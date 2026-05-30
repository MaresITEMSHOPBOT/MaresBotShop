# cython: language_level=3
# cython: boundscheck=False
# cython: wraparound=False
# cython: cdivision=True
"""Cython hot path for the sublinear pi(x) counter (Lucy/Meissel recurrence).

This is the same algorithm as ``primecount._prime_count_numpy`` but with the
whole double loop compiled to C over int64 arrays — no per-prime temporary
allocations, no numpy dispatch. It is the fastest pi(x) this package offers and
extends the reachable range (pi(10^14), pi(10^15)). Correctness is guaranteed
by construction (identical recurrence to the verified array version) and pinned
by the tests.
"""
import numpy as np
cimport numpy as cnp
from libc.math cimport sqrt

cnp.import_array()


def prime_count_c(long long n):
    """Return pi(n) via the Lucy/Meissel DP, fully in C. ~O(n^(3/4)) time."""
    if n < 2:
        return 0
    cdef long long r = <long long>sqrt(<double>n)
    while (r + 1) * (r + 1) <= n:
        r += 1
    while r * r > n:
        r -= 1

    cdef cnp.int64_t[::1] small = np.empty(r + 1, dtype=np.int64)
    cdef cnp.int64_t[::1] large = np.empty(r + 1, dtype=np.int64)
    cdef long long v, i, p, p2, imax, d, sp

    for v in range(r + 1):
        small[v] = v - 1                       # small[v] = S(v) = #{2..v}
    for i in range(1, r + 1):
        large[i] = n // i - 1                  # large[i] = S(n//i)

    for p in range(2, r + 1):
        if small[p] == small[p - 1]:           # p already sieved out -> not prime
            continue
        sp = small[p - 1]                      # pi(p-1)
        p2 = p * p
        imax = n // p2
        if r < imax:
            imax = r
        # large key values, ascending i: large[i*p] is a future index -> still old
        for i in range(1, imax + 1):
            d = i * p
            if d <= r:
                large[i] -= large[d] - sp
            else:
                large[i] -= small[n // d] - sp
        # small key values, descending v: small[v//p] is a smaller index -> still old
        v = r
        while v >= p2:
            small[v] -= small[v // p] - sp
            v -= 1
    return large[1]
