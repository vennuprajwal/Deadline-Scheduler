import sys
from typing import List, Tuple, Optional


class Job:
    def __init__(self, job_id: int, deadline: int, profit: int):
        self.id = job_id
        self.deadline = deadline
        self.profit = profit

    def __lt__(self, other: "Job") -> bool:
        # Decreasing profit, then increasing job ID for deterministic ties.
        if self.profit != other.profit:
            return self.profit > other.profit
        return self.id < other.id

    def __repr__(self) -> str:
        return f"Job(id={self.id}, deadline={self.deadline}, profit={self.profit})"


def sort_jobs(jobs: List[Job]) -> List[Job]:
    """Return jobs in greedy order: profit descending, job ID ascending."""
    return sorted(jobs, key=lambda job: (-job.profit, job.id))


def find_max_profit(
    jobs: List[Job],
    available_slots: List[bool],
    sorted_jobs: Optional[List[Job]] = None,
) -> Tuple[int, List[int]]:
    """
    Find the maximum profit and which jobs are scheduled in which slots.

    Returns (total_profit, slot_assignments) where slot_assignments[i] is the
    job ID assigned to slot i + 1, or 0 if the slot is empty.

    ``sorted_jobs`` can be supplied when callers already sorted the jobs. This
    keeps the critical-slot search at O(H * n * H) instead of re-sorting for
    every simulated slot removal.
    """
    if not available_slots:
        return 0, []

    ordered_jobs = sorted_jobs if sorted_jobs is not None else sort_jobs(jobs)

    num_slots = len(available_slots)
    slot_filled = [False] * num_slots
    slot_assignments = [0] * num_slots
    total_profit = 0

    for job in ordered_jobs:
        # Try the latest free and available slot at or before the deadline.
        for slot in range(min(job.deadline, num_slots) - 1, -1, -1):
            if available_slots[slot] and not slot_filled[slot]:
                slot_filled[slot] = True
                slot_assignments[slot] = job.id
                total_profit += job.profit
                break

    return total_profit, slot_assignments


def get_rejected_jobs(jobs: List[Job], slot_assignments: List[int]) -> List[int]:
    """Return rejected job IDs in original input order."""
    scheduled_ids = set(slot_assignments)
    scheduled_ids.discard(0)
    return [job.id for job in jobs if job.id not in scheduled_ids]


def find_critical_slot(
    jobs: List[Job],
    available_slots: List[bool],
    base_profit: int,
    base_assignments: List[int],
    sorted_jobs: Optional[List[Job]] = None,
) -> Tuple[int, int, int, List[int]]:
    """
    Find the available slot whose loss causes the maximum profit reduction.

    Every originally available slot is a candidate, including slots that are
    empty in the baseline schedule. Each candidate is evaluated with a complete
    rebuild from the original job list.

    ``sorted_jobs`` can be supplied so the greedy order is sorted only once per
    solve. Returns (critical_slot, loss, after_profit, after_assignments).
    """
    num_slots = len(available_slots)
    if num_slots == 0 or not any(available_slots):
        return 0, 0, 0, [0] * num_slots

    ordered_jobs = sorted_jobs if sorted_jobs is not None else sort_jobs(jobs)
    max_loss = -1
    critical_slot = 0
    best_after_profit = 0
    best_after_assignments = [0] * num_slots

    # Iterating in ascending slot order means the first maximum wins ties.
    for slot_idx in range(num_slots):
        if not available_slots[slot_idx]:
            continue

        test_slots = available_slots.copy()
        test_slots[slot_idx] = False

        profit, assignments = find_max_profit(jobs, test_slots, ordered_jobs)
        loss = base_profit - profit

        if loss > max_loss:
            max_loss = loss
            critical_slot = slot_idx + 1
            best_after_profit = profit
            best_after_assignments = assignments

    if critical_slot == 0:
        return 0, 0, 0, [0] * num_slots

    return critical_slot, max_loss, best_after_profit, best_after_assignments


def format_output(
    base_profit: int,
    base_assignments: List[int],
    rejected: List[int],
    critical_slot: int,
    loss: int,
    after_profit: int,
    after_assignments: List[int],
) -> str:
    """Build the exact output format used by the submission."""
    lines = [
        f"BASE_PROFIT {base_profit}",
        "BASE_SLOTS " + " ".join(map(str, base_assignments)),
        "REJECTED " + " ".join(map(str, [len(rejected)] + rejected)),
        f"CRITICAL_SLOT {critical_slot}",
        f"LOSS {loss}",
        f"AFTER_PROFIT {after_profit}",
        "AFTER_SLOTS " + " ".join(map(str, after_assignments)),
    ]
    return "\n".join(lines)


def solve() -> None:
    data = sys.stdin.read().strip().split()
    if not data:
        return

    it = iter(data)
    try:
        n = int(next(it))
        m = int(next(it))
        k = int(next(it))
    except (StopIteration, ValueError):
        return

    unavailable_slots = []
    for _ in range(k):
        unavailable_slots.append(int(next(it)))

    jobs = []
    for _ in range(n):
        job_id = int(next(it))
        deadline = int(next(it))
        profit = int(next(it))
        jobs.append(Job(job_id, deadline, profit))

    available_slots = [True] * m
    for slot in unavailable_slots:
        if 1 <= slot <= m:
            available_slots[slot - 1] = False

    ordered_jobs = sort_jobs(jobs)
    base_profit, base_assignments = find_max_profit(jobs, available_slots, ordered_jobs)
    rejected = get_rejected_jobs(jobs, base_assignments)

    critical_slot, loss, after_profit, after_assignments = find_critical_slot(
        jobs, available_slots, base_profit, base_assignments, ordered_jobs
    )

    print(
        format_output(
            base_profit,
            base_assignments,
            rejected,
            critical_slot,
            loss,
            after_profit,
            after_assignments,
        )
    )


if __name__ == "__main__":
    solve()
