# Deadline Scheduler: Survive a Lost Time Slot

## 1. Problem Statement

We are given `n` jobs and `H` time slots. Each job has:

- A unique job ID.
- A deadline `d` in `1..H`.
- A profit `p`.

Some time slots may be unavailable from the start. Each job takes exactly one slot and must be scheduled at or before its deadline. A slot can hold at most one job.

The task is to:

1. Find a schedule that maximizes total profit.
2. Report which jobs are rejected.
3. Identify the **critical slot**: the available slot whose loss causes the maximum reduction in total profit.
4. Report the profit loss, the after-loss profit and the rebuilt assignment.

If multiple slots cause the same maximum loss, the smallest slot number is critical.

If no slot is initially available, the critical slot is `0`, the loss is `0`, and the after-loss assignment contains only zeros.

## 2. Input Format

```text
n H k
<k unavailable slot numbers...>
<job_id> <deadline> <profit>   (n lines)
```

- `n`: number of jobs.
- `H`: number of time slots.
- `k`: number of unavailable slots.
- Unavailable slot numbers are distinct and lie in `1..H`.
- Constraints in the provided problem: `n <= 200`, `H <= 60`.

Official sample input:

```text
5 3 0
1 2 100
2 1 19
3 2 27
4 1 25
5 3 15
```

## 3. Output Format

```text
BASE_PROFIT <total>
BASE_SLOTS <job_id per slot, 0 if empty>
REJECTED <count> <job ids in input order>
CRITICAL_SLOT <slot number, 0 if none>
LOSS <profit lost>
AFTER_PROFIT <total after loss>
AFTER_SLOTS <job_id per slot after loss, 0 if empty>
```

The `REJECTED` line starts with the number of rejected jobs, followed by their IDs in the original input order. This count is part of the required submission format.

For the sample input:

```text
BASE_PROFIT 142
BASE_SLOTS 3 1 5
REJECTED 2 2 4
CRITICAL_SLOT 1
LOSS 27
AFTER_PROFIT 115
AFTER_SLOTS 0 1 5
```

## 4. Approach

### 4.1 Greedy Baseline Schedule

This is a variant of the classic **Job Sequencing with Deadlines** problem. The baseline schedule is built greedily:

1. Sort jobs by profit descending.
2. For equal profit, sort by job ID ascending for deterministic output.
3. Process jobs in that order.
4. For each job, assign the **latest available, unfilled slot at or before its deadline**.
5. If no such slot exists, reject the job.

Using the latest feasible slot is important: it preserves earlier slots for jobs with tighter deadlines.

### 4.2 Why the Greedy Choice Is Optimal

Consider any optimal schedule. Jobs are considered in decreasing profit order. When a job is assigned to its latest available feasible slot, any schedule that places it earlier can be transformed by moving it to the latest free slot without reducing feasibility for previously scheduled jobs. This leaves at least as much room for the remaining jobs.

By an exchange argument, no lower-profit job should displace a higher-profit job when both can use the same feasible slots. Therefore, the greedy schedule maximizes total profit.

### 4.3 Critical-Slot Search

For every **originally available** slot `s`:

1. Create a copy of the availability array with `s` marked unavailable.
2. Rebuild the entire greedy schedule from the original job list.
3. Compute `loss = base_profit - candidate_profit`.
4. Keep the candidate with the largest loss.

Candidates are evaluated in ascending slot order. Because the comparison uses strict `>`, the first maximum wins ties, which is the smallest slot number.

Empty baseline slots are also tested. Removing an empty slot normally causes zero loss, but it can still matter if a different arrangement of jobs would use that slot.

Each candidate rebuild starts from the original job list, not from the baseline assignment. This is necessary because losing a slot can change which jobs are scheduled and in which slots.

### 4.4 Precomputed Sort Order

The job order does not change when a slot is removed. The implementation sorts once per solve and reuses that order for the baseline and all candidate rebuilds.

## 5. Correctness Argument

### Lemma 1: The greedy baseline is optimal

Jobs are processed by non-increasing profit. Assigning each job to its latest feasible free slot leaves earlier slots available for jobs with tighter deadlines. By the standard exchange argument for job sequencing with deadlines, this produces a maximum-profit schedule.

### Lemma 2: Testing every available slot covers the critical slot

