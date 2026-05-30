# Plan: the fastest prime generator achievable in pure-ish Python

This is the plan drawn up *before* implementation. It is kept in the repo so
the design intent (and its honest trade-offs) can be checked against what was
actually built and measured. The measured outcome lives in `README.md`.

## Goal

Build the fastest prime-generation system reasonably achievable from Python,
measure every optimization rather than assuming it, and document honestly how
far the result is from the C++ state of the art (primesieve).

## Strategy: one verified core, many measurable knobs

Every backend sieves the same way and is cross-checked against a trivial
reference sieve, so each optimization can be toggled and *measured* in
isolation. Shared indexing convention: **store odd numbers only**; odd value
`v` ↔ odd index `g = (v-1)//2`. Segments are blocks of `S` odd indices aligned
to multiples of `S`, and `S` is a multiple of 840 (= lcm(8, 15, 105)) so every
wheel period and the bit-packing byte boundary line up — segment reset is then
a single memory copy.

## Components & the axis each one measures

1. **Reference oracle** (`reference.py`) — textbook sieve; ground truth.
2. **Segmented sieve, bit-packed + numpy** (`backends.py`, `csieve.py`)
   - *bit-packed (1 bit/odd)* vs *bytearray (1 byte/odd)* → memory axis.
   - numpy marks with vectorized slice assignment `arr[start::step] = 0`.
   - segment sized to fit L1/L2 (tunable `segment_odds`).
3. **Wheel factorization** (`wheel.py`) — odd-only vs mod-30 vs mod-210, via a
   tiled pre-sieve pattern that pre-marks the wheel primes' multiples.
4. **Hot path in C** (`_sieve.pyx` + `_sieve_fallback.py` + loader) — the
   inner marking loop in Cython, with a pure-Python fallback → numpy-vs-C axis.
5. **Parallelism** (`parallel.py`) — split into independent segments across all
   cores with multiprocessing; workers share a read-only base-prime list.
6. **Huge single numbers** (`bigprime.py`) — gmpy2 Miller-Rabin / next_prime,
   pure-Python deterministic MR fallback.
7. **Correctness gate** (`tests/`) — π(10⁶)=78498, π(10⁹)=50847534, plus every
   backend cross-checked against the reference on boundary-crossing ranges.
8. **Benchmarks** (`benchmarks/benchmark.py`) — measures all axes, verifies each
   timed result, emits the markdown tables in the README.

## Anticipated honest trade-offs (to confirm by measurement)

- **Bit-packing vs numpy slice-marking are in tension.** numpy's fast
  `arr[s::p]=0` needs a *byte* buffer; true 1-bit packing needs per-bit
  read-modify-write, which only pays off in compiled C. Expectation: the
  bit-packed *Cython* loop wins on cache; bit-packing in pure Python loses.
- **The wheel helps the scalar C loop more than vectorized numpy**, because the
  wheel removes the densest (3/5/7) marking passes, which dominate a scalar
  loop but are cheap bulk writes in numpy.
- **Realistic ceiling:** Python + numpy + multiprocessing should land around
  1e7–1e8 primes/sec. primesieve (C++ bucket sieve) does ~1e9/sec on one core;
  matching it needs C++/assembly and is out of scope.

## Order of work

reference & wheel → numpy/bytearray sieve (verify π gates) → Cython hot path +
fallback (verify byte-identical) → multiprocessing (verify scaling) → gmpy2 big
ints → test suite → benchmark → README with measured tables.
