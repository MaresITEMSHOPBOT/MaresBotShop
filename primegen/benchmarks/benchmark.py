#!/usr/bin/env python3
"""Measure every optimization axis and emit markdown tables.

Honesty policy: every timed run also *verifies* its result (against the known
prime-counting value or a reference count), so a fast-but-wrong configuration
can never post a misleading number. Rates are reported as millions of primes
per second and millions of integers sieved per second.

Axes measured:
  1. representation / inner loop : bytearray vs numpy vs Cython bit-packed
                                   vs the pure-Python bit-packed fallback
  2. wheel                       : odd-only vs mod-30 vs mod-210
  3. multi-core scaling          : 1 .. N cores
  4. segment size                : L1 .. L3-ish buffer sizes
  5. huge integers               : gmpy2 vs pure-Python Miller-Rabin

Usage:
    python benchmark.py                 # default sizes
    python benchmark.py --n 1000000000  # peak-rate tables at 10^9
    python benchmark.py --quick         # tiny sizes, fast smoke
    python benchmark.py --out results.md
"""
from __future__ import annotations

import argparse
import multiprocessing as mp
import os
import platform
import random
import sys
import time
from contextlib import contextmanager
from io import StringIO

# Allow running directly (`python benchmarks/benchmark.py`) from the repo root.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np

from primegen import backends, bigprime
from primegen import csieve
from primegen.backends import (
    DEFAULT_SEGMENT_ODDS,
    normalize_segment_odds,
    sieve_bytearray,
    sieve_numpy,
)
from primegen.csieve import HAVE_CYTHON, sieve_bitpacked
from primegen.parallel import parallel_count

# Known pi(10^k) values used to verify timed counts.
KNOWN_PI = {
    10**6: 78498, 10**7: 664579, 10**8: 5761455,
    10**9: 50847534, 10**10: 455052511,
}


def best_time(fn, repeat: int):
    """Run ``fn`` ``repeat`` times, return (best_seconds, last_result)."""
    best = float("inf")
    result = None
    for _ in range(repeat):
        t = time.perf_counter()
        result = fn()
        dt = time.perf_counter() - t
        best = min(best, dt)
    return best, result


def verify_count(n_exclusive_hi: int, got: int) -> str:
    """Return a check mark / flag string for a count against the known value."""
    target = n_exclusive_hi - 1
    if target in KNOWN_PI:
        return "ok" if got == KNOWN_PI[target] else f"WRONG(!{KNOWN_PI[target]})"
    return "?"


@contextmanager
def fallback_inner_loop():
    """Temporarily swap the bit-packed driver's inner loop to the pure-Python one."""
    from primegen import _sieve_fallback as fb

    saved_mark, saved_count = csieve.mark_segment, csieve.count_bits
    csieve.mark_segment, csieve.count_bits = fb.mark_segment, fb.count_bits
    try:
        yield
    finally:
        csieve.mark_segment, csieve.count_bits = saved_mark, saved_count


def fmt_rate(count: int, nums: int, dt: float):
    return f"{count/dt/1e6:8.2f}", f"{nums/dt/1e6:8.1f}"


