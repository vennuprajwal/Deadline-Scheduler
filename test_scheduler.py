#!/usr/bin/env python3
"""Assertion-based tests for the deadline scheduler reference implementation."""

import subprocess
import sys
import unittest

from deadline_scheduler import (
    Job,
    find_critical_slot,
    find_max_profit,
    format_output,
    get_rejected_jobs,
    sort_jobs,
)

SAMPLE_1_INPUT = """5 3 0
1 2 100
2 1 19
3 2 27
4 1 25
5 3 15
"""

SAMPLE_1_OUTPUT = """BASE_PROFIT 142
BASE_SLOTS 3 1 5
REJECTED 2 2 4
CRITICAL_SLOT 1
LOSS 27
AFTER_PROFIT 115
AFTER_SLOTS 0 1 5"""

SAMPLE_2_INPUT = """3 3 2
1 3
10 1 50
20 3 20
30 2 10
"""

SAMPLE_2_OUTPUT = """BASE_PROFIT 20
BASE_SLOTS 0 20 0
REJECTED 2 10 30
CRITICAL_SLOT 2
LOSS 20
AFTER_PROFIT 0
AFTER_SLOTS 0 0 0"""


def run_scheduler(jobs, available_slots):
    base_profit, base_assignments = find_max_profit(jobs, available_slots)
    rejected = get_rejected_jobs(jobs, base_assignments)
    critical, loss, after_profit, after_assignments = find_critical_slot(
        jobs, available_slots, base_profit, base_assignments
    )
    return format_output(
        base_profit,
        base_assignments,
        rejected,
        critical,
        loss,
        after_profit,
        after_assignments,
    )


def run_cli(input_text):
    result = subprocess.run(
        [sys.executable, "deadline_scheduler.py"],
        input=input_text,
        text=True,
        capture_output=True,
        check=True,
    )
    return result.stdout.strip()


class SchedulerTests(unittest.TestCase):
    def test_sample_1_cli(self):
        self.assertEqual(run_cli(SAMPLE_1_INPUT), SAMPLE_1_OUTPUT)

    def test_sample_2_cli(self):
        self.assertEqual(run_cli(SAMPLE_2_INPUT), SAMPLE_2_OUTPUT)

    def test_equal_profit_is_sorted_by_increasing_job_id(self):
        jobs = [Job(2, 2, 50), Job(1, 2, 50), Job(3, 1, 50)]
        self.assertEqual([job.id for job in sort_jobs(jobs)], [1, 2, 3])
        self.assertEqual(run_scheduler(jobs, [True, True]), (
            "BASE_PROFIT 100\n"
            "BASE_SLOTS 2 1\n"
            "REJECTED 1 3\n"
            "CRITICAL_SLOT 1\n"
            "LOSS 50\n"
            "AFTER_PROFIT 50\n"
            "AFTER_SLOTS 0 1"
        ))

    def test_all_slots_unavailable(self):
        jobs = [Job(1, 1, 10), Job(2, 2, 20)]
        self.assertEqual(run_scheduler(jobs, [False, False, False]), (
            "BASE_PROFIT 0\n"
            "BASE_SLOTS 0 0 0\n"
            "REJECTED 2 1 2\n"
            "CRITICAL_SLOT 0\n"
            "LOSS 0\n"
            "AFTER_PROFIT 0\n"
            "AFTER_SLOTS 0 0 0"
        ))

    def test_zero_loss_uses_smallest_available_slot(self):
        jobs = [Job(1, 3, 10)]
        self.assertEqual(run_scheduler(jobs, [True, True, True]), (
            "BASE_PROFIT 10\n"
            "BASE_SLOTS 0 0 1\n"
            "REJECTED 0\n"
            "CRITICAL_SLOT 1\n"
            "LOSS 0\n"
            "AFTER_PROFIT 10\n"
            "AFTER_SLOTS 0 0 1"
        ))

    def test_single_job_single_slot(self):
        jobs = [Job(1, 1, 5)]
        self.assertEqual(run_scheduler(jobs, [True]), (
            "BASE_PROFIT 5\n"
            "BASE_SLOTS 1\n"
            "REJECTED 0\n"
            "CRITICAL_SLOT 1\n"
            "LOSS 5\n"
            "AFTER_PROFIT 0\n"
            "AFTER_SLOTS 0"
        ))

    def test_equal_deadlines_and_rebuild_from_original_jobs(self):
        jobs = [Job(1, 2, 10), Job(2, 2, 20), Job(3, 2, 30)]
        self.assertEqual(run_scheduler(jobs, [True, True, True]), (
            "BASE_PROFIT 50\n"
            "BASE_SLOTS 2 3 0\n"
            "REJECTED 1 1\n"
            "CRITICAL_SLOT 1\n"
            "LOSS 20\n"
            "AFTER_PROFIT 30\n"
            "AFTER_SLOTS 0 3 0"
        ))

    def test_rejected_jobs_keep_input_order(self):
        jobs = [Job(9, 1, 10), Job(4, 1, 20), Job(7, 1, 30)]
        _, assignments = find_max_profit(jobs, [True])
        self.assertEqual(get_rejected_jobs(jobs, assignments), [9, 4])

    def test_maximum_input_size_has_no_duplicate_assignments(self):
        jobs = []
        for index in range(200):
            jobs.append(Job(index + 1, (index % 60) + 1, (index * 37) % 500 + 1))

        available = [True] * 60
        for slot in range(0, 60, 7):
            available[slot] = False

        base_profit, assignments = find_max_profit(jobs, available)
        scheduled = [job_id for job_id in assignments if job_id != 0]
        self.assertEqual(len(scheduled), len(set(scheduled)))
        self.assertLessEqual(len(scheduled), 60)

        critical, loss, after_profit, after_assignments = find_critical_slot(
            jobs, available, base_profit, assignments
        )
        self.assertGreaterEqual(critical, 0)
        self.assertLessEqual(critical, 60)
        self.assertGreaterEqual(loss, 0)
        self.assertLessEqual(after_profit, base_profit)
        self.assertEqual(len(after_assignments), 60)
        after_scheduled = [job_id for job_id in after_assignments if job_id != 0]
        self.assertEqual(len(after_scheduled), len(set(after_scheduled)))


if __name__ == "__main__":
    unittest.main(verbosity=2)
