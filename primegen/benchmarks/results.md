# primegen benchmark results

- Date: 2026-05-30
- Python: 3.11.15 (Linux x86_64)
- CPUs: 4
- numpy: 2.4.6
- Cython hot path: ENABLED
- big-int backend: gmpy2
- default segment: 262,080 odds (31 KB bit-packed / 255 KB byte-array)

## 1. Representation & inner loop  (single core, wheel mod 210)

Counting primes in `[0, N)`. The pure-Python backends use a smaller N (they are far too slow at the large N), so compare the **rate** columns.

| Backend | Representation | Inner loop | N | time (s) | M primes/s | M nums/s | check |
|---|---|---|--:|--:|--:|--:|:--:|
| pure-Python bytearray | 1 byte / odd | Python slice `buf[s::p]=0` | 10,000,000 |   0.050 |    13.35 |    200.8 | ok |
| pure-Python fallback | 1 bit / odd | Python bit loop | 10,000,000 |   1.842 |     0.36 |      5.4 | ok |
| numpy | 1 byte / odd | numpy slice `arr[s::p]=0` | 100,000,000 |   0.202 |    28.46 |    494.0 | ok |
| Cython | 1 bit / odd | C bit loop | 100,000,000 |   0.102 |    56.74 |    984.8 | ok |

## 2. Wheel factorization  (best single-core backend, wheel pre-sieve)

Backend: **Cython bit-packed**. Counting primes in `[0, 100,000,000)`.

| Wheel | spokes (residues kept) | time (s) | M primes/s | speedup vs odd-only | check |
|---|--:|--:|--:|--:|:--:|
| mod 2 | 1 / 2 (odds) |   0.153 |    37.64 | 1.00x | ok |
| mod 30 | 8 / 30 |   0.112 |    51.55 | 1.37x | ok |
| mod 210 | 48 / 210 |   0.101 |    57.12 | 1.52x | ok |

## 3. Multi-core scaling  (Cython bit-packed, wheel mod 210, 4 CPUs)

Counting primes in `[0, 1,000,000,000)` with multiprocessing.

| Workers | time (s) | M primes/s | speedup | parallel efficiency | check |
|--:|--:|--:|--:|--:|:--:|
| 1 |   1.198 |    42.43 | 1.00x | 100.0% | ok |
| 2 |   0.651 |    78.08 | 1.84x |  92.0% | ok |
| 3 |   0.426 |   119.47 | 2.82x |  93.9% | ok |
| 4 |   0.324 |   156.83 | 3.70x |  92.4% | ok |

## 4. Segment size tuning  (Cython bit-packed, wheel mod 210, single core)

Counting primes in `[0, 100,000,000)`. Buffer size = segment_odds / 8 bytes. Typical L1≈32–48 KB, L2≈256 KB–1 MB.

| Buffer | segment_odds | time (s) | M primes/s |
|--:|--:|--:|--:|
| 16 KB | 131,880 |   0.105 |    54.67 |
| 32 KB | 262,920 |   0.103 |    56.10 |
| 64 KB | 525,000 |   0.103 |    56.05 |
| 128 KB | 1,049,160 |   0.101 |    57.02 |
| 256 KB | 2,097,480 |   0.101 |    57.09 |
| 512 KB | 4,194,960 |   0.106 |    54.31 |
| 1024 KB | 8,389,080 |   0.107 |    54.08 |

## 5. Huge single integers  (gmpy2 vs pure-Python Miller-Rabin)

Backend in use: **gmpy2**. 200 random odd numbers per size; pure-Python uses 10 MR rounds.

| Digits | pure-Python MR (ms) | gmpy2 (ms) | gmpy2 speedup |
|--:|--:|--:|--:|
| 50 |      4.4 |     0.5 |   8.6x |
| 100 |     18.1 |     1.4 |  13.2x |
| 200 |     63.7 |     3.3 |  19.2x |
| 400 |    422.8 |    27.3 |  15.5x |

> Reality check: primesieve (C++ bucket sieve, hand-tuned) reaches ~1e9 primes/sec on a single core. Matching that needs C++/asm; see README.
