"""A tour of *different* algorithms for finding primes.

The rest of primegen leans on one workhorse (a tuned segmented Sieve of
Eratosthenes). But "finding primes" has many genuinely different algorithms,
each with its own idea. This module collects them — each one verified against
the reference oracle and benchmarked against the others — so the trade-offs are
measured, not assumed.

Bounded sieves (find all primes <= n):
  * trial_division      — the naive baseline: test each number for divisibility
  * sieve_eratosthenes  — cross out multiples of each prime (the classic)
  * sieve_sundaram      — cross out numbers of the form i+j+2ij, then map k->2k+1
  * sieve_atkin         — flip bits by solutions of quadratic forms mod 12

Unbounded generation (stream primes with no upper limit):
  * primes_incremental  — O'Neill's incremental sieve via a dict of next hits

Primality of a single number (different ideas):
  * is_prime_wilson     — Wilson's theorem: (n-1)! ≡ -1 (mod n)  [formula]
  * aks_is_prime        — AKS: deterministic, polynomial time (2002 breakthrough)
  * lucas_lehmer        — Mersenne primes 2^p-1 (how the largest primes are found)
"""
from __future__ import annotations

import math
from typing import Dict, Iterator, List

# ===========================================================================
# Bounded sieves
# ===========================================================================
def trial_division(n: int) -> List[int]:
    """Primes <= n by testing each candidate against known smaller primes.

    Idea: a number is prime iff no prime <= sqrt(it) divides it. Dead simple,
    O(n*sqrt(n)/ln n)-ish — the slowest here, included as the honest baseline.
    """
    if n < 2:
        return []
    primes = [2]
    for cand in range(3, n + 1, 2):
        limit = math.isqrt(cand)
        for p in primes:
            if p > limit:
                primes.append(cand)
                break
            if cand % p == 0:
                break
        else:
            primes.append(cand)
    return primes


def sieve_eratosthenes(n: int) -> List[int]:
    """Primes <= n by crossing out multiples (textbook Sieve of Eratosthenes).

    Idea (Eratosthenes, ~240 BC): start with all numbers as candidates; the
    first unmarked number is prime, so cross out all its multiples; repeat.
    O(n log log n) — the gold standard. (primegen's fast backends are tuned
    segmented/bit-packed/wheeled versions of exactly this.)
    """
    if n < 2:
        return []
    sieve = bytearray([1]) * (n + 1)
    sieve[0] = sieve[1] = 0
    for i in range(2, math.isqrt(n) + 1):
        if sieve[i]:
            sieve[i * i :: i] = bytearray(len(range(i * i, n + 1, i)))
    return [i for i in range(2, n + 1) if sieve[i]]


def sieve_sundaram(n: int) -> List[int]:
    """Primes <= n via the Sieve of Sundaram (1934).

    Idea: a number 2k+1 is composite iff k = i + j + 2ij for some 1 <= i <= j.
    So cross out all such k in [1, (n-1)/2]; every surviving k yields the odd
    prime 2k+1. Elegant — no explicit division or multiples-of-primes step.
    """
    if n < 2:
        return []
    m = (n - 1) // 2
    marked = bytearray(m + 1)  # marked[k] == 1  =>  2k+1 is composite
    i = 1
    while i + i + 2 * i * i <= m:           # j starts at i; smallest term is 2i+2i^2
        j = i
        while i + j + 2 * i * j <= m:
            marked[i + j + 2 * i * j] = 1
            j += 1
        i += 1
    primes = [2]
    primes.extend(2 * k + 1 for k in range(1, m + 1) if not marked[k])
    return primes


