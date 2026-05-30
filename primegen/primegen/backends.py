"""Segmented sieve backends: pure-Python ``bytearray`` and vectorized ``numpy``.

Indexing convention (shared with the whole package)
----------------------------------------------------
We store **odd numbers only**. An odd value ``v`` maps to an *odd index*
``g = (v - 1) // 2`` (so ``v = 2*g + 1``). A *segment* is a contiguous block
of ``S`` odd indices, and segments are aligned to multiples of ``S`` in
global odd-index space. ``S`` is always a multiple of ``WHEEL_ALIGN`` (840),
which is divisible by every wheel period we use (15, 105) and by 8 (for the
bit-packed Cython backend). Because of that alignment every segment begins
at wheel-phase 0, so resetting a segment to its initial wheel pattern is a
single ``memcpy``-class copy.

The two wheel mechanisms
------------------------
* ``wheel`` in {1, 2}: plain odd-only sieve (only the factor 2 wheeled out).
* ``wheel`` in {30, 210}: the segment buffer is *initialized* from a tiled
  wheel pattern that pre-marks every multiple of the wheel primes (3, 5[, 7]).
  We then only sieve primes >= ``first_sieving_prime`` (7 or 11). Skipping the
  dense 3/5/7 passes is the measurable win; the wheel primes themselves are
  re-added at collection time.
"""
from __future__ import annotations

from math import isqrt
from typing import Iterator, List, Tuple

import numpy as np

from .wheel import WHEEL_PRIMES, first_sieving_prime, odd_index_pattern

# Segment size must be a multiple of this so all wheels + bit-packing align.
WHEEL_ALIGN = 840
# Default segment size in odd indices (~256 KB byte buffer -> fits L2).
DEFAULT_SEGMENT_ODDS = WHEEL_ALIGN * 312  # 262080 odds


