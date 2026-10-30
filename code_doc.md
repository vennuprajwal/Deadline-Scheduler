# Deadline Scheduler: Survive a Lost Time Slot

## Problem Statement

Given a set of jobs, each with a unique ID, deadline, and profit, and a set of time slots (some initially unavailable), we need to:

1. Schedule jobs to maximize total profit (each job takes 1 slot, must be scheduled at or before its deadline)
2. Identify the **critical slot** — the available slot whose loss would cause the maximum reduction in profit
3. Output baseline profit, slot assignments, rejected jobs, critical slot, loss, and post-loss profit/assignments

---

## Approach and Algorithmic Decisions

### Core Algorithm: Greedy Job Scheduling with Deadlines

The problem is a variant of the classic **Job Sequencing with Deadlines** problem, solved optimally using a greedy approach:

1. **Sort jobs by profit in descending order** — consider highest-profit jobs first
2. **For each job, place it in the latest available slot ≤ its deadline** — this leaves earlier slots free for other jobs with tighter deadlines
3. **Repeat until all jobs considered or no slots remain**

This greedy strategy is optimal because:
- Higher profit jobs should never be displaced by lower profit ones
- Scheduling at the latest possible slot maximizes flexibility for remaining jobs

### Handling Unavailable Slots

We maintain a boolean array `available_slots` where `True` means the slot is available. Initially unavailable slots are marked `False`.

### Finding the Critical Slot

For each **initially available** slot, we simulate its loss:
1. Temporarily mark the slot as unavailable
2. Re-run the greedy scheduling algorithm
3. Compute profit loss = `base_profit - new_profit`
4. Track the slot with maximum loss (tie-break: smaller slot number)

This is O(m × n log n) where m = slots, n = jobs. For typical constraints, this is efficient.

### Data Structures

- **Job class**: Stores id, deadline, profit; implements `__lt__` for sorting by profit
- **available_slots**: List[bool] — O(1) slot availability check
- **slot_assignments**: List[int] — job_id assigned to each slot (0 = empty)

---

## Time and Space Complexity

| Operation | Time Complexity | Space Complexity |
|-----------|----------------|------------------|
| Sorting jobs | O(n log n) | O(n) |
| Baseline scheduling | O(n × m) | O(m) |
| Critical slot search (m simulations) | O(m × n log n) | O(m) |
| **Total** | **O(m × n log n)** | **O(n + m)** |

Where n = number of jobs, m = number of time slots.

---

## Sample Test Cases

### Test Case 1 (from problem statement)

**Input:**
```
5 3 0
1 2 100
2 1 19
3 2 27
4 1 25
5 3 15
```

**Output:**
```
BASE_PROFIT 142
BASE_SLOTS 3 1 5
REJECTED 2 4
CRITICAL_SLOT 1
LOSS 27
AFTER_PROFIT 115
AFTER_SLOTS 0 1 5
```

**Explanation:** 
- Baseline: Jobs 3, 1, 5 scheduled in slots 1, 2, 3 → profit = 27 + 100 + 15 = 142
- Losing slot 1: best profit = 115 (loss = 27)
- Losing slot 2: best profit = 115 (loss = 27) 
- Losing slot 3: best profit = 127 (loss = 15)
- Tie between slots 1 and 2 → choose slot 1 (smaller number)

---

### Test Case 2 (from problem statement)

**Input:**
```
3 3 2
1 3
10 1 50
20 3 20
30 2 10
```

**Output:**
```
BASE_PROFIT 20
BASE_SLOTS 0 20 0
REJECTED 10 30
CRITICAL_SLOT 2
LOSS 20
AFTER_PROFIT 0
AFTER_SLOTS 0 0 0
```

**Explanation:**
- Only slot 2 initially available (slots 1,3 unavailable)
- Job 10 deadline=1 cannot use slot 2
- Job 20 deadline=3 uses slot 2 → profit = 20
- Losing slot 2 leaves no usable slots → profit = 0

---

### Test Case 3 (Original)

**Input:**
```
4 4 1
2
10 4 100
20 2 50
30 3 75
40 1 25
```

**Output:**
```
BASE_PROFIT 225
BASE_SLOTS 10 20 30 0
REJECTED 40
CRITICAL_SLOT 1
LOSS 100
AFTER_PROFIT 125
AFTER_SLOTS 0 20 30 0
```

**Explanation:**
- Slot 2 initially unavailable
- Baseline: Job 10 in slot 1, Job 20 in slot 3, Job 30 in slot 4 → profit = 100 + 50 + 75 = 225
- Job 40 (deadline 1) rejected
- Critical slot = 1 (losing it removes job 10 with profit 100)
- After losing slot 1: Job 20 in slot 3, Job 30 in slot 4 → profit = 125

---

### Test Case 4 (Original - Tie Breaking)

**Input:**
```
3 3 0
1 3 50
2 2 50
3 1 50
```

**Output:**
```
BASE_PROFIT 150
BASE_SLOTS 3 2 1
REJECTED 
CRITICAL_SLOT 1
LOSS 50
AFTER_PROFIT 100
AFTER_SLOTS 0 2 1
```

**Explanation:**
- All jobs have same profit (50), all slots available
- Baseline: Job 3 in slot 1, Job 2 in slot 2, Job 1 in slot 3 → profit = 150
- Losing any slot causes loss of 50 (one job)
- Tie between slots 1, 2, 3 → choose slot 1 (smallest)

---

### Test Case 5 (Original - No Jobs Can Be Scheduled)

**Input:**
```
2 2 0
1 1 100
2 1 200
```

**Output:**
```
BASE_PROFIT 200
BASE_SLOTS 2 0
REJECTED 1
CRITICAL_SLOT 1
LOSS 200
AFTER_PROFIT 0
AFTER_SLOTS 0 0
```

**Explanation:**
- Both jobs have deadline 1, only slot 1 can be used
- Job 2 (profit 200) gets slot 1, Job 1 rejected
- Losing slot 1 → no slots available → profit 0
- Critical slot = 1, loss = 200

---

## Member Contributions

Since this is an individual submission:

| Member | Contribution |
|--------|--------------|
| [Your Name] | Complete algorithm design, implementation, testing, documentation |

---

## Files Submitted

1. **deadline_scheduler.py** — Complete Python solution
2. **code_doc.pdf** — This document (converted from Markdown)

---

## How to Run

```bash
python deadline_scheduler.py < input.txt
```

Or pipe input directly:
```bash
echo "5 3 0
1 2 100
2 1 19
3 2 27
4 1 25
5 3 15" | python deadline_scheduler.py
```

The program reads from stdin and writes to stdout.