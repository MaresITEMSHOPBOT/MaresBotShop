"""Lagarias-Miller-Odlyzko (LMO) prime counting — the world-class *algorithm*.

This is the genuinely-better-asymptotics method: it computes pi(x) in about
**O(x^(2/3))** time (vs the Lucy/Meissel recurrence in ``primecount`` at
O(x^(3/4))). It is the same class of algorithm the C++ record-holder
``primecount`` uses (with the sharper Deleglise-Rivat refinements) to reach
pi(10^29).

It rests on Meissel's identity, with ``a = pi(x^(1/3))``::

    pi(x) = phi(x, a) + a - 1 - P2(x, a)

* ``P2(x, a)`` = count of n <= x that are a product of exactly two primes both
  > x^(1/3); computed by a segmented sieve (``_p2``).
* ``phi(x, a)`` = count of n <= x with no prime factor among the first ``a``
  primes; computed by the LMO leaf decomposition ``phi = S1 + S2``:
    - **S1 (ordinary leaves)**: sum over squarefree n <= y = x^(1/3) with
      smallest prime factor > p_c of ``mu(n) * phi_tiny(x/n, c)``.
    - **S2 (special leaves)**: the leaves with n > y, summed efficiently with a
      Fenwick (binary-indexed) tree over a sieve of [1, x/y] — this is the
      crux that makes LMO sub-O(x^(3/4)).

HONESTY NOTE — measured, not assumed: this *pure-Python* implementation is
**correct** (verified against the reference and the tabulated pi(x)) but, like
Atkin-vs-Eratosthenes earlier in this project, its superior asymptotics are
swamped by Python's per-operation constants. In wall-clock it is ~190x **slower**
than the Cython-compiled Lucy counter at x=10^10 (and ~1000x at 10^7) — though
the gap *narrows* with x because LMO's exponent is smaller (measured growth
~4.8x/decade vs Lucy's ~5.1x), confirming O(x^(2/3)) < O(x^(3/4)). The crossover
where LMO actually wins lies far past any reachable x in pure Python; realising
its advantage means compiling the hot loops to C (as the C++ `primecount` does).
See ``benchmarks/compare_counting.py``.
"""
from __future__ import annotations

from math import isqrt
from typing import List

import numpy as np


def integer_cbrt(x: int) -> int:
    """Floor of the cube root of x."""
    r = int(round(x ** (1.0 / 3.0)))
    while (r + 1) ** 3 <= x:
        r += 1
    while r ** 3 > x:
        r -= 1
    return r


def _mobius_and_lpf(n: int):
    """Mobius mu[] and least-prime-factor lpf[] for 0..n via a linear sieve."""
    lpf = [0] * (n + 1)
    mu = [0] * (n + 1)
    if n >= 1:
        mu[1] = 1
    primes: List[int] = []
    for i in range(2, n + 1):
        if lpf[i] == 0:
            lpf[i] = i
            mu[i] = -1
            primes.append(i)
        for p in primes:
            if p > lpf[i] or i * p > n:
                break
            lpf[i * p] = p
            mu[i * p] = 0 if p == lpf[i] else -mu[i]
    return mu, lpf


class _Fenwick:
    """Binary-indexed tree for prefix sums over [1, n] (1-indexed)."""

    __slots__ = ("n", "t")

    def __init__(self, n: int):
        self.n = n
        self.t = [0] * (n + 1)

    def add(self, i: int, v: int) -> None:
        t = self.t
        while i <= self.n:
            t[i] += v
            i += i & (-i)

    def query(self, i: int) -> int:
        s = 0
        t = self.t
        while i > 0:
            s += t[i]
            i -= i & (-i)
        return s