# ---------------------------------------------------------------------------
def table_representation(p, n_fast: int, n_slow: int):
    """Axis 1 & 3: representation / inner loop, plus numpy-vs-Cython."""
    p("## 1. Representation & inner loop  (single core, wheel mod 210)\n")
    p("Counting primes in `[0, N)`. The pure-Python backends use a smaller N "
      "(they are far too slow at the large N), so compare the **rate** columns.\n")
    p("| Backend | Representation | Inner loop | N | time (s) | M primes/s | M nums/s | check |")
    p("|---|---|---|--:|--:|--:|--:|:--:|")

    rows = []
    # Slow pure-Python backends at n_slow.
    def run_bytearray():
        return sieve_bytearray(0, n_slow + 1, wheel=210, collect=False)
    dt, c = best_time(run_bytearray, 1)
    mp_, mn_ = fmt_rate(c, n_slow, dt)
    rows.append(("pure-Python bytearray", "1 byte / odd", "Python slice `buf[s::p]=0`",
                 n_slow, dt, mp_, mn_, verify_count(n_slow + 1, c)))

    if HAVE_CYTHON:
        with fallback_inner_loop():
            def run_fb():
                return sieve_bitpacked(0, n_slow + 1, wheel=210, collect=False)
            dt, c = best_time(run_fb, 1)
        mp_, mn_ = fmt_rate(c, n_slow, dt)
        rows.append(("pure-Python fallback", "1 bit / odd", "Python bit loop",
                     n_slow, dt, mp_, mn_, verify_count(n_slow + 1, c)))

    # Fast backends at n_fast.
    def run_numpy():
        return sieve_numpy(0, n_fast + 1, wheel=210, collect=False)
    dt, c = best_time(run_numpy, 3)
    mp_, mn_ = fmt_rate(c, n_fast, dt)
    rows.append(("numpy", "1 byte / odd", "numpy slice `arr[s::p]=0`",
                 n_fast, dt, mp_, mn_, verify_count(n_fast + 1, c)))

    if HAVE_CYTHON:
        def run_cy():
            return sieve_bitpacked(0, n_fast + 1, wheel=210, collect=False)
        dt, c = best_time(run_cy, 3)
        mp_, mn_ = fmt_rate(c, n_fast, dt)
        rows.append(("Cython", "1 bit / odd", "C bit loop",
                     n_fast, dt, mp_, mn_, verify_count(n_fast + 1, c)))

    for name, rep, loop, N, dt, mps, mns, chk in rows:
        p(f"| {name} | {rep} | {loop} | {N:,} | {dt:7.3f} | {mps} | {mns} | {chk} |")
    p("")


def table_wheel(p, n: int):
    """Axis 2: odd-only vs mod-30 vs mod-210."""
    p("## 2. Wheel factorization  (best single-core backend, wheel pre-sieve)\n")
    fn = sieve_bitpacked if HAVE_CYTHON else sieve_numpy
    label = "Cython bit-packed" if HAVE_CYTHON else "numpy"
    p(f"Backend: **{label}**. Counting primes in `[0, {n:,})`.\n")
    p("| Wheel | spokes (residues kept) | time (s) | M primes/s | speedup vs odd-only | check |")
    p("|---|--:|--:|--:|--:|:--:|")
    base_dt = None
    spokes = {2: "1 / 2 (odds)", 30: "8 / 30", 210: "48 / 210"}
    for wheel in (2, 30, 210):
        dt, c = best_time(lambda: fn(0, n + 1, wheel=wheel, collect=False), 3)
        if wheel == 2:
            base_dt = dt
        p(f"| mod {wheel} | {spokes[wheel]} | {dt:7.3f} | {c/dt/1e6:8.2f} | "
          f"{base_dt/dt:4.2f}x | {verify_count(n + 1, c)} |")
    p("")


def table_scaling(p, n: int):
    """Axis 4: multi-core scaling."""
    ncpu = mp.cpu_count()
    p(f"## 3. Multi-core scaling  (Cython bit-packed, wheel mod 210, {ncpu} CPUs)\n")
    p(f"Counting primes in `[0, {n:,})` with multiprocessing.\n")
    p("| Workers | time (s) | M primes/s | speedup | parallel efficiency | check |")
    p("|--:|--:|--:|--:|--:|:--:|")
    base_dt = None
    backend = "cython" if HAVE_CYTHON else "numpy"
    for w in range(1, ncpu + 1):
        dt, c = best_time(
            lambda: parallel_count(0, n + 1, workers=w, chunks_per_worker=4, backend=backend), 2
        )
        if w == 1:
            base_dt = dt
        p(f"| {w} | {dt:7.3f} | {c/dt/1e6:8.2f} | {base_dt/dt:4.2f}x | "
          f"{100*base_dt/dt/w:5.1f}% | {verify_count(n + 1, c)} |")
    p("")


