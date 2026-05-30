"""Primality and prime-search for *huge single numbers* (100+ digits).

For big integers a sieve is hopeless; you test individual numbers. ``gmpy2``
(a thin wrapper over GMP) is dramatically faster than pure-Python ``pow`` for
the modular exponentiation at the heart of Miller-Rabin, so we use
``gmpy2.is_prime`` / ``gmpy2.next_prime`` when available.

A pure-Python fallback is provided so the module always works:

* deterministic Miller-Rabin for ``n < 3.3e24`` (a fixed 12-witness set is
  proven sufficient there), and
* probabilistic Miller-Rabin (random bases) above that.

The benchmark script quantifies the gmpy2-vs-pure-Python gap on 100+ digit
numbers.
"""
from __future__ import annotations

import random
from typing import List

try:  # optional, but strongly recommended for big numbers
    import gmpy2

    HAVE_GMPY2 = True
except ImportError:  # pragma: no cover
    gmpy2 = None
    HAVE_GMPY2 = False

# Witness set proven to give a *deterministic* Miller-Rabin test for all
# n < 3,317,044,064,679,887,385,961,981 (Sorenson & Webster).
_DET_WITNESSES: List[int] = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37]
_DET_BOUND = 3_317_044_064_679_887_385_961_981

# Small primes for quick trial division before the heavier test.
_SMALL_PRIMES: List[int] = [
    2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
    73, 79, 83, 89, 97,
]


def backend_name() -> str:
    """Return ``'gmpy2'`` or ``'python-fallback'``."""
    return "gmpy2" if HAVE_GMPY2 else "python-fallback"


def _is_strong_probable_prime(n: int, a: int, d: int, s: int) -> bool:
    """Return True if ``n`` passes the Miller-Rabin test for base ``a``."""
    x = pow(a, d, n)
    if x == 1 or x == n - 1:
        return True
    for _ in range(s - 1):
        x = x * x % n
        if x == n - 1:
            return True
    return False


def is_prime_mr(n: int, rounds: int = 40) -> bool:
    """Pure-Python Miller-Rabin (deterministic below ``_DET_BOUND``)."""
    n = int(n)
    if n < 2:
        return False
    for p in _SMALL_PRIMES:
        if n == p:
            return True
        if n % p == 0:
            return False
    d = n - 1
    s = 0
    while d % 2 == 0:
        d //= 2
        s += 1
    if n < _DET_BOUND:
        witnesses = _DET_WITNESSES
    else:
        witnesses = [random.randrange(2, n - 1) for _ in range(rounds)]
    for a in witnesses:
        a %= n
        if a < 2:
            continue
        if not _is_strong_probable_prime(n, a, d, s):
            return False
    return True


def is_prime(n: int) -> bool:
    """Test primality of a single integer (uses gmpy2 when available).

    Below ``_DET_BOUND`` the result is exact either way. Above it, gmpy2 uses
    a strong BPSW + Miller-Rabin test and the fallback uses probabilistic
    Miller-Rabin (no known counterexamples, astronomically small error).
    """
    n = int(n)
    if HAVE_GMPY2:
        return bool(gmpy2.is_prime(n))
    return is_prime_mr(n)


def next_prime(n: int) -> int:
    """Smallest prime strictly greater than ``n``."""
    n = int(n)
    if HAVE_GMPY2:
        return int(gmpy2.next_prime(n))
    if n < 2:
        return 2
    cand = n + 1
    if cand % 2 == 0:
        cand += 1 if cand != 2 else 0
    if cand == 2:
        return 2
    while not is_prime_mr(cand):
        cand += 2
    return cand


def prev_prime(n: int) -> int:
    """Largest prime strictly less than ``n`` (raises if none exists)."""
    n = int(n)
    if n <= 2:
        raise ValueError("no prime below 2")
    if n == 3:
        return 2
    cand = n - 1
    if cand % 2 == 0:
        cand -= 1
    while cand >= 3:
        if is_prime_mr(cand):
            return cand
        cand -= 2
    return 2


def random_prime(bits: int) -> int:
    """Return a random prime with exactly ``bits`` bits (top bit set)."""
    if bits < 2:
        raise ValueError("need at least 2 bits")
    while True:
        cand = random.getrandbits(bits) | (1 << (bits - 1)) | 1
        if is_prime(cand):
            return cand
