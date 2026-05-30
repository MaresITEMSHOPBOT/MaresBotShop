"""Parallel sieving across CPU cores with ``multiprocessing``.

The target range is split into independent contiguous chunks and sieved in
parallel. The base-prime list (primes up to ``sqrt(hi)``) is computed **once**
in the parent and handed to every worker through the pool initializer, so it
is shared read-only rather than recomputed per chunk. Each chunk is a fully
independent segmented sieve, so there is no inter-worker communication during
sieving — embarrassingly parallel.

Use ``parallel_count`` for throughput (returns ``pi(hi-1) - pi(lo-1)``) and
``parallel_primes`` to materialize the primes themselves.
"""
from __future__ import annotations

import multiprocessing as mp
from math import isqrt
from typing import List, Optional, Tuple

import numpy as np

from .backends import DEFAULT_SEGMENT_ODDS, base_primes_upto, sieve_numpy
from .csieve import sieve_bitpacked

# Per-worker shared state, populated by the pool initializer.
_SHARED: dict = {}


def _init_worker(primes: np.ndarray, wheel: int, segment_odds: int, backend: str) -> None:
    _SHARED["primes"] = primes
    _SHARED["wheel"] = wheel
    _SHARED["segment_odds"] = segment_odds
    _SHARED["fn"] = sieve_bitpacked if backend == "cython" else sieve_numpy


def _count_chunk(task: Tuple[int, int]) -> int:
    lo, hi = task
    return int(
        _SHARED["fn"](
            lo, hi, wheel=_SHARED["wheel"],
            segment_odds=_SHARED["segment_odds"], collect=False,
            primes=_SHARED["primes"],
        )
    )


def _collect_chunk(task: Tuple[int, int]) -> np.ndarray:
    lo, hi = task
    return np.asarray(
        _SHARED["fn"](
            lo, hi, wheel=_SHARED["wheel"],
            segment_odds=_SHARED["segment_odds"], collect=True,
            primes=_SHARED["primes"],
        ),
        dtype=np.int64,
    )


def split_range(lo: int, hi: int, n: int) -> List[Tuple[int, int]]:
    """Split ``[lo, hi)`` into up to ``n`` contiguous, non-empty chunks."""
    span = hi - lo
    if span <= 0:
        return []
    n = max(1, min(n, span))
    edges = [lo + (span * i) // n for i in range(n + 1)]
    return [(edges[i], edges[i + 1]) for i in range(n) if edges[i + 1] > edges[i]]


def _resolve(workers: Optional[int], chunks_per_worker: int, lo: int, hi: int) -> Tuple[int, int]:
    workers = workers or mp.cpu_count()
    workers = max(1, workers)
    n_chunks = max(workers, workers * chunks_per_worker)
    return workers, n_chunks


def parallel_count(
    lo: int,
    hi: int,
    *,
    workers: Optional[int] = None,
    chunks_per_worker: int = 1,
    wheel: int = 210,
    segment_odds: int = DEFAULT_SEGMENT_ODDS,
    backend: str = "cython",
) -> int:
    """Count primes in ``[lo, hi)`` across ``workers`` processes.

    ``workers=1`` runs inline (no pool overhead) and is the honest single-core
    baseline for scaling measurements.
    """
    if hi <= 2 or hi <= lo:
        return 0
    primes = base_primes_upto(isqrt(hi - 1))
    fn = sieve_bitpacked if backend == "cython" else sieve_numpy
    workers, n_chunks = _resolve(workers, chunks_per_worker, lo, hi)
    if workers == 1:
        return int(fn(lo, hi, wheel=wheel, segment_odds=segment_odds, collect=False, primes=primes))
    tasks = split_range(lo, hi, n_chunks)
    with mp.Pool(workers, initializer=_init_worker, initargs=(primes, wheel, segment_odds, backend)) as pool:
        return int(sum(pool.map(_count_chunk, tasks)))


def parallel_primes(
    lo: int,
    hi: int,
    *,
    workers: Optional[int] = None,
    chunks_per_worker: int = 1,
    wheel: int = 210,
    segment_odds: int = DEFAULT_SEGMENT_ODDS,
    backend: str = "cython",
) -> np.ndarray:
    """Return the primes in ``[lo, hi)`` as a sorted int64 array, computed in parallel."""
    if hi <= 2 or hi <= lo:
        return np.empty(0, dtype=np.int64)
    primes = base_primes_upto(isqrt(hi - 1))
    fn = sieve_bitpacked if backend == "cython" else sieve_numpy
    workers, n_chunks = _resolve(workers, chunks_per_worker, lo, hi)
    if workers == 1:
        return np.asarray(fn(lo, hi, wheel=wheel, segment_odds=segment_odds, collect=True, primes=primes), dtype=np.int64)
    tasks = split_range(lo, hi, n_chunks)
    with mp.Pool(workers, initializer=_init_worker, initargs=(primes, wheel, segment_odds, backend)) as pool:
        parts = pool.map(_collect_chunk, tasks)  # map preserves chunk order
    return np.concatenate(parts) if parts else np.empty(0, dtype=np.int64)
