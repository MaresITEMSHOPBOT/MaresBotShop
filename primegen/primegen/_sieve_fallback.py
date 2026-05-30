"""Pure-Python fallback for the Cython hot path.

Same interface and identical semantics as ``_sieve.pyx`` (``mark_segment``
and ``count_bits``), but implemented in plain Python so the package works
even when the compiled extension is unavailable. It is *much* slower — that
slowness is exactly what motivates the Cython version, and the benchmark
quantifies the gap.
"""
from __future__ import annotations

import numpy as np

# Precomputed popcount table (mirrors the one built in the .pyx).
_POPCOUNT = bytes(bin(i).count("1") for i in range(256))


def mark_segment(buf: np.ndarray, S: int, seg_g0: int, primes: np.ndarray, start_p: int) -> None:
    """Clear the candidate bit of every composite in a bit-packed segment.

    ``buf`` is a uint8 numpy array of ``S // 8`` bytes, modified in place.
    """
    seg_v0 = 2 * seg_g0 + 1
    seg_v1 = 2 * (seg_g0 + S - 1) + 1
    for p in primes:
        p = int(p)
        if p < start_p:
            continue
        pp = p * p
        if pp > seg_v1:
            break
        base = pp if pp >= seg_v0 else seg_v0
        r = base % p
        m = base if r == 0 else base + (p - r)
        if (m & 1) == 0:
            m += p
        idx = (m - seg_v0) >> 1
        while idx < S:
            buf[idx >> 3] &= 0xFF ^ (1 << (idx & 7))
            idx += p


def count_bits(buf: np.ndarray, bit_lo: int, bit_hi: int) -> int:
    """Return the number of set bits with index in ``[bit_lo, bit_hi)``."""
    if bit_hi <= bit_lo:
        return 0
    byte_lo = bit_lo >> 3
    byte_hi = (bit_hi - 1) >> 3
    a = bit_lo & 7
    b = (bit_hi - 1) & 7
    if byte_lo == byte_hi:
        mask = (0xFF << a) & (0xFF >> (7 - b)) & 0xFF
        return _POPCOUNT[buf[byte_lo] & mask]
    total = _POPCOUNT[buf[byte_lo] & ((0xFF << a) & 0xFF)]
    for j in range(byte_lo + 1, byte_hi):
        total += _POPCOUNT[int(buf[j])]
    total += _POPCOUNT[buf[byte_hi] & (0xFF >> (7 - b))]
    return total
