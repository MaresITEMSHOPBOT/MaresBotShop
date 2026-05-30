"""Correctness for the alternative prime-finding algorithms.

Each algorithm is checked against the reference oracle. The slow ones (AKS,
Wilson) are exercised only on small inputs so the suite stays fast; their
agreement there, plus their deterministic nature, establishes correctness.
"""
import pytest

from primegen import algorithms as A
from primegen import reference as ref

SIEVES = [A.trial_division, A.sieve_eratosthenes, A.sieve_sundaram, A.sieve_atkin]


@pytest.mark.parametrize("fn", SIEVES, ids=lambda f: f.__name__)
@pytest.mark.parametrize("n", [0, 1, 2, 3, 4, 5, 10, 11, 30, 97, 100, 1000, 9973, 100_000])
def test_bounded_sieves_match_reference(fn, n):
    assert fn(n) == ref.primes_upto(n)


def test_incremental_sieve():
    assert A.first_n_primes(10) == [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
    # 1000th prime is 7919
    assert A.first_n_primes(1000) == ref.primes_upto(7919)
    # streaming agrees with a bounded sieve
    gen = A.primes_incremental()
    streamed = [next(gen) for _ in range(2000)]
    assert streamed == ref.primes_upto(streamed[-1])


def test_wilson_small():
    for n in range(0, 1500):
        assert A.is_prime_wilson(n) == ref.is_prime_trial(n), n


def test_lucas_lehmer_mersenne():
    assert A.mersenne_prime_exponents(130) == [2, 3, 5, 7, 13, 17, 19, 31, 61, 89, 107, 127]
    assert A.lucas_lehmer(11) is False   # M11 = 2047 = 23*89
    assert A.lucas_lehmer(13) is True    # M13 = 8191 is prime
    assert A.lucas_lehmer(2) is True     # M2 = 3


def test_aks_small_range():
    # AKS is deterministic; must match reference exactly (kept small — it's slow).
    for n in range(2, 160):
        assert A.aks_is_prime(n) == ref.is_prime_trial(n), n


@pytest.mark.parametrize("n,expected", [
    (561, False),     # Carmichael number — AKS is not fooled
    (1105, False),    # Carmichael
    (2047, False),    # 23*89, strong pseudoprime base 2
    (7919, True),     # prime
    (7921, False),    # 89^2 (perfect power path)
])
def test_aks_spot_checks(n, expected):
    assert A.aks_is_prime(n) is expected


def test_perfect_power_detection():
    assert A._is_perfect_power(2**10) is True
    assert A._is_perfect_power(7**5) is True
    assert A._is_perfect_power(7919) is False