def sieve_atkin(limit: int) -> List[int]:
    """Primes <= limit via the Sieve of Atkin (2003).

    Idea: instead of multiples, use modular quadratic forms. A square-free n
    (> 3) is prime depending on the *parity* of the number of representations
    by certain forms:
      * n % 12 in {1, 5} : toggle on each solution of 4x^2 + y^2 = n
      * n % 12 == 7      : toggle on each solution of 3x^2 + y^2 = n
      * n % 12 == 11     : toggle on each solution of 3x^2 - y^2 = n (x > y)
    Then remove multiples of each prime's square. Better asymptotic complexity
    (O(n / log log n)), but the constant factors make it *lose* to a tuned
    Eratosthenes in practice — see the benchmark.
    """
    if limit < 2:
        return []
    if limit < 4:
        return [2, 3][: max(0, limit - 1)]
    sieve = bytearray(limit + 1)
    root = math.isqrt(limit) + 1
    for x in range(1, root + 1):
        xx = x * x
        for y in range(1, root + 1):
            yy = y * y
            n = 4 * xx + yy
            if n <= limit and (n % 12 == 1 or n % 12 == 5):
                sieve[n] ^= 1
            n = 3 * xx + yy
            if n <= limit and n % 12 == 7:
                sieve[n] ^= 1
            n = 3 * xx - yy
            if x > y and n <= limit and n % 12 == 11:
                sieve[n] ^= 1
    # remove multiples of squares of all found primes
    for k in range(5, math.isqrt(limit) + 1):
        if sieve[k]:
            kk = k * k
            sieve[kk :: kk] = bytearray(len(range(kk, limit + 1, kk)))
    primes = [2, 3]
    primes.extend(n for n in range(5, limit + 1) if sieve[n])
    return primes


# ===========================================================================
# Unbounded generation
# ===========================================================================
def primes_incremental() -> Iterator[int]:
    """Yield primes forever, with no upper bound (incremental sieve).

    Idea (M. O'Neill): keep a dict mapping the next composite that each known
    prime will hit to that prime's stride. When we reach a number not in the
    dict it is prime; otherwise we advance the colliding primes to their next
    free slot. Memory is only O(pi(sqrt(n))) — it sieves lazily as it streams.
    """
    yield 2
    next_composite: Dict[int, int] = {}  # composite -> stride (2*prime)
    candidate = 3
    while True:
        stride = next_composite.pop(candidate, None)
        if stride is None:
            # candidate is prime; its first odd multiple to mark is candidate^2
            yield candidate
            next_composite[candidate * candidate] = 2 * candidate
        else:
            # advance to the next not-yet-occupied odd multiple
            nxt = candidate + stride
            while nxt in next_composite:
                nxt += stride
            next_composite[nxt] = stride
        candidate += 2


def first_n_primes(count: int) -> List[int]:
    """Return the first ``count`` primes using the unbounded incremental sieve."""
    out: List[int] = []
    gen = primes_incremental()
    for _ in range(count):
        out.append(next(gen))
    return out


# ===========================================================================
# Single-number primality (different ideas)
# ===========================================================================
def is_prime_wilson(n: int) -> bool:
    """Primality by Wilson's theorem: n > 1 is prime iff (n-1)! ≡ -1 (mod n).

    A genuine primality *formula*. Computed mod n it is O(n) multiplications —
    far too slow to be practical, but mathematically exact and a neat contrast
    to the sieve approach.
    """
    if n < 2:
        return False
    fact = 1
    for i in range(2, n):
        fact = (fact * i) % n
        if fact == 0:  # n is composite (it shares a factor with some i<n)
            return False
    return fact == n - 1


def lucas_lehmer(p: int) -> bool:
    """Is the Mersenne number M_p = 2^p - 1 prime? (Lucas-Lehmer test.)

    Idea: for p > 2, M_p is prime iff s_{p-2} ≡ 0 (mod M_p), where s_0 = 4 and
    s_{k+1} = s_k^2 - 2. This is *the* test behind every record prime: the
    largest known primes are all Mersenne primes found this way. Requires p
    itself to be prime for M_p to have a chance.
    """
    if p == 2:
        return True  # M_2 = 3 is prime
    if p < 2:
        return False
    mersenne = (1 << p) - 1
    s = 4
    for _ in range(p - 2):
        s = (s * s - 2) % mersenne
    return s == 0


