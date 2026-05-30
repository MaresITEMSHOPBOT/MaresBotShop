"""Big-integer primality / prime-search correctness."""
import bisect
import random

import pytest

from primegen import bigprime as bp
from primegen import reference as ref


def test_is_prime_small_matches_trial():
    for n in range(0, 3000):
        assert bp.is_prime(n) == ref.is_prime_trial(n), n


def test_pure_python_mr_matches_trial():
    for n in range(0, 3000):
        assert bp.is_prime_mr(n) == ref.is_prime_trial(n), n


def test_next_prime_matches_reference():
    P = ref.primes_upto(3000)
    for n in range(0, 2000):
        expected = P[bisect.bisect_right(P, n)]
        assert bp.next_prime(n) == expected, n


def test_prev_prime():
    assert bp.prev_prime(3) == 2
    assert bp.prev_prime(100) == 97
    assert bp.prev_prime(8) == 7
    with pytest.raises(ValueError):
        bp.prev_prime(2)


@pytest.mark.parametrize("p", [
    2**607 - 1,    # Mersenne prime M607 (183 digits)
    2**521 - 1,    # Mersenne prime M521
    10**18 + 9,    # known prime
])
def test_known_large_primes(p):
    assert bp.is_prime(p) is True


@pytest.mark.parametrize("c", [
    2**607 - 1 + 2,
    (10**50 + 1),         # composite
    (2**67 - 1),          # famously composite (Cole)
])
def test_known_large_composites(c):
    assert bp.is_prime(c) is False


def test_mr_agrees_with_backend_on_randoms():
    random.seed(123)
    for _ in range(500):
        n = random.randrange(2, 10**15)
        assert bp.is_prime_mr(n) == bp.is_prime(n), n


def test_next_prime_big():
    n = 10**100
    p = bp.next_prime(n)
    assert p > n
    assert bp.is_prime(p)
    # nothing prime strictly between n and p
    assert all(not bp.is_prime(n + k) for k in range(1, p - n))


def test_random_prime_bits():
    random.seed(0)
    p = bp.random_prime(64)
    assert bp.is_prime(p)
    assert p.bit_length() == 64
