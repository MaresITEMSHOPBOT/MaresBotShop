"""Reference sieve — the correctness oracle.

This module is intentionally as simple and obviously-correct as possible.
It is *not* fast and is *not* segmented. Every optimized backend in this
package is cross-checked against the output of these functions on
overlapping ranges (see ``tests/test_correctness.py``). If the reference
is ever wrong, the whole project is wrong, so it stays trivial.
"""
from __future__ import annotations

from typing import List


def primes_upto(n: int) -> List[int]:
    """Return all primes ``p`` with ``p <= n`` using a plain sieve of Eratosthenes.

    Uses a full byte-per-integer sieve (no odd-only trick, no segmentation)
    so the code reads exactly like the textbook algorithm.
    """
    if n < 2:
        return []
    sieve = bytearray([1]) * (n + 1)
    sieve[0] = 0
    sieve[1] = 0
    i = 2
    while i * i <= n:
        if sieve[i]:
            # Zero out i*i, i*i+i, i*i+2i, ... <= n in one C-level slice.
            sieve[i * i :: i] = bytearray(len(range(i * i, n + 1, i)))
        i += 1
    return [i for i in range(2, n + 1) if sieve[i]]


def primes_in_range(lo: int, hi: int) -> List[int]:
    """Return all primes ``p`` with ``lo <= p < hi`` (half-open interval)."""
    if hi <= 2 or hi <= lo:
        return []
    return [p for p in primes_upto(hi - 1) if p >= lo]


def count_upto(n: int) -> int:
    """Return ``pi(n)`` = the number of primes ``<= n``."""
    if n < 2:
        return 0
    sieve = bytearray([1]) * (n + 1)
    sieve[0] = 0
    sieve[1] = 0
    i = 2
    while i * i <= n:
        if sieve[i]:
            sieve[i * i :: i] = bytearray(len(range(i * i, n + 1, i)))
        i += 1
    return sum(sieve)


def is_prime_trial(n: int) -> bool:
    """Trial-division primality test. Trivially correct, used to validate fast paths."""
    if n < 2:
        return False
    if n < 4:
        return True
    if n % 2 == 0:
        return False
    i = 3
    while i * i <= n:
        if n % i == 0:
            return False
        i += 2
    return True
