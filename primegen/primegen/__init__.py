"""primegen — a fast, honestly-benchmarked prime generation toolkit in Python.

Quick start
-----------
    >>> import primegen
    >>> primegen.count_primes(10**6)        # pi(10^6 - 1)
    78498
    >>> primegen.primes(20).tolist()
    [2, 3, 5, 7, 11, 13, 17, 19]
    >>> primegen.nth_prime(1000)
    7919
    >>> primegen.is_prime(2**607 - 1)        # 183-digit Mersenne prime
    True

The high-level functions auto-select the fastest available backend
(Cython bit-packed sieve > numpy sieve; multiprocessing for big ranges;
gmpy2 for huge single integers). See ``primegen.backends_available()``.
"""
from __future__ import annotations

from .core import (
    backends_available,
    count_primes,
    is_prime,
    next_prime,
    nth_prime,
    prev_prime,
    primes,
)

__version__ = "0.1.0"

__all__ = [
    "primes",
    "count_primes",
    "nth_prime",
    "is_prime",
    "next_prime",
    "prev_prime",
    "backends_available",
    "__version__",
]
