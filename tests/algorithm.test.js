"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const A = require("../assets/js/algorithm.js");

const SAMPLE_1_INPUT = `5 3 0
1 2 100
2 1 19
3 2 27
4 1 25
5 3 15`;

const SAMPLE_1_OUTPUT = `BASE_PROFIT 142
BASE_SLOTS 3 1 5
REJECTED 2 2 4
CRITICAL_SLOT 1
LOSS 27
AFTER_PROFIT 115
AFTER_SLOTS 0 1 5`;

const SAMPLE_2_INPUT = `3 3 2
1 3
10 1 50
20 3 20
30 2 10`;

const SAMPLE_2_OUTPUT = `BASE_PROFIT 20
BASE_SLOTS 0 20 0
REJECTED 2 10 30
CRITICAL_SLOT 2
LOSS 20
AFTER_PROFIT 0
AFTER_SLOTS 0 0 0`;

function run(config) {
  return A.analyze(config).output;
}

test("sample test case 1", () => {
  assert.equal(run(A.parseProblemInput(SAMPLE_1_INPUT)), SAMPLE_1_OUTPUT);
});

test("sample test case 2", () => {
  assert.equal(run(A.parseProblemInput(SAMPLE_2_INPUT)), SAMPLE_2_OUTPUT);
});

test("equal profits are ordered by increasing job ID", () => {
  const result = A.analyze({
    numSlots: 2,
    unavailable: [],
    jobs: [
      { id: 2, deadline: 2, profit: 50 },
      { id: 1, deadline: 2, profit: 50 },
      { id: 3, deadline: 1, profit: 50 }
    ]
  });
  assert.deepEqual(result.sortedJobs.map((job) => job.id), [1, 2, 3]);
  assert.deepEqual(result.baseline.assignments, [2, 1]);
  assert.equal(result.criticalSlot, 1);
  assert.equal(result.output, `BASE_PROFIT 100
BASE_SLOTS 2 1
REJECTED 1 3
CRITICAL_SLOT 1
LOSS 50
AFTER_PROFIT 50
AFTER_SLOTS 0 1`);
});

test("all slots unavailable returns zero critical slot and zero loss", () => {
  const result = A.analyze({
    numSlots: 3,
    unavailable: [1, 2, 3],
    jobs: [
      { id: 1, deadline: 1, profit: 10 },
      { id: 2, deadline: 2, profit: 20 }
    ]
  });
  assert.equal(result.available.some(Boolean), false);
  assert.equal(result.criticalSlot, 0);
  assert.equal(result.loss, 0);
  assert.equal(result.afterProfit, 0);
  assert.deepEqual(result.afterAssignments, [0, 0, 0]);
  assert.equal(result.output, `BASE_PROFIT 0
BASE_SLOTS 0 0 0
REJECTED 2 1 2
CRITICAL_SLOT 0
LOSS 0
AFTER_PROFIT 0
AFTER_SLOTS 0 0 0`);
});

test("zero-loss candidates choose the smallest available slot", () => {
  const result = A.analyze({
    numSlots: 3,
    unavailable: [],
    jobs: [{ id: 1, deadline: 3, profit: 10 }]
  });
  assert.equal(result.criticalSlot, 1);
  assert.equal(result.loss, 0);
  assert.equal(result.afterProfit, 10);
  assert.deepEqual(result.afterAssignments, [0, 0, 1]);
});

test("empty baseline slots are valid critical-slot candidates", () => {
  const result = A.analyze({
    numSlots: 5,
    unavailable: [],
    jobs: [{ id: 1, deadline: 1, profit: 10 }]
  });
  assert.deepEqual(result.baseline.assignments, [1, 0, 0, 0, 0]);
  assert.equal(result.candidates.length, 5);
  assert.equal(result.criticalSlot, 1);
  assert.equal(result.loss, 10);
  assert.equal(result.afterProfit, 0);
});

