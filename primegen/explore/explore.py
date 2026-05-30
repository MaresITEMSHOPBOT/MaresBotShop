#!/usr/bin/env python3
"""Empirical exploration of primes AND composites, built on the primegen toolkit.

Run:  python explore/explore.py            # prints findings, writes FINDINGS.md + plots/

The goal is to *understand* — using real computed data, not assertions — how
primes are distributed and how composite numbers are built, and to connect that
structure to the algorithms (sieve, Fermat/Miller-Rabin, Pollard's rho).

Sections
  A. How primes work .... Fundamental Theorem, why sieve to sqrt(n),
                          Prime Number Theorem, prime gaps & twins
  B. Non-primes ......... smallest-prime-factor structure, omega(n) ~ ln ln n,
                          divisors & highly composite numbers, perfect numbers
  C. Numbers that fool the algorithms ... Fermat pseudoprimes, Carmichael
                          numbers, strong pseudoprimes, Pollard's rho
"""
from __future__ import annotations

import os
import sys
import time
from collections import Counter
from io import StringIO
from math import gcd, log

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import primegen
from primegen import bigprime as bp
from primegen import factor as F

HERE = os.path.dirname(os.path.abspath(__file__))
PLOTS = os.path.join(HERE, "plots")
os.makedirs(PLOTS, exist_ok=True)

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    HAVE_MPL = True
except ImportError:  # pragma: no cover
    HAVE_MPL = False

_report = StringIO()


def out(line: str = "") -> None:
    print(line)
    _report.write(line + "\n")


# ---------------------------------------------------------------------------
# numerical logarithmic integral  Li(x) = ∫_2^x dt/ln t   (Gauss's estimate)
# via the substitution t = e^u  ->  ∫ e^u/u du, Simpson's rule.
# ---------------------------------------------------------------------------
def Li(x: float, n: int = 400_000) -> float:
    if x < 2:
        return 0.0
    a, b = log(2.0), log(x)
    u = np.linspace(a, b, n + 1)
    f = np.exp(u) / u
    w = np.ones(n + 1)
    w[1:-1:2] = 4
    w[2:-1:2] = 2
    return float((b - a) / n / 3 * np.dot(w, f))


# ===========================================================================
# A. HOW PRIMES WORK
# ===========================================================================
def section_fundamental():
    out("## A1. The Fundamental Theorem of Arithmetic\n")
    out("Every integer > 1 is prime, or a *unique* product of primes. Primes are")
    out("the multiplicative atoms; composites are molecules built from them.\n")
    for n in [60, 360, 1001, 5040, 2**20 - 1, 9_999_991 * 7]:
        fac = F.factorize(n)
        pretty = " * ".join(f"{p}^{e}" if e > 1 else f"{p}" for p, e in fac)
        kind = "PRIME" if len(fac) == 1 and fac[0][1] == 1 else "composite"
        out(f"  {n:>12,} = {pretty:30s} [{kind}]")
    out("")


def section_why_sqrt():
    out("## A2. Why the sieve only needs primes up to sqrt(n)\n")
    out("A composite n has a smallest prime factor spf(n). Claim: spf(n) <= sqrt(n)")
    out("(if every prime factor were > sqrt(n), their product would exceed n).")
    out("So every composite is struck out by a prime <= sqrt(n) — the sieve is complete.\n")
    N = 5_000_000
    t = time.perf_counter()
    spf = F.spf_sieve(N)
    dt = time.perf_counter() - t
    comp = np.arange(2, N + 1)
    is_comp = spf[2:] != comp  # spf != n  => composite
    spf_comp = spf[2:][is_comp]
    n_comp = comp[is_comp]
    violations = int(np.count_nonzero(spf_comp.astype(np.float64) > np.sqrt(n_comp)))
    out(f"  built smallest-prime-factor of all n <= {N:,} in {dt:.2f}s")
    out(f"  composites in range: {is_comp.sum():,}")
    out(f"  composites whose smallest prime factor exceeds sqrt(n): {violations}  (must be 0)")
    out(f"  => verified empirically: sieving to sqrt(n) misses nothing.\n")
    return spf


