"""Correctness gate. No optimization ships unless these pass.

Strategy: a dead-simple reference sieve (``primegen.reference``) is the oracle.
Every fast backend is cross-checked against it on a battery of ranges that
deliberately stress segment boundaries, offset starts, and the wheel-prime
re-adding logic. The famous prime-counting values pin the absolute results.
"""
import numpy as np
import pytest

from primegen import reference as ref
from primegen.backends import sieve_bytearray, sieve_numpy
from primegen.csieve import HAVE_CYTHON, sieve_bitpacked
from primegen.parallel import parallel_count, parallel_primes

# All sieve backends under test, by name.
SIEVES = {
    "bytearray": sieve_bytearray,
    "numpy": sieve_numpy,
    "bitpacked": sieve_bitpacked,
}
WHEELS = (2, 30, 210)

# Ranges chosen to exercise edges: empties, the prime 2, tiny ranges, ranges
# that cross many segment boundaries (paired with a tiny segment), offset
# starts, and a window around 10^6.
RANGES = [
    (0, 2), (0, 3), (2, 3), (7, 7), (0, 1), (1, 2),
    (0, 30), (0, 100), (0, 1000), (0, 50_000),
    (990, 1050), (123_456, 234_567),
    (999_983, 1_000_005), (1_000_000, 1_001_000),
]


def _as_list(x):
    return x.tolist() if isinstance(x, np.ndarray) else list(x)


@pytest.mark.parametrize("name", list(SIEVES))
@pytest.mark.parametrize("wheel", WHEELS)
@pytest.mark.parametrize("lo,hi", RANGES)
def test_backend_matches_reference(name, wheel, lo, hi):
    sieve = SIEVES[name]
    truth = ref.primes_in_range(lo, hi)
    # Tiny segment forces many boundary crossings.
    got = _as_list(sieve(lo, hi, wheel=wheel, segment_odds=840))
    assert got == truth
    count = sieve(lo, hi, wheel=wheel, segment_odds=840, collect=False)
    assert count == len(truth)


@pytest.mark.parametrize("name", list(SIEVES))
@pytest.mark.parametrize("wheel", WHEELS)
def test_backend_default_segment(name, wheel):
    """Same check but with the (large) default segment size."""
    sieve = SIEVES[name]
    truth = ref.primes_in_range(0, 200_000)
    assert _as_list(sieve(0, 200_000, wheel=wheel)) == truth
    assert sieve(0, 200_000, wheel=wheel, collect=False) == len(truth)


def test_wheels_agree_on_large_range():
    """odd-only, mod-30, and mod-210 must all produce identical primes."""
    base = _as_list(sieve_bitpacked(0, 2_000_000, wheel=2))
    assert _as_list(sieve_bitpacked(0, 2_000_000, wheel=30)) == base
    assert _as_list(sieve_bitpacked(0, 2_000_000, wheel=210)) == base
    assert _as_list(sieve_numpy(0, 2_000_000, wheel=210)) == base


@pytest.mark.parametrize("n,expected", [
    (100, 25),
    (1000, 168),
    (10**6, 78498),     # the canonical pi(10^6) gate
    (10**7, 664579),
    (10**8, 5761455),
])
def test_prime_counting_gates(n, expected):
    assert sieve_bitpacked(0, n + 1, wheel=210, collect=False) == expected
    assert sieve_numpy(0, n + 1, wheel=210, collect=False) == expected


@pytest.mark.slow
def test_pi_1e9_gate():
    """The pi(10^9) = 50,847,534 gate (opt in with --run-slow)."""
    assert sieve_bitpacked(0, 10**9 + 1, wheel=210, collect=False) == 50_847_534
    assert parallel_count(0, 10**9 + 1, workers=4) == 50_847_534


@pytest.mark.skipif(not HAVE_CYTHON, reason="Cython extension not built")
def test_cython_matches_fallback_byte_identical():
    """The compiled hot path must be byte-identical to the pure-Python fallback."""
    from primegen import _sieve as cy
    from primegen import _sieve_fallback as py
    from primegen.backends import base_primes_upto
    from primegen.csieve import _packed_pattern
    from primegen.wheel import first_sieving_prime

    primes = base_primes_upto(20000)
    S = 840 * 40
    for wheel in WHEELS:
        sp = first_sieving_prime(wheel)
        for seg_g0 in (0, S, 7 * S, 12_345 * S):
            a = _packed_pattern(wheel, S).copy()
            b = a.copy()
            cy.mark_segment(a, S, seg_g0, primes, sp)
            py.mark_segment(b, S, seg_g0, primes, sp)
            assert np.array_equal(a, b)
            bits = np.unpackbits(a, bitorder="little")
            for lo, hi in [(0, S), (13, S - 9), (S // 2, S // 2 + 777)]:
                assert cy.count_bits(a, lo, hi) == py.count_bits(b, lo, hi)
                assert cy.count_bits(a, lo, hi) == int(bits[lo:hi].sum())


@pytest.mark.parametrize("workers", [1, 2, 3, 4])
def test_parallel_matches_single_core(workers):
    truth = ref.primes_in_range(0, 300_000)
    got = parallel_primes(0, 300_000, workers=workers, chunks_per_worker=3).tolist()
    assert got == truth
    assert parallel_count(0, 300_000, workers=workers) == len(truth)


def test_parallel_offset_range():
    truth = ref.primes_in_range(500_000, 700_000)
    assert parallel_primes(500_000, 700_000, workers=3, chunks_per_worker=2).tolist() == truth


# ---- public API -------------------------------------------------------------
def test_public_api_counts():
    import primegen
    assert primegen.count_primes(10**6) == 78498
    assert primegen.count_primes(10, 30) == len(ref.primes_in_range(10, 30))
    assert primegen.primes(20).tolist() == [2, 3, 5, 7, 11, 13, 17, 19]


@pytest.mark.parametrize("n,expected", [
    (1, 2), (2, 3), (3, 5), (6, 13),
    (1000, 7919), (10_000, 104_729), (100_000, 1_299_709),
])
def test_nth_prime(n, expected):
    import primegen
    assert primegen.nth_prime(n) == expected
