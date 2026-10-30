import sys
from typing import List, Tuple, Optional


class Job:
    def __init__(self, job_id: int, deadline: int, profit: int):
        self.id = job_id
        self.deadline = deadline
        self.profit = profit

    def __lt__(self, other):
        return self.profit > other.profit


def find_max_profit(jobs: List[Job], available_slots: List[bool]) -> Tuple[int, List[int]]:
    """
    Find the maximum profit and which jobs are scheduled in which slots.
    Returns (total_profit, slot_assignments) where slot_assignments[i] = job_id assigned to slot i+1, or 0 if empty.
    """
    if not available_slots:
        return 0, []

    # Sort jobs by profit descending (greedy)
    sorted_jobs = sorted(jobs)

    num_slots = len(available_slots)
    slot_filled = [False] * num_slots
    slot_assignments = [0] * num_slots
    total_profit = 0

    for job in sorted_jobs:
        # Try to schedule job at the latest available slot <= deadline
        for slot in range(min(job.deadline, num_slots) - 1, -1, -1):
            if available_slots[slot] and not slot_filled[slot]:
                slot_filled[slot] = True
                slot_assignments[slot] = job.id
                total_profit += job.profit
                break

    return total_profit, slot_assignments


def get_rejected_jobs(jobs: List[Job], slot_assignments: List[int]) -> List[int]:
    """Return list of job IDs that were not scheduled."""
    scheduled_ids = set(slot_assignments)
    scheduled_ids.discard(0)  # Remove empty slot indicator
    rejected = [job.id for job in jobs if job.id not in scheduled_ids]
    return rejected


def find_critical_slot(jobs: List[Job], available_slots: List[bool], 
                       base_profit: int, base_assignments: List[int]) -> Tuple[int, int, int, List[int]]:
    """
    Find the critical slot whose loss causes maximum profit loss.
    Returns (critical_slot, loss, after_profit, after_assignments)
    """
    if not available_slots:
        return 0, 0, 0, []

    num_slots = len(available_slots)
    max_loss = -1
    critical_slot = 0
    best_after_profit = 0
    best_after_assignments = []

    # Check each available slot
    for slot_idx in range(num_slots):
        if not available_slots[slot_idx]:
            continue

        # Simulate losing this slot
        test_slots = available_slots.copy()
        test_slots[slot_idx] = False

        profit, assignments = find_max_profit(jobs, test_slots)
        loss = base_profit - profit

        # Update critical slot (prefer smaller slot number on tie)
        if loss > max_loss or (loss == max_loss and slot_idx + 1 < critical_slot):
            max_loss = loss
            critical_slot = slot_idx + 1
            best_after_profit = profit
            best_after_assignments = assignments

    return critical_slot, max_loss, best_after_profit, best_after_assignments


def solve() -> None:
    data = sys.stdin.read().strip().split()
    if not data:
        return

    it = iter(data)
    n = int(next(it))
    m = int(next(it))
    k = int(next(it))  # Number of initially unavailable slots

    # Read unavailable slots
    unavailable_slots = []
    for _ in range(k):
        unavailable_slots.append(int(next(it)))

    # Read jobs
    jobs = []
    for _ in range(n):
        job_id = int(next(it))
        deadline = int(next(it))
        profit = int(next(it))
        jobs.append(Job(job_id, deadline, profit))

    # Initialize available slots
    available_slots = [True] * m
    for slot in unavailable_slots:
        if 1 <= slot <= m:
            available_slots[slot - 1] = False

    # Compute baseline
    base_profit, base_assignments = find_max_profit(jobs, available_slots)
    rejected = get_rejected_jobs(jobs, base_assignments)

    # Find critical slot
    critical_slot, loss, after_profit, after_assignments = find_critical_slot(
        jobs, available_slots, base_profit, base_assignments
    )

    # Output
    print(f"BASE_PROFIT {base_profit}")
    print("BASE_SLOTS " + " ".join(map(str, base_assignments)))
    print("REJECTED " + " ".join(map(str, rejected)))
    print(f"CRITICAL_SLOT {critical_slot}")
    print(f"LOSS {loss}")
    print(f"AFTER_PROFIT {after_profit}")
    print("AFTER_SLOTS " + " ".join(map(str, after_assignments)))


if __name__ == "__main__":
    solve()