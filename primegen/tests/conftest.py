"""pytest configuration: a ``slow`` marker for the heavy correctness gates.

By default slow tests (e.g. the pi(10^9) gate) are skipped to keep the suite
fast. Run them with::

    pytest --run-slow
"""
import pytest


def pytest_addoption(parser):
    parser.addoption(
        "--run-slow", action="store_true", default=False,
        help="run slow tests (e.g. the pi(10^9) correctness gate)",
    )


def pytest_configure(config):
    config.addinivalue_line("markers", "slow: heavy test, opt in with --run-slow")


def pytest_collection_modifyitems(config, items):
    if config.getoption("--run-slow"):
        return
    skip = pytest.mark.skip(reason="needs --run-slow")
    for item in items:
        if "slow" in item.keywords:
            item.add_marker(skip)