def section_pnt():
    out("## A3. The Prime Number Theorem:  pi(x) ~ x/ln(x) ~ Li(x)\n")
    out("Primes thin out, but predictably. Two estimates of pi(x):")
    out("the crude x/ln(x), and Gauss's Li(x) = ∫ dt/ln t (far better).\n")
    out("|         x | pi(x) (exact) |    x/ln x | rel.err |       Li(x) | rel.err |")
    out("|----------:|--------------:|----------:|--------:|------------:|--------:|")
    xs, pis, naive_err, li_err = [], [], [], []
    for k in range(1, 10):
        x = 10 ** k
        pix = primegen.count_primes(x + 1)  # pi(x)
        naive = x / log(x)
        lix = Li(x)
        e1 = (naive - pix) / pix
        e2 = (lix - pix) / pix
        out(f"| {x:>9,} | {pix:>13,} | {naive:>9,.0f} | {e1:+7.4f} | {lix:>11,.0f} | {e2:+8.5f} |")
        xs.append(x); pis.append(pix); naive_err.append(abs(e1)); li_err.append(abs(e2))
    out("\nNote how Li(x)'s relative error shrinks ~10x faster — that is the PNT")
    out("error term (Li is accurate to ~sqrt(x), the Riemann-hypothesis bound).\n")
    return xs, pis, naive_err, li_err


def section_gaps():
    out("## A4. Prime gaps and twin primes\n")
    out("The average gap between primes near x is about ln(x). Gaps are erratic,")
    out("yet twin primes (gap 2) keep appearing as far as we look.\n")
    N = 10_000_000
    ps = primegen.primes(N)
    gaps = np.diff(ps)
    out(f"  primes below {N:,}: {len(ps):,}")
    out(f"  mean gap (empirical): {gaps.mean():.3f}   vs  ln(N) = {log(N):.3f}   (PNT prediction)")
    out(f"  largest gap below {N:,}: {gaps.max()} (after prime {int(ps[gaps.argmax()]):,})")
    twins = int(np.count_nonzero(gaps == 2))
    out(f"  twin-prime pairs (p, p+2) below {N:,}: {twins:,}")
    # record (maximal) gaps
    records, best = [], 0
    for i, g in enumerate(gaps):
        if g > best:
            best = int(g)
            records.append((int(ps[i]), best))
    out(f"  record gaps (start -> gap): " + ", ".join(f"{p}->{g}" for p, g in records[:12]) + " ...")
    out("")
    return ps, gaps


# ===========================================================================
# B. NON-PRIMES (COMPOSITES)
# ===========================================================================
def section_spf_distribution(spf):
    out("## B1. The shape of composites: smallest-prime-factor distribution\n")
    out("Each composite is 'claimed' by its smallest prime factor. Half of all")
    out("numbers are even (spf 2); a third of the rest fall to 3; and so on —")
    out("a prime p first-claims a density 1/p of the numbers no smaller prime took.\n")
    N = len(spf) - 1
    comp_spf = spf[2:][spf[2:] != np.arange(2, N + 1)]  # spf of composites only
    c = Counter(comp_spf.tolist())
    total = sum(c.values())
    out("| smallest prime factor | # composites it first-claims | fraction of composites |")
    out("|----------------------:|-----------------------------:|-----------------------:|")
    for p in [2, 3, 5, 7, 11, 13]:
        out(f"| {p:>21} | {c.get(p,0):>28,} | {c.get(p,0)/total:>21.4f} |")
    big = sum(v for k, v in c.items() if k > 13)
    out(f"| {'> 13':>21} | {big:>28,} | {big/total:>21.4f} |")
    out("")


def section_omega(spf):
    out("## B2. How many prime factors does a typical number have?  omega(n) ~ ln ln n\n")
    out("Hardy & Ramanujan (1917): the number of *distinct* prime factors of n is")
    out("almost always about ln ln n — astonishingly small and slow-growing.\n")
    # Omega(n) (with multiplicity) via the spf sieve: factor each n by repeated spf.
    N = len(spf) - 1
    out("| up to x | mean omega(n) (distinct) | ln ln x |")
    out("|--------:|-------------------------:|--------:|")
    data = []
    for k in (3, 4, 5, 6):
        x = 10 ** k
        # count distinct prime factors for 2..x using spf
        om = _omega_array(spf, x)
        mean_om = om[2:x + 1].mean()
        data.append((x, mean_om, log(log(x))))
        out(f"| {x:>7,} | {mean_om:>24.4f} | {log(log(x)):>7.4f} |")
    out("\n(The convergence is famously slow because ln ln x barely moves.)\n")
    return data