The lost slot must be one of the originally available slots. The algorithm tests each such slot exactly once, so the true critical slot is among the candidates.

### Lemma 3: Each candidate profit is correct

For each candidate, the algorithm discards the baseline assignment, removes only that slot from the original availability array, and reruns the optimal greedy algorithm. By Lemma 1, the resulting profit is the maximum profit achievable without that slot.

### Theorem: The reported slot is critical

The algorithm computes the correct loss for every possible lost slot. It keeps a slot with maximum loss. On equal losses, ascending iteration order and a strict comparison retain the smallest slot number. Therefore, the reported critical slot, loss, after-loss profit and after-loss assignment satisfy the problem statement.

## 6. Complexity Analysis

Let `n` be the number of jobs and `H` the number of slots.

| Phase | Time | Space |
|-------|------|-------|
| Sort jobs once | `O(n log n)` | `O(n)` |
| Baseline scheduling | `O(n * H)` | `O(H)` |
| Critical-slot rebuilds | `O(n * H^2)` | `O(H)` |
| Total | `O(n log n + n * H^2)` | `O(n + H)` |

There are at most `H` candidate slots. Each candidate rebuild scans up to `H` slots for each of `n` jobs. The schedule arrays and availability arrays are `O(H)`; the sorted job list is `O(n)`.

The previous documentation claimed `O(m * n log n)` by assuming a re-sort per candidate. The implementation sorts once and reuses the order, so the correct bound is `O(n log n + n * H^2)`.

## 7. Worked Examples

### 7.1 Official Sample 1

Input:

```text
5 3 0
1 2 100
2 1 19
3 2 27
4 1 25
5 3 15
```

Greedy order: job 1 (100), job 3 (27), job 4 (25), job 2 (19), job 5 (15).

Baseline:

- Job 1 (deadline 2) takes slot 2.
- Job 3 (deadline 2) takes slot 1.
- Job 4 (deadline 1) is rejected because slot 1 is filled.
- Job 2 (deadline 1) is rejected because slot 1 is filled.
- Job 5 (deadline 3) takes slot 3.

Output:

```text
BASE_PROFIT 142
BASE_SLOTS 3 1 5
REJECTED 2 2 4
CRITICAL_SLOT 1
LOSS 27
AFTER_PROFIT 115
AFTER_SLOTS 0 1 5
```

Candidate losses:

- Remove slot 1: job 1 uses slot 2, job 5 uses slot 3, profit 115, loss 27.
- Remove slot 2: job 1 uses slot 1, job 5 uses slot 3, profit 115, loss 27.
- Remove slot 3: job 1 uses slot 2, job 3 uses slot 1, profit 127, loss 15.

Slots 1 and 2 tie, so slot 1 is critical.

### 7.2 Official Sample 2

Input:

```text
3 3 2
1 3
10 1 50
20 3 20
30 2 10
```

Slots 1 and 3 are initially unavailable. Only slot 2 remains.

- Job 10 has deadline 1, so it cannot use slot 2.
- Job 20 has deadline 3, so it takes slot 2.
- Job 30 has deadline 2 but slot 2 is filled.

Output:

```text
BASE_PROFIT 20
BASE_SLOTS 0 20 0
REJECTED 2 10 30
CRITICAL_SLOT 2
LOSS 20
AFTER_PROFIT 0
AFTER_SLOTS 0 0 0
```

Removing slot 2 leaves no usable slot, so all profit is lost.

### 7.3 Unavailable Slot in the Middle

Input:

```text
4 4 1
2
10 4 100
20 2 50
30 3 75
40 1 25
```

Slot 2 is initially unavailable.

Baseline:

- Job 10 takes slot 4.
- Job 30 takes slot 3.
- Job 20 takes slot 1 because slot 2 is unavailable.
- Job 40 is rejected.

Output:

```text
BASE_PROFIT 225
BASE_SLOTS 20 0 30 10
REJECTED 1 40
CRITICAL_SLOT 1
LOSS 50
AFTER_PROFIT 175
AFTER_SLOTS 0 0 30 10
```

Removing slot 1, 3 or 4 each costs 50 profit. Slot 1 wins the tie.

### 7.4 Equal Profits

Input:

```text
3 3 0
1 3 50
2 2 50
3 1 50
```

The output is:

