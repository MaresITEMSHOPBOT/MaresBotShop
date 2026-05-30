"""Build script for primegen, including the Cython hot-path extension.

Build the compiled extension in place with::

    python setup.py build_ext --inplace

or simply run ``./build.sh``. If Cython or numpy headers are unavailable the
package still imports and runs — it transparently falls back to the
pure-Python sieve inner loop (see ``primegen/csieve.py``).
"""
from setuptools import Extension, setup

try:
    from Cython.Build import cythonize

    HAVE_CYTHON = True
except ImportError:  # pragma: no cover
    cythonize = None
    HAVE_CYTHON = False

try:
    import numpy

    NUMPY_INCLUDE = [numpy.get_include()]
except ImportError:  # pragma: no cover
    NUMPY_INCLUDE = []

ext_modules = []
if HAVE_CYTHON and NUMPY_INCLUDE:
    ext_modules = cythonize(
        [
            Extension(
                "primegen._sieve",
                ["primegen/_sieve.pyx"],
                include_dirs=NUMPY_INCLUDE,
                define_macros=[("NPY_NO_DEPRECATED_API", "NPY_1_7_API_VERSION")],
                extra_compile_args=["-O3", "-funroll-loops"],
            ),
            Extension(
                "primegen._count",
                ["primegen/_count.pyx"],
                include_dirs=NUMPY_INCLUDE,
                define_macros=[("NPY_NO_DEPRECATED_API", "NPY_1_7_API_VERSION")],
                extra_compile_args=["-O3", "-funroll-loops"],
            ),
        ],
        compiler_directives={"language_level": "3"},
    )

setup(
    name="primegen",
    version="0.1.0",
    description="Fast, honestly-benchmarked prime generation in Python.",
    packages=["primegen"],
    ext_modules=ext_modules,
    install_requires=["numpy>=1.20"],
    extras_require={"big": ["gmpy2>=2.1"], "build": ["Cython>=3.0"]},
    python_requires=">=3.8",
)
