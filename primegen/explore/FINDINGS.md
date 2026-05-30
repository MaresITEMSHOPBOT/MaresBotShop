# Exploring primes and composites with primegen

backends: {'sieve_backend': 'cython', 'have_cython': True, 'bigint_backend': 'gmpy2', 'cpu_count': 4}

## A1. The Fundamental Theorem of Arithmetic

Every integer > 1 is prime, or a *unique* product of primes. Primes are
the multiplicative atoms; composites are molecules built from them.

            60 = 2^2 * 3 * 5                    [composite]
           360 = 2^3 * 3^2 * 5                  [composite]
         1,001 = 7 * 11 * 13                    [composite]
         5,040 = 2^4 * 3^2 * 5 * 7              [composite]
     1,048,575 = 3 * 5^2 * 11 * 31 * 41         [composite]
    69,999,937 = 7 * 9999991                    [composite]

## A2. Why the sieve only needs primes up to sqrt(n)

A composite n has a smallest prime factor spf(n). Claim: spf(n) <= sqrt(n)
(if every prime factor were > sqrt(n), their product would exceed n).
So every composite is struck out by a prime <= sqrt(n) — the sieve is complete.

  built smallest-prime-factor of all n <= 5,000,000 in 0.19s
  composites in range: 4,651,486
  composites whose smallest prime factor exceeds sqrt(n): 0  (must be 0)
  => verified empirically: sieving to sqrt(n) misses nothing.

## A3. The Prime Number Theorem:  pi(x) ~ x/ln(x) ~ Li(x)

Primes thin out, but predictably. Two estimates of pi(x):
the crude x/ln(x), and Gauss's Li(x) = ∫ dt/ln t (far better).

|         x | pi(x) (exact) |    x/ln x | rel.err |       Li(x) | rel.err |
|----------:|--------------:|----------:|--------:|------------:|--------:|
|        10 |             4 |         4 | +0.0857 |           5 | +0.28011 |
|       100 |            25 |        22 | -0.1314 |          29 | +0.16324 |
|     1,000 |           168 |       145 | -0.1383 |         177 | +0.05098 |
|    10,000 |         1,229 |     1,086 | -0.1166 |       1,245 | +0.01309 |
|   100,000 |         9,592 |     8,686 | -0.0945 |       9,629 | +0.00383 |
| 1,000,000 |        78,498 |    72,382 | -0.0779 |      78,627 | +0.00164 |
| 10,000,000 |       664,579 |   620,421 | -0.0664 |     664,917 | +0.00051 |
| 100,000,000 |     5,761,455 | 5,428,681 | -0.0578 |   5,762,208 | +0.00013 |
| 1,000,000,000 |    50,847,534 | 48,254,942 | -0.0510 |  50,849,234 | +0.00003 |

Note how Li(x)'s relative error shrinks ~10x faster — that is the PNT
error term (Li is accurate to ~sqrt(x), the Riemann-hypothesis bound).

## A4. Prime gaps and twin primes

The average gap between primes near x is about ln(x). Gaps are erratic,
yet twin primes (gap 2) keep appearing as far as we look.

  primes below 10,000,000: 664,579
  mean gap (empirical): 15.047   vs  ln(N) = 16.118   (PNT prediction)
  largest gap below 10,000,000: 154 (after prime 4,652,353)
  twin-prime pairs (p, p+2) below 10,000,000: 58,980
  record gaps (start -> gap): 2->1, 3->2, 7->4, 23->6, 89->8, 113->14, 523->18, 887->20, 1129->22, 1327->34, 9551->36, 15683->44 ...


---

## B1. The shape of composites: smallest-prime-factor distribution

Each composite is 'claimed' by its smallest prime factor. Half of all
numbers are even (spf 2); a third of the rest fall to 3; and so on —
a prime p first-claims a density 1/p of the numbers no smaller prime took.

| smallest prime factor | # composites it first-claims | fraction of composites |
|----------------------:|-----------------------------:|-----------------------:|
|                     2 |                    2,499,999 |                0.5375 |
|                     3 |                      833,332 |                0.1792 |
|                     5 |                      333,332 |                0.0717 |
|                     7 |                      190,475 |                0.0409 |
|                    11 |                      103,895 |                0.0223 |
|                    13 |                       79,919 |                0.0172 |
|                  > 13 |                      610,534 |                0.1313 |

## B2. How many prime factors does a typical number have?  omega(n) ~ ln ln n

Hardy & Ramanujan (1917): the number of *distinct* prime factors of n is
almost always about ln ln n — astonishingly small and slow-growing.

| up to x | mean omega(n) (distinct) | ln ln x |
|--------:|-------------------------:|--------:|
|   1,000 |                   2.1281 |  1.9326 |
|  10,000 |                   2.4302 |  2.2203 |
| 100,000 |                   2.6640 |  2.4435 |
| 1,000,000 |                   2.8537 |  2.6258 |

(The convergence is famously slow because ln ln x barely moves.)

## B3. Divisors, highly composite numbers, and perfect numbers