def table_segment(p, n: int):
    """Axis 5: segment-size tuning for the bit-packed backend."""
    if not HAVE_CYTHON:
        return
    p("## 4. Segment size tuning  (Cython bit-packed, wheel mod 210, single core)\n")
    p(f"Counting primes in `[0, {n:,})`. Buffer size = segment_odds / 8 bytes. "
      "Typical L1≈32–48 KB, L2≈256 KB–1 MB.\n")
    p("| Buffer | segment_odds | time (s) | M primes/s |")
    p("|--:|--:|--:|--:|")
    for kb in (16, 32, 64, 128, 256, 512, 1024):
        S = normalize_segment_odds(kb * 1024 * 8)  # kb*1024 bytes worth of bits
        dt, c = best_time(lambda: sieve_bitpacked(0, n + 1, wheel=210, segment_odds=S, collect=False), 3)
        p(f"| {kb} KB | {S:,} | {dt:7.3f} | {c/dt/1e6:8.2f} |")
    p("")


def table_bigint(p):
    """Axis 6: gmpy2 vs pure-Python Miller-Rabin on huge numbers."""
    p("## 5. Huge single integers  (gmpy2 vs pure-Python Miller-Rabin)\n")
    p(f"Backend in use: **{bigprime.backend_name()}**. "
      "200 random odd numbers per size; pure-Python uses 10 MR rounds.\n")
    p("| Digits | pure-Python MR (ms) | gmpy2 (ms) | gmpy2 speedup |")
    p("|--:|--:|--:|--:|")
    random.seed(7)
    have_gmpy2 = bigprime.HAVE_GMPY2
    for digits in (50, 100, 200, 400):
        nums = [random.randrange(10**(digits - 1), 10**digits) | 1 for _ in range(200)]
        t = time.perf_counter()
        for x in nums:
            bigprime.is_prime_mr(x, rounds=10)
        tp = (time.perf_counter() - t) * 1000
        if have_gmpy2:
            import gmpy2
            t = time.perf_counter()
            for x in nums:
                gmpy2.is_prime(x)
            tg = (time.perf_counter() - t) * 1000
            p(f"| {digits} | {tp:8.1f} | {tg:7.1f} | {tp/tg:5.1f}x |")
        else:
            p(f"| {digits} | {tp:8.1f} | n/a | n/a |")
    p("")


def system_header(p):
    p("# primegen benchmark results\n")
    p(f"- Date: {time.strftime('%Y-%m-%d')}")
    p(f"- Python: {platform.python_version()} ({platform.system()} {platform.machine()})")
    p(f"- CPUs: {mp.cpu_count()}")
    p(f"- numpy: {np.__version__}")
    p(f"- Cython hot path: {'ENABLED' if HAVE_CYTHON else 'DISABLED (pure-Python fallback)'}")
    p(f"- big-int backend: {bigprime.backend_name()}")
    p(f"- default segment: {DEFAULT_SEGMENT_ODDS:,} odds "
      f"({DEFAULT_SEGMENT_ODDS // 8 // 1024} KB bit-packed / "
      f"{DEFAULT_SEGMENT_ODDS // 1024} KB byte-array)\n")


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--n", type=int, default=10**8, help="N for fast/peak-rate tables")
    ap.add_argument("--n-slow", type=int, default=10**7, help="N for pure-Python backends")
    ap.add_argument("--n-scale", type=int, default=10**9,
                    help="N for the multi-core scaling table (large, to amortize pool startup)")
    ap.add_argument("--quick", action="store_true", help="tiny sizes for a fast smoke run")
    ap.add_argument("--out", type=str, default=None, help="also write markdown here")
    args = ap.parse_args(argv)

    n_fast = args.n
    n_slow = args.n_slow
    n_scale = args.n_scale
    if args.quick:
        n_fast, n_slow, n_scale = 10**7, 10**6, 10**8

    buf = StringIO()

    def p(line=""):
        print(line)
        buf.write(line + "\n")

    system_header(p)
    table_representation(p, n_fast, n_slow)
    table_wheel(p, n_fast)
    table_scaling(p, n_scale)
    table_segment(p, n_fast)
    table_bigint(p)

    p("> Reality check: primesieve (C++ bucket sieve, hand-tuned) reaches "
      "~1e9 primes/sec on a single core. Matching that needs C++/asm; see README.")

    if args.out:
        with open(args.out, "w") as f:
            f.write(buf.getvalue())
        print(f"\n[written to {args.out}]", file=sys.stderr)


if __name__ == "__main__":
    main()
