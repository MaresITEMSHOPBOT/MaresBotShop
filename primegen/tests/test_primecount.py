"""Correctness for the sublinear prime-counting method.

The three implementations (dict / pure-array / numpy) must agree with each
other, with the reference sieve, and with the famous tabulated pi(x) values.
"""
import random

import pytest

from primegen import count_primes
from primegen import reference as ref
from primegen.primecount import (
    _prime_count_arrays_py,
    _prime_count_numpy,
    prime_count,
    prime_count_lucy,
    prime_count_range,
    prime_sum,
)

KNOWN_PI = {
    10**6: 78498,
    10**7: 664579,
    10**8: 5761455,
    10**9: 50847534,
    10**10: 455052511,
}
KNOWN_PI_SLOW = {
    10**11: 4118054813,
    10**12: 37607912018,
    10**13: 346065536839,
}


def test_implementations_agree_with_reference():
    random.seed(0)
    samples = [0, 1, 2, 3, 4, 10, 100, 1000, 9973, 10**4, 10**5, 10**6]
    samples += [random.randrange(2, 10**6) for _ in range(60)]
    for n in samples:
        truth = ref.count_upto(n)
        assert prime_count_lucy(n) == truth, n
        assert _prime_count_arrays_py(n) == truth, n
        assert _prime_count_numpy(n) == truth, n
        assert prime_count(n) == truth, n


@pytest.mark.parametrize("n,expected", list(KNOWN_PI.items()))
def test_known_pi_values(n, expected):
    assert prime_count(n) == expected


@pytest.mark.slow
@pytest.mark.parametrize("n,expected", list(KNOWN_PI_SLOW.items()))
def test_known_pi_values_slow(n, expected):
    assert prime_count(n) == expected


def test_range_matches_sieve():
    assert prime_count_range(10**6, 10**7) == ref.count_upto(10**7 - 1) - ref.count_upto(10**6 - 1)
    assert prime_count_range(0, 100) == 25
    assert prime_count_range(10, 30) == len(ref.primes_in_range(10, 30))
    assert prime_count_range(50, 50) == 0


def test_count_primes_public_api_uses_counter():
    # public count_primes must still be correct (now backed by the sublinear method)
    assert count_primes(10**6) == 78498
    assert count_primes(10**8) == 5761455
    assert count_primes(10**6, 10**7) == ref.count_upto(10**7 - 1) - ref.count_upto(10**6 - 1)
    # and the explicit sieve method must agree with it
    assert count_primes(10**6, method="sieve") == count_primes(10**6, method="count")


def test_prime_sum():
    assert prime_sum(10) == 17           # 2+3+5+7
    assert prime_sum(2) == 2
    assert prime_sum(1) == 0
    assert prime_sum(100) == 1060
    assert prime_sum(2_000_000) == 142913828922   # Project Euler 10
