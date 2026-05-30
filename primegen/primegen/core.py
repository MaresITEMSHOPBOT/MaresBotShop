"""High-level public API with automatic backend selection.

These are the functions most users want. They pick a sensible backend:

* small/medium ranges -> single-core sieve (Cython bit-packed if compiled,
  else vectorized numpy), wheel mod 210;
* large ranges on multi-core machines -> the multiprocessing sieve;
* single huge integers -> the gmpy2 / Miller-Rabin path in ``bigprime``.

Everything routes through the same verified cores, so results are identical
regardless of which backend is chosen.
"""
from __future__ import annotations

import multiprocessing as mp
from math import isqrt, log
from typing import Optional

import numpy as np

from . import bigprime
from .backends import DEFAULT_SEGMENT_ODDS, sieve_numpy
from .csieve import HAVE_CYTHON, sieve_bitpacked
from .parallel import parallel_count, parallel_primes
from .primecount import prime_count_range

# Above this many integers in the range, fan out across cores.
PARALLEL_THRESHOLD = 50_000_000

_BEST_BACKEND = "cython" if HAVE_CYTHON else "numpy"
_BEST_FN = sieve_bitpacked if HAVE_CYTHON else sieve_numpy


def _normalize_bounds(a: int, b: Optional[int]) -> "tuple[int, int]":
    """``f(stop)`` -> [0, stop); ``f(start, stop)`` -> [start, stop)."""
    if b is None:
        return 0, int(a)
    return int(a), int(b)


def primes(a: int, b: Optional[int] = None, *, workers: Optional[int] = None) -> np.ndarray:
    """Primes in a range, as a sorted int64 numpy array.

    ``primes(stop)`` -> primes < ``stop``;  ``primes(start, stop)`` -> primes
    in ``[start, stop)``. Automatically parallelizes large ranges.
    """
    lo, hi = _normalize_bounds(a, b)
    if hi <= 2 or hi <= lo:
        return np.empty(0, dtype=np.int64)
    use_parallel = (hi - lo) > PARALLEL_THRESHOLD and (workers or mp.cpu_count()) > 1
    if use_parallel:
        return parallel_primes(lo, hi, workers=workers, chunks_per_worker=4, backend=_BEST_BACKEND)
    return np.asarray(_BEST_FN(lo, hi, wheel=210, collect=True), dtype=np.int64)


def count_primes(a: int, b: Optional[int] = None, *, method: str = "auto",
                 workers: Optional[int] = None) -> int:
    """Number of primes in a range (``pi`` over the interval).

    ``count_primes(stop)`` -> ``pi(stop-1)``;  ``count_primes(start, stop)``
    -> primes in ``[start, stop)``.

    ``method``:
      * ``"auto"`` / ``"count"`` (default): the **sublinear** combinatorial
        counter (``primecount``) — ~O(x^(3/4)), no enumeration. Reaches
        pi(10^12) in seconds and beats the sieve by orders of magnitude.
      * ``"sieve"``: count by actually sieving (enumerates the primes). Useful
        for cross-checking, or when you also want the primes themselves.
    """
    lo, hi = _normalize_bounds(a, b)
    if hi <= 2 or hi <= lo:
        return 0
    if method in ("auto", "count"):
        return prime_count_range(lo, hi)
    use_parallel = (hi - lo) > PARALLEL_THRESHOLD and (workers or mp.cpu_count()) > 1
    if use_parallel:
        return parallel_count(lo, hi, workers=workers, chunks_per_worker=4, backend=_BEST_BACKEND)
    return int(_BEST_FN(lo, hi, wheel=210, collect=False))


def _nth_prime_upper_bound(n: int) -> int:
    """Proven upper bound for the n-th prime (n >= 6): n(ln n + ln ln n)."""
    ln = log(n)
    return int(n * (ln + log(ln))) + 3


def nth_prime(n: int) -> int:
    """Return the ``n``-th prime (1-indexed: ``nth_prime(1) == 2``)."""
    if n < 1:
        raise ValueError("n must be >= 1")
    if n < 6:
        return [2, 3, 5, 7, 11][n - 1]
    hi = _nth_prime_upper_bound(n)
    ps = primes(hi + 1)
    if len(ps) < n:  # pragma: no cover - bound is proven, defensive only
        ps = primes(2 * hi)
    return int(ps[n - 1])


# --- single huge integers: delegate to the gmpy2 / Miller-Rabin path ---------
def is_prime(n: int) -> bool:
    """Primality test for a single integer of any size (gmpy2 when available)."""
    return bigprime.is_prime(n)


def next_prime(n: int) -> int:
    """Smallest prime strictly greater than ``n``."""
    return bigprime.next_prime(n)


def prev_prime(n: int) -> int:
    """Largest prime strictly less than ``n``."""
    return bigprime.prev_prime(n)


def backends_available() -> dict:
    """Report which optional accelerators are active (for diagnostics)."""
    return {
        "sieve_backend": _BEST_BACKEND,
        "have_cython": HAVE_CYTHON,
        "bigint_backend": bigprime.backend_name(),
        "cpu_count": mp.cpu_count(),
    }
