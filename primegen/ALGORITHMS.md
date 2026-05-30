# Algorithms for finding primes — a measured tour

There isn't *one* algorithm for finding primes; there's a family, and the best
choice depends on what you're doing: sieving a whole range, streaming primes
forever, or testing one huge number. This catalogues the genuinely different
approaches, each implemented in `primegen/algorithms.py`, verified against the
reference oracle, and **raced against the others** (run
`python benchmarks/compare_algorithms.py`).

## The idea behind each

| Algorithm | Core idea | Finds |
|---|---|---|
| **Trial division** | n is prime iff no prime ≤ √n divides it | primes ≤ N |
| **Sieve of Eratosthenes** (~240 BC) | the first unmarked number is prime; cross out its multiples | primes ≤ N |
| **Sieve of Sundaram** (1934) | 2k+1 is composite iff k = i+j+2ij; remove those k | primes ≤ N |
| **Sieve of Atkin** (2003) | flip bits by counting solutions of quadratic forms mod 12 | primes ≤ N |
| **Incremental sieve** (O'Neill) | dict of each prime's next multiple; sieve lazily while streaming | primes, **unbounded** |
| **Wilson's theorem** | n prime iff (n−1)! ≡ −1 (mod n) | one number |
| **AKS** (2002) | deterministic, polynomial time, via (x+a)ⁿ ≡ xⁿ+a in (ℤ/n)[x]/(xʳ−1) | one number |
| **Lucas–Lehmer** | Mₚ = 2ᵖ−1 prime iff sₚ₋₂ ≡ 0, s₀=4, sₖ₊₁=sₖ²−2 | Mersenne primes |
| **Miller–Rabin / BPSW** | strong probable-prime test (see `bigprime.py`) | one number (huge) |
| **Meissel–Lehmer / Lucy** | DP over the O(√x) values ⌊x/i⌋; sieve "lifted" to keys | **π(x) only**, sublinear |

## Measured race (this 4-core box, Python 3.11)

### Bounded sieves — all primes up to 10⁶

| Algorithm | time (s) | M primes/s | vs fastest |
|---|--:|--:|--:|
| trial division | 0.6827 | 0.11 | 610× |
| Sundaram | 0.3948 | 0.20 | 353× |
| Atkin | 0.2834 | 0.28 | 253× |
| Eratosthenes (textbook) | 0.0430 | 1.82 | 38× |
| **primegen (Cython, wheel-210)** | **0.0011** | **70.10** | **1×** |

**The honest lessons:**
1. **Better asymptotic complexity ≠ faster in practice.** Atkin is *O(N / log log N)* — asymptotically better than Eratosthenes' *O(N log log N)* — yet it is **6× slower** here. Its win is buried under Python-level constant factors (nested loops, no vectorized inner step).
2. **The inner loop is everything.** Textbook Eratosthenes beats Sundaram/Atkin only because its hot step is a C-level slice `sieve[i*i::i] = 0`, while theirs run in the Python interpreter.
3. **Tuning beats cleverness.** primegen's segmented + bit-packed + wheel + Cython sieve is **38× faster than even textbook Eratosthenes** and 250–600× faster than the "clever" sieves — same 2000-year-old idea, just engineered.

### Unbounded generation — first 10⁶ primes (no upper bound)

The incremental sieve streams primes lazily (≈0.24 M primes/s, O(π(√n)) memory).
Slower per prime than a bounded sieve, but it never needs to know N in advance —
useful when you want "primes until some condition".

### One number, three ideas

| Number | Miller–Rabin (gmpy2) | Wilson's theorem | AKS |
|--:|--:|--:|--:|
| 7,919 | 32 µs | 0.55 ms | 7.0 s |
| 99,991 | 16 µs | 9.6 ms | 42.2 s |

For a single number, the *test* algorithms crush the sieves. **Miller–Rabin
wins by ~6 orders of magnitude over AKS.** Wilson and AKS are mathematically
exact but impractical — Wilson is O(n) multiplications, AKS's polynomial step is
enormous. AKS matters because it *proved* primality is in P (deterministic,
polynomial), not because anyone runs it.

### Mersenne primes — how record primes are found

Lucas–Lehmer instantly identifies the exponents p ≤ 160 with 2ᵖ−1 prime:
`[2, 3, 5, 7, 13, 17, 19, 31, 61, 89, 107, 127]`. Every largest-known-prime
record for decades has been a Mersenne prime found exactly this way (GIMPS).

## The real speedup: counting WITHOUT enumerating (sublinear π(x))

Every sieve above must *visit* (almost) every integer up to x — that is ~O(x)
work, no matter how tuned. But if you only need the **count** π(x), not the
primes themselves, you can do far better. The Meissel–Lehmer combinatorial
method — implemented here in its clean DP form (the "Lucy_Hedgehog" recurrence,
`primegen/primecount.py`) — works only with the O(√x) distinct values ⌊x/i⌋ and
computes π(x) in about **O(x^(3/4))** time and **O(√x)** memory, *without ever
listing a prime*.

Measured — sieve vs counter (verified against the tabulated π(x)):

| x | tuned sieve (4 cores) | sublinear counter (1 thread) | speedup |
|--:|--:|--:|--:|
| 10⁹ | 0.33 s | **0.08 s** | 4.1× |
| 10¹⁰ | 3.75 s | **0.33 s** | 11.3× |
| 10¹¹ | ~40 s (extrapolated) | **1.5 s** | ~25× |

**Compiling the hot loop (Cython).** The whole DP is then ported to C
(`primegen/_count.pyx`), removing numpy's per-prime temporary allocations — the
fastest π(x) this package offers, ~2× over the numpy version, same recurrence:

| x | numpy counter | **Cython counter** | speedup |
|--:|--:|--:|--:|
| 10¹¹ | 1.44 s | **0.68 s** | 2.1× |
| 10¹² | 7.90 s | **3.73 s** | 2.1× |
| 10¹³ | 37.8 s | **19.8 s** | 1.9× |

And where the sieve simply can't follow (it would take many minutes/hours and
hundreds of GB), the Cython counter strolls on — all results match known π(x):