def _make_phi_tiny(c: int, primes: List[int]):
    """Return phi(t, c) as an O(1) callable via the wheel of the first c primes."""
    period = 1
    for i in range(c):
        period *= primes[i]
    table = [0] * (period + 1)
    for r in range(1, period + 1):
        coprime = 0 if any(r % primes[i] == 0 for i in range(c)) else 1
        table[r] = table[r - 1] + coprime
    phi_period = table[period]

    def phi_tiny(t: int) -> int:
        if t <= 0:
            return 0
        return (t // period) * phi_period + table[t % period]

    return phi_tiny


def _lmo_phi(x: int, a: int, primes: List[int], mu: List[int], lpf: List[int]) -> int:
    """phi(x, a) via the LMO ordinary (S1) + special (S2) leaf decomposition."""
    y = integer_cbrt(x)
    c = min(a, 7)
    phi_tiny = _make_phi_tiny(c, primes)
    pc = primes[c - 1]  # the c-th prime

    # S1: ordinary leaves  (n = 1 .. y, squarefree, smallest prime factor > p_c)
    S1 = phi_tiny(x)  # n = 1
    for n in range(2, y + 1):
        if lpf[n] > pc and mu[n] != 0:
            S1 += mu[n] * phi_tiny(x // n)

    # S2: special leaves via a Fenwick tree over [1, z], z = x // y
    z = x // y
    bit = _Fenwick(z)
    sieve = bytearray([1]) * (z + 1)
    sieve[0] = 0
    for k in range(1, z + 1):
        bit.add(k, 1)
    for i in range(c):  # cross out the first c primes
        p = primes[i]
        for k in range(p, z + 1, p):
            if sieve[k]:
                sieve[k] = 0
                bit.add(k, -1)

    S2 = 0
    for b in range(c, a):
        p = primes[b]
        for m in range(y // p + 1, y + 1):
            if lpf[m] > p and mu[m] != 0:
                t = x // (p * m)
                if t >= 1:
                    S2 -= mu[m] * bit.query(t)   # query BEFORE crossing p_b -> phi(t, b)
        for k in range(p, z + 1, p):              # now cross out multiples of p_b
            if sieve[k]:
                sieve[k] = 0
                bit.add(k, -1)

    return S1 + S2


def _pi_many(points: List[int], base_primes: np.ndarray) -> List[int]:
    """pi(t) for each t in the ascending list ``points`` via one segmented sieve."""
    if not points:
        return []
    limit = points[-1]
    bp = base_primes[base_primes * base_primes <= limit]
    out: List[int] = []
    count = 0
    qi = 0
    low = 2
    SEG = 1 << 18
    npts = len(points)
    while qi < npts:
        high = min(low + SEG - 1, limit)
        size = high - low + 1
        seg = np.ones(size, dtype=bool)
        for p in bp:
            p = int(p)
            if p * p > high:
                break
            start = p * p if p * p >= low else ((low + p - 1) // p) * p
            seg[start - low:: p] = False
        csum = np.cumsum(seg)
        while qi < npts and points[qi] <= high:
            out.append(count + int(csum[points[qi] - low]))
            qi += 1
        count += int(csum[-1])
        low = high + 1
        if low > limit:
            break
    return out


def _p2(x: int, y: int, primes: List[int]) -> int:
    """P2(x, a) = #{n <= x : n = p*q, p,q prime, p,q > p_a}, via a segmented sieve."""
    sx = isqrt(x)
    rel = [(i + 1, p) for i, p in enumerate(primes) if y < p <= sx]  # (pi(p), p)
    if not rel:
        return 0
    pts = sorted({x // p for _, p in rel})
    pi_at = dict(zip(pts, _pi_many(pts, np.asarray(primes, dtype=np.int64))))
    total = 0
    for pi_p, p in rel:
        total += pi_at[x // p] - pi_p + 1
    return total


def pi_lmo(x: int) -> int:
    """Return pi(x) by the Lagarias-Miller-Odlyzko method (O(x^(2/3)) operations)."""
    x = int(x)
    if x < 2:
        return 0
    if x < 25:
        return sum(1 for n in range(2, x + 1)
                   if all(n % d for d in range(2, isqrt(n) + 1)))
    sx = isqrt(x)
    # primes up to sqrt(x) (enough for both phi's wheel/leaves and P2's sieve)
    from .backends import base_primes_upto
    primes = [int(p) for p in base_primes_upto(sx)]
    y = integer_cbrt(x)
    a = sum(1 for p in primes if p <= y)  # pi(y)
    mu, lpf = _mobius_and_lpf(y)
    phi = _lmo_phi(x, a, primes, mu, lpf)
    return phi + a - 1 - _p2(x, y, primes)