test("single job and single slot", () => {
  const result = A.analyze({
    numSlots: 1,
    unavailable: [],
    jobs: [{ id: 1, deadline: 1, profit: 5 }]
  });
  assert.equal(result.output, `BASE_PROFIT 5
BASE_SLOTS 1
REJECTED 0
CRITICAL_SLOT 1
LOSS 5
AFTER_PROFIT 0
AFTER_SLOTS 0`);
});

test("equal deadlines rebuild from the original job list", () => {
  const result = A.analyze({
    numSlots: 3,
    unavailable: [],
    jobs: [
      { id: 1, deadline: 2, profit: 10 },
      { id: 2, deadline: 2, profit: 20 },
      { id: 3, deadline: 2, profit: 30 }
    ]
  });
  assert.deepEqual(result.baseline.assignments, [2, 3, 0]);
  assert.equal(result.criticalSlot, 1);
  assert.equal(result.loss, 20);
  assert.deepEqual(result.afterAssignments, [0, 3, 0]);
  assert.deepEqual(result.baseline.rejected, [1]);
});

test("trace records checked, blocked, occupied and selected slots", () => {
  const result = A.analyze({
    numSlots: 3,
    unavailable: [1],
    jobs: [
      { id: 1, deadline: 2, profit: 100 },
      { id: 2, deadline: 2, profit: 27 }
    ]
  });
  const first = result.baseline.steps[0];
  assert.equal(first.job.id, 1);
  assert.deepEqual(first.checked.map((check) => check.slot), [2]);
  assert.equal(first.checked[0].selected, true);
  assert.equal(first.selectedSlot, 2);

  const second = result.baseline.steps[1];
  assert.deepEqual(second.checked.map((check) => check.slot), [2, 1]);
  assert.equal(second.checked[0].filled, true);
  assert.equal(second.checked[1].available, false);
  assert.equal(second.rejected, true);
  assert.equal(second.selectedSlot, 0);
});

test("maximum input size keeps assignments and rejections valid", () => {
  const jobs = [];
  for (let index = 0; index < A.MAX_JOBS; index += 1) {
    jobs.push({
      id: index + 1,
      deadline: (index % A.MAX_SLOTS) + 1,
      profit: ((index * 37) % 500) + 1
    });
  }
  const unavailable = [];
  for (let slot = 1; slot <= A.MAX_SLOTS; slot += 7) unavailable.push(slot);

  const result = A.analyze({ numSlots: A.MAX_SLOTS, unavailable, jobs });
  const scheduled = result.baseline.assignments.filter(Boolean);
  assert.equal(new Set(scheduled).size, scheduled.length);
  assert.ok(result.criticalSlot >= 0 && result.criticalSlot <= A.MAX_SLOTS);
  assert.ok(result.afterProfit <= result.baseline.profit);
  assert.equal(result.candidates.length, A.MAX_SLOTS - unavailable.length);
});

test("parser rejects malformed and invalid inputs", () => {
  assert.throws(() => A.parseProblemInput(""), /empty/i);
  assert.throws(() => A.parseProblemInput("5 3 0\n1 2"), /ended early/i);
  assert.throws(() => A.parseProblemInput("1 3 0\n1 4 10"), /deadline/i);
  assert.throws(() => A.parseProblemInput("2 3 0\n1 2 10\n1 2 20"), /duplicated/i);
  assert.throws(() => A.parseProblemInput("1 3 2\n1 1\n1 2 10"), /duplicated/i);
  assert.throws(() => A.parseProblemInput("1 0 0\n1 1 10"), /m must/i);
});

test("project validation catches configuration problems", () => {
  const errors = A.validateProject(
    {
      numSlots: 2,
      unavailable: [1, 1, 4],
      jobs: [
        { id: 1, deadline: 3, profit: 0 },
        { id: 1, deadline: 1, profit: 5 }
      ]
    },
    { requireJobs: true }
  );
  assert.ok(errors.some((message) => /duplicated/i.test(message)));
  assert.ok(errors.some((message) => /outside 1\.\.2/i.test(message)));
  assert.ok(errors.some((message) => /deadline/i.test(message)));
  assert.ok(errors.some((message) => /profit/i.test(message)));
});
