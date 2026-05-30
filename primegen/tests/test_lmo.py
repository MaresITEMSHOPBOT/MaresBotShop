"""Correctness for the Lagarias-Miller-Odlyzko prime counter.

LMO is verified against the reference oracle and the tabulated pi(x). Its value
here is the *algorithm* (better asymptotics), not speed — the benchmark shows it
is slower than the Cython Lucy counter in pure Python, which is the honest point.
"""
import random

import pytest

from primegen import reference as ref
from primegen.lmo import _lmo_phi, _mobius_and_lpf, integer_cbrt, pi_lmo
from primegen.primecount import prime_count


def test_integer_cbrt():
    for x in [0, 1, 7, 8, 9, 26, 27, 28, 1000, 999, 10**9, 10**12 + 5]:
        r = integer_cbrt(x)
        assert r ** 3 <= x < (r + 1) ** 3


def test_lmo_matches_reference():
    random.seed(11)
    samples = [2, 3, 10, 24, 25, 26, 30, 100, 1000, 9973, 10**4, 10**5]
    samples += [random.randrange(25, 10**6) for _ in range(50)]
    for n in samples:
        assert pi_lmo(n) == ref.count_upto(n), n


def test_lmo_phi_matches_brute():
    """The phi(x, a) leaf decomposition must equal a direct sieve count."""
    from math import isqrt
    for x in [10**4, 5 * 10**4, 10**5]:
        primes = ref.primes_upto(isqrt(x))
        y = integer_cbrt(x)
        a = sum(1 for p in primes if p <= y)
        mu, lpf = _mobius_and_lpf(y)
        phi = _lmo_phi(x, a, primes, mu, lpf)
        # brute phi(x, a) = #{n<=x with no factor among first a primes}
        first = primes[:a]
        brute = sum(1 for n in range(1, x + 1) if all(n % p for p in first))
        assert phi == brute, (x, phi, brute)


@pytest.mark.parametrize("x,expected", [
    (10**6, 78498),
    (10**7, 664579),
    (10**8, 5761455),
])
def test_lmo_known_pi(x, expected):
    assert pi_lmo(x) == expected


@pytest.mark.slow
@pytest.mark.parametrize("x,expected", [
    (10**9, 50847534),
    (10**10, 455052511),
])
def test_lmo_known_pi_slow(x, expected):
    assert pi_lmo(x) == expected


def test_lmo_agrees_with_lucy_counter():
    """LMO and the Lucy counter (different algorithms) must give identical pi(x)."""
    for x in [12345, 999983, 10**6, 3 * 10**6]:
        assert pi_lmo(x) == prime_count(x)
