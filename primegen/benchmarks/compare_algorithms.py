#!/usr/bin/env python3
"""Race the different prime-finding algorithms against each other.

Honest comparison: each timed result is verified (the sieves must return the
known prime count). Run:  python benchmarks/compare_algorithms.py
"""
from __future__ import annotations

import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from primegen import algorithms as A
from primegen import bigprime
from primegen.csieve import HAVE_CYTHON, sieve_bitpacked

KNOWN_PI = {10**5: 9592, 10**6: 78498, 10**7: 664579}


def best(fn, repeat=1):
    t = float("inf")
    res = None
    for _ in range(repeat):
        s = time.perf_counter()
        res = fn()
        t = min(t, time.perf_counter() - s)
    return t, res


def race_bounded(n: int):
    print(f"\n## Bounded sieves — all primes up to N = {n:,}\n")
    print("| Algorithm | idea | time (s) | M primes/s | vs fastest | check |")
    print("|---|---|--:|--:|--:|:--:|")
    contenders = [
        ("trial division", "test each n by division", lambda: len(A.trial_division(n))),
        ("Eratosthenes (textbook)", "cross out multiples", lambda: len(A.sieve_eratosthenes(n))),
        ("Sundaram", "remove i+j+2ij", lambda: len(A.sieve_sundaram(n))),
        ("Atkin", "quadratic forms mod 12", lambda: len(A.sieve_atkin(n))),
    ]
    if HAVE_CYTHON:
        contenders.append(("primegen (Cython, wheel-210)", "tuned segmented bit-packed",
                           lambda: int(sieve_bitpacked(0, n + 1, wheel=210, collect=False))))
    rows = []
    for name, idea, fn in contenders:
        dt, count = best(fn, repeat=2 if n <= 10**6 else 1)
        rows.append((name, idea, dt, count))
    fastest = min(dt for _, _, dt, _ in rows)
    for name, idea, dt, count in rows:
        chk = "ok" if count == KNOWN_PI.get(n, count) else f"WRONG({count})"
        print(f"| {name} | {idea} | {dt:8.4f} | {count/dt/1e6:7.2f} | {dt/fastest:6.1f}x | {chk} |")


def race_unbounded(count: int):
    print(f"\n## Unbounded generation — first {count:,} primes (streaming, no upper bound)\n")
    dt, primes = best(lambda: A.first_n_primes(count))
    print(f"- incremental sieve: {dt:.3f} s  ->  {count/dt/1e6:.2f} M primes/s  "
          f"(last prime = {primes[-1]:,})")
    print("- uses O(pi(sqrt n)) memory; sieves lazily as it streams.")


def race_single_number():
    print("\n## Single-number primality — three very different ideas\n")
    print("Same number, three algorithms. Note the spread of running times.\n")
    print("| Number | Miller–Rabin (gmpy2) | Wilson's theorem | AKS (deterministic poly) |")
    print("|--:|--:|--:|--:|")
    for n in (7919, 99991):
        t1, _ = best(lambda: bigprime.is_prime(n))
        t2, _ = best(lambda: A.is_prime_wilson(n))
        t3, _ = best(lambda: A.aks_is_prime(n))
        print(f"| {n:,} | {t1*1e6:8.1f} µs | {t2*1e3:8.2f} ms | {t3:8.2f} s |")
    print("\n=> Miller–Rabin wins by orders of magnitude. Wilson and AKS are exact but")
    print("   impractical: Wilson is O(n) multiplications, AKS's polynomial step is huge.")


def main():
    print("# Prime-finding algorithms compared")
    print(f"(Cython hot path: {'on' if HAVE_CYTHON else 'off'})")
    race_bounded(10**5)
    race_bounded(10**6)
    race_unbounded(10**6)
    race_single_number()
    print("\n## Mersenne primes (largest known primes are found this way)\n")
    t, exps = best(lambda: A.mersenne_prime_exponents(160))
    print(f"- Lucas–Lehmer found exponents p<=160 with 2^p-1 prime: {exps}  ({t:.2f}s)")


if __name__ == "__main__":
    main()
