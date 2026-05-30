#!/usr/bin/env python3
"""Counting pi(x): the sublinear combinatorial method vs the sieve.

Shows the crossover (the counter wins even at 10^9) and that the counter
reaches scales the sieve cannot. Every result is verified against the known
pi(x) value. Run:  python benchmarks/count_scaling.py
"""
from __future__ import annotations

import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from primegen.parallel import parallel_count
from primegen.primecount import prime_count

KNOWN = {
    10**9: 50847534, 10**10: 455052511, 10**11: 4118054813,
    10**12: 37607912018, 10**13: 346065536839,
}


def timed(fn):
    t = time.perf_counter()
    r = fn()
    return r, time.perf_counter() - t


def main():
    print("# Counting pi(x): tuned parallel SIEVE vs sublinear COUNTER\n")
    print("| x | sieve (4 cores) | sublinear counter | speedup | pi(x) | check |")
    print("|--:|--:|--:|--:|--:|:--:|")
    for k in (9, 10, 11):                       # the sieve is still feasible up to ~10^11
        x = 10**k
        (cc, tc) = timed(lambda: prime_count(x))
        sieve_str = "—"
        speed = "—"
        if k <= 10:                             # don't make the user wait minutes at 10^11
            (cs, ts) = timed(lambda: parallel_count(0, x + 1, workers=4))
            assert cs == cc
            sieve_str = f"{ts:.2f}s"
            speed = f"{ts/tc:.1f}x"
        chk = "ok" if cc == KNOWN[x] else "WRONG"
        print(f"| {x:,} | {sieve_str} | {tc:.3f}s | {speed} | {cc:,} | {chk} |")

    print("\n# Where only the counter can go (sieve would take many minutes/hours)\n")
    print("| x | sublinear counter | pi(x) | check |")
    print("|--:|--:|--:|:--:|")
    for k in (12, 13):
        x = 10**k
        (cc, tc) = timed(lambda: prime_count(x))
        chk = "ok" if cc == KNOWN[x] else "WRONG"
        print(f"| {x:,} | {tc:.2f}s | {cc:,} | {chk} |")

    print("\nWhy: the sieve is ~O(x) (it must touch every integer); the counter is")
    print("~O(x^(3/4)) with O(sqrt x) memory, so its lead grows with x.")


if __name__ == "__main__":
    main()