def _omega_array(spf, x):
    """Distinct-prime-factor count for every n in [0, x], using the spf sieve."""
    om = np.zeros(x + 1, dtype=np.int16)
    for n in range(2, x + 1):
        m, last = n, 0
        while m > 1:
            p = spf[m]
            if p != last:
                om[n] += 1
                last = p
            m //= p
    return om


def section_divisors_perfect():
    out("## B3. Divisors, highly composite numbers, and perfect numbers\n")
    out("tau(n) = number of divisors. 'Highly composite' numbers (Ramanujan) set")
    out("records for tau — the opposite extreme from primes (which have tau=2).\n")
    best, records = 0, []
    for n in range(1, 100_001):
        t = F.num_divisors(n)
        if t > best:
            best = t
            records.append((n, t, F.factorize(n)))
    out("  highly composite numbers below 100,000 (n : tau(n) = factorization):")
    for n, t, fac in records:
        pretty = "*".join(f"{p}^{e}" if e > 1 else f"{p}" for p, e in fac) or "1"
        out(f"    {n:>6,} : {t:>3}  = {pretty}")
    out("")
    out("Perfect numbers (sigma(n) = 2n) tie composites back to primes via the")
    out("Euclid-Euler theorem: n = 2^(p-1)(2^p - 1) is perfect iff 2^p - 1 is a")
    out("(Mersenne) prime.\n")
    out("|       n | = 2^(p-1)(2^p-1) | 2^p-1 prime? |")
    out("|--------:|------------------|:------------:|")
    for p in [2, 3, 5, 7, 13]:
        mers = 2 ** p - 1
        n = 2 ** (p - 1) * mers
        out(f"| {n:>7,} | p={p}: 2^{p-1}*{mers} | {bp.is_prime(mers)} |")
    out("")


# ===========================================================================
# C. NUMBERS THAT FOOL THE ALGORITHMS
# ===========================================================================
def section_fermat_carmichael():
    out("## C1. Fermat's little theorem, and the composites that abuse it\n")
    out("For a prime p and any a not divisible by p:  a^(p-1) ≡ 1 (mod p).")
    out("This is the basis of fast primality tests. But it has *liars*.\n")
    # Fermat test holds for primes (for bases a coprime to p, i.e. a not a multiple of p)
    for p in [7, 97, 7919]:
        ok = all(pow(a, p - 1, p) == 1 for a in range(2, 50) if a % p != 0)
        out(f"  prime {p}: a^(p-1) ≡ 1 (mod {p}) for all coprime a -> {ok}")
    out("")
    out("Fermat *pseudoprimes* base 2: composites c with 2^(c-1) ≡ 1 (mod c).")
    psp2 = [c for c in range(3, 100_000, 2)
            if pow(2, c - 1, c) == 1 and not bp.is_prime(c)]
    out(f"  base-2 Fermat pseudoprimes below 100,000: {len(psp2)} of them, e.g. {psp2[:8]}")
    out(f"  (the smallest, {psp2[0]} = {'*'.join(map(str, F.factor_flat(psp2[0])))}, fools the base-2 Fermat test)\n")

    out("**Carmichael numbers** are the worst case: composite, yet a^(n-1) ≡ 1")
    out("(mod n) for *every* a coprime to n. No choice of base saves the Fermat test.\n")
    carm = [n for n in range(3, 100_000, 2) if F.is_carmichael(n)]
    out(f"  Carmichael numbers below 100,000: {carm}")
    out("  Korselt's criterion (square-free, and (p-1)|(n-1) for each prime p|n):")
    for n in carm[:4]:
        fac = F.factorize(n)
        checks = ", ".join(f"({p}-1)|{n-1}:{(n-1)%(p-1)==0}" for p, _ in fac)
        out(f"    {n} = {'*'.join(str(p) for p,_ in fac)}  -> {checks}")
    # Demonstrate 561 fooling Fermat for many bases:
    n = 561
    liars = [a for a in range(2, n) if gcd(a, n) == 1 and pow(a, n - 1, n) == 1]
    coprime = [a for a in range(2, n) if gcd(a, n) == 1]
    out(f"\n  561 fools Fermat for {len(liars)}/{len(coprime)} coprime bases — i.e. ALL of them.\n")
    return psp2, carm