| x | Cython counter | π(x) | verified |
|--:|--:|--:|:--:|
| 10¹⁴ | **105 s** | 3,204,941,750,802 | ✓ measured |
| 10¹⁵ | **529 s** (≈250 MB) | 29,844,570,422,669 | ✓ measured |

The lead grows with x precisely because it is O(x^¾) vs O(x). This is the same
*class* of algorithm the C++ tool `primecount` uses to reach π(10²⁹) — though it
employs the more advanced Lagarias–Miller–Odlyzko / Deléglise–Rivat refinements
(O(x^(2/3))). Our Lucy variant is simpler but already a categorical win over the
sieve for counting. `primegen.count_primes` now uses it by default
(`method="sieve"` forces the old enumeration path). The same recurrence also
gives the *sum* of primes (`primegen.prime_sum`).

## So, which algorithm "finds primes"?

- **Just the count π(x)** → the sublinear Meissel–Lehmer/Lucy counter
  (`primegen.count_primes`, `primegen.prime_count`) — fastest by far, no
  enumeration.
- **All primes up to N (the values)** → Sieve of Eratosthenes, tuned (segmented +
  bit-packed + wheel). That's `primegen.primes`.
- **A stream of primes, no bound** → incremental sieve (`primegen.primes_incremental`).
- **Is this one (possibly huge) number prime?** → Miller–Rabin / BPSW
  (`primegen.is_prime`, via gmpy2).
- **A gigantic record prime** → Lucas–Lehmer on Mersenne candidates
  (`primegen.lucas_lehmer`).
- **A guaranteed proof in polynomial time** → AKS (`algorithms.aks_is_prime`) — in
  theory; in practice you'd use ECPP or APR-CL.
