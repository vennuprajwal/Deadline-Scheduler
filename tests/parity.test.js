"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const A = require("../assets/js/algorithm.js");

const ROOT = path.resolve(__dirname, "..");
const PYTHON = process.env.PYTHON || "python";

function toInput(config) {
  const lines = [
    `${config.jobs.length} ${config.numSlots} ${config.unavailable.length}`,
    config.unavailable.join(" ")
  ].filter((line, index) => index === 0 || line.length > 0);
  config.jobs.forEach((job) => {
    lines.push(`${job.id} ${job.deadline} ${job.profit}`);
  });
  return lines.join("\n") + "\n";
}

function pythonOutput(config) {
  const result = spawnSync(PYTHON, ["deadline_scheduler.py"], {
    cwd: ROOT,
    input: toInput(config),
    text: true,
    encoding: "utf8"
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr || "Python scheduler failed");
  return result.stdout.trim().replace(/\r\n/g, "\n");
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

test("JavaScript frontend matches Python for 120 generated cases", () => {
  const random = seededRandom(20261030);

  for (let sample = 0; sample < 120; sample += 1) {
    const numSlots = 1 + Math.floor(random() * 8);
    const jobCount = 1 + Math.floor(random() * 14);
    const unavailable = [];
    for (let slot = 1; slot <= numSlots; slot += 1) {
      if (random() < 0.22) unavailable.push(slot);
    }

    const jobs = [];
    const usedIds = new Set();
    for (let index = 0; index < jobCount; index += 1) {
      let id = 1 + Math.floor(random() * 40);
      while (usedIds.has(id)) id = 1 + Math.floor(random() * 40);
      usedIds.add(id);
      jobs.push({
        id,
        deadline: 1 + Math.floor(random() * numSlots),
        profit: 1 + Math.floor(random() * 250)
      });
    }

    // Shuffle input order so the ID tie-break is genuinely exercised.
    for (let index = jobs.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(random() * (index + 1));
      const temporary = jobs[index];
      jobs[index] = jobs[swap];
      jobs[swap] = temporary;
    }

    const config = { numSlots, unavailable, jobs };
    const js = A.analyze(config).output;
    const py = pythonOutput(config);
    assert.equal(js, py, `Mismatch for generated case ${sample + 1}\nInput:\n${toInput(config)}`);
  }
});

test("JavaScript frontend matches Python on official samples", () => {
  const samples = [
    {
      numSlots: 3,
      unavailable: [],
      jobs: [
        { id: 1, deadline: 2, profit: 100 },
        { id: 2, deadline: 1, profit: 19 },
        { id: 3, deadline: 2, profit: 27 },
        { id: 4, deadline: 1, profit: 25 },
        { id: 5, deadline: 3, profit: 15 }
      ]
    },
    {
      numSlots: 3,
      unavailable: [1, 3],
      jobs: [
        { id: 10, deadline: 1, profit: 50 },
        { id: 20, deadline: 3, profit: 20 },
        { id: 30, deadline: 2, profit: 10 }
      ]
    }
  ];

  samples.forEach((config) => {
    assert.equal(A.analyze(config).output, pythonOutput(config));
  });
});