def section_strong_pseudoprimes():
    out("## C2. Why Miller-Rabin beats Fermat (and why we use several bases)\n")
    out("Miller-Rabin upgrades Fermat using square roots of 1. It has liars too,")
    out("but far fewer, and *no* composite is a strong liar for all small bases —")
    out("which is why a fixed witness set is deterministic up to huge bounds.\n")

    def is_strong_pseudoprime(n, a):
        if n % 2 == 0 or n < 3:
            return False
        d, s = n - 1, 0
        while d % 2 == 0:
            d //= 2; s += 1
        x = pow(a, d, n)
        if x in (1, n - 1):
            return True
        for _ in range(s - 1):
            x = x * x % n
            if x == n - 1:
                return True
        return False

    for base in (2, 3):
        sp = [n for n in range(3, 100_000, 2)
              if is_strong_pseudoprime(n, base) and not bp.is_prime(n)]
        out(f"  strong pseudoprimes base {base} below 100,000: {len(sp)} -> {sp[:6]}")
    # 2047 = 23*89 is the classic base-2 strong liar
    out(f"\n  classic case: 2047 = 23*89. strong-pseudoprime base 2? "
        f"{is_strong_pseudoprime(2047, 2)};  but base 3? {is_strong_pseudoprime(2047, 3)}")
    out("  => a single base can be fooled; combining bases 2,3,5,7,... cannot be")
    out("     (no composite < 3.3e24 survives the 12-base test). That is exactly")
    out("     what primegen.bigprime uses below that bound.\n")


def section_pollard():
    out("## C3. Factoring composites: Pollard's rho (the non-prime algorithm)\n")
    out("Miller-Rabin asks 'is it prime?'. Pollard's rho asks 'if not, give a")
    out("factor', finding a factor p in ~O(p^0.5) steps — great for small factors,")
    out("hopeless for two huge primes (which is precisely why RSA is safe).\n")
    cases = [
        ("2^67 - 1 (Cole, 1903)", 2**67 - 1),
        ("10!+1", 3628801),
        ("a 12-digit semiprime", 999_999_999_989 * 7),
        ("Fermat number F5 = 2^32+1", 2**32 + 1),
    ]
    for label, n in cases:
        t = time.perf_counter()
        fac = F.factorize(n)
        dt = time.perf_counter() - t
        pretty = " * ".join(f"{p}^{e}" if e > 1 else f"{p}" for p, e in fac)
        out(f"  {label:28s}: {n:,} = {pretty}   ({dt*1000:.1f} ms)")
    out("\n  (F5 = 4294967297 = 641 * 6700417 disproved Fermat's conjecture that all")
    out("   2^(2^k)+1 are prime — a composite hiding among 'obvious' primes.)\n")