def mersenne_prime_exponents(max_p: int) -> List[int]:
    """Exponents p <= max_p for which 2^p - 1 is prime (via Lucas-Lehmer)."""
    out: List[int] = []
    for p in sieve_eratosthenes(max_p):  # p must be prime
        if lucas_lehmer(p):
            out.append(p)
    return out


# --- AKS: deterministic polynomial-time primality (Agrawal-Kayal-Saxena, 2002)
def _is_perfect_power(n: int) -> bool:
    """True if n = a^b for integers a >= 2, b >= 2."""
    for b in range(2, n.bit_length() + 1):
        a = round(n ** (1.0 / b))
        for cand in (a - 1, a, a + 1):
            if cand >= 2 and cand ** b == n:
                return True
    return False


def _multiplicative_order_exceeds(n: int, r: int, bound: float) -> bool:
    """True if the multiplicative order of n modulo r exceeds ``bound``."""
    k = 1
    t = n % r
    if t == 1:
        return 1 > bound
    while t != 1:
        t = (t * n) % r
        k += 1
        if k > bound:
            return True
    return k > bound


def _poly_mul_mod(a: List[int], b: List[int], r: int, n: int) -> List[int]:
    """Multiply polynomials a, b in (Z/n)[x] / (x^r - 1)."""
    res = [0] * r
    for i in range(r):
        ai = a[i]
        if ai:
            for j in range(r):
                bj = b[j]
                if bj:
                    res[(i + j) % r] = (res[(i + j) % r] + ai * bj) % n
    return res


def _poly_pow_mod(base: List[int], e: int, r: int, n: int) -> List[int]:
    """Raise polynomial ``base`` to ``e`` in (Z/n)[x] / (x^r - 1)."""
    result = [0] * r
    result[0] = 1 % n
    while e > 0:
        if e & 1:
            result = _poly_mul_mod(result, base, r, n)
        e >>= 1
        if e:
            base = _poly_mul_mod(base, base, r, n)
    return result


def aks_is_prime(n: int) -> bool:
    """AKS primality test — deterministic and polynomial-time.

    The 2002 result that primality is in P. Faithful (unoptimised) version:
      1. if n is a perfect power -> composite
      2. find smallest r with ord_r(n) > log2(n)^2
      3. if any 1 < gcd(a, n) < n for a <= r -> composite
      4. if n <= r -> prime
      5. for a = 1..floor(sqrt(phi(r))*log2(n)): verify
         (x + a)^n ≡ x^n + a   in (Z/n)[x] / (x^r - 1); any failure -> composite
      6. otherwise -> prime
    Correct but *very* slow (the polynomial step is O(r^2 log n) per a); use it
    on small n only. It is here for its theoretical importance, not speed.
    """
    n = int(n)
    if n < 2:
        return False
    if n in (2, 3):
        return True
    if n % 2 == 0:
        return False
    if _is_perfect_power(n):
        return False

    log2n = math.log2(n)
    bound = log2n * log2n
    r = 2
    while r < n:
        if math.gcd(n, r) == 1 and _multiplicative_order_exceeds(n, r, bound):
            break
        r += 1

    for a in range(2, min(r, n - 1) + 1):
        g = math.gcd(a, n)
        if 1 < g < n:
            return False

    if n <= r:
        return True

    phi_r = sum(1 for k in range(1, r + 1) if math.gcd(k, r) == 1)
    a_max = int(math.isqrt(phi_r) * log2n)
    for a in range(1, a_max + 1):
        base = [0] * r
        base[0] = a % n
        base[1 % r] = (base[1 % r] + 1) % n          # polynomial (x + a)
        lhs = _poly_pow_mod(base, n, r, n)           # (x + a)^n
        rhs = [0] * r                                # x^(n mod r) + a
        rhs[n % r] = (rhs[n % r] + 1) % n
        rhs[0] = (rhs[0] + a) % n
        if lhs != rhs:
            return False
    return True
