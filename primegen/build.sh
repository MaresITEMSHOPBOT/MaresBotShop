#!/usr/bin/env bash
# Build the Cython hot-path extension in place.
#
# After this runs, `primegen.csieve.HAVE_CYTHON` is True and the bit-packed
# sieve uses the compiled inner loop. If this step is skipped (or fails),
# the package still works via the pure-Python fallback — just slower.
set -euo pipefail
cd "$(dirname "$0")"

echo ">> Building primegen._sieve (Cython) ..."
python3 setup.py build_ext --inplace

echo ">> Verifying ..."
python3 -c "from primegen import csieve; print('HAVE_CYTHON =', csieve.HAVE_CYTHON, '->', csieve.impl_name())"
echo ">> Done."