# ===========================================================================
# PLOTS
# ===========================================================================
def make_plots(pnt, gaps_data, spf, omega_data):
    if not HAVE_MPL:
        out("(matplotlib not available — skipping plots)")
        return
    xs, pis, naive_err, li_err = pnt
    ps, gaps = gaps_data

    # 1. PNT: relative error of x/ln x vs Li(x)
    fig, ax = plt.subplots(figsize=(7, 4.5))
    ax.loglog(xs, naive_err, "o-", label="|x/ln x − π(x)| / π(x)")
    ax.loglog(xs, li_err, "s-", label="|Li(x) − π(x)| / π(x)")
    ax.set_xlabel("x"); ax.set_ylabel("relative error")
    ax.set_title("Prime Number Theorem: Li(x) tracks π(x) far better than x/ln x")
    ax.legend(); ax.grid(True, which="both", alpha=0.3)
    fig.tight_layout(); fig.savefig(os.path.join(PLOTS, "pnt_error.png"), dpi=110); plt.close(fig)

    # 2. prime gap histogram
    fig, ax = plt.subplots(figsize=(7, 4.5))
    ax.hist(gaps, bins=range(0, int(gaps.max()) + 2, 2), color="steelblue", edgecolor="k", linewidth=0.3)
    ax.axvline(gaps.mean(), color="red", ls="--", label=f"mean gap = {gaps.mean():.2f}")
    ax.set_xlabel("gap between consecutive primes"); ax.set_ylabel("count")
    ax.set_title("Prime gaps below 10^7 (note the spikes at multiples of 6)")
    ax.legend(); ax.set_xlim(0, 120)
    fig.tight_layout(); fig.savefig(os.path.join(PLOTS, "prime_gaps.png"), dpi=110); plt.close(fig)

    # 3. smallest-prime-factor distribution (fraction claimed by each prime)
    N = len(spf) - 1
    comp_spf = spf[2:][spf[2:] != np.arange(2, N + 1)]
    c = Counter(comp_spf.tolist())
    primes_axis = [p for p in primegen.primes(60).tolist()]
    fracs = [c.get(p, 0) / len(comp_spf) for p in primes_axis]
    fig, ax = plt.subplots(figsize=(7, 4.5))
    ax.bar([str(p) for p in primes_axis], fracs, color="darkorange", edgecolor="k", linewidth=0.3)
    ax.plot([str(p) for p in primes_axis],
            [(1.0 / p) * np.prod([1 - 1.0 / q for q in primes_axis if q < p]) for p in primes_axis],
            "k.-", label="predicted (1/p)·∏_{q<p}(1−1/q)")
    ax.set_xlabel("smallest prime factor p"); ax.set_ylabel("fraction of composites")
    ax.set_title("Which prime first claims each composite (≤ %d)" % N)
    ax.legend()
    fig.tight_layout(); fig.savefig(os.path.join(PLOTS, "spf_distribution.png"), dpi=110); plt.close(fig)

    # 4. omega(n) mean vs ln ln x
    xs_o = [d[0] for d in omega_data]
    mean_o = [d[1] for d in omega_data]
    lnln = [d[2] for d in omega_data]
    fig, ax = plt.subplots(figsize=(7, 4.5))
    ax.semilogx(xs_o, mean_o, "o-", label="mean ω(n) (measured)")
    ax.semilogx(xs_o, lnln, "s--", label="ln ln x (Hardy–Ramanujan)")
    ax.set_xlabel("x"); ax.set_ylabel("average # distinct prime factors")
    ax.set_title("A typical number has ~ln ln n distinct prime factors")
    ax.legend(); ax.grid(True, alpha=0.3)
    fig.tight_layout(); fig.savefig(os.path.join(PLOTS, "omega_mean.png"), dpi=110); plt.close(fig)

    # 5. Ulam spiral — visual prime pattern (diagonal structure)
    size = 201
    spiral = _ulam_spiral(size)
    fig, ax = plt.subplots(figsize=(6, 6))
    ax.imshow(spiral, cmap="binary", interpolation="nearest")
    ax.set_title("Ulam spiral (%dx%d): primes line up on diagonals" % (size, size))
    ax.axis("off")
    fig.tight_layout(); fig.savefig(os.path.join(PLOTS, "ulam_spiral.png"), dpi=110); plt.close(fig)

    out(f"plots written to {PLOTS}/ : pnt_error.png, prime_gaps.png, "
        "spf_distribution.png, omega_mean.png, ulam_spiral.png")


def _ulam_spiral(size):
    """Boolean grid: True where the spiral cell holds a prime."""
    grid = np.zeros((size, size), dtype=bool)
    x = y = size // 2
    dx, dy = 0, -1
    primeset = set(primegen.primes(size * size + 1).tolist())
    for i in range(1, size * size + 1):
        if 0 <= x < size and 0 <= y < size and i in primeset:
            grid[y, x] = True
        if (x == y) or (x < y and x + y == size - 1) or (x > y and x + y == size):
            dx, dy = -dy, dx
        x, y = x + dx, y + dy
    return grid


def main():
    t0 = time.perf_counter()
    out("# Exploring primes and composites with primegen\n")
    out(f"backends: {primegen.backends_available()}\n")

    section_fundamental()
    spf = section_why_sqrt()
    pnt = section_pnt()
    gaps_data = section_gaps()

    out("\n---\n")
    section_spf_distribution(spf)
    omega_data = section_omega(spf)
    section_divisors_perfect()

    out("\n---\n")
    section_fermat_carmichael()
    section_strong_pseudoprimes()
    section_pollard()

    out("\n---\n")
    make_plots(pnt, gaps_data, spf, omega_data)
    out(f"\n(total runtime {time.perf_counter()-t0:.1f}s)")

    with open(os.path.join(HERE, "FINDINGS.md"), "w") as f:
        f.write(_report.getvalue())
    print(f"\n[findings written to {os.path.join(HERE, 'FINDINGS.md')}]", file=sys.stderr)


if __name__ == "__main__":
    main()