tau(n) = number of divisors. 'Highly composite' numbers (Ramanujan) set
records for tau — the opposite extreme from primes (which have tau=2).

  highly composite numbers below 100,000 (n : tau(n) = factorization):
         1 :   1  = 1
         2 :   2  = 2
         4 :   3  = 2^2
         6 :   4  = 2*3
        12 :   6  = 2^2*3
        24 :   8  = 2^3*3
        36 :   9  = 2^2*3^2
        48 :  10  = 2^4*3
        60 :  12  = 2^2*3*5
       120 :  16  = 2^3*3*5
       180 :  18  = 2^2*3^2*5
       240 :  20  = 2^4*3*5
       360 :  24  = 2^3*3^2*5
       720 :  30  = 2^4*3^2*5
       840 :  32  = 2^3*3*5*7
     1,260 :  36  = 2^2*3^2*5*7
     1,680 :  40  = 2^4*3*5*7
     2,520 :  48  = 2^3*3^2*5*7
     5,040 :  60  = 2^4*3^2*5*7
     7,560 :  64  = 2^3*3^3*5*7
    10,080 :  72  = 2^5*3^2*5*7
    15,120 :  80  = 2^4*3^3*5*7
    20,160 :  84  = 2^6*3^2*5*7
    25,200 :  90  = 2^4*3^2*5^2*7
    27,720 :  96  = 2^3*3^2*5*7*11
    45,360 : 100  = 2^4*3^4*5*7
    50,400 : 108  = 2^5*3^2*5^2*7
    55,440 : 120  = 2^4*3^2*5*7*11
    83,160 : 128  = 2^3*3^3*5*7*11

Perfect numbers (sigma(n) = 2n) tie composites back to primes via the
Euclid-Euler theorem: n = 2^(p-1)(2^p - 1) is perfect iff 2^p - 1 is a
(Mersenne) prime.

|       n | = 2^(p-1)(2^p-1) | 2^p-1 prime? |
|--------:|------------------|:------------:|
|       6 | p=2: 2^1*3 | True |
|      28 | p=3: 2^2*7 | True |
|     496 | p=5: 2^4*31 | True |
|   8,128 | p=7: 2^6*127 | True |
| 33,550,336 | p=13: 2^12*8191 | True |


---

## C1. Fermat's little theorem, and the composites that abuse it

For a prime p and any a not divisible by p:  a^(p-1) ≡ 1 (mod p).
This is the basis of fast primality tests. But it has *liars*.

  prime 7: a^(p-1) ≡ 1 (mod 7) for all coprime a -> True
  prime 97: a^(p-1) ≡ 1 (mod 97) for all coprime a -> True
  prime 7919: a^(p-1) ≡ 1 (mod 7919) for all coprime a -> True

Fermat *pseudoprimes* base 2: composites c with 2^(c-1) ≡ 1 (mod c).
  base-2 Fermat pseudoprimes below 100,000: 78 of them, e.g. [341, 561, 645, 1105, 1387, 1729, 1905, 2047]
  (the smallest, 341 = 11*31, fools the base-2 Fermat test)

**Carmichael numbers** are the worst case: composite, yet a^(n-1) ≡ 1
(mod n) for *every* a coprime to n. No choice of base saves the Fermat test.

  Carmichael numbers below 100,000: [561, 1105, 1729, 2465, 2821, 6601, 8911, 10585, 15841, 29341, 41041, 46657, 52633, 62745, 63973, 75361]
  Korselt's criterion (square-free, and (p-1)|(n-1) for each prime p|n):
    561 = 3*11*17  -> (3-1)|560:True, (11-1)|560:True, (17-1)|560:True
    1105 = 5*13*17  -> (5-1)|1104:True, (13-1)|1104:True, (17-1)|1104:True
    1729 = 7*13*19  -> (7-1)|1728:True, (13-1)|1728:True, (19-1)|1728:True
    2465 = 5*17*29  -> (5-1)|2464:True, (17-1)|2464:True, (29-1)|2464:True

  561 fools Fermat for 319/319 coprime bases — i.e. ALL of them.

## C2. Why Miller-Rabin beats Fermat (and why we use several bases)

Miller-Rabin upgrades Fermat using square roots of 1. It has liars too,
but far fewer, and *no* composite is a strong liar for all small bases —
which is why a fixed witness set is deterministic up to huge bounds.

  strong pseudoprimes base 2 below 100,000: 16 -> [2047, 3277, 4033, 4681, 8321, 15841]
  strong pseudoprimes base 3 below 100,000: 23 -> [121, 703, 1891, 3281, 8401, 8911]

  classic case: 2047 = 23*89. strong-pseudoprime base 2? True;  but base 3? False
  => a single base can be fooled; combining bases 2,3,5,7,... cannot be
     (no composite < 3.3e24 survives the 12-base test). That is exactly
     what primegen.bigprime uses below that bound.

## C3. Factoring composites: Pollard's rho (the non-prime algorithm)

Miller-Rabin asks 'is it prime?'. Pollard's rho asks 'if not, give a
factor', finding a factor p in ~O(p^0.5) steps — great for small factors,
hopeless for two huge primes (which is precisely why RSA is safe).

  2^67 - 1 (Cole, 1903)       : 147,573,952,589,676,412,927 = 193707721 * 761838257287   (3.1 ms)
  10!+1                       : 3,628,801 = 11 * 329891   (0.0 ms)
  a 12-digit semiprime        : 6,999,999,999,923 = 7 * 999999999989   (0.0 ms)
  Fermat number F5 = 2^32+1   : 4,294,967,297 = 641 * 6700417   (0.0 ms)

  (F5 = 4294967297 = 641 * 6700417 disproved Fermat's conjecture that all
   2^(2^k)+1 are prime — a composite hiding among 'obvious' primes.)


---

plots written to /home/user/MaresBotShop/primegen/explore/plots/ : pnt_error.png, prime_gaps.png, spf_distribution.png, omega_mean.png, ulam_spiral.png

(total runtime 5.8s)
