"""Wheel factorization constants and pre-sieve patterns.

A "wheel mod m" skips every integer that shares a factor with ``m``. We use
the product of the first few primes:

* **mod 30 = 2*3*5**  -> phi(30) = 8 coprime residues per 30 integers
* **mod 210 = 2*3*5*7** -> phi(210) = 48 coprime residues per 210 integers

Because every backend in this package stores **odd numbers only** (the
factor of 2 is always wheeled out), the natural unit is the *odd index*:

    odd value v (v odd) <-> odd index g = (v - 1) // 2      [v = 2*g + 1]

so g=0->1, g=1->3, g=2->5, ...

For a wheel mod m the pattern of "is this odd index coprime to m?" repeats
every ``m // 2`` odd indices (15 for mod 30, 105 for mod 210). We expose
that repeating boolean pattern; backends tile it to pre-mark all multiples
of the wheel primes in one cheap memory copy, leaving only the primes
beyond the wheel to be sieved the slow way.
"""
from __future__ import annotations

from math import gcd
from typing import Dict, List

# Wheel primes for each modulus.
WHEEL_PRIMES: Dict[int, List[int]] = {
    1: [],            # degenerate: "wheel" of nothing -> plain odd-only sieve
    2: [2],           # odd-only
    30: [2, 3, 5],
    210: [2, 3, 5, 7],
}


def coprime_residues(m: int) -> List[int]:
    """Residues in [1, m] coprime to m (the spokes of the wheel)."""
    return [r for r in range(1, m + 1) if gcd(r, m) == 1]


def odd_index_pattern(m: int) -> List[int]:
    """Repeating odd-index mask for wheel mod ``m``.

    Returns a list of length ``m // 2`` (m must be even). Entry ``j`` is 1
    if the odd value ``2*j + 1`` is coprime to ``m``, else 0. Tiling this
    list reproduces the wheel's "candidate" mask over all odd numbers.

    For ``m == 1`` (no wheel) the pattern is a single ``1`` (every odd is a
    candidate), matching a plain odd-only sieve.
    """
    if m == 1:
        return [1]
    if m % 2 != 0:
        raise ValueError("wheel modulus must be even (must include the prime 2)")
    half = m // 2
    pattern = [0] * half
    for j in range(half):
        v = 2 * j + 1
        pattern[j] = 1 if gcd(v, m) == 1 else 0
    return pattern


def first_sieving_prime(m: int) -> int:
    """Smallest prime that still needs explicit sieving after wheel mod ``m``.

    All multiples of the wheel primes are pre-marked, so sieving starts at
    the next prime: 3 for odd-only, 7 for mod 30, 11 for mod 210.
    """
    wp = WHEEL_PRIMES.get(m)
    if wp is None:
        raise ValueError(f"unknown wheel modulus {m}")
    if m in (1, 2):
        return 3
    # next prime after the largest wheel prime
    candidate = wp[-1] + 1
    while True:
        if all(candidate % p for p in range(2, int(candidate**0.5) + 1)):
            return candidate
        candidate += 1


# Number of odd indices in one wheel period, for each modulus.
PERIOD_ODD_INDICES: Dict[int, int] = {m: (1 if m == 1 else m // 2) for m in WHEEL_PRIMES}
