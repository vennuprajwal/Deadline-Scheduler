(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.DeadlineScheduler = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var MAX_JOBS = 200;
  var MAX_SLOTS = 60;

  function isInteger(value) {
    return typeof value === "number" && Number.isFinite(value) && Math.floor(value) === value;
  }

  function toInteger(value) {
    var number = Number(value);
    return isInteger(number) ? number : NaN;
  }

  /**
   * Greedy order: highest profit first, then smallest job ID.
   * The job ID tie-break is required for deterministic output.
   */
  function sortJobs(jobs) {
    return jobs.slice().sort(function (a, b) {
      if (b.profit !== a.profit) return b.profit - a.profit;
      return a.id - b.id;
    });
  }

  function buildAvailability(numSlots, unavailable) {
    var available = new Array(numSlots).fill(true);
    (unavailable || []).forEach(function (slot) {
      if (isInteger(slot) && slot >= 1 && slot <= numSlots) {
        available[slot - 1] = false;
      }
    });
    return available;
  }

  /**
   * One complete greedy scheduling pass.
   *
   * @param {Array} sortedJobs jobs already ordered by sortJobs
   * @param {Array<boolean>} available slot availability, index 0 = slot 1
   * @param {boolean} trace when true, records every slot check for visualization
   */
  function runSchedule(sortedJobs, available, trace) {
    var numSlots = available.length;
    var filled = new Array(numSlots).fill(false);
    var assignments = new Array(numSlots).fill(0);
    var steps = trace ? [] : null;
    var totalProfit = 0;

    for (var jobIndex = 0; jobIndex < sortedJobs.length; jobIndex += 1) {
      var job = sortedJobs[jobIndex];
      var checks = [];
      var selectedSlot = -1;
      var assignmentsBefore = assignments.slice();
      var start = Math.min(job.deadline, numSlots) - 1;

      for (var slotIndex = start; slotIndex >= 0; slotIndex -= 1) {
        var slotIsAvailable = !!available[slotIndex];
        var slotIsFilled = !!filled[slotIndex];
        var selected = slotIsAvailable && !slotIsFilled;
        checks.push({
          slot: slotIndex + 1,
          available: slotIsAvailable,
          filled: slotIsFilled,
          selected: selected
        });
        if (selected) {
          selectedSlot = slotIndex;
          break;
        }
      }

      if (selectedSlot >= 0) {
        filled[selectedSlot] = true;
        assignments[selectedSlot] = job.id;
        totalProfit += job.profit;
      }

      if (trace) {
        steps.push({
          jobIndex: jobIndex,
          job: { id: job.id, deadline: job.deadline, profit: job.profit },
          checked: checks,
          selectedSlot: selectedSlot + 1,
          rejected: selectedSlot < 0,
          assignmentsBefore: assignmentsBefore,
          assignments: assignments.slice(),
          profit: totalProfit
        });
      }
    }

    return {
      profit: totalProfit,
      assignments: assignments,
      steps: steps
    };
  }

  function getRejected(jobs, assignments) {
    var scheduledIds = new Set();
    assignments.forEach(function (jobId) {
      if (jobId !== 0) scheduledIds.add(jobId);
    });
    return jobs
      .filter(function (job) {
        return !scheduledIds.has(job.id);
      })
      .map(function (job) {
        return job.id;
      });
  }

  function formatOutput(result) {
    var rejected = result.rejected || (result.baseline && result.baseline.rejected) || [];
    var baseAssignments = result.assignments || (result.baseline && result.baseline.assignments) || [];
    var afterAssignments = result.afterAssignments || [];
    var baseProfit =
      result.profit !== undefined
        ? result.profit
        : result.baseProfit !== undefined
          ? result.baseProfit
          : result.baseline
            ? result.baseline.profit
            : 0;

    return [
      "BASE_PROFIT " + baseProfit,
      "BASE_SLOTS " + baseAssignments.join(" "),
      "REJECTED " + [rejected.length].concat(rejected).join(" "),
      "CRITICAL_SLOT " + (result.criticalSlot || 0),
      "LOSS " + (result.loss || 0),
      "AFTER_PROFIT " + (result.afterProfit || 0),
      "AFTER_SLOTS " + afterAssignments.join(" ")
    ].join("\n");
  }

  /**
   * Baseline schedule + critical-slot analysis.
   *
   * Every originally available slot is tested, including empty baseline slots.
   * Every candidate rebuild starts from the original job list. The chosen slot
   * is the first slot with the largest profit loss (smallest slot number wins).
   */
  function analyze(config) {
    var jobs = (config.jobs || []).map(function (job) {
      return {
        id: Number(job.id),
        deadline: Number(job.deadline),
        profit: Number(job.profit)
      };
    });
    var numSlots = Number(config.numSlots);
    var unavailable = Array.from(new Set((config.unavailable || []).map(Number))).sort(function (a, b) {
      return a - b;
    });
    var available = buildAvailability(numSlots, unavailable);
    var sortedJobs = sortJobs(jobs);

    var baselineRun = runSchedule(sortedJobs, available, true);
    var rejected = getRejected(jobs, baselineRun.assignments);
    var baseline = {
      profit: baselineRun.profit,
      assignments: baselineRun.assignments,
      rejected: rejected,
      steps: baselineRun.steps
    };

    var candidates = [];
    var maxLoss = null;
    var criticalSlot = 0;
    var afterProfit = 0;
    var afterAssignments = new Array(numSlots).fill(0);
    var afterRejected = rejected.slice();

    for (var slotIndex = 0; slotIndex < numSlots; slotIndex += 1) {
      if (!available[slotIndex]) continue;

      var testSlots = available.slice();
      testSlots[slotIndex] = false;
      var candidateRun = runSchedule(sortedJobs, testSlots, false);
      var candidateRejected = getRejected(jobs, candidateRun.assignments);
      var loss = baselineRun.profit - candidateRun.profit;
      var candidate = {
        slot: slotIndex + 1,
        profit: candidateRun.profit,
        loss: loss,
        assignments: candidateRun.assignments,
        rejected: candidateRejected
      };
      candidates.push(candidate);

      if (maxLoss === null || loss > maxLoss) {
        maxLoss = loss;
        criticalSlot = candidate.slot;
        afterProfit = candidateRun.profit;
        afterAssignments = candidateRun.assignments;
        afterRejected = candidateRejected;
      }
    }

    if (maxLoss === null) {
      maxLoss = 0;
      criticalSlot = 0;
      afterProfit = 0;
      afterAssignments = new Array(numSlots).fill(0);
      afterRejected = rejected.slice();
    }

    var result = {
      jobs: jobs,
      sortedJobs: sortedJobs,
      numSlots: numSlots,
      unavailable: unavailable,
      available: available,
      baseline: baseline,
      candidates: candidates,
      criticalSlot: criticalSlot,
      loss: maxLoss,
      afterProfit: afterProfit,
      afterAssignments: afterAssignments,
      afterRejected: afterRejected
    };
    result.output = formatOutput({
      profit: baseline.profit,
      assignments: baseline.assignments,
      rejected: baseline.rejected,
      criticalSlot: criticalSlot,
      loss: maxLoss,
      afterProfit: afterProfit,
      afterAssignments: afterAssignments
    });
    return result;
  }

  function validateProject(config, options) {
    var opts = options || {};
    var errors = [];
    var numSlots = toInteger(config && config.numSlots);
    var jobs = (config && config.jobs) || [];
    var unavailable = (config && config.unavailable) || [];

    if (!isInteger(numSlots) || numSlots < 1 || numSlots > MAX_SLOTS) {
      errors.push("Time slots (H) must be an integer between 1 and " + MAX_SLOTS + ".");
    }

    if (!Array.isArray(jobs)) {
      errors.push("Jobs must be a list.");
      jobs = [];
    } else if (jobs.length > MAX_JOBS) {
      errors.push("Job count cannot exceed " + MAX_JOBS + ".");
    } else if (opts.requireJobs && jobs.length < 1) {
      errors.push("Add at least one job before running the analysis.");
    }

    var seenIds = new Set();
    jobs.forEach(function (job, index) {
      var id = toInteger(job.id);
      var deadline = toInteger(job.deadline);
      var profit = toInteger(job.profit);
      var label = isInteger(id) ? "Job " + id : "Job at row " + (index + 1);

      if (!isInteger(id) || id < 1) {
        errors.push(label + ": job ID must be a positive integer.");
      } else if (seenIds.has(id)) {
        errors.push("Job ID " + id + " is duplicated.");
      } else {
        seenIds.add(id);
      }

      if (!isInteger(deadline) || deadline < 1 || (isInteger(numSlots) && deadline > numSlots)) {
        errors.push(
          label + ": deadline must be an integer between 1 and " + (isInteger(numSlots) ? numSlots : "H") + "."
        );
      }

      if (!isInteger(profit) || profit < 1) {
        errors.push(label + ": profit must be a positive integer.");
      }
    });

    if (!Array.isArray(unavailable)) {
      errors.push("Unavailable slots must be a list.");
    } else if (isInteger(numSlots)) {
      var seenSlots = new Set();
      unavailable.forEach(function (slot) {
        var value = toInteger(slot);
        if (!isInteger(value) || value < 1 || value > numSlots) {
          errors.push("Unavailable slot " + slot + " is outside 1.." + numSlots + ".");
        } else if (seenSlots.has(value)) {
          errors.push("Unavailable slot " + value + " is listed more than once.");
        } else {
          seenSlots.add(value);
        }
      });
    }

    return errors;
  }

  /**
   * Parse the official stdin format:
   *   n m k
   *   <k unavailable slots>
   *   <job_id deadline profit> x n
   */
  function parseProblemInput(text) {
    var raw = String(text || "").trim();
    if (!raw) {
      throw new Error("Input is empty. Enter a test case using the required input format.");
    }

    var tokens = raw.split(/\s+/);
    var numbers = tokens.map(function (token) {
      return Number(token);
    });

    if (numbers.some(function (value) { return !isInteger(value); })) {
      throw new Error("Every input value must be an integer.");
    }
    if (numbers.length < 3) {
      throw new Error("The first line must contain n, m and k.");
    }

    var index = 0;
    var n = numbers[index++];
    var m = numbers[index++];
    var k = numbers[index++];

    if (n < 1 || n > MAX_JOBS) throw new Error("n must be between 1 and " + MAX_JOBS + ".");
    if (m < 1 || m > MAX_SLOTS) throw new Error("m must be between 1 and " + MAX_SLOTS + ".");
    if (k < 0 || k > m) throw new Error("k must be between 0 and m.");

    var required = 3 + k + n * 3;
    if (numbers.length < required) {
      throw new Error(
        "Input ended early. Expected " + n + " jobs and " + k + " unavailable slot number(s)."
      );
    }
    if (numbers.length > required) {
      throw new Error("Unexpected extra values after the " + n + " jobs.");
    }

    var unavailable = numbers.slice(index, index + k);
    index += k;

    var seenSlots = new Set();
    unavailable.forEach(function (slot) {
      if (slot < 1 || slot > m) throw new Error("Unavailable slot " + slot + " is outside 1.." + m + ".");
      if (seenSlots.has(slot)) throw new Error("Unavailable slot " + slot + " is duplicated.");
      seenSlots.add(slot);
    });

    var jobs = [];
    var seenIds = new Set();
    for (var jobIndex = 0; jobIndex < n; jobIndex += 1) {
      var id = numbers[index++];
      var deadline = numbers[index++];
      var profit = numbers[index++];

      if (id < 1) throw new Error("Job ID must be a positive integer.");
      if (seenIds.has(id)) throw new Error("Job ID " + id + " is duplicated.");
      seenIds.add(id);

      if (deadline < 1 || deadline > m) {
        throw new Error("Job " + id + ": deadline must be between 1 and " + m + ".");
      }
      if (profit < 1) throw new Error("Job " + id + ": profit must be a positive integer.");

      jobs.push({ id: id, deadline: deadline, profit: profit });
    }

    return {
      numSlots: m,
      unavailable: unavailable.slice().sort(function (a, b) { return a - b; }),
      jobs: jobs
    };
  }

  return {
    MAX_JOBS: MAX_JOBS,
    MAX_SLOTS: MAX_SLOTS,
    sortJobs: sortJobs,
    buildAvailability: buildAvailability,
    runSchedule: runSchedule,
    getRejected: getRejected,
    formatOutput: formatOutput,
    analyze: analyze,
    validateProject: validateProject,
    parseProblemInput: parseProblemInput
  };
});