```text
BASE_PROFIT 150
BASE_SLOTS 3 2 1
REJECTED 0
CRITICAL_SLOT 1
LOSS 50
AFTER_PROFIT 100
AFTER_SLOTS 0 2 1
```

All three slots cause a loss of 50, so slot 1 is selected.

### 7.5 All Slots Unavailable

Input:

```text
2 3 3
1 2 3
1 1 10
2 2 20
```

Output:

```text
BASE_PROFIT 0
BASE_SLOTS 0 0 0
REJECTED 2 1 2
CRITICAL_SLOT 0
LOSS 0
AFTER_PROFIT 0
AFTER_SLOTS 0 0 0
```

### 7.6 Zero Loss

If a slot is not needed by any optimal schedule, removing it can cause zero loss. The algorithm still reports it as critical when every candidate has zero loss, choosing the smallest available slot.

Input:

```text
1 3 0
1 3 10
```

Output:

```text
BASE_PROFIT 10
BASE_SLOTS 0 0 1
REJECTED 0
CRITICAL_SLOT 1
LOSS 0
AFTER_PROFIT 10
AFTER_SLOTS 0 0 1
```

The single job needs only slot 3, so removing slot 1 causes no loss. Slot 1 is still reported because every candidate has zero loss and ties choose the smallest available slot.

## 8. Edge Cases

| Case | Behavior |
|------|----------|
| No available slots | Critical slot `0`, loss `0`, after profit `0`, all-zero after assignment |
| No jobs | Profit `0`, rejected count `0`, assignments all zero |
| More jobs than slots | Jobs that cannot be placed are rejected |
| Equal profits | Job ID ascending breaks ties during scheduling |
| Equal losses | Smallest slot number is critical |
| Slot empty in baseline | Still tested as a candidate |
| Deadline larger than `H` | Clamped to the last slot when searching |
| `k = 0` | All slots are available |
| Duplicate unavailable slots | Input guarantees distinct, but marking is idempotent |

## 9. Implementation Notes

### Python reference

`deadline_scheduler.py` reads whitespace-separated integers from stdin. It prints exactly seven lines. The critical-slot search reuses a precomputed sorted job list.

### Shared JavaScript engine

`assets/js/algorithm.js` exports the same algorithm to both the browser and Node. It is used by the dashboard and by the JavaScript tests. The Python and JavaScript implementations are checked against each other by `tests/parity.test.js` on official samples and 120 generated cases.

### Slot numbering

Internally, slots are zero-indexed arrays. All user-facing output is converted to one-based slot numbers. An empty slot is represented by job ID `0`, so job IDs must be positive in valid input.

### Rejected-job order

Rejected IDs are emitted in the original input order, not in greedy order. The count is prepended to the line.

## 10. Verification

The reference test suite covers:

- Official sample 1.
- Official sample 2.
- Equal-profit tie-breaking.
- All slots unavailable.
- Zero-profit-loss candidates.
- Single-slot schedules.
- Maximum-size inputs.
- JavaScript/Python parity with shuffled input order.

Commands:

```powershell
python test_scheduler.py
node --test tests\algorithm.test.js
node --test tests\parity.test.js
```

The dashboard also includes a browser test runner on the `#/tests` page, with official samples and edge cases executed against the shared JavaScript engine.

## 11. Files

| File | Purpose |
|------|---------|
| `deadline_scheduler.py` | Python reference implementation and command-line interface |
| `test_scheduler.py` | Python tests |
| `assets/js/algorithm.js` | Shared scheduling engine |
| `assets/js/app.js` | Dashboard routing, state and interactions |
| `assets/js/icons.js` | Inline icon geometry |
| `assets/css/app.css` | Dashboard styling and responsive layout |
| `dashboard.html` | Dashboard shell |
| `index.html` | Redirect to `dashboard.html` |
| `tests/algorithm.test.js` | JavaScript algorithm tests |
| `tests/parity.test.js` | JavaScript/Python parity tests |
| `input.txt` | Official sample input |
| `generate_pdf.py` | Optional PDF generator |

## 12. Conclusion

The solution uses a greedy latest-feasible-slot schedule, then evaluates every originally available slot by rebuilding the schedule without it. The result is optimal for the baseline and exact for the critical-slot analysis. Complexity is `O(n log n + n * H^2)` time and `O(n + H)` space, which is well within the stated limits.
