# cython: language_level=3
# cython: boundscheck=False
# cython: wraparound=False
# cython: cdivision=True
"""Cython hot path: bit-packed segmented sieve inner loop.

The segment is **bit-packed** — one bit per odd candidate, 8x less memory
than one byte per candidate. Odd index ``g`` lives in ``buf[g >> 3]`` at bit
``g & 7`` (little-endian within the byte). A set bit means "still a prime
candidate". Marking a composite clears its bit. Because the buffer is 8x
smaller it stays resident in L1/L2 far longer than a byte-per-candidate
array, which is the whole point of bit-packing.

Two functions are exposed and mirrored by ``_sieve_fallback.py``:

* ``mark_segment`` — clear the bits of every composite in the segment.
* ``count_bits``   — popcount the set bits in a (possibly partial) bit range.
"""
import numpy as np
cimport numpy as cnp

cnp.import_array()

# 256-entry popcount lookup table, built once at import.
cdef unsigned char _POPCOUNT[256]
cdef int _i, _b, _c
for _i in range(256):
    _c = 0
    _b = _i
    while _b:
        _c += _b & 1
        _b >>= 1
    _POPCOUNT[_i] = <unsigned char>_c


def mark_segment(unsigned char[::1] buf,
                 long long S,
                 long long seg_g0,
                 cnp.int64_t[::1] primes,
                 long long start_p):
    """Clear the candidate bit of every composite in one bit-packed segment.

    Parameters
    ----------
    buf : uint8[::1]
        Bit-packed segment buffer of length ``S // 8`` bytes. Modified in place.
    S : number of odd indices the segment spans (== 8 * len(buf)).
    seg_g0 : global odd index of bit 0 of this segment.
    primes : sorted int64 base primes (up to sqrt of the global upper bound).
    start_p : smallest prime to sieve with (wheel primes below it are
        pre-marked in the segment's initial pattern, so they are skipped).
    """
    cdef Py_ssize_t i, nprimes = primes.shape[0]
    cdef long long p, pp, base, r, m, idx
    cdef long long seg_v0 = 2 * seg_g0 + 1
    cdef long long seg_v1 = 2 * (seg_g0 + S - 1) + 1
    for i in range(nprimes):
        p = primes[i]
        if p < start_p:
            continue
        pp = p * p
        if pp > seg_v1:
            break
        # First odd multiple of p that is >= max(p*p, seg_v0).
        base = pp if pp >= seg_v0 else seg_v0
        r = base % p
        m = base if r == 0 else base + (p - r)
        if (m & 1LL) == 0:        # p is odd, so an even multiple uses k even; skip to odd k
            m += p
        idx = (m - seg_v0) >> 1   # local odd index of the first composite
        # Tight inner loop: clear one bit every p odd-indices.
        while idx < S:
            buf[idx >> 3] &= <unsigned char>(~(1 << (idx & 7)))
            idx += p


def count_bits(unsigned char[::1] buf, long long bit_lo, long long bit_hi):
    """Return the number of set bits with index in ``[bit_lo, bit_hi)``."""
    if bit_hi <= bit_lo:
        return 0
    cdef long long byte_lo = bit_lo >> 3
    cdef long long byte_hi = (bit_hi - 1) >> 3
    cdef int a = <int>(bit_lo & 7)
    cdef int b = <int>((bit_hi - 1) & 7)
    cdef long long total = 0
    cdef long long j
    cdef unsigned char mask
    if byte_lo == byte_hi:
        mask = <unsigned char>((0xFF << a) & (0xFF >> (7 - b)))
        return _POPCOUNT[buf[byte_lo] & mask]
    # first (partial) byte: keep bits [a..7]
    mask = <unsigned char>((0xFF << a) & 0xFF)
    total += _POPCOUNT[buf[byte_lo] & mask]
    # whole middle bytes
    for j in range(byte_lo + 1, byte_hi):
        total += _POPCOUNT[buf[j]]
    # last (partial) byte: keep bits [0..b]
    mask = <unsigned char>(0xFF >> (7 - b))
    total += _POPCOUNT[buf[byte_hi] & mask]
    return total
