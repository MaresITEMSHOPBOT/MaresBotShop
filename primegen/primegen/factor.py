"""Composite-number structure: factorization and arithmetic functions.

Primes are the multiplicative *atoms*; composites are the *molecules*. By the
**Fundamental Theorem of Arithmetic** every integer n > 1 is either prime or a
*unique* product of primes. Everything here exploits that structure:

* ``spf_sieve``  — smallest prime factor of *every* number up to N at once,
  in ~O(N log log N). This is also the deepest "why the sieve works" fact:
  a composite is removed exactly by its smallest prime factor, and that factor
  is always <= sqrt(n).
* ``factorize`` — factor a *single* (possibly huge) number with trial division
  + Pollard's rho, using Miller-Rabin (``bigprime.is_prime``) to know when a
  remaining cofactor is already prime. Rho is the composite-world counterpart
  to Miller-Rabin: one answers "is it prime?", the other "if not, give a factor".
* arithmetic functions derived from the factorization: number/sum of divisors,
  Euler's totient, omega/Omega, and tests for perfect and Carmichael numbers.
"""
from __future__ import annotations

import random
from math import gcd, isqrt
from typing import Dict, List, Tuple

import numpy as np

from . import bigprime

# Small primes for fast trial division before Pollard's rho kicks in.
_SMALL_PRIMES: List[int] = [
    2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
    73, 79, 83, 89, 97, 101, 103, 107, 109, 113,
]


def spf_sieve(n: int) -> np.ndarray:
    """Smallest prime factor of every integer in ``[0, n]``.

    ``spf[i]`` is the smallest prime dividing ``i`` (``spf[i] == i`` iff ``i``
    is prime; ``spf[0] = 0``, ``spf[1] = 1`` by convention). Only multiples are
    visited starting at ``p*p`` for primes ``p <= sqrt(n)`` (smaller multiples
    already carry a smaller prime), so the outer loop is just O(sqrt(n)).
    """
    spf = np.zeros(n + 1, dtype=np.int64)
    for p in range(2, isqrt(n) + 1):
        if spf[p] == 0:  # p is prime
            sl = spf[p * p :: p]
            sl[sl == 0] = p
    if n >= 2:
        rest = np.nonzero(spf[2:] == 0)[0] + 2  # whatever is still 0 is prime
        spf[rest] = rest
    if n >= 1:
        spf[1] = 1
    return spf


def _pollard_rho(n: int) -> int:
    """Return a non-trivial factor of composite ``n`` (Brent's variant)."""
    if n % 2 == 0:
        return 2
    while True:
        x = random.randrange(2, n)
        y = x
        c = random.randrange(1, n)
        d = 1
        while d == 1:
            x = (x * x + c) % n
            y = (y * y + c) % n
            y = (y * y + c) % n
            d = gcd(abs(x - y), n)
        if d != n:
            return d


def factorize(n: int) -> List[Tuple[int, int]]:
    """Prime factorization of ``n`` as a sorted list of ``(prime, exponent)``.

    Works for huge ``n``: small primes are trial-divided first, then Pollard's
    rho splits the rest, with Miller-Rabin deciding when a cofactor is prime.
    """
    n = int(n)
    if n < 0:
        raise ValueError("n must be non-negative")
    if n < 2:
        return []
    factors: Dict[int, int] = {}
    for p in _SMALL_PRIMES:
        while n % p == 0:
            factors[p] = factors.get(p, 0) + 1
            n //= p
        if p * p > n:
            break

    def _factor(m: int) -> None:
        if m == 1:
            return
        if bigprime.is_prime(m):
            factors[m] = factors.get(m, 0) + 1
            return
        d = _pollard_rho(m)
        _factor(d)
        _factor(m // d)

    if n > 1:
        _factor(n)
    return sorted(factors.items())


def factor_flat(n: int) -> List[int]:
    """Prime factors of ``n`` with multiplicity, ascending (e.g. 12 -> [2, 2, 3])."""
    out: List[int] = []
    for p, e in factorize(n):
        out.extend([p] * e)
    return out


def num_divisors(n: int) -> int:
    """tau(n): number of positive divisors (product of exponent+1)."""
    if n < 1:
        raise ValueError("n must be >= 1")
    result = 1
    for _, e in factorize(n):
        result *= e + 1
    return result


def sum_divisors(n: int) -> int:
    """sigma(n): sum of all positive divisors of n."""
    if n < 1:
        raise ValueError("n must be >= 1")
    result = 1
    for p, e in factorize(n):
        result *= (p ** (e + 1) - 1) // (p - 1)
    return result


def divisors(n: int) -> List[int]:
    """All positive divisors of ``n``, sorted."""
    if n < 1:
        raise ValueError("n must be >= 1")
    divs = [1]
    for p, e in factorize(n):
        powers = [p ** k for k in range(1, e + 1)]
        divs = [d * q for d in divs for q in [1] + powers]
    return sorted(divs)


def euler_phi(n: int) -> int:
    """Euler's totient phi(n): count of integers in [1, n] coprime to n."""
    if n < 1:
        raise ValueError("n must be >= 1")
    result = n
    for p, _ in factorize(n):
        result -= result // p
    return result


def omega(n: int) -> int:
    """Number of *distinct* prime factors of n."""
    return len(factorize(n))


def big_omega(n: int) -> int:
    """Number of prime factors of n *with multiplicity* (Omega)."""
    return sum(e for _, e in factorize(n))


def is_perfect(n: int) -> bool:
    """A perfect number equals the sum of its proper divisors (sigma(n) == 2n)."""
    return n >= 2 and sum_divisors(n) == 2 * n


def classify_abundance(n: int) -> str:
    """'deficient', 'perfect', or 'abundant' by comparing sigma(n) to 2n."""
    s = sum_divisors(n)
    if s < 2 * n:
        return "deficient"
    if s == 2 * n:
        return "perfect"
    return "abundant"


def is_carmichael(n: int) -> bool:
    """Is ``n`` a Carmichael number?

    Korselt's criterion: ``n`` is Carmichael iff it is composite, square-free,
    and ``(p - 1) | (n - 1)`` for every prime ``p`` dividing ``n``. Carmichael
    numbers are composites that pass the Fermat primality test for *every* base
    coprime to ``n`` — the reason a naive Fermat test is unsafe and Miller-Rabin
    (or BPSW) is needed.
    """
    if n < 3 or n % 2 == 0:
        return False
    fac = factorize(n)
    if len(fac) < 2:  # prime or prime power -> not Carmichael
        return False
    for p, e in fac:
        if e > 1:  # must be square-free
            return False
        if (n - 1) % (p - 1) != 0:
            return False
    return True
