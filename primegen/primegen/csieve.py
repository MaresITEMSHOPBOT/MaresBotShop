"""Bit-packed segmented sieve driver + compiled/fallback loader.

This module picks the fastest available implementation of the hot path
(``mark_segment`` / ``count_bits``): the compiled Cython extension
``_sieve`` if present, otherwise the pure-Python ``_sieve_fallback``.
``HAVE_CYTHON`` records which one is in use. The sieve *driver*
(``sieve_bitpacked``) is identical either way — only the inner loop swaps.
"""
from __future__ import annotations

from math import isqrt
from typing import List

import numpy as np

from .backends import (
    DEFAULT_SEGMENT_ODDS,
    _iter_segments,
    _odd_index_bounds,
    _small_primes_in_range,
    _wheel_pattern_array,
    base_primes_upto,
    normalize_segment_odds,
)
from .wheel import first_sieving_prime

try:  # pragma: no cover - exercised by whichever path is installed
    from . import _sieve as _impl

    HAVE_CYTHON = True
    _IMPL_NAME = "cython"
except ImportError:  # pragma: no cover
    from . import _sieve_fallback as _impl

    HAVE_CYTHON = False
    _IMPL_NAME = "python-fallback"

mark_segment = _impl.mark_segment
count_bits = _impl.count_bits


def impl_name() -> str:
    """Return ``'cython'`` or ``'python-fallback'`` for diagnostics/benchmarks."""
    return _IMPL_NAME


def _packed_pattern(wheel: int, S: int) -> np.ndarray:
    """Bit-packed (little-endian) initial wheel pattern for a segment of ``S`` odds."""
    flat = _wheel_pattern_array(wheel, S)
    return np.packbits(flat, bitorder="little")


def sieve_bitpacked(
    lo: int,
    hi: int,
    *,
    wheel: int = 2,
    segment_odds: int = DEFAULT_SEGMENT_ODDS,
    collect: bool = True,
    primes: "np.ndarray | None" = None,
):
    """Bit-packed segmented sieve over [lo, hi).

    Uses one bit per odd candidate (8x less memory than the byte backends).
    ``collect=True`` returns an ``int64`` array of primes; ``collect=False``
    returns the count via a popcount over the packed bits. ``primes`` may be
    a precomputed shared base-prime list (see ``sieve_numpy``).
    """
    if hi <= 2 or hi <= lo:
        return np.empty(0, dtype=np.int64) if collect else 0
    S = normalize_segment_odds(segment_odds)
    start_p = first_sieving_prime(wheel)
    if primes is None:
        primes = base_primes_upto(isqrt(hi - 1))
    pattern = _packed_pattern(wheel, S)

    g_start, g_end = _odd_index_bounds(lo, hi)
    smalls = _small_primes_in_range(wheel, lo, hi)

    buf = np.empty(S // 8, dtype=np.uint8)
    if collect:
        chunks: List[np.ndarray] = []
        if smalls:
            chunks.append(np.array(smalls, dtype=np.int64))
    else:
        total = len(smalls)

    for seg_g0, clip_a, clip_b in _iter_segments(g_start, g_end, S):
        np.copyto(buf, pattern)
        mark_segment(buf, S, seg_g0, primes, start_p)
        if collect:
            bits = np.unpackbits(buf, bitorder="little")[clip_a:clip_b]
            local = np.nonzero(bits)[0].astype(np.int64) + (seg_g0 + clip_a)
            chunks.append(local * 2 + 1)
        else:
            total += count_bits(buf, clip_a, clip_b)

    if collect:
        if not chunks:
            return np.empty(0, dtype=np.int64)
        out = np.concatenate(chunks)
        out.sort()
        return out
    return total
