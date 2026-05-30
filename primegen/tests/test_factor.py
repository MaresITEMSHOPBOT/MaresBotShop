"""Correctness for the composite-number / factorization module."""
import random

import numpy as np
import pytest

from primegen import factor as F
from primegen import reference as ref


def _spf_trial(n):
    if n < 2:
        return n
    d = 2
    while d * d <= n:
        if n % d == 0:
            return d
        d += 1
    return n


def test_spf_sieve_matches_trial():
    spf = F.spf_sieve(50_000)
    for n in range(2, 50_000):
        assert spf[n] == _spf_trial(n), n


def test_smallest_prime_factor_below_sqrt():
    """Every composite's smallest prime factor is <= sqrt(n) (why we sieve to sqrt)."""
    N = 1_000_000
    spf = F.spf_sieve(N)
    n = np.arange(2, N + 1)
    composite = spf[2:] != n
    spf_c = spf[2:][composite].astype(np.float64)
    n_c = n[composite]
    assert np.all(spf_c <= np.sqrt(n_c))


def test_factorize_reconstructs():
    random.seed(0)
    for _ in range(3000):
        n = random.randrange(2, 10**7)
        prod = 1
        for p, e in F.factorize(n):
            assert ref.is_prime_trial(p)
            prod *= p**e
        assert prod == n


@pytest.mark.parametrize("n,expected", [
    (60, [(2, 2), (3, 1), (5, 1)]),
    (1001, [(7, 1), (11, 1), (13, 1)]),
    (2**67 - 1, [(193707721, 1), (761838257287, 1)]),  # Cole 1903
    (2**32 + 1, [(641, 1), (6700417, 1)]),             # Euler's F5 factorization
])
def test_factorize_known(n, expected):
    assert F.factorize(n) == expected


def test_arithmetic_functions():
    assert F.num_divisors(12) == 6
    assert F.sum_divisors(12) == 28
    assert F.euler_phi(12) == 4
    assert F.divisors(28) == [1, 2, 4, 7, 14, 28]
    assert F.omega(360) == 3        # 360 = 2^3 * 3^2 * 5
    assert F.big_omega(360) == 6
    assert F.euler_phi(1) == 1
    assert F.num_divisors(1) == 1


def test_perfect_numbers():
    assert [n for n in range(2, 10000) if F.is_perfect(n)] == [6, 28, 496, 8128]
    assert F.classify_abundance(6) == "perfect"
    assert F.classify_abundance(12) == "abundant"
    assert F.classify_abundance(8) == "deficient"


def test_carmichael_numbers():
    found = [n for n in range(3, 10000) if F.is_carmichael(n)]
    assert found == [561, 1105, 1729, 2465, 2821, 6601, 8911]
    # square-free composite but a prime is NOT Carmichael
    assert not F.is_carmichael(7919)
    # 561 = 3*11*17 fools Fermat for every coprime base
    from math import gcd
    assert all(pow(a, 560, 561) == 1 for a in range(2, 561) if gcd(a, 561) == 1)


def test_factor_flat():
    assert F.factor_flat(12) == [2, 2, 3]
    assert F.factor_flat(17) == [17]
    assert F.factor_flat(1) == []