def base_primes_upto(limit: int) -> np.ndarray:
    """Primes ``<= limit`` as an ``int64`` numpy array (fast odd-only sieve).

    Used once per query to build the read-only list of "base primes" up to
    ``sqrt(hi)`` that every segment sieves with.
    """
    if limit < 2:
        return np.empty(0, dtype=np.int64)
    if limit == 2:
        return np.array([2], dtype=np.int64)
    n_odds = (limit - 1) // 2 + 1  # odd indices for values 1, 3, ..., <= limit
    is_p = np.ones(n_odds, dtype=np.uint8)
    is_p[0] = 0  # value 1 is not prime
    g = 1
    while True:
        v = 2 * g + 1
        if v * v > limit:
            break
        if is_p[g]:
            is_p[(v * v - 1) // 2 :: v] = 0
        g += 1
    odd_primes = np.nonzero(is_p)[0].astype(np.int64) * 2 + 1
    return np.concatenate((np.array([2], dtype=np.int64), odd_primes))


def normalize_segment_odds(segment_odds: int) -> int:
    """Round a requested segment size up to a multiple of ``WHEEL_ALIGN``."""
    if segment_odds < WHEEL_ALIGN:
        return WHEEL_ALIGN
    return ((segment_odds + WHEEL_ALIGN - 1) // WHEEL_ALIGN) * WHEEL_ALIGN


def _odd_index_bounds(lo: int, hi: int) -> Tuple[int, int]:
    """Return ``[g_start, g_end)`` odd-index range covering odd values in [lo, hi).

    Excludes the value 1 (not prime) and the even prime 2 (handled separately).
    """
    lo2 = max(lo, 3)
    if lo2 % 2 == 0:
        lo2 += 1
    hival = hi - 1  # largest integer strictly below hi
    if hival < lo2:
        return (0, 0)
    if hival % 2 == 0:
        hival -= 1
    g_start = (lo2 - 1) // 2
    g_end = (hival - 1) // 2 + 1
    return (g_start, g_end)


def _small_primes_in_range(wheel: int, lo: int, hi: int) -> List[int]:
    """Wheel primes (and 2) that fall in [lo, hi); these are pre-marked by the
    wheel pattern and so must be re-added explicitly."""
    return [p for p in WHEEL_PRIMES.get(wheel, [2]) if lo <= p < hi]


def _wheel_pattern_array(wheel: int, segment_odds: int) -> np.ndarray:
    """Tiled wheel pattern of length ``segment_odds`` as ``uint8`` (1 = candidate)."""
    if wheel in (1, 2):
        return np.ones(segment_odds, dtype=np.uint8)
    pat = np.array(odd_index_pattern(wheel), dtype=np.uint8)
    reps = segment_odds // len(pat)
    return np.tile(pat, reps)


def _iter_segments(g_start: int, g_end: int, S: int) -> Iterator[Tuple[int, int, int]]:
    """Yield ``(seg_g0, clip_a, clip_b)`` for each aligned segment overlapping
    ``[g_start, g_end)``. ``seg_g0`` is the segment's first global odd index;
    ``clip_a``/``clip_b`` are *local* indices bounding the valid output region.
    """
    first_seg = (g_start // S) * S
    seg_g0 = first_seg
    while seg_g0 < g_end:
        seg_g1 = seg_g0 + S
        clip_a = max(g_start, seg_g0) - seg_g0
        clip_b = min(g_end, seg_g1) - seg_g0
        yield seg_g0, clip_a, clip_b
        seg_g0 = seg_g1


# --------------------------------------------------------------------------
# numpy backend
# --------------------------------------------------------------------------
def _mark_numpy(buf: np.ndarray, seg_g0: int, S: int, primes: np.ndarray, start_p: int) -> None:
    """Mark composites in one numpy segment buffer via vectorized slice writes."""
    seg_v0 = 2 * seg_g0 + 1          # value of buf[0]
    seg_v1 = 2 * (seg_g0 + S - 1) + 1  # value of buf[S-1]
    for p in primes:
        p = int(p)
        if p < start_p:
            continue
        if p * p > seg_v1:
            break
        # First odd multiple of p that is >= max(p*p, seg_v0).
        base = p * p if p * p >= seg_v0 else seg_v0
        m = base + ((-base) % p)        # smallest multiple of p that is >= base
        if m % 2 == 0:                  # need an odd multiple (p is odd)
            m += p
        start_local = (m - seg_v0) // 2
        if start_local < S:
            buf[start_local::p] = 0


def sieve_numpy(
    lo: int,
    hi: int,
    *,
    wheel: int = 2,
    segment_odds: int = DEFAULT_SEGMENT_ODDS,
    collect: bool = True,
    primes: "np.ndarray | None" = None,
):
    """Vectorized numpy segmented sieve over [lo, hi).

    ``collect=True`` returns an ``int64`` array of primes; ``collect=False``
    returns just the count ``pi(hi-1) - pi(lo-1)`` (faster, no materialization).
    ``primes`` may be a precomputed base-prime list (>= sqrt(hi-1)); the
    inner loop stops early on its own, so passing a longer list is harmless.
    This is how parallel workers share one read-only base-prime array.
    """
    if hi <= 2 or hi <= lo:
        return np.empty(0, dtype=np.int64) if collect else 0
    S = normalize_segment_odds(segment_odds)
    start_p = first_sieving_prime(wheel)
    if primes is None:
        primes = base_primes_upto(isqrt(hi - 1))
    pattern = _wheel_pattern_array(wheel, S)

    g_start, g_end = _odd_index_bounds(lo, hi)
    smalls = _small_primes_in_range(wheel, lo, hi)

    buf = np.empty(S, dtype=np.uint8)
    if collect:
        chunks: List[np.ndarray] = []
        if smalls:
            chunks.append(np.array(smalls, dtype=np.int64))
    else:
        total = len(smalls)

    for seg_g0, clip_a, clip_b in _iter_segments(g_start, g_end, S):
        np.copyto(buf, pattern)
        _mark_numpy(buf, seg_g0, S, primes, start_p)
        view = buf[clip_a:clip_b]
        if collect:
            local = np.nonzero(view)[0].astype(np.int64) + (seg_g0 + clip_a)
            chunks.append(local * 2 + 1)
        else:
            total += int(view.sum())

    if collect:
        if not chunks:
            return np.empty(0, dtype=np.int64)
        out = np.concatenate(chunks)
        out.sort()
        return out
    return total


# --------------------------------------------------------------------------
# pure-Python bytearray backend
# --------------------------------------------------------------------------
def sieve_bytearray(
    lo: int,
    hi: int,
    *,
    wheel: int = 2,
    segment_odds: int = DEFAULT_SEGMENT_ODDS,
    collect: bool = True,
):
    """Pure-Python segmented sieve using a ``bytearray`` (one byte per odd).

    Marking uses extended-slice assignment ``buf[start::step] = bytes(n)``,
    which runs as a C loop inside CPython. This is the "bytearray" comparison
    point for the bit-packed Cython backend.
    """
    if hi <= 2 or hi <= lo:
        return [] if collect else 0
    S = normalize_segment_odds(segment_odds)
    start_p = first_sieving_prime(wheel)
    primes = [int(p) for p in base_primes_upto(isqrt(hi - 1))]
    pattern = bytes(_wheel_pattern_array(wheel, S).tobytes())

    g_start, g_end = _odd_index_bounds(lo, hi)
    smalls = _small_primes_in_range(wheel, lo, hi)

    out: List[int] = list(smalls) if collect else []
    total = len(smalls)

    for seg_g0, clip_a, clip_b in _iter_segments(g_start, g_end, S):
        buf = bytearray(pattern)
        seg_v0 = 2 * seg_g0 + 1
        seg_v1 = 2 * (seg_g0 + S - 1) + 1
        for p in primes:
            if p < start_p:
                continue
            if p * p > seg_v1:
                break
            base = p * p if p * p >= seg_v0 else seg_v0
            m = base + ((-base) % p)
            if m % 2 == 0:
                m += p
            start_local = (m - seg_v0) // 2
            if start_local < S:
                n = (S - 1 - start_local) // p + 1
                buf[start_local::p] = bytes(n)
        if collect:
            for j in range(clip_a, clip_b):
                if buf[j]:
                    out.append(2 * (seg_g0 + j) + 1)
        else:
            total += sum(buf[clip_a:clip_b])

    if collect:
        out.sort()
        return out
    return total
