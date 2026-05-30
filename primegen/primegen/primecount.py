"""Sublinear prime counting: pi(x) WITHOUT enumerating the primes.

A sieve must touch (almost) every integer up to x, so counting pi(x) that way
is ~O(x) work and O(x) (or segmented) memory. But we don't need the primes
themselves to *count* them. The Meissel-Mertens-Lehmer combinatorial method —
here in its clean dynamic-programming form (often called the "Lucy_Hedgehog"
recurrence) — computes pi(x) in about **O(x^(3/4))** time and **O(sqrt x)**
memory. That is genuinely sublinear: it reaches pi(10^12), pi(10^13) in seconds
where a sieve would need trillions of operations and hundreds of GB.

The idea
--------
Work only with the O(sqrt x) *distinct* values ``floor(x / i)``. Let
``S(v)`` = count of integers in ``[2, v]`` not yet sieved. Initialise
``S(v) = v - 1`` (everything is a candidate). Then, exactly like Eratosthenes
but lifted to those key values, for each prime ``p <= sqrt x`` remove the
integers whose *smallest* prime factor is ``p``::

    S(v) -= S(v // p) - S(p - 1)     for all v >= p*p

After processing every ``p <= sqrt x``, ``S(x) = pi(x)``.

Three implementations are provided and cross-checked against each other and the
sieve: a dict version (clearest), a pure-Python array version (no numpy), and a
vectorised numpy version (fast). ``prime_count`` picks the best available.
"""
from __future__ import annotations

from math import isqrt

try:
    import numpy as np

    _HAVE_NUMPY = True
except ImportError:  # pragma: no cover
    np = None
    _HAVE_NUMPY = False


def prime_count_lucy(n: int) -> int:
    """pi(n) via the Lucy_Hedgehog recurrence (dict version — the clear reference)."""
    n = int(n)
    if n < 2:
        return 0
    r = isqrt(n)
    # The O(sqrt n) distinct key values floor(n/i), then the small values down to 1.
    keys = [n // i for i in range(1, r + 1)]
    keys += list(range(keys[-1] - 1, 0, -1))
    S = {v: v - 1 for v in keys}                  # S(v) = #{2..v}
    for p in range(2, r + 1):
        if S[p] == S[p - 1]:                      # p already removed -> not prime
            continue
        sp = S[p - 1]                             # = pi(p-1) = (#primes < p)
        p2 = p * p
        for v in keys:                            # keys are descending
            if v < p2:
                break
            S[v] -= S[v // p] - sp
    return S[n]


def _prime_count_arrays_py(n: int) -> int:
    """pi(n), pure-Python array version (faster than the dict, numpy-free fallback)."""
    n = int(n)
    if n < 2:
        return 0
    r = isqrt(n)
    small = [v - 1 for v in range(r + 1)]         # small[v] = S(v), v = 0..r
    large = [0] * (r + 1)                          # large[i] = S(n//i), i = 1..r
    for i in range(1, r + 1):
        large[i] = n // i - 1
    for p in range(2, r + 1):
        if small[p] == small[p - 1]:
            continue
        sp = small[p - 1]
        p2 = p * p
        imax = min(r, n // p2)
        for i in range(1, imax + 1):              # update large key values (ascending i)
            d = i * p
            large[i] -= (large[d] if d <= r else small[n // d]) - sp
        for v in range(r, p2 - 1, -1):            # update small key values (descending v)
            small[v] -= small[v // p] - sp
    return large[1]


def _prime_count_numpy(n: int) -> int:
    """pi(n), vectorised numpy version (fast). Same recurrence, batched per prime."""
    n = int(n)
    if n < 2:
        return 0
    r = isqrt(n)
    small = np.arange(-1, r, dtype=np.int64)       # small[v] = v - 1  (length r+1)
    idx = np.arange(0, r + 1, dtype=np.int64)
    large = np.empty(r + 1, dtype=np.int64)
    large[1:] = n // idx[1:] - 1                    # large[i] = n//i - 1
    for p in range(2, r + 1):
        if small[p] == small[p - 1]:
            continue
        sp = int(small[p - 1])
        p2 = p * p
        imax = min(r, n // p2)
        k = min(imax, r // p)                        # split: i*p <= r  vs  i*p > r
        if k >= 1:
            # i = 1..k : large[i] -= large[i*p] - sp     (numpy snapshots the RHS)
            large[1:k + 1] -= large[p:p * k + 1:p] - sp
        if imax > k:
            # i = k+1..imax : large[i] -= small[n//(i*p)] - sp
            j = np.arange(k + 1, imax + 1, dtype=np.int64)
            large[k + 1:imax + 1] -= small[n // (j * p)] - sp
        if p2 <= r:
            # v = p2..r : small[v] -= small[v//p] - sp   (gather copies old values)
            v = np.arange(p2, r + 1, dtype=np.int64)
            small[p2:r + 1] -= small[v // p] - sp
    return int(large[1])


def prime_count(n: int) -> int:
    """Return pi(n) sublinearly. Uses numpy when available, else a pure-Python array."""
    if _HAVE_NUMPY:
        return _prime_count_numpy(n)
    return _prime_count_arrays_py(n)


def prime_count_range(lo: int, hi: int) -> int:
    """Count primes in the half-open interval [lo, hi) = pi(hi-1) - pi(lo-1)."""
    if hi <= lo:
        return 0
    return prime_count(hi - 1) - prime_count(max(lo, 2) - 1)


def prime_sum(n: int) -> int:
    """Bonus: the *sum* of all primes <= n, same recurrence weighted by p.

    Demonstrates the method's generality: replace the count S(v)=#{2..v} with
    the sum S(v)=2+3+...+v, and remove p * (S(v//p) - S(p-1)) each step.
    """
    n = int(n)
    if n < 2:
        return 0
    r = isqrt(n)
    if _HAVE_NUMPY:
        small = np.arange(0, r + 1, dtype=object)         # exact big-int sums
        small = np.array([v * (v + 1) // 2 - 1 for v in range(r + 1)], dtype=object)
        large = np.array([0] + [(n // i) * (n // i + 1) // 2 - 1 for i in range(1, r + 1)], dtype=object)
        for p in range(2, r + 1):
            if small[p] == small[p - 1]:
                continue
            sp = small[p - 1]
            p2 = p * p
            imax = min(r, n // p2)
            for i in range(1, imax + 1):                  # object dtype -> loop (exactness over speed)
                d = i * p
                large[i] -= p * ((large[d] if d <= r else small[n // d]) - sp)
            for v in range(r, p2 - 1, -1):
                small[v] -= p * (small[v // p] - sp)
        return int(large[1])
    # pure-Python
    small = [v * (v + 1) // 2 - 1 for v in range(r + 1)]
    large = [0] + [(n // i) * (n // i + 1) // 2 - 1 for i in range(1, r + 1)]
    for p in range(2, r + 1):
        if small[p] == small[p - 1]:
            continue
        sp = small[p - 1]
        p2 = p * p
        imax = min(r, n // p2)
        for i in range(1, imax + 1):
            d = i * p
            large[i] -= p * ((large[d] if d <= r else small[n // d]) - sp)
        for v in range(r, p2 - 1, -1):
            small[v] -= p * (small[v // p] - sp)
    return large[1]
