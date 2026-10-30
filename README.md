# Deadline Scheduler

Deadline Scheduler is a static algorithm lab for **Job Sequencing with Deadlines**. It builds a maximum-profit baseline schedule and identifies the **critical time slot** whose loss causes the largest profit drop.

The project includes:

- A Python reference implementation and CLI.
- A shared JavaScript scheduling engine for the browser and Node.
- A responsive dashboard with interactive visualization, critical-slot comparison, sample verification and documentation.
- Python, JavaScript and cross-language parity tests.

Open `dashboard.html` directly or deploy the repository as a static site.

## Problem

Given `n` jobs with unique IDs, deadlines and profits, and `H` time slots where some slots are initially unavailable, find:

1. The maximum achievable profit and the baseline slot-to-job assignment.
2. The rejected jobs in input order.
3. The critical available slot whose removal causes the largest profit loss, with ties resolved by the smallest slot number.
4. The loss, after-loss profit and rebuilt assignment.

Each job takes exactly one slot and must be scheduled at or before its deadline.

## Algorithm

### Greedy scheduling

Jobs are ordered by **profit descending**, then by **job ID ascending** for deterministic ties. Each job claims the **latest available, unfilled slot at or before its deadline**.

This is optimal for job sequencing with deadlines: higher-profit jobs are considered first, and using the latest feasible slot preserves earlier slots for jobs with tighter deadlines.

### Critical-slot search

Every **originally available** slot is tested, including slots that are empty in the baseline:

1. Mark the candidate slot unavailable.
2. Rebuild the schedule from the original job list using the already-sorted jobs.
3. Compute `loss = baseline profit - candidate profit`.
4. Keep the largest loss, breaking ties with the smallest slot number.

Special cases:

- If every slot is initially unavailable, the critical slot is `0`, loss is `0`, and the after-loss assignment contains only zeros.
- If several candidates have zero loss, the smallest available slot is reported.

## Complexity

For `n` jobs and `H` slots:

| Phase | Time | Space |
|-------|------|-------|
| Sort jobs once | `O(n log n)` | `O(n)` |
| Baseline scheduling | `O(n * H)` | `O(H)` |
| Critical-slot rebuilds | `O(n * H^2)` | `O(H)` |
| **Total** | **`O(n log n + n * H^2)`** | **`O(n + H)`** |

Constraints: `1 <= n <= 200`, `1 <= H <= 60`.

## Input Format

```text
n H k
<k unavailable slot numbers...>
<job_id> <deadline> <profit>   (n lines)
```

Example (`input.txt`):

```text
5 3 0
1 2 100
2 1 19
3 2 27
4 1 25
5 3 15
```

## Output Format

```text
BASE_PROFIT <total>
BASE_SLOTS <job_id per slot, 0 if empty>
REJECTED <count> <job ids in input order>
CRITICAL_SLOT <slot number, 0 if none>
LOSS <profit lost>
AFTER_PROFIT <total after loss>
AFTER_SLOTS <job_id per slot after loss, 0 if empty>
```

The `REJECTED` line includes the number of rejected jobs before the IDs.

Example output for `input.txt`:

```text
BASE_PROFIT 142
BASE_SLOTS 3 1 5
REJECTED 2 2 4
CRITICAL_SLOT 1
LOSS 27
AFTER_PROFIT 115
AFTER_SLOTS 0 1 5
```

Slots 1 and 2 both lose 27 profit when removed. The smaller slot number wins the tie.

## Usage

```powershell
Get-Content input.txt | python deadline_scheduler.py
```

On Unix-like shells:

```bash
python deadline_scheduler.py < input.txt
```

The CLI reads from stdin and writes only the seven output lines to stdout.

## Dashboard

Open `dashboard.html` directly, or deploy the repository as a static site. The dashboard is dependency-free at runtime and includes:

- Overview with KPI cards, baseline timeline, after-loss schedule and output console.
- Jobs table with search, filters, sorting and add/edit/delete dialogs.
- Configuration for the time horizon, unavailable slots and official input import.
- Step-by-step greedy visualization with playback controls.
- Critical-slot bar chart and candidate comparison table.
- Browser test runner for official samples and edge cases.
- Complexity analysis and full documentation.
- Dark and light themes with responsive sidebar navigation.

The dashboard uses hash routes: `#/overview`, `#/jobs`, `#/configuration`, `#/visualization`, `#/critical`, `#/tests`, `#/complexity` and `#/documentation`.

## Tests

Run all JavaScript and parity tests via npm:

```powershell
npm test
```

Or run individual suites:

Python reference tests:

```powershell
python test_scheduler.py
```

JavaScript algorithm tests:

```powershell
node --test tests/algorithm.test.js
```

JavaScript/Python parity tests on official samples and 120 generated cases:

```powershell
node --test tests/parity.test.js
```

The Python suite covers the official samples plus tie-breaking, all-slots-unavailable, zero-loss, single-slot and maximum-size cases. The parity suite shuffles input order so the job-ID tie-break is genuinely exercised.

## Project Files

| File | Description |
|------|-------------|
| `deadline_scheduler.py` | Python reference implementation and CLI |
| `test_scheduler.py` | Python assertion tests |
| `assets/js/algorithm.js` | Shared browser/Node scheduling engine |
| `assets/js/app.js` | Dashboard state, routing, views and interactions |
| `assets/js/icons.js` | Inline Lucide icon geometry |
| `assets/css/app.css` | Dashboard design system and responsive layout |
| `dashboard.html` | Dashboard shell |
| `index.html` | Static hosting entrypoint |
| `package.json` | Project scripts and metadata |
| `requirements.txt` | Python dependency specifications |
| `tests/algorithm.test.js` | JavaScript algorithm tests |
| `tests/parity.test.js` | JavaScript/Python parity tests |
| `input.txt` | Official sample input |
| `code_doc.md` | Full problem write-up and worked examples |
| `generate_pdf.py` | Optional PDF generator; requires `fpdf2` |

## Documentation PDF

`generate_pdf.py` renders `code_doc.md` to `code_doc.pdf`. It requires `fpdf2`:

```powershell
python -m pip install fpdf2
python generate_pdf.py
```

## License

No license specified.
