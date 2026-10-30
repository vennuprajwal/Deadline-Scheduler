(function () {
  "use strict";

  var A = window.DeadlineScheduler;
  var I = window.Icons;

  if (!A || !I) {
    document.body.innerHTML =
      '<div style="padding:32px;font-family:system-ui;color:#f8fafc;background:#0b1020">The scheduling engine failed to load. Refresh the page to try again.</div>';
    return;
  }

  var STORAGE_KEY = "deadline-scheduler-v2";
  var LEGACY_STORAGE_KEY = "deadline-scheduler-dashboard";
  var THEME_KEY = "deadline-scheduler-theme";
  var SIDEBAR_KEY = "deadline-scheduler-sidebar-collapsed";

  var SAMPLE_ONE = {
    numSlots: 3,
    unavailable: [],
    jobs: [
      { id: 1, deadline: 2, profit: 100 },
      { id: 2, deadline: 1, profit: 19 },
      { id: 3, deadline: 2, profit: 27 },
      { id: 4, deadline: 1, profit: 25 },
      { id: 5, deadline: 3, profit: 15 }
    ]
  };

  var NAV_GROUPS = [
    {
      label: "Workspace",
      items: [
        { route: "overview", label: "Overview", icon: "layout-dashboard" },
        { route: "jobs", label: "Jobs", icon: "briefcase", meta: "jobs" },
        { route: "configuration", label: "Configuration", icon: "sliders", meta: "slots" }
      ]
    },
    {
      label: "Analysis",
      items: [
        { route: "visualization", label: "Visualization", icon: "activity" },
        { route: "critical", label: "Critical slot", icon: "crosshair" },
        { route: "tests", label: "Test cases", icon: "flask", meta: "tests" }
      ]
    },
    {
      label: "Reference",
      items: [
        { route: "complexity", label: "Complexity", icon: "gauge" },
        { route: "documentation", label: "Documentation", icon: "book-open" }
      ]
    }
  ];

  var ROUTE_META = {
    overview: { title: "Overview", group: "Workspace", subtitle: "Baseline schedule and lost-slot risk" },
    jobs: { title: "Jobs", group: "Workspace", subtitle: "Manage the project job set" },
    configuration: { title: "Configuration", group: "Workspace", subtitle: "Time horizon and unavailable slots" },
    visualization: { title: "Visualization", group: "Analysis", subtitle: "Walk through the greedy decisions" },
    critical: { title: "Critical slot", group: "Analysis", subtitle: "Compare the profit loss for every slot" },
    tests: { title: "Test cases", group: "Analysis", subtitle: "Official and edge-case verification" },
    complexity: { title: "Complexity", group: "Reference", subtitle: "Formal running time and space analysis" },
    documentation: { title: "Documentation", group: "Reference", subtitle: "Problem, approach and output contract" }
  };

  var SAMPLE_TESTS = [
    {
      id: "official-1",
      name: "Official sample 1",
      meta: "Problem statement",
      config: {
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
      expected:
        "BASE_PROFIT 142\nBASE_SLOTS 3 1 5\nREJECTED 2 2 4\nCRITICAL_SLOT 1\nLOSS 27\nAFTER_PROFIT 115\nAFTER_SLOTS 0 1 5"
    },
    {
      id: "official-2",
      name: "Official sample 2",
      meta: "Two unavailable slots",
      config: {
        numSlots: 3,
        unavailable: [1, 3],
        jobs: [
          { id: 10, deadline: 1, profit: 50 },
          { id: 20, deadline: 3, profit: 20 },
          { id: 30, deadline: 2, profit: 10 }
        ]
      },
      expected:
        "BASE_PROFIT 20\nBASE_SLOTS 0 20 0\nREJECTED 2 10 30\nCRITICAL_SLOT 2\nLOSS 20\nAFTER_PROFIT 0\nAFTER_SLOTS 0 0 0"
    },
    {
      id: "equal-profit",
      name: "Equal-profit tie break",
      meta: "Deterministic ordering",
      config: {
        numSlots: 2,
        unavailable: [],
        jobs: [
          { id: 2, deadline: 2, profit: 50 },
          { id: 1, deadline: 2, profit: 50 },
          { id: 3, deadline: 1, profit: 50 }
        ]
      },
      expected:
        "BASE_PROFIT 100\nBASE_SLOTS 2 1\nREJECTED 1 3\nCRITICAL_SLOT 1\nLOSS 50\nAFTER_PROFIT 50\nAFTER_SLOTS 0 1"
    },
    {
      id: "all-unavailable",
      name: "No available slots",
      meta: "Zero-slot edge case",
      config: {
        numSlots: 3,
        unavailable: [1, 2, 3],
        jobs: [
          { id: 1, deadline: 1, profit: 10 },
          { id: 2, deadline: 2, profit: 20 }
        ]
      },
      expected:
        "BASE_PROFIT 0\nBASE_SLOTS 0 0 0\nREJECTED 2 1 2\nCRITICAL_SLOT 0\nLOSS 0\nAFTER_PROFIT 0\nAFTER_SLOTS 0 0 0"
    },
    {
      id: "zero-loss",
      name: "Zero-loss candidate",
      meta: "Smallest slot wins",
      config: {
        numSlots: 3,
        unavailable: [],
        jobs: [{ id: 1, deadline: 3, profit: 10 }]
      },
      expected:
        "BASE_PROFIT 10\nBASE_SLOTS 0 0 1\nREJECTED 0\nCRITICAL_SLOT 1\nLOSS 0\nAFTER_PROFIT 10\nAFTER_SLOTS 0 0 1"
    }
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function defaultState() {
    var sample = clone(SAMPLE_ONE);
    sample.projectName = "Lost Slot Study";
    return sample;
  }

  function sanitiseState(raw) {
    if (!raw || typeof raw !== "object") return null;
    var numSlots = Number(raw.numSlots !== undefined ? raw.numSlots : raw.m);
    var jobs = Array.isArray(raw.jobs)
      ? raw.jobs.map(function (job) {
          return {
            id: Number(job && job.id),
            deadline: Number(job && job.deadline),
            profit: Number(job && job.profit)
          };
        })
      : null;
    if (!jobs) return null;
    var unavailable = Array.isArray(raw.unavailable)
      ? Array.from(
          new Set(
            raw.unavailable
              .map(Number)
              .filter(function (slot) {
                return Number.isInteger(slot) && slot >= 1 && slot <= numSlots;
              })
          )
        ).sort(function (a, b) {
          return a - b;
        })
      : [];
    var candidate = {
      projectName:
        typeof raw.projectName === "string" && raw.projectName.trim()
          ? raw.projectName.trim().slice(0, 80)
          : "Untitled project",
      numSlots: numSlots,
      unavailable: unavailable,
      jobs: jobs
    };
    return candidate;
  }

  function loadState() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (saved) {
        var candidate = sanitiseState(JSON.parse(saved));
        if (candidate && A.validateProject(candidate).length === 0) return candidate;
      }
    } catch (error) {
      return defaultState();
    }
    return defaultState();
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      toast("error", "Could not save", "Browser storage is unavailable. Changes will last for this session only.");
    }
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function esc(value) {
    return String(value === undefined || value === null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function icon(name, size, className) {
    return I.icon(name, size, className);
  }

  function number(value) {
    return new Intl.NumberFormat("en-US").format(Number(value) || 0);
  }

  function configKey() {
    return JSON.stringify({
      numSlots: state.numSlots,
      unavailable: state.unavailable,
      jobs: state.jobs
    });
  }

  function getAnalysis() {
    var key = configKey();
    if (!analysisCache || analysisCache.key !== key) {
      analysisCache = { key: key, result: A.analyze(state) };
    }
    return analysisCache.result;
  }

  function getRoute() {
    var raw = window.location.hash.replace(/^#\/?/, "").split("?")[0];
    return Object.prototype.hasOwnProperty.call(ROUTE_META, raw) ? raw : "overview";
  }

  function navigate(route) {
    closeMobileNav();
    if (!Object.prototype.hasOwnProperty.call(ROUTE_META, route)) route = "overview";
    if (getRoute() === route && window.location.hash) {
      renderView();
      return;
    }
    window.location.hash = "#/" + route;
  }

  function configToInput(config) {
    var lines = [config.jobs.length + " " + config.numSlots + " " + config.unavailable.length];
    if (config.unavailable.length) lines.push(config.unavailable.join(" "));
    config.jobs.forEach(function (job) {
      lines.push(job.id + " " + job.deadline + " " + job.profit);
    });
    return lines.join("\n");
  }

  function outputHtml(output) {
    return String(output)
      .split("\n")
      .map(function (line) {
        var match = line.match(/^([A-Z_]+)\s*(.*)$/);
        if (!match) return esc(line);
        return '<span class="out-label">' + esc(match[1]) + "</span>" + (match[2] ? " " + esc(match[2]) : "");
      })
      .join("\n");
  }

  function scheduledLookup(result) {
    var lookup = new Map();
    result.baseline.assignments.forEach(function (jobId, index) {
      if (jobId !== 0) lookup.set(jobId, index + 1);
    });
    return lookup;
  }

  function slotCard(slot, result, options) {
    var opts = options || {};
    var assignedJobId = result.baseline.assignments[slot - 1];
    var job = assignedJobId ? result.jobs.find(function (item) { return item.id === assignedJobId; }) : null;
    var unavailable = result.unavailable.indexOf(slot) !== -1;
    var critical = result.criticalSlot === slot;
    var classes = ["slot-card"];
    if (opts.compact) classes.push("compact");
    if (unavailable) {
      classes.push("is-unavailable");
    } else if (job) {
      classes.push("is-scheduled");
    } else {
      classes.push("is-unused");
    }
    if (critical) classes.push("is-critical");
    var jobLabel = unavailable ? "Lost" : job ? "Job " + job.id : "Open";
    var metaLabel = unavailable
      ? "Unavailable"
      : job
        ? "Deadline " + job.deadline + " · Profit " + number(job.profit)
        : "No job assigned";
    var stateLabel = critical ? "Critical slot" : unavailable ? "Blocked" : job ? "Scheduled" : "Unused";
    return (
      '<div class="' +
      classes.join(" ") +
      '" title="Slot ' +
      slot +
      ': ' +
      esc(metaLabel) +
      '">' +
      (critical ? '<span class="critical-tag">Critical</span>' : "") +
      '<span class="slot-no">Slot ' +
      slot +
      "</span>" +
      '<span class="slot-job">' +
      esc(jobLabel) +
      "</span>" +
      '<span class="slot-meta">' +
      esc(metaLabel) +
      "</span>" +
      '<span class="slot-state">' +
      esc(stateLabel) +
      "</span>" +
      "</div>"
    );
  }

  function timeline(result, compact) {
    var cards = [];
    for (var slot = 1; slot <= result.numSlots; slot += 1) {
      cards.push(slotCard(slot, result, { compact: compact }));
    }
    return '<div class="timeline-grid">' + cards.join("") + "</div>";
  }

  function legend() {
    return (
      '<div class="legend">' +
      '<span class="legend-item"><span class="legend-swatch scheduled"></span>Scheduled</span>' +
      '<span class="legend-item"><span class="legend-swatch unused"></span>Unused</span>' +
      '<span class="legend-item"><span class="legend-swatch unavailable"></span>Unavailable</span>' +
      '<span class="legend-item"><span class="legend-swatch critical"></span>Critical</span>' +
      "</div>"
    );
  }

  function emptyState(iconName, title, message) {
    return (
      '<div class="empty-state">' +
      '<span class="empty-icon">' +
      icon(iconName, 20) +
      "</span><h3>" +
      esc(title) +
      "</h3><p>" +
      esc(message) +
      "</p></div>"
    );
  }

  function navMeta(item) {
    if (item.meta === "jobs") return state.jobs.length + " jobs";
    if (item.meta === "slots") return state.numSlots + "H";
    if (item.meta === "tests") return SAMPLE_TESTS.length + " cases";
    return "";
  }

  function renderNav() {
    var route = getRoute();
    var html = NAV_GROUPS.map(function (group) {
      var items = group.items
        .map(function (item) {
          var active = item.route === route;
          return (
            '<a class="nav-item' +
            (active ? " active" : "") +
            '" href="#/' +
            item.route +
            '" data-route="' +
            item.route +
            '" title="' +
            esc(item.label) +
            '"' +
            (active ? ' aria-current="page"' : "") +
            ">" +
            '<span class="nav-icon">' +
            icon(item.icon, 17) +
            "</span>" +
            '<span class="nav-text">' +
            esc(item.label) +
            "</span>" +
            (item.meta ? '<span class="nav-meta">' + esc(navMeta(item)) + "</span>" : "") +
            "</a>"
          );
        })
        .join("");
      return (
        '<div class="nav-group"><div class="nav-label">' +
        esc(group.label) +
        "</div>" +
        items +
        "</div>"
      );
    }).join("");
    byId("sidebarNav").innerHTML = html;
  }

  function renderTopbar() {
    var route = getRoute();
    var meta = ROUTE_META[route];
    byId("pageTitle").textContent = meta.title;
    byId("breadcrumb").innerHTML =
      esc(meta.group) + '<span class="sep">/</span>' + esc(meta.title);
    byId("buildChip").textContent = state.numSlots + " slots · " + state.jobs.length + " jobs";
    document.title = meta.title + " — Deadline Scheduler";
    updateThemeIcon();
  }

  function updateThemeIcon() {
    var theme = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    byId("themeIcon").innerHTML = icon(theme === "dark" ? "sun" : "moon", 17);
  }

  function paintShellIcons() {
    byId("brandMark").innerHTML = icon("calendar", 20);
    byId("sidebarCloseIcon").innerHTML = icon("x", 16);
    byId("mobileMenuIcon").innerHTML = icon("menu", 18);
    byId("collapseIcon").innerHTML = icon("panel-left", 14);
    byId("resetIcon").innerHTML = icon("rotate-ccw", 15);
    byId("runIcon").innerHTML = icon("zap", 15);
    updateThemeIcon();
  }

  function renderView() {
    var route = getRoute();
    renderTopbar();
    renderNav();
    var container = byId("view");
    var renderer = PAGE_RENDERERS[route];
    var content;
    try {
      content = renderer(getAnalysis());
    } catch (error) {
      content =
        '<div class="card"><div class="card-body">' +
        emptyState("alert", "Something went wrong", "The view could not be rendered. Refresh the page or reset the simulation.")
        .replace("</div>", "</div>") +
        "</div></div>";
      if (window.console) window.console.error(error);
    }
    container.innerHTML = content;
    if (route !== "visualization") pauseVizPlayback(false);
  }

  function showModal(options) {
    var modalRoot = byId("modalRoot");
    modalRoot.innerHTML =
      '<div class="modal-overlay" data-modal-overlay>' +
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">' +
      '<div class="modal-header"><div><div class="modal-title" id="modalTitle">' +
      esc(options.title) +
      "</div>" +
      (options.subtitle ? '<div class="modal-subtitle">' + esc(options.subtitle) + "</div>" : "") +
      '</div><button class="icon-btn" type="button" data-action="close-modal" aria-label="Close dialog">' +
      icon("x", 16) +
      "</button></div>" +
      '<div class="modal-body" id="modalBody">' +
      (options.body || "") +
      "</div>" +
      (options.footer ? '<div class="modal-footer">' + options.footer + "</div>" : "") +
      "</div></div>";
    document.body.classList.add("modal-open");
    var focusTarget = modalRoot.querySelector("input, select, textarea, button");
    if (focusTarget) window.setTimeout(function () { focusTarget.focus(); }, 0);
  }

  function closeModal() {
    byId("modalRoot").innerHTML = "";
    document.body.classList.remove("modal-open");
  }

  function modalError(message) {
    var body = byId("modalBody");
    if (!body) return;
    var existing = body.querySelector(".modal-error");
    if (existing) existing.remove();
    body.insertAdjacentHTML(
      "afterbegin",
      '<div class="modal-error">' + icon("alert", 15) + "<span>" + esc(message) + "</span></div>"
    );
  }

  function toast(type, title, message) {
    var root = byId("toastRoot");
    var id = "toast-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    var iconName = type === "success" ? "check-circle" : type === "error" ? "alert" : type === "warning" ? "alert" : "info";
    root.insertAdjacentHTML(
      "beforeend",
      '<div class="toast ' +
        esc(type) +
        '" id="' +
        id +
        '"><span class="toast-icon">' +
        icon(iconName, 17) +
        '</span><div class="toast-body"><div class="toast-title">' +
        esc(title) +
        '</div><div class="toast-message">' +
        esc(message || "") +
        '</div></div><button class="toast-close" type="button" data-action="close-toast" data-target="' +
        id +
        '" aria-label="Dismiss notification">' +
        icon("x", 14) +
        "</button></div>"
    );
    var element = byId(id);
    window.setTimeout(function () {
      if (element && element.parentNode) element.parentNode.removeChild(element);
    }, type === "error" ? 7200 : 4600);
  }

  function copyText(text, successTitle) {
    function done() {
      toast("success", successTitle || "Copied", "The text is on your clipboard.");
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text, done); });
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    try {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "readonly");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
      done();
    } catch (error) {
      toast("error", "Copy failed", "Select the text and copy it manually.");
    }
  }

  function downloadFile(filename, text, mime) {
    var blob = new Blob([text], { type: mime || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }

  function showValidationErrors(errors) {
    showModal({
      title: "Configuration needs attention",
      subtitle: errors.length + (errors.length === 1 ? " issue must be fixed." : " issues must be fixed."),
      body:
        '<div class="modal-error">' +
        icon("alert", 15) +
        "<span>Fix the following before running the analysis.</span></div>" +
        '<div class="explanation-box"><ul>' +
        errors.map(function (error) { return "<li>" + esc(error) + "</li>"; }).join("") +
        "</ul></div>",
      footer:
        '<button class="btn" type="button" data-action="close-modal">Close</button>' +
        '<button class="btn btn-primary" type="button" data-route="configuration">Open configuration</button>'
    });
  }

  function runAnalysis() {
    var errors = A.validateProject(state, { requireJobs: true });
    if (errors.length) {
      showValidationErrors(errors);
      return;
    }
    var result = getAnalysis();
    persist();
    renderView();
    toast(
      "success",
      "Analysis complete",
      "Base profit " + number(result.baseline.profit) + " · critical slot " + (result.criticalSlot || "none") + "."
    );
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    var next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem(THEME_KEY, next); } catch (error) { /* ignored */ }
    updateThemeIcon();
  }

  function openMobileNav() {
    byId("appShell").classList.add("mobile-nav-open");
  }

  function closeMobileNav() {
    byId("appShell").classList.remove("mobile-nav-open");
  }

  function toggleSidebar() {
    var shell = byId("appShell");
    var collapsed = shell.classList.toggle("sidebar-collapsed");
    try { localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0"); } catch (error) { /* ignored */ }
    var button = document.querySelector('[data-action="toggle-sidebar"]');
    if (button) button.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
  }

  function openResetModal() {
    showModal({
      title: "Reset simulation",
      subtitle: "Restore the starter sample and clear local changes.",
      body:
        '<p class="muted">This replaces the current project with the five-job starter sample. Your saved theme and sidebar preference are kept.</p>',
      footer:
        '<button class="btn" type="button" data-action="close-modal">Cancel</button>' +
        '<button class="btn btn-danger" type="button" data-action="confirm-reset">' +
        icon("rotate-ccw", 15) +
        "Reset simulation</button>"
    });
  }

  function confirmReset() {
    state = defaultState();
    analysisCache = null;
    ui.jobSearch = "";
    ui.jobStatus = "all";
    ui.jobSort = "profit-desc";
    ui.vizIndex = 0;
    ui.testResults = {};
    ui.inspectedSlot = null;
    pauseVizPlayback(false);
    persist();
    closeModal();
    renderView();
    toast("success", "Simulation reset", "The starter sample has been restored.");
  }

  var state = loadState();
  var analysisCache = null;
  var ui = {
    jobSearch: "",
    jobStatus: "all",
    jobSort: "profit-desc",
    vizIndex: 0,
    vizPlaying: false,
    vizSpeed: 900,
    vizTimer: null,
    testResults: {},
    inspectedSlot: null
  };

  function handleAction(action, element, event) {
    switch (action) {
      case "toggle-theme":
        toggleTheme();
        break;
      case "toggle-sidebar":
        toggleSidebar();
        break;
      case "open-sidebar":
        openMobileNav();
        break;
      case "close-sidebar":
        closeMobileNav();
        break;
      case "reset-simulation":
        openResetModal();
        break;
      case "confirm-reset":
        confirmReset();
        break;
      case "run-analysis":
        runAnalysis();
        break;
      case "close-modal":
        closeModal();
        break;
      case "close-toast":
        var target = byId(element.getAttribute("data-target"));
        if (target && target.parentNode) target.parentNode.removeChild(target);
        break;
      case "add-job":
        openJobModal(null);
        break;
      case "edit-job":
        openJobModal(Number(element.getAttribute("data-index")));
        break;
      case "delete-job":
        openDeleteModal(Number(element.getAttribute("data-index")));
        break;
      case "confirm-delete":
        confirmDeleteJob(Number(element.getAttribute("data-index")));
        break;
      case "sort-jobs":
        ui.jobSort = element.getAttribute("data-sort");
        renderView();
        break;
      case "clear-job-search":
        ui.jobSearch = "";
        renderView();
        break;
      case "toggle-slot":
        toggleSlot(Number(element.getAttribute("data-slot")));
        break;
      case "apply-configuration":
        submitConfigForm();
        break;
      case "load-import":
        loadImport();
        break;
      case "load-sample-2":
        loadSampleTwo();
        break;
      case "copy-output":
        copyText(getAnalysis().output, "Output copied");
        break;
      case "download-output":
        downloadFile("deadline-scheduler-output.txt", getAnalysis().output + "\n");
        break;
      case "copy-input":
        copyText(configToInput(state) + "\n", "Input copied");
        break;
      case "download-docs":
        downloadFile("deadline-scheduler-documentation.md", documentationMarkdown(), "text/markdown;charset=utf-8");
        break;
      case "viz-prev":
        pauseVizPlayback(true);
        stepViz(-1);
        break;
      case "viz-next":
        pauseVizPlayback(true);
        stepViz(1);
        break;
      case "viz-restart":
        pauseVizPlayback(true);
        ui.vizIndex = 0;
        renderView();
        break;
      case "viz-play":
        toggleVizPlayback();
        break;
      case "run-test":
        runSingleTest(element.getAttribute("data-test"));
        break;
      case "run-all-tests":
        runAllTests();
        break;
      case "inspect-candidate":
        ui.inspectedSlot = Number(element.getAttribute("data-slot"));
        renderView();
        break;
      case "use-baseline":
        ui.inspectedSlot = null;
        renderView();
        break;
      default:
        break;
    }
    if (event) event.preventDefault();
  }

  function submitJobForm() {
    var form = byId("jobForm");
    if (!form) return;
    var index = Number(form.getAttribute("data-index"));
    var candidate = {
      id: Number(byId("jobIdInput").value),
      deadline: Number(byId("jobDeadlineInput").value),
      profit: Number(byId("jobProfitInput").value)
    };
    var jobs = state.jobs.slice();
    if (Number.isInteger(index) && index >= 0 && index < jobs.length) {
      jobs[index] = candidate;
    } else {
      jobs.push(candidate);
    }
    var errors = A.validateProject(
      { numSlots: state.numSlots, unavailable: state.unavailable, jobs: jobs },
      { requireJobs: true }
    );
    if (errors.length) {
      modalError(errors[0]);
      return;
    }
    state.jobs = jobs;
    analysisCache = null;
    persist();
    closeModal();
    renderView();
    toast("success", index >= 0 ? "Job updated" : "Job added", "Job " + candidate.id + " is ready for analysis.");
  }

  function submitConfigForm() {
    var nameInput = byId("projectNameInput");
    var slotInput = byId("numSlotsInput");
    if (!nameInput || !slotInput) return;
    var nextSlots = Number(slotInput.value);
    if (!Number.isInteger(nextSlots) || nextSlots < 1 || nextSlots > A.MAX_SLOTS) {
      toast("error", "Invalid time horizon", "H must be an integer between 1 and " + A.MAX_SLOTS + ".");
      slotInput.focus();
      return;
    }
    state.projectName = nameInput.value.trim().slice(0, 80) || "Untitled project";
    state.numSlots = nextSlots;
    state.unavailable = state.unavailable.filter(function (slot) { return slot <= nextSlots; });
    state.jobs = state.jobs.map(function (job) {
      return job.deadline > nextSlots ? { id: job.id, deadline: nextSlots, profit: job.profit } : job;
    });
    analysisCache = null;
    persist();
    renderView();
    toast("success", "Configuration saved", "The horizon is now " + nextSlots + " slot" + (nextSlots === 1 ? "" : "s") + ".");
  }

  function loadImport() {
    var area = byId("importText");
    if (!area) return;
    try {
      var parsed = A.parseProblemInput(area.value);
      state.numSlots = parsed.numSlots;
      state.unavailable = parsed.unavailable;
      state.jobs = parsed.jobs;
      analysisCache = null;
      persist();
      closeModal();
      navigate("overview");
      renderView();
      toast("success", "Input loaded", parsed.jobs.length + " jobs across " + parsed.numSlots + " slots.");
    } catch (error) {
      modalError(error.message || "The input could not be parsed.");
    }
  }

  function loadSampleTwo() {
    var sample = SAMPLE_TESTS[1].config;
    state.numSlots = sample.numSlots;
    state.unavailable = sample.unavailable.slice();
    state.jobs = clone(sample.jobs);
    state.projectName = "Unavailable Slots Study";
    analysisCache = null;
    persist();
    renderView();
    toast("success", "Sample loaded", "Official sample 2 is now the active project.");
  }

  document.addEventListener("click", function (event) {
    if (event.target && event.target.classList && event.target.classList.contains("modal-overlay")) {
      closeModal();
      return;
    }
    var routeTarget = event.target.closest("[data-route]");
    if (routeTarget) {
      event.preventDefault();
      navigate(routeTarget.getAttribute("data-route"));
      return;
    }
    var actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) return;
    handleAction(actionTarget.getAttribute("data-action"), actionTarget, event);
  });

  document.addEventListener("input", function (event) {
    var target = event.target;
    if (!target || !target.id) return;
    if (target.id === "jobSearch") {
      ui.jobSearch = target.value;
      refreshJobsTable();
    }
    if (target.id === "projectNameInput") {
      state.projectName = target.value.trim().slice(0, 80) || "Untitled project";
    }
  });

  document.addEventListener("change", function (event) {
    var target = event.target;
    if (!target || !target.id) return;
    if (target.id === "jobStatusFilter") {
      ui.jobStatus = target.value;
      renderView();
    }
    if (target.id === "vizSpeed") {
      ui.vizSpeed = Number(target.value) || 900;
      if (ui.vizPlaying) {
        pauseVizPlayback(false);
        startVizPlayback();
      }
    }
  });

  document.addEventListener("submit", function (event) {
    if (event.target.id === "jobForm") {
      event.preventDefault();
      submitJobForm();
    }
    if (event.target.id === "configForm") {
      event.preventDefault();
      submitConfigForm();
    }
    if (event.target.id === "importForm") {
      event.preventDefault();
      loadImport();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      if (byId("modalRoot").innerHTML) closeModal();
      closeMobileNav();
    }
  });

  window.addEventListener("hashchange", function () {
    closeMobileNav();
    if (getRoute() !== "visualization") pauseVizPlayback(false);
    renderView();
  });

  window.addEventListener("keydown", function (event) {
    if (getRoute() !== "visualization" || !byId("view")) return;
    var tag = event.target && event.target.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      pauseVizPlayback(true);
      stepViz(1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      pauseVizPlayback(true);
      stepViz(-1);
    }
    if (event.key === " ") {
      event.preventDefault();
      toggleVizPlayback();
    }
  });

  function init() {
    paintShellIcons();
    try {
      if (localStorage.getItem(SIDEBAR_KEY) === "1") byId("appShell").classList.add("sidebar-collapsed");
    } catch (error) { /* ignored */ }
    if (!window.location.hash) {
      window.history.replaceState(null, "", "#/overview");
    }
    renderView();
  }

  function assignmentsTimeline(result, assignments, options) {
    var opts = options || {};
    var lostSlot = Number(opts.criticalSlot) || 0;
    var cards = [];
    for (var slot = 1; slot <= result.numSlots; slot += 1) {
      var jobId = assignments[slot - 1] || 0;
      var job = jobId
        ? result.jobs.find(function (item) {
            return item.id === jobId;
          })
        : null;
      var unavailable = result.unavailable.indexOf(slot) !== -1 || slot === lostSlot;
      var classes = ["slot-card", "compact"];
      if (unavailable) classes.push("is-unavailable");
      else if (job) classes.push("is-scheduled");
      else classes.push("is-unused");
      if (slot === lostSlot) classes.push("is-critical");
      var jobLabel = unavailable ? "Lost" : job ? "Job " + job.id : "Open";
      var metaLabel = unavailable
        ? slot === lostSlot
          ? "Removed for this test"
          : "Unavailable"
        : job
          ? "Deadline " + job.deadline + " · Profit " + number(job.profit)
          : "No job assigned";
      var stateLabel = slot === lostSlot ? "Critical slot" : unavailable ? "Blocked" : job ? "Scheduled" : "Unused";
      cards.push(
        '<div class="' +
          classes.join(" ") +
          '">' +
          (slot === lostSlot ? '<span class="critical-tag">Lost</span>' : "") +
          '<span class="slot-no">Slot ' +
          slot +
          "</span>" +
          '<span class="slot-job">' +
          esc(jobLabel) +
          "</span>" +
          '<span class="slot-meta">' +
          esc(metaLabel) +
          "</span>" +
          '<span class="slot-state">' +
          esc(stateLabel) +
          "</span></div>"
      );
    }
    return '<div class="timeline-grid">' + cards.join("") + "</div>";
  }

  function renderOverview(result) {
    var baseline = result.baseline;
    var scheduled = baseline.assignments.filter(Boolean).length;
    var rejected = baseline.rejected.length;
    var coverage = result.jobs.length ? Math.round((scheduled / result.jobs.length) * 100) : 0;
    var criticalJobId = result.criticalSlot ? baseline.assignments[result.criticalSlot - 1] : 0;
    var criticalJob = criticalJobId
      ? result.jobs.find(function (job) {
          return job.id === criticalJobId;
        })
      : null;
    var afterWidth = baseline.profit ? Math.round((result.afterProfit / baseline.profit) * 100) : 0;
    var riskClass = result.loss > 0 ? "warning" : "success";
    var hasJobs = result.jobs.length > 0;

    return (
      '<div class="page-stack">' +
      '<section class="section-heading"><div><h2>Algorithm control room</h2>' +
      "<p>Run a deterministic greedy schedule, then audit every available slot for profit risk.</p></div>" +
      '<div class="card-actions">' +
      '<button class="btn" type="button" data-route="visualization">' +
      icon("activity", 15) +
      "Visualize" +
      "</button>" +
      '<button class="btn btn-primary" type="button" data-action="run-analysis">' +
      icon("zap", 15) +
      "Run analysis" +
      "</button></div></section>" +
      '<div class="kpi-grid">' +
      '<div class="kpi-card"><div class="kpi-label">' +
      icon("circle-dollar", 14) +
      "Base profit</div><div class=\"kpi-value\">" +
      number(baseline.profit) +
      '</div><div class="kpi-hint">Optimal greedy total for the current horizon</div></div>' +
      '<div class="kpi-card success"><div class="kpi-label">' +
      icon("check-circle", 14) +
      "Scheduled jobs</div><div class=\"kpi-value\">" +
      scheduled +
      " / " +
      result.jobs.length +
      '</div><div class="kpi-hint">' +
      coverage +
      "% of jobs accepted into the baseline</div></div>" +
      '<div class="kpi-card critical"><div class="kpi-label">' +
      icon("x-circle", 14) +
      "Rejected jobs</div><div class=\"kpi-value\">" +
      rejected +
      '</div><div class="kpi-hint">' +
      (rejected ? "Unscheduled after the greedy pass" : "Every job fits in the current horizon") +
      "</div></div>" +
      '<div class="kpi-card ' +
      riskClass +
      '"><div class="kpi-label">' +
      icon("crosshair", 14) +
      "Critical slot</div><div class=\"kpi-value\">" +
      (result.criticalSlot || "None") +
      '</div><div class="kpi-hint">' +
      (result.loss > 0 ? "Losing it costs " + number(result.loss) + " profit" : "No available slot reduces profit") +
      "</div></div></div>" +
      '<div class="grid-2-1">' +
      '<div class="card"><div class="card-header"><div class="card-title-group"><div class="card-title">' +
      icon("calendar", 15) +
      "Baseline schedule</div><div class=\"card-subtitle\">Latest-slot greedy allocation for " +
      result.numSlots +
      " time slots.</div></div>" +
      '<div class="card-actions"><span class="badge success"><span class="dot"></span>' +
      number(baseline.profit) +
      " profit</span></div></div>" +
      '<div class="card-body">' +
      (hasJobs ? timeline(result, false) : emptyState("briefcase", "No jobs yet", "Add a job to start building the baseline schedule.")) +
      '<div style="margin-top:14px">' +
      legend() +
      "</div></div></div>" +
      '<div class="card"><div class="card-header"><div class="card-title-group"><div class="card-title">' +
      icon("trending-down", 15) +
      "Lost-slot exposure</div><div class=\"card-subtitle\">The available slot whose removal hurts most.</div></div>" +
      '<span class="badge ' +
      (result.loss > 0 ? "warning" : "success") +
      '">' +
      (result.loss > 0 ? "Risk detected" : "Stable") +
      "</span></div><div class=\"card-body\">" +
      '<div class="metric-strip" style="grid-template-columns:repeat(2,minmax(0,1fr))">' +
      '<div class="metric-tile ' +
      (result.loss > 0 ? "warning" : "success") +
      '"><div class="label">Profit at risk</div><div class="value">' +
      number(result.loss) +
      '</div></div><div class="metric-tile"><div class="label">After-loss profit</div><div class="value">' +
      number(result.afterProfit) +
      "</div></div></div>" +
      '<div class="compare-row" style="margin-top:15px"><span class="compare-label">Baseline</span>' +
      '<div class="progress"><div class="progress-fill success" style="width:100%"></div></div>' +
      '<span class="compare-value">' +
      number(baseline.profit) +
      "</span></div>" +
      '<div class="compare-row"><span class="compare-label">After loss</span>' +
      '<div class="progress"><div class="progress-fill warning" style="width:' +
      afterWidth +
      '%"></div></div><span class="compare-value">' +
      number(result.afterProfit) +
      "</span></div>" +
      '<div class="callout ' +
      (result.loss > 0 ? "warning" : "") +
      '" style="margin-top:15px">' +
      icon(result.loss > 0 ? "alert" : "info", 16) +
      "<div>" +
      (result.criticalSlot
        ? "<b>Slot " +
          result.criticalSlot +
          "</b> is critical" +
          (criticalJob ? " because it carries job " + criticalJob.id + "." : " in the current baseline.")
        : "<b>No slot is critical.</b> No available slot can be removed.") +
      (result.loss > 0
        ? " Rebuilding after its loss leaves <b>" + number(result.afterProfit) + "</b> profit."
        : " The schedule is unaffected by any single-slot loss.") +
      "</div></div>" +
      (result.criticalSlot
        ? '<div class="viz-section-label" style="margin-top:15px"><span>After-loss schedule</span><span>Slot ' +
          result.criticalSlot +
          " removed</span></div>" +
          assignmentsTimeline(result, result.afterAssignments, { criticalSlot: result.criticalSlot })
        : "") +
      "</div></div></div>" +
      '<div class="grid-2-1">' +
      '<div class="card console-card"><div class="console-head"><div class="console-title">' +
      '<span class="console-lights"><i></i><i></i><i></i></span>' +
      icon("terminal", 14) +
      "stdout · deterministic output</div>" +
      '<div class="console-actions">' +
      '<button class="icon-btn" type="button" data-action="copy-output" title="Copy output" aria-label="Copy output">' +
      icon("copy", 14) +
      '</button><button class="icon-btn" type="button" data-action="download-output" title="Download output" aria-label="Download output">' +
      icon("download", 14) +
      "</button></div></div>" +
      '<pre class="output-console">' +
      outputHtml(result.output) +
      "</pre></div>" +
      '<div class="card"><div class="card-header"><div class="card-title-group"><div class="card-title">' +
      icon("layers", 15) +
      "Project snapshot</div><div class=\"card-subtitle\">" +
      esc(state.projectName) +
      "</div></div></div><div class=\"card-body\">" +
      '<div class="mini-kpis">' +
      '<div class="mini-kpi"><div class="k">Time horizon</div><div class="v">' +
      result.numSlots +
      "H</div></div>" +
      '<div class="mini-kpi"><div class="k">Jobs</div><div class="v">' +
      result.jobs.length +
      "</div></div>" +
      '<div class="mini-kpi"><div class="k">Unavailable</div><div class="v">' +
      result.unavailable.length +
      "</div></div>" +
      '<div class="mini-kpi"><div class="k">Slots tested</div><div class="v">' +
      result.candidates.length +
      "</div></div></div>" +
      '<div class="form-note">' +
      icon("info", 15) +
      "<span>Critical-slot testing covers every originally available slot, including slots that are empty in the baseline.</span></div>" +
      '<div class="card-actions" style="margin-top:15px;justify-content:flex-start;flex-wrap:wrap">' +
      '<button class="btn btn-sm" type="button" data-route="critical">' +
      icon("crosshair", 14) +
      "Inspect all candidates</button>" +
      '<button class="btn btn-sm" type="button" data-route="jobs">' +
      icon("briefcase", 14) +
      "Manage jobs</button></div></div></div></div></div>"
    );
  }

  function sortControl(label, field) {
    var active = ui.jobSort.indexOf(field) === 0;
    var descending = ui.jobSort === field + "-desc";
    var next = active && descending ? field + "-asc" : field + "-desc";
    return (
      '<button class="sort-btn' +
      (active ? " active" : "") +
      '" type="button" data-action="sort-jobs" data-sort="' +
      next +
      '">' +
      esc(label) +
      icon(active ? (descending ? "arrow-down" : "arrow-up") : "arrow-up-down", 12) +
      "</button>"
    );
  }

  function filteredJobs(result) {
    var lookup = scheduledLookup(result);
    var query = ui.jobSearch.trim().toLowerCase();
    var rows = state.jobs.map(function (job, index) {
      return { job: job, index: index, slot: lookup.get(job.id) || 0 };
    });
    rows = rows.filter(function (row) {
      if (ui.jobStatus === "scheduled" && !row.slot) return false;
      if (ui.jobStatus === "rejected" && row.slot) return false;
      if (!query) return true;
      return (
        String(row.job.id).indexOf(query) !== -1 ||
        String(row.job.deadline).indexOf(query) !== -1 ||
        String(row.job.profit).indexOf(query) !== -1
      );
    });
    rows.sort(function (a, b) {
      if (ui.jobSort === "profit-asc") return a.job.profit - b.job.profit || a.job.id - b.job.id;
      if (ui.jobSort === "id-asc") return a.job.id - b.job.id;
      if (ui.jobSort === "id-desc") return b.job.id - a.job.id;
      if (ui.jobSort === "deadline-asc") return a.job.deadline - b.job.deadline || a.job.id - b.job.id;
      if (ui.jobSort === "deadline-desc") return b.job.deadline - a.job.deadline || a.job.id - b.job.id;
      return b.job.profit - a.job.profit || a.job.id - b.job.id;
    });
    return rows;
  }

  function jobRowsHtml(rows) {
    if (!rows.length) {
      return (
        '<tr><td colspan="5"><div class="empty-state"><span class="empty-icon">' +
        icon("search", 20) +
        "</span><h3>No matching jobs</h3><p>Adjust the search or status filter, or add a new job.</p></div></td></tr>"
      );
    }
    return rows
      .map(function (row) {
        var job = row.job;
        var status = row.slot
          ? '<span class="badge success"><span class="dot"></span>Scheduled · slot ' + row.slot + "</span>"
          : '<span class="badge critical"><span class="dot"></span>Rejected</span>';
        return (
          '<tr><td class="cell-id">Job ' +
          job.id +
          '</td><td class="cell-num">' +
          job.deadline +
          '</td><td class="cell-num">' +
          number(job.profit) +
          "</td><td>" +
          status +
          '</td><td><div class="row-actions">' +
          '<button class="icon-btn" type="button" data-action="edit-job" data-index="' +
          row.index +
          '" title="Edit job" aria-label="Edit job ' +
          job.id +
          '">' +
          icon("pencil", 14) +
          '</button><button class="icon-btn danger" type="button" data-action="delete-job" data-index="' +
          row.index +
          '" title="Delete job" aria-label="Delete job ' +
          job.id +
          '">' +
          icon("trash-2", 14) +
          "</button></div></td></tr>"
        );
      })
      .join("");
  }

  function refreshJobsTable() {
    var tbody = byId("jobsTableBody");
    if (!tbody) return;
    var rows = filteredJobs(getAnalysis());
    tbody.innerHTML = jobRowsHtml(rows);
    var count = byId("jobsResultCount");
    if (count) count.textContent = rows.length + " of " + state.jobs.length + " jobs";
  }

  function renderJobs(result) {
    var rows = filteredJobs(result);
    return (
      '<div class="page-stack"><section class="section-heading"><div><h2>Project jobs</h2>' +
      "<p>Each job takes one slot and must finish at or before its deadline. Higher profit wins ties by job ID.</p></div>" +
      '<div class="card-actions"><button class="btn" type="button" data-route="configuration">' +
      icon("sliders", 15) +
      "Configuration</button>" +
      '<button class="btn btn-primary" type="button" data-action="add-job">' +
      icon("plus", 15) +
      "Add job</button></div></section>" +
      '<div class="card"><div class="table-toolbar"><div class="toolbar-controls">' +
      '<div class="input-group"><span class="input-icon">' +
      icon("search", 15) +
      '</span><input class="input" id="jobSearch" type="search" placeholder="Search by ID, deadline or profit" value="' +
      esc(ui.jobSearch) +
      '" aria-label="Search jobs" /></div>' +
      '<select class="select" id="jobStatusFilter" aria-label="Filter by status">' +
      '<option value="all"' +
      (ui.jobStatus === "all" ? " selected" : "") +
      ">All jobs</option>" +
      '<option value="scheduled"' +
      (ui.jobStatus === "scheduled" ? " selected" : "") +
      ">Scheduled</option>" +
      '<option value="rejected"' +
      (ui.jobStatus === "rejected" ? " selected" : "") +
      ">Rejected</option></select></div>" +
      '<span class="badge neutral" id="jobsResultCount">' +
      rows.length +
      " of " +
      state.jobs.length +
      " jobs</span></div>" +
      '<div class="table-wrap"><table class="data-table"><thead><tr>' +
      "<th>" +
      sortControl("Job", "id") +
      "</th><th>" +
      sortControl("Deadline", "deadline") +
      "</th><th>" +
      sortControl("Profit", "profit") +
      "</th><th>Status</th><th></th>" +
      '</tr></thead><tbody id="jobsTableBody">' +
      jobRowsHtml(rows) +
      "</tbody></table></div>" +
      '<div class="card-footer"><span class="muted">' +
      state.jobs.length +
      " jobs · " +
      result.numSlots +
      ' slots</span><span class="faint">Deadline range 1..' +
      result.numSlots +
      "</span></div></div>" +
      '<div class="grid-2"><div class="card"><div class="card-header"><div class="card-title-group"><div class="card-title">' +
      icon("check-circle", 15) +
      "Scheduling rules</div></div></div><div class=\"card-body prose\">" +
      "<p>Jobs are ordered by <strong>profit descending</strong>, then <strong>job ID ascending</strong>. Each job claims the latest free slot at or before its deadline.</p>" +
      "<ul><li>Job IDs must be unique positive integers.</li><li>Deadlines must be in 1..H.</li><li>Profit must be a positive integer.</li><li>The project accepts up to " +
      A.MAX_JOBS +
      " jobs and " +
      A.MAX_SLOTS +
      " slots.</li></ul></div></div>" +
      '<div class="card"><div class="card-header"><div class="card-title-group"><div class="card-title">' +
      icon("database", 15) +
      "Set summary</div></div></div><div class=\"card-body\">" +
      '<div class="summary-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))">' +
      '<div class="summary-stat"><div class="label">Scheduled</div><div class="value">' +
      result.baseline.assignments.filter(Boolean).length +
      '</div><div class="meta">Jobs in baseline</div></div>' +
      '<div class="summary-stat"><div class="label">Rejected</div><div class="value">' +
      result.baseline.rejected.length +
      '</div><div class="meta">No free slot by deadline</div></div>' +
      '<div class="summary-stat"><div class="label">Base profit</div><div class="value">' +
      number(result.baseline.profit) +
      '</div><div class="meta">Greedy total</div></div>' +
      '<div class="summary-stat"><div class="label">Critical slot</div><div class="value">' +
      (result.criticalSlot || "None") +
      '</div><div class="meta">Loss ' +
      number(result.loss) +
      "</div></div></div></div></div></div></div>"
    );
  }

  function openJobModal(index) {
    var editing = Number.isInteger(index) && index >= 0 && index < state.jobs.length;
    var job = editing ? state.jobs[index] : { id: state.jobs.reduce(function (max, item) { return Math.max(max, item.id); }, 0) + 1, deadline: 1, profit: 10 };
    showModal({
      title: editing ? "Edit job" : "Add job",
      subtitle: "Deadlines are 1-indexed and cannot exceed the current horizon.",
      body:
        '<form id="jobForm" data-index="' +
        (editing ? index : -1) +
        '">' +
        '<div class="field-row"><div class="field"><label for="jobIdInput">Job ID</label>' +
        '<input class="input" id="jobIdInput" type="number" min="1" step="1" value="' +
        job.id +
        '" required /></div>' +
        '<div class="field"><label for="jobDeadlineInput">Deadline</label>' +
        '<input class="input" id="jobDeadlineInput" type="number" min="1" max="' +
        state.numSlots +
        '" step="1" value="' +
        job.deadline +
        '" required /></div></div>' +
        '<div class="field"><label for="jobProfitInput">Profit</label>' +
        '<input class="input" id="jobProfitInput" type="number" min="1" step="1" value="' +
        job.profit +
        '" required /></div>' +
        '<div class="form-note">' +
        icon("info", 15) +
        "<span>A job is scheduled in the latest free slot at or before its deadline. Ties in profit are broken by the smaller job ID.</span></div></form>",
      footer:
        '<button class="btn" type="button" data-action="close-modal">Cancel</button>' +
        '<button class="btn btn-primary" type="submit" form="jobForm">' +
        icon("check", 15) +
        (editing ? "Save changes" : "Add job") +
        "</button>"
    });
  }

  function openDeleteModal(index) {
    var job = state.jobs[index];
    if (!job) return;
    showModal({
      title: "Delete job " + job.id + "?",
      subtitle: "This removes the job from the project and its schedule.",
      body:
        '<div class="callout critical">' +
        icon("alert", 16) +
        "<div><b>Deadline " +
        job.deadline +
        " · Profit " +
        number(job.profit) +
        "</b><br>This action cannot be undone.</div></div>",
      footer:
        '<button class="btn" type="button" data-action="close-modal">Cancel</button>' +
        '<button class="btn btn-danger" type="button" data-action="confirm-delete" data-index="' +
        index +
        '">' +
        icon("trash-2", 15) +
        "Delete job</button>"
    });
  }

  function confirmDeleteJob(index) {
    var job = state.jobs[index];
    if (!job) {
      closeModal();
      return;
    }
    state.jobs.splice(index, 1);
    analysisCache = null;
    persist();
    closeModal();
    renderView();
    toast("success", "Job deleted", "Job " + job.id + " was removed from the project.");
  }

  function renderConfiguration(result) {
    var available = result.numSlots - state.unavailable.length;
    var toggles = [];
    for (var slot = 1; slot <= state.numSlots; slot += 1) {
      var blocked = state.unavailable.indexOf(slot) !== -1;
      toggles.push(
        '<button class="slot-toggle' +
          (blocked ? " active" : "") +
          '" type="button" data-action="toggle-slot" data-slot="' +
          slot +
          '" title="' +
          (blocked ? "Make slot available" : "Mark slot unavailable") +
          '">Slot ' +
          slot +
          "</button>"
      );
    }
    return (
      '<div class="page-stack"><section class="section-heading"><div><h2>Project configuration</h2>' +
      "<p>Set the time horizon, block unavailable slots and import an official input file.</p></div>" +
      '<div class="card-actions"><button class="btn" type="button" data-action="run-analysis">' +
      icon("zap", 15) +
      "Run analysis</button></div></section>" +
      '<div class="grid-2-1"><form class="card" id="configForm"><div class="card-header"><div class="card-title-group"><div class="card-title">' +
      icon("sliders", 15) +
      "Project settings</div><div class=\"card-subtitle\">Changes are validated before they are saved.</div></div></div>" +
      '<div class="card-body"><div class="field"><label for="projectNameInput">Project name</label>' +
      '<input class="input" id="projectNameInput" type="text" maxlength="80" value="' +
      esc(state.projectName) +
      '" placeholder="Untitled project" /></div>' +
      '<div class="field"><label for="numSlotsInput">Time horizon (H)</label>' +
      '<input class="input" id="numSlotsInput" type="number" min="1" max="' +
      A.MAX_SLOTS +
      '" step="1" value="' +
      state.numSlots +
      '" required />' +
      '<span class="field-hint">Between 1 and ' +
      A.MAX_SLOTS +
      " slots. Lowering the horizon clamps deadlines that exceed it and removes out-of-range unavailable slots.</span></div>" +
      '<div class="form-note">' +
      icon("info", 15) +
      "<span>The current schedule uses <b>" +
      state.jobs.length +
      "</b> jobs over <b>" +
      state.numSlots +
      "</b> slots with <b>" +
      state.unavailable.length +
      "</b> unavailable.</span></div>" +
      '<div class="form-actions"><button class="btn btn-primary" type="submit">' +
      icon("check", 15) +
      "Save configuration</button></div></div></form>" +
      '<div class="card"><div class="card-header"><div class="card-title-group"><div class="card-title">' +
      icon("calendar", 15) +
      "Availability map</div><div class=\"card-subtitle\">Click a slot to toggle its availability.</div></div>" +
      '<span class="badge accent">' +
      available +
      " / " +
      state.numSlots +
      " available</span></div>" +
      '<div class="card-body"><div class="checkbox-row">' +
      toggles.join("") +
      "</div>" +
      '<div class="form-note">' +
      icon("alert", 15) +
      "<span>Unavailable slots are skipped during scheduling and are never tested as critical slots.</span></div>" +
      '<div class="summary-grid" style="grid-template-columns:repeat(2,minmax(0,1fr));margin-top:15px">' +
      '<div class="summary-stat"><div class="label">Available</div><div class="value">' +
      available +
      '</div><div class="meta">Candidate loss tests</div></div>' +
      '<div class="summary-stat"><div class="label">Blocked</div><div class="value">' +
      state.unavailable.length +
      '</div><div class="meta">Initially unavailable</div></div></div></div></div></div>' +
      '<div class="card"><div class="card-header"><div class="card-title-group"><div class="card-title">' +
      icon("file-text", 15) +
      "Load a problem input</div><div class=\"card-subtitle\">Paste the official stdin format to replace the active project.</div></div>" +
      '<button class="btn btn-sm" type="button" data-action="load-sample-2">' +
      icon("flask", 14) +
      "Use official sample 2</button></div>" +
      '<div class="card-body"><form id="importForm"><div class="field"><label for="importText">Input data</label>' +
      '<textarea class="textarea" id="importText" placeholder="' +
      esc(configToInput(SAMPLE_TESTS[1].config)) +
      '" spellcheck="false"></textarea>' +
      '<span class="field-hint">First line: n m k. Then k unavailable slot numbers, followed by n lines of job_id deadline profit.</span></div>' +
      '<div class="form-actions"><button class="btn btn-primary" type="submit">' +
      icon("download", 15) +
      "Load input</button></div></form></div></div>" +
      '<div class="card"><div class="card-header"><div class="card-title-group"><div class="card-title">' +
      icon("rotate-ccw", 15) +
      "Reset project</div><div class=\"card-subtitle\">Restore the starter sample and clear local edits.</div></div></div>" +
      '<div class="card-body"><div class="callout warning">' +
      icon("alert", 16) +
      "<div><b>This cannot be undone.</b> The current jobs, horizon and unavailable slots will be replaced by the five-job starter sample.</div></div>" +
      '<div class="form-actions"><button class="btn btn-danger" type="button" data-action="reset-simulation">' +
      icon("rotate-ccw", 15) +
      "Reset simulation</button></div></div></div></div>"
    );
  }

  function toggleSlot(slot) {
    var nameInput = byId("projectNameInput");
    if (nameInput) state.projectName = nameInput.value.trim().slice(0, 80) || "Untitled project";
    var index = state.unavailable.indexOf(slot);
    if (index === -1) state.unavailable.push(slot);
    else state.unavailable.splice(index, 1);
    state.unavailable.sort(function (a, b) {
      return a - b;
    });
    analysisCache = null;
    persist();
    renderView();
  }

  function vizSteps() {
    return getAnalysis().baseline.steps || [];
  }

  function stepViz(delta) {
    var steps = vizSteps();
    if (!steps.length) return;
    ui.vizIndex = Math.max(0, Math.min(steps.length - 1, ui.vizIndex + delta));
    renderView();
  }

  function startVizPlayback() {
    var steps = vizSteps();
    if (!steps.length) return;
    if (ui.vizIndex >= steps.length - 1) ui.vizIndex = 0;
    ui.vizPlaying = true;
    renderView();
    scheduleVizTick();
  }

  function scheduleVizTick() {
    window.clearTimeout(ui.vizTimer);
    ui.vizTimer = window.setTimeout(function () {
      if (!ui.vizPlaying) return;
      var steps = vizSteps();
      if (ui.vizIndex >= steps.length - 1) {
        ui.vizPlaying = false;
        ui.vizTimer = null;
        renderView();
        return;
      }
      ui.vizIndex += 1;
      renderView();
      scheduleVizTick();
    }, ui.vizSpeed);
  }

  function pauseVizPlayback(shouldRender) {
    var wasPlaying = ui.vizPlaying;
    window.clearTimeout(ui.vizTimer);
    ui.vizTimer = null;
    ui.vizPlaying = false;
    if (shouldRender && wasPlaying) renderView();
  }

  function toggleVizPlayback() {
    if (ui.vizPlaying) pauseVizPlayback(true);
    else startVizPlayback();
  }

  function vizSlotStrip(result, step) {
    var cards = [];
    for (var slot = 1; slot <= result.numSlots; slot += 1) {
      var jobId = step.assignments[slot - 1] || 0;
      var job = jobId
        ? result.jobs.find(function (item) {
            return item.id === jobId;
          })
        : null;
      var unavailable = result.unavailable.indexOf(slot) !== -1;
      var check = step.checked.find(function (item) { return item.slot === slot; });
      var selected = step.selectedSlot === slot;
      var classes = ["slot-card", "compact"];
      if (unavailable) classes.push("is-unavailable");
      else if (job) classes.push("is-scheduled");
      else classes.push("is-unused");
      if (selected) classes.push("selected");
      var jobLabel = unavailable ? "Lost" : job ? "Job " + job.id : "Open";
      var stateLabel = selected ? "Selected" : unavailable ? "Blocked" : job ? "Occupied" : "Open";
      var checkLabel = check
        ? check.selected
          ? "Selected by this step"
          : check.filled
            ? "Already occupied"
            : check.available
              ? "Available but not selected"
              : "Unavailable"
        : "Not inspected by this step";
      cards.push(
        '<div class="' +
          classes.join(" ") +
          '" title="Slot ' +
          slot +
          ": " +
          esc(checkLabel) +
          '">' +
          '<span class="slot-no">Slot ' +
          slot +
          "</span>" +
          '<span class="slot-job">' +
          esc(jobLabel) +
          "</span>" +
          '<span class="slot-meta">' +
          (job ? "Profit " + number(job.profit) : unavailable ? "Cannot be used" : "No job yet") +
          "</span>" +
          '<span class="slot-state">' +
          esc(stateLabel) +
          "</span></div>"
      );
    }
    return '<div class="viz-slot-strip">' + cards.join("") + "</div>";
  }

  function vizJobFlow(steps, currentIndex) {
    var result = getAnalysis();
    return result.sortedJobs
      .map(function (job, index) {
        var rowStep = steps[index];
        var classes = ["job-flow-row"];
        var status = "Queued";
        if (index < currentIndex) {
          classes.push("processed");
          if (rowStep && rowStep.selectedSlot) {
            status = "Placed in slot " + rowStep.selectedSlot;
          } else {
            classes.push("rejected-row");
            status = "Rejected";
          }
        } else if (index === currentIndex) {
          classes.push("current");
          status = "Inspecting now";
        }
        return (
          '<div class="' +
          classes.join(" ") +
          '"><span class="job-rank">' +
          (index + 1) +
          '</span><span class="job-flow-id">Job ' +
          job.id +
          '</span><span class="job-flow-num">d=' +
          job.deadline +
          '</span><span class="job-flow-num">p=' +
          number(job.profit) +
          '</span><span class="job-flow-status">' +
          esc(status) +
          "</span></div>"
        );
      })
      .join("");
  }

  function vizChecks(step) {
    if (!step.checked.length) {
      return '<span class="muted">No slot needs to be checked for this job.</span>';
    }
    return step.checked
      .map(function (check) {
        var classes = ["viz-check"];
        var text = "Slot " + check.slot + " · empty";
        if (check.selected) {
          classes.push("selected");
          text = "Slot " + check.slot + " · selected";
        } else if (!check.available) {
          classes.push("unavailable");
          text = "Slot " + check.slot + " · unavailable";
        } else if (check.filled) {
          classes.push("filled");
          text = "Slot " + check.slot + " · occupied";
        }
        return '<span class="' + classes.join(" ") + '">' + esc(text) + "</span>";
      })
      .join("");
  }

  function vizNarrative(step) {
    if (step.rejected) {
      return (
        "Every slot at or before the deadline is unavailable or already occupied, so job " +
        step.job.id +
        " cannot be scheduled. It is added to the rejected set and the profit total stays at " +
        number(step.profit) +
        "."
      );
    }
    return (
      "The scan starts at slot " +
      Math.min(step.job.deadline, getAnalysis().numSlots) +
      " and moves toward slot 1. Slot " +
      step.selectedSlot +
      " is the latest free, available slot, so it is assigned to job " +
      step.job.id +
      ". Earlier slots remain free for jobs with tighter deadlines."
    );
  }

  function renderVisualization(result) {
    var steps = result.baseline.steps || [];
    if (!steps.length) {
      return (
        '<div class="page-stack"><section class="section-heading"><div><h2>Greedy trace</h2>' +
        "<p>Add at least one job to walk through the scheduling decisions.</p></div></section>" +
        '<div class="card"><div class="card-body">' +
        emptyState("briefcase", "No trace available", "The visualization needs at least one job in the project.") +
        "</div></div></div>"
      );
    }
    ui.vizIndex = Math.max(0, Math.min(ui.vizIndex, steps.length - 1));
    var step = steps[ui.vizIndex];
    var atEnd = ui.vizIndex === steps.length - 1;
    var progress = Math.round(((ui.vizIndex + 1) / steps.length) * 100);
    var playIcon = ui.vizPlaying ? "pause" : "play";
    return (
      '<div class="page-stack"><section class="section-heading"><div><h2>Greedy decision trace</h2>' +
      "<p>Step through the sorted job list and watch each deadline scan choose a slot.</p></div>" +
      '<div class="card-actions"><button class="btn" type="button" data-route="critical">' +
      icon("crosshair", 15) +
      "Critical slot</button></div></section>" +
      '<div class="card"><div class="card-body"><div class="viz-topbar">' +
      '<div class="stage-pills"><span class="stage-pill done">' +
      icon("check", 12) +
      'Sort by profit</span><span class="stage-pill ' +
      (atEnd ? "done" : "active") +
      '">Allocate slots</span><span class="stage-pill ' +
      (atEnd ? "active" : "") +
      '">Audit loss</span><span class="stage-pill ' +
      (atEnd ? "active" : "") +
      '">Rebuild</span></div>' +
      '<span class="badge accent">Step ' +
      (ui.vizIndex + 1) +
      " / " +
      steps.length +
      "</span></div></div></div>" +
      '<div class="viz-layout"><div class="card viz-stage"><div class="card-header"><div class="card-title-group"><div class="card-title">' +
      '<span class="stage-index">' +
      (step.jobIndex + 1) +
      "</span>Greedy decision</div><div class=\"card-subtitle\">Job " +
      step.job.id +
      " · deadline " +
      step.job.deadline +
      " · profit " +
      number(step.job.profit) +
      "</div></div>" +
      '<span class="badge ' +
      (step.rejected ? "critical" : "success") +
      '">' +
      (step.rejected ? "Rejected" : "Placed") +
      "</span></div><div class=\"card-body\"><div class=\"viz-canvas\">" +
      '<div><div class="viz-section-label"><span>Schedule snapshot</span><span>Profit ' +
      number(step.profit) +
      "</span></div>" +
      vizSlotStrip(result, step) +
      "</div>" +
      '<div><div class="viz-section-label"><span>Greedy order</span><span>Highest profit first</span></div>' +
      '<div class="job-flow-list">' +
      vizJobFlow(steps, ui.vizIndex) +
      "</div></div></div></div></div>" +
      '<div class="card viz-stage"><div class="card-header"><div class="card-title-group"><div class="card-title">' +
      icon("target", 15) +
      "Decision detail</div><div class=\"card-subtitle\">Why this slot was chosen.</div></div></div>" +
      '<div class="card-body"><div class="vis-explanation">' +
      '<div class="explanation-box"><div class="label">Current job</div><p><b>Job ' +
      step.job.id +
      "</b> needs one slot with deadline ≤ " +
      step.job.deadline +
      ".</p><p>" +
      vizNarrative(step) +
      "</p></div>" +
      '<div class="explanation-box"><div class="label">Slot checks</div><p style="margin-bottom:7px">Searched from the deadline down to slot 1.</p>' +
      '<div class="viz-check-list">' +
      vizChecks(step) +
      "</div></div>" +
      '<div class="mini-kpis"><div class="mini-kpi"><div class="k">Running profit</div><div class="v">' +
      number(step.profit) +
      '</div></div><div class="mini-kpi"><div class="k">Slots filled</div><div class="v">' +
      step.assignments.filter(Boolean).length +
      "</div></div></div>" +
      '<div class="player"><div class="player-row">' +
      '<button class="icon-btn" type="button" data-action="viz-restart" title="Restart trace" aria-label="Restart trace">' +
      icon("rotate-ccw", 15) +
      '</button><button class="icon-btn" type="button" data-action="viz-prev" title="Previous step" aria-label="Previous step"' +
      (ui.vizIndex === 0 ? " disabled" : "") +
      ">" +
      icon("skip-back", 16) +
      '</button><button class="btn btn-primary" type="button" data-action="viz-play">' +
      icon(playIcon, 15) +
      (ui.vizPlaying ? "Pause" : "Play") +
      '</button><button class="icon-btn" type="button" data-action="viz-next" title="Next step" aria-label="Next step"' +
      (atEnd ? " disabled" : "") +
      ">" +
      icon("skip-forward", 16) +
      '</button><select class="select speed-select" id="vizSpeed" aria-label="Playback speed">' +
      '<option value="1500"' +
      (ui.vizSpeed === 1500 ? " selected" : "") +
      ">0.6×</option>" +
      '<option value="900"' +
      (ui.vizSpeed === 900 ? " selected" : "") +
      ">1×</option>" +
      '<option value="550"' +
      (ui.vizSpeed === 550 ? " selected" : "") +
      ">1.6×</option>" +
      '<option value="250"' +
      (ui.vizSpeed === 250 ? " selected" : "") +
      ">3.6×</option></select></div>" +
      '<div class="player-progress"><span>Step ' +
      (ui.vizIndex + 1) +
      " of " +
      steps.length +
      '</span><div class="progress"><div class="progress-fill" style="width:' +
      progress +
      '%"></div></div><span>' +
      progress +
      "%</span></div></div></div></div></div></div>" +
      '<div class="grid-2"><div class="card"><div class="card-header"><div class="card-title-group"><div class="card-title">' +
      icon("trending-down", 15) +
      "If the critical slot is lost</div><div class=\"card-subtitle\">The same greedy pass with slot " +
      (result.criticalSlot || "—") +
      " removed.</div></div><span class=\"badge warning\">Loss " +
      number(result.loss) +
      "</span></div><div class=\"card-body\">" +
      (result.criticalSlot
        ? assignmentsTimeline(result, result.afterAssignments, { criticalSlot: result.criticalSlot })
        : emptyState("info", "No critical slot", "No available slot can be removed.")) +
      "</div></div>" +
      '<div class="card"><div class="card-header"><div class="card-title-group"><div class="card-title">' +
      icon("crosshair", 15) +
      "Audit checkpoint</div><div class=\"card-subtitle\">Result after comparing every available slot.</div></div></div>" +
      '<div class="card-body"><div class="metric-strip" style="grid-template-columns:repeat(3,minmax(0,1fr))">' +
      '<div class="metric-tile warning"><div class="label">Critical slot</div><div class="value">' +
      (result.criticalSlot || "None") +
      '</div></div><div class="metric-tile"><div class="label">Loss</div><div class="value">' +
      number(result.loss) +
      '</div></div><div class="metric-tile success"><div class="label">After profit</div><div class="value">' +
      number(result.afterProfit) +
      "</div></div></div>" +
      '<div class="callout" style="margin-top:15px">' +
      icon("info", 16) +
      "<div>Removing a slot is tested against the <b>original job list</b>, not the baseline assignment. Empty baseline slots are included in the audit.</div></div>" +
      '<div class="form-actions" style="justify-content:flex-start"><button class="btn" type="button" data-route="critical">' +
      icon("activity", 15) +
      "Inspect all candidates</button></div></div></div></div></div>"
    );
  }

  function candidateForView(result) {
    if (ui.inspectedSlot) {
      var inspected = result.candidates.find(function (candidate) {
        return candidate.slot === ui.inspectedSlot;
      });
      if (inspected) return inspected;
      ui.inspectedSlot = null;
    }
    if (result.criticalSlot) {
      return {
        slot: result.criticalSlot,
        profit: result.afterProfit,
        loss: result.loss,
        assignments: result.afterAssignments,
        rejected: result.afterRejected
      };
    }
    return {
      slot: 0,
      profit: 0,
      loss: 0,
      assignments: result.afterAssignments,
      rejected: result.afterRejected
    };
  }

  function renderCritical(result) {
    var active = candidateForView(result);
    var maxLoss = result.candidates.reduce(function (max, candidate) {
      return Math.max(max, candidate.loss);
    }, 0);
    var chart = result.candidates
      .map(function (candidate) {
        var height = maxLoss > 0 ? Math.max(2, Math.round((candidate.loss / maxLoss) * 100)) : 2;
        var classes = ["bar-col"];
        if (candidate.slot === result.criticalSlot) classes.push("is-critical");
        if (candidate.loss === 0) classes.push("is-zero");
        return (
          '<div class="' +
          classes.join(" ") +
          '"><span class="bar-value">' +
          number(candidate.loss) +
          '</span><div class="bar-track"><div class="bar-fill" style="height:' +
          height +
          '%"></div></div><span class="bar-label">#' +
          candidate.slot +
          "</span></div>"
        );
      })
      .join("");
    var activeJobId = active.slot ? result.baseline.assignments[active.slot - 1] : 0;
    var activeJob = activeJobId
      ? result.jobs.find(function (job) {
          return job.id === activeJobId;
        })
      : null;
    var rejectedChips = active.rejected.length
      ? active.rejected
          .map(function (jobId) {
            return '<span class="badge critical">Job ' + jobId + "</span>";
          })
          .join(" ")
      : '<span class="badge success">No rejected jobs</span>';
    return (
      '<div class="page-stack"><section class="section-heading"><div><h2>Critical-slot audit</h2>' +
      "<p>Every originally available slot is removed in turn, then the original jobs are scheduled again.</p></div>" +
      '<div class="card-actions"><button class="btn" type="button" data-route="visualization">' +
      icon("activity", 15) +
      "Trace greedy pass</button></div></section>" +
      '<div class="metric-strip"><div class="metric-tile warning"><div class="label">Critical slot</div><div class="value">' +
      (result.criticalSlot || "None") +
      '</div></div><div class="metric-tile critical"><div class="label">Maximum loss</div><div class="value">' +
      number(result.loss) +
      '</div></div><div class="metric-tile success"><div class="label">After-loss profit</div><div class="value">' +
      number(result.afterProfit) +
      '</div></div><div class="metric-tile"><div class="label">Slots tested</div><div class="value">' +
      result.candidates.length +
      "</div></div></div>" +
      '<div class="callout ' +
      (result.loss > 0 ? "warning" : "") +
      '">' +
      icon(result.loss > 0 ? "alert" : "info", 16) +
      "<div>" +
      (result.criticalSlot
        ? "<b>Slot " +
          result.criticalSlot +
          "</b> produces the largest profit loss" +
          (activeJob ? " and carries job " + activeJob.id + " in the baseline." : ".")
        : "<b>No available slot is critical.</b> All slots are unavailable, so no removal test exists.") +
      (result.loss > 0
        ? " A tie is resolved in favour of the smaller slot number."
        : " Zero-loss candidates resolve to the smallest available slot.") +
      "</div></div>" +
      '<div class="grid-2-1"><div class="card"><div class="card-header"><div class="card-title-group"><div class="card-title">' +
      icon("activity", 15) +
      "Loss by removed slot</div><div class=\"card-subtitle\">Bar height is relative to the maximum observed loss.</div></div></div>" +
      '<div class="card-body"><div class="chart-shell">' +
      (result.candidates.length
        ? '<div class="chart-scroll"><div class="bar-chart">' + chart + "</div></div>" +
          '<div class="chart-foot"><span>Slot number</span><span>Critical slot highlighted in amber</span></div>'
        : emptyState("calendar", "No available slots", "Unavailable slots are never tested as critical candidates.")) +
      "</div></div></div>" +
      '<div class="card"><div class="card-header"><div class="card-title-group"><div class="card-title">' +
      icon("layers", 15) +
      "Rebuilt schedule</div><div class=\"card-subtitle\">" +
      (active.slot ? "Slot " + active.slot + " removed for this view." : "No removal possible.") +
      "</div></div>" +
      (active.slot === result.criticalSlot
        ? '<span class="badge warning">Critical</span>'
        : '<button class="btn btn-sm" type="button" data-action="use-baseline">' +
          icon("crosshair", 14) +
          "Show critical</button>") +
      '</div><div class="card-body">' +
      assignmentsTimeline(result, active.assignments, { criticalSlot: active.slot }) +
      '<div class="viz-section-label" style="margin-top:15px"><span>Rejected after loss</span><span>Input order</span></div><div class="checkbox-row">' +
      rejectedChips +
      "</div>" +
      '<div class="mini-kpis" style="margin-top:15px"><div class="mini-kpi"><div class="k">Base profit</div><div class="v">' +
      number(result.baseline.profit) +
      '</div></div><div class="mini-kpi"><div class="k">After removal</div><div class="v">' +
      number(active.profit) +
      "</div></div></div></div></div></div>" +
      '<div class="card"><div class="card-header"><div class="card-title-group"><div class="card-title">' +
      icon("database", 15) +
      "Candidate comparison</div><div class=\"card-subtitle\">Select any row to inspect its rebuilt schedule.</div></div></div>" +
      '<div class="table-wrap"><table class="data-table"><thead><tr><th>Slot</th><th>Baseline job</th><th>After profit</th><th>Loss</th><th>Rejected</th><th></th></tr></thead><tbody>' +
      (result.candidates.length
        ? result.candidates
            .map(function (candidate) {
              var jobId = result.baseline.assignments[candidate.slot - 1];
              var critical = candidate.slot === result.criticalSlot;
              var rejectedLabel = candidate.rejected.length ? candidate.rejected.join(", ") : "None";
              return (
                '<tr class="' +
                (critical ? "row-critical" : "") +
                '"><td class="cell-id">Slot ' +
                candidate.slot +
                '</td><td class="cell-num">' +
                (jobId ? "Job " + jobId : "Empty") +
                '</td><td class="cell-num">' +
                number(candidate.profit) +
                '</td><td class="cell-num"><span class="badge ' +
                (critical ? "warning" : candidate.loss === 0 ? "success" : "neutral") +
                '">' +
                number(candidate.loss) +
                '</span></td><td class="row-muted">' +
                esc(rejectedLabel) +
                '</td><td><div class="row-actions">' +
                (candidate.slot === active.slot
                  ? '<span class="badge accent">Viewing</span>'
                  : '<button class="btn btn-sm" type="button" data-action="inspect-candidate" data-slot="' +
                    candidate.slot +
                    '">Inspect</button>') +
                "</div></td></tr>"
              );
            })
            .join("")
        : '<tr><td colspan="6"><div class="empty-state"><span class="empty-icon">' +
          icon("calendar", 20) +
          "</span><h3>No candidates</h3><p>Every slot is initially unavailable.</p></div></td></tr>") +
      "</tbody></table></div></div></div>"
    );
  }

  function testResultFor(test) {
    return ui.testResults[test.id] || null;
  }

  function runTest(test) {
    var actual;
    try {
      actual = A.analyze(A.parseProblemInput(configToInput(test.config))).output;
    } catch (error) {
      actual = "ERROR: " + (error.message || "The case could not be run.");
    }
    ui.testResults[test.id] = {
      actual: actual,
      pass: actual === test.expected
    };
    return ui.testResults[test.id];
  }

  function runSingleTest(id) {
    var test = SAMPLE_TESTS.find(function (item) { return item.id === id; });
    if (!test) return;
    var result = runTest(test);
    renderView();
    toast(
      result.pass ? "success" : "error",
      result.pass ? "Test passed" : "Test failed",
      test.name + (result.pass ? " matches the expected output." : " differs from the expected output.")
    );
  }

  function runAllTests() {
    var passed = 0;
    SAMPLE_TESTS.forEach(function (test) {
      if (runTest(test).pass) passed += 1;
    });
    renderView();
    toast(
      passed === SAMPLE_TESTS.length ? "success" : "error",
      passed + " / " + SAMPLE_TESTS.length + " tests passed",
      passed === SAMPLE_TESTS.length
        ? "Every browser test matches its expected output."
        : "Open the failing case to compare expected and actual lines."
    );
  }

  function diffHtml(test, result) {
    if (!result || result.pass) return "";
    var expectedLines = test.expected.split("\n");
    var actualLines = result.actual.split("\n");
    var count = Math.max(expectedLines.length, actualLines.length);
    var rows = [];
    for (var index = 0; index < count; index += 1) {
      if (expectedLines[index] !== actualLines[index]) {
        rows.push(
          "<li><span class=\"expected\">Expected: " +
            esc(expectedLines[index] === undefined ? "(missing)" : expectedLines[index]) +
            '</span><br><span class="actual">Actual: ' +
            esc(actualLines[index] === undefined ? "(missing)" : actualLines[index]) +
            "</span></li>"
        );
      }
    }
    return (
      '<ul class="diff-list">' +
      (rows.length ? rows.join("") : "<li>Output text differs.</li>") +
      "</ul>"
    );
  }

  function renderTests() {
    var runResults = SAMPLE_TESTS.map(testResultFor).filter(Boolean);
    var passed = runResults.filter(function (result) { return result.pass; }).length;
    return (
      '<div class="page-stack"><section class="section-heading"><div><h2>Verification suite</h2>' +
      "<p>Official samples and edge cases are executed directly by the same algorithm module that powers the dashboard.</p></div>" +
      '<div class="card-actions"><button class="btn btn-primary" type="button" data-action="run-all-tests">' +
      icon("play", 15) +
      "Run all tests</button></div></section>" +
      '<div class="card"><div class="card-header"><div class="card-title-group"><div class="card-title">' +
      icon("flask", 15) +
      "Browser test runner</div><div class=\"card-subtitle\">The output below is generated live; no expected values are hard-coded into the engine.</div></div>" +
      '<span class="badge ' +
      (runResults.length && passed === SAMPLE_TESTS.length ? "success" : runResults.length ? "warning" : "neutral") +
      '">' +
      (runResults.length ? passed + " / " + SAMPLE_TESTS.length + " passed" : "Not run yet") +
      "</span></div><div class=\"card-body\"><div class=\"test-grid\">" +
      SAMPLE_TESTS.map(function (test) {
        var result = testResultFor(test);
        var status = result
          ? result.pass
            ? '<span class="badge success"><span class="dot"></span>PASS</span>'
            : '<span class="badge critical"><span class="dot"></span>FAIL</span>'
          : '<span class="badge neutral">READY</span>';
        return (
          '<div class="sample-card"><div class="sample-card-head"><div><h3>' +
          esc(test.name) +
          '</h3><div class="sample-meta">' +
          esc(test.meta) +
          "</div></div>" +
          status +
          "</div>" +
          '<div class="viz-section-label"><span>Input</span><span>' +
          test.config.jobs.length +
          " jobs · " +
          test.config.numSlots +
          " slots</span></div>" +
          '<pre class="code-block">' +
          esc(configToInput(test.config)) +
          "</pre>" +
          '<div class="viz-section-label" style="margin-top:2px"><span>Expected output</span><span>Exact text match</span></div>' +
          '<pre class="code-block">' +
          esc(test.expected) +
          "</pre>" +
          (result
            ? '<div class="test-result ' +
              (result.pass ? "pass" : "fail") +
              '"><span class="test-icon">' +
              icon(result.pass ? "check-circle" : "x-circle", 18) +
              "</span><div><h3>" +
              (result.pass ? "Output matches" : "Output mismatch") +
              "</h3><p>" +
              (result.pass ? "All seven lines match the reference output." : "Compare the differing lines below.") +
              "</p>" +
              diffHtml(test, result) +
              "</div></div>"
            : "") +
          '<div class="form-actions" style="justify-content:flex-start;margin-top:auto"><button class="btn btn-sm" type="button" data-action="run-test" data-test="' +
          test.id +
          '">' +
          icon("play", 14) +
          (result ? "Run again" : "Run test") +
          "</button></div></div>"
        );
      }).join("") +
      "</div></div></div>" +
      '<div class="callout">' +
      icon("info", 16) +
      "<div><b>Reference parity.</b> The Node test suite runs the same cases and compares the browser engine against the Python implementation on generated inputs. The <span class=\"code-inline\">REJECTED</span> line includes the number of rejected jobs before the IDs.</div></div></div>"
    );
  }

  function renderComplexity() {
    var n = state.jobs.length;
    var h = state.numSlots;
    return (
      '<div class="page-stack"><section class="section-heading"><div><h2>Complexity analysis</h2>' +
      "<p>The implementation sorts once and reuses the ordered job list for every critical-slot simulation.</p></div>" +
      '<span class="badge accent">n = ' +
      n +
      " · H = " +
      h +
      "</span></section>" +
      '<div class="grid-3"><div class="card"><div class="card-header"><div class="card-title-group"><div class="card-title">' +
      icon("arrow-up-down", 15) +
      "1 · Sort jobs</div></div><span class=\"badge neutral\">Once</span></div>" +
      '<div class="card-body"><div class="formula-card"><div class="label">Time</div><div class="formula">O(n log n)<small>Profit descending, then job ID ascending.</small></div></div>' +
      '<div class="formula-card" style="margin-top:10px"><div class="label">Space</div><div class="formula">O(n)<small>The sorted copy is reused by every pass.</small></div></div></div></div>' +
      '<div class="card"><div class="card-header"><div class="card-title-group"><div class="card-title">' +
      icon("activity", 15) +
      "2 · Baseline pass</div></div><span class=\"badge neutral\">1 pass</span></div>" +
      '<div class="card-body"><div class="formula-card"><div class="label">Time</div><div class="formula">O(n · H)<small>Each job scans from its deadline toward slot 1.</small></div></div>' +
      '<div class="formula-card" style="margin-top:10px"><div class="label">Space</div><div class="formula">O(H)<small>Availability, filled state and assignments.</small></div></div></div></div>' +
      '<div class="card"><div class="card-header"><div class="card-title-group"><div class="card-title">' +
      icon("crosshair", 15) +
      "3 · Critical scan</div></div><span class=\"badge warning\">H passes</span></div>" +
      '<div class="card-body"><div class="formula-card"><div class="label">Time</div><div class="formula">O(H · n · H)<small>Each available slot triggers one full rebuild.</small></div></div>' +
      '<div class="formula-card" style="margin-top:10px"><div class="label">Space</div><div class="formula">O(H)<small>Each candidate result is recorded for comparison.</small></div></div></div></div></div>' +
      '<div class="card"><div class="card-header"><div class="card-title-group"><div class="card-title">' +
      icon("gauge", 15) +
      "Total complexity</div><div class=\"card-subtitle\">For n jobs and H time slots.</div></div>" +
      '<span class="badge success">Sorted once</span></div><div class="card-body">' +
      '<div class="grid-2"><div class="formula-card"><div class="label">Time</div><div class="formula">O(n log n + n · H²)<small>Worst case O(n · H²) for H ≥ 2; sorting is not repeated.</small></div></div>' +
      '<div class="formula-card"><div class="label">Space</div><div class="formula">O(n + H)<small>Jobs, availability map, assignments and candidate records.</small></div></div></div>' +
      '<table class="doc-table" style="margin-top:16px"><thead><tr><th>Phase</th><th>Time</th><th>Space</th><th>Implementation note</th></tr></thead><tbody>' +
      "<tr><td>Sort</td><td>O(n log n)</td><td>O(n)</td><td><code>sortJobs</code> sorts by profit and ID once.</td></tr>" +
      "<tr><td>Baseline</td><td>O(n · H)</td><td>O(H)</td><td>Latest free slot at or before each deadline.</td></tr>" +
      "<tr><td>Critical search</td><td>O(n · H²)</td><td>O(H)</td><td>At most H candidate rebuilds from the original jobs.</td></tr>" +
      "<tr><td>Rejected set</td><td>O(n)</td><td>O(n)</td><td>Input order is preserved for the output contract.</td></tr>" +
      "<tr><td><b>Total</b></td><td><b>O(n log n + n · H²)</b></td><td><b>O(n + H)</b></td><td>Constraints: n ≤ 200, H ≤ 60.</td></tr>" +
      "</tbody></table></div></div>" +
      '<div class="grid-2"><div class="card"><div class="card-header"><div class="card-title-group"><div class="card-title">' +
      icon("zap", 15) +
      "Why reuse the sorted order?</div></div></div><div class=\"card-body prose\">" +
      "<p>The greedy order depends only on the original jobs. Removing a time slot changes which jobs fit, not the profit order. Sorting once removes an extra <span class=\"code-inline\">log n</span> factor from every candidate rebuild.</p>" +
      "<p>A naive candidate loop that sorts again would cost <strong>O(H · n log n + n · H²)</strong>. The implementation deliberately avoids that duplication.</p></div></div>" +
      '<div class="card"><div class="card-header"><div class="card-title-group"><div class="card-title">' +
      icon("database", 15) +
      "What the bound means</div></div></div><div class=\"card-body prose\">" +
      "<p>At the maximum supported size, <strong>n = 200</strong> and <strong>H = 60</strong>. The critical-slot audit performs at most 60 rebuilds, each scanning at most 60 slots for each of 200 jobs.</p>" +
      "<p>The dominant term is <strong>n · H²</strong>. Sorting is still required for correctness, but it is not the bottleneck at the supported limits.</p></div></div></div></div>"
    );
  }

  function documentationMarkdown() {
    return [
      "# Deadline Scheduler: Survive a Lost Time Slot",
      "",
      "## Problem statement",
      "",
      "Given n jobs with unique IDs, deadlines and profits, plus H time slots where some slots are initially unavailable:",
      "",
      "1. Build the maximum-profit baseline schedule.",
      "2. Report rejected jobs in input order.",
      "3. Identify the critical available slot whose removal causes the largest profit loss.",
      "4. Report the loss, the after-loss profit and the rebuilt assignment.",
      "",
      "Each job takes exactly one slot and must be scheduled at or before its deadline.",
      "",
      "## Input format",
      "",
      "```",
      "n H k",
      "<k unavailable slot numbers>",
      "<job_id> <deadline> <profit>   (n lines)",
      "```",
      "",
      "- n is the number of jobs, 1 <= n <= 200.",
      "- H is the number of time slots, 1 <= H <= 60.",
      "- k is the number of initially unavailable slots.",
      "- Unavailable slots are distinct and 1-indexed.",
      "",
      "## Output format",
      "",
      "```",
      "BASE_PROFIT <total>",
      "BASE_SLOTS <job_id per slot, 0 if empty>",
      "REJECTED <count> <job ids in input order>",
      "CRITICAL_SLOT <slot number, 0 if none>",
      "LOSS <profit lost>",
      "AFTER_PROFIT <profit after removal>",
      "AFTER_SLOTS <job_id per slot after removal, 0 if empty>",
      "```",
      "",
      "The REJECTED line includes the number of rejected jobs before the IDs.",
      "",
      "## Greedy approach",
      "",
      "Jobs are sorted by profit descending, then by job ID ascending. For each job, the scheduler scans from its deadline down to slot 1 and takes the latest available slot that is not already filled.",
      "",
      "Placing a job as late as possible preserves earlier slots for jobs with tighter deadlines. The highest-profit-first order makes the greedy choice optimal for classic job sequencing with deadlines.",
      "",
      "## Critical-slot search",
      "",
      "For every originally available slot:",
      "",
      "1. Mark that slot unavailable in a copy of the availability map.",
      "2. Re-run the greedy scheduler using the original job list.",
      "3. Compute loss = baseline profit - candidate profit.",
      "4. Keep the largest loss; ties go to the smaller slot number.",
      "",
      "Empty baseline slots are tested too. If every slot is initially unavailable, the critical slot is 0 and the loss is 0.",
      "",
      "## Worked example",
      "",
      "```",
      "5 3 0",
      "1 2 100",
      "2 1 19",
      "3 2 27",
      "4 1 25",
      "5 3 15",
      "```",
      "",
      "```",
      "BASE_PROFIT 142",
      "BASE_SLOTS 3 1 5",
      "REJECTED 2 2 4",
      "CRITICAL_SLOT 1",
      "LOSS 27",
      "AFTER_PROFIT 115",
      "AFTER_SLOTS 0 1 5",
      "```",
      "",
      "Removing slot 1 or slot 2 loses 27 profit. Removing slot 3 loses 15. The tie resolves to slot 1.",
      "",
      "## Edge cases",
      "",
      "- All slots unavailable: profit 0, critical slot 0, loss 0, after assignments all zeros.",
      "- Zero-loss candidates: the smallest available slot is reported, and the after-loss schedule can be identical to the baseline.",
      "- Equal profits: job ID ascending is the deterministic tie-break.",
      "- Equal deadlines: the latest-slot greedy rule still applies, and every candidate rebuild starts from the original jobs.",
      "",
      "## Correctness sketch",
      "",
      "The exchange argument for job sequencing with deadlines shows that processing jobs in non-increasing profit order and placing each job in its latest free feasible slot is optimal. The critical-slot phase exhaustively tries every available slot, so it observes every possible single-slot loss. Choosing the maximum loss with the smallest-slot tie-break therefore implements the required contract.",
      "",
      "## Complexity",
      "",
      "- Sorting once: O(n log n).",
      "- Baseline scheduling: O(n * H).",
      "- At most H candidate rebuilds: O(n * H^2).",
      "- Total time: O(n log n + n * H^2), worst case O(n * H^2).",
      "- Space: O(n + H).",
      "",
      "## Verification",
      "",
      "The browser test runner covers both official samples, equal-profit tie-breaking, an all-slots-unavailable case and a zero-loss case. The repository also includes Node tests and a parity suite that compares the JavaScript engine with the Python reference on generated inputs.",
      "",
      "## CLI",
      "",
      "```powershell",
      "Get-Content input.txt | python deadline_scheduler.py",
      "```",
      "",
      "## Files",
      "",
      "- deadline_scheduler.py: Python reference and CLI.",
      "- test_scheduler.py: Python assertion tests.",
      "- assets/js/algorithm.js: shared browser/Node scheduling engine.",
      "- assets/js/app.js: dashboard state, views and interactions.",
      "- tests/algorithm.test.js: JavaScript algorithm tests.",
      "- tests/parity.test.js: JavaScript/Python parity tests.",
      ""
    ].join("\n");
  }

  function renderDocumentation() {
    var result = getAnalysis();
    var sample = SAMPLE_TESTS[0];
    return (
      '<div class="page-stack"><section class="section-heading"><div><h2>Project documentation</h2>' +
      "<p>The problem contract, algorithm decisions and verification story for the Deadline Scheduler.</p></div>" +
      '<div class="card-actions"><button class="btn" type="button" data-action="download-docs">' +
      icon("download", 15) +
      "Download Markdown</button></div></section>" +
      '<div class="doc-grid"><nav class="doc-nav" aria-label="Documentation sections">' +
      '<a href="#/documentation" data-doc-target="doc-problem">Problem</a>' +
      '<a href="#/documentation" data-doc-target="doc-format">Input and output</a>' +
      '<a href="#/documentation" data-doc-target="doc-approach">Approach</a>' +
      '<a href="#/documentation" data-doc-target="doc-critical">Critical slot</a>' +
      '<a href="#/documentation" data-doc-target="doc-example">Worked example</a>' +
      '<a href="#/documentation" data-doc-target="doc-edge">Edge cases</a>' +
      '<a href="#/documentation" data-doc-target="doc-proof">Correctness</a>' +
      '<a href="#/documentation" data-doc-target="doc-complexity">Complexity</a>' +
      '<a href="#/documentation" data-doc-target="doc-verification">Verification</a>' +
      "</nav>" +
      '<div class="card"><div class="card-body prose">' +
      '<section class="doc-section" id="doc-problem"><h2>Problem statement</h2>' +
      "<p>Given <strong>n jobs</strong> with unique IDs, deadlines and profits, and <strong>H time slots</strong> where some slots are initially unavailable, build a maximum-profit baseline schedule and then find the <strong>critical available slot</strong> whose removal causes the largest profit loss.</p>" +
      "<p>Each job takes exactly one slot and must be scheduled at or before its deadline. The report must include the baseline assignment, rejected jobs, critical slot, loss, after-loss profit and after-loss assignment.</p></section>" +
      '<section class="doc-section" id="doc-format"><h2>Input format</h2>' +
      '<pre class="code-block">n H k\n&lt;k unavailable slot numbers&gt;\n&lt;job_id&gt; &lt;deadline&gt; &lt;profit&gt;   (n lines)</pre>' +
      "<p>Constraints: <span class=\"code-inline\">1 ≤ n ≤ 200</span>, <span class=\"code-inline\">1 ≤ H ≤ 60</span>. Unavailable slots are distinct and within <span class=\"code-inline\">1..H</span>. Job IDs are unique positive integers and profits are positive integers.</p>" +
      "<h3>Output contract</h3>" +
      '<pre class="code-block">BASE_PROFIT &lt;total&gt;\nBASE_SLOTS &lt;job_id per slot, 0 if empty&gt;\nREJECTED &lt;count&gt; &lt;job ids in input order&gt;\nCRITICAL_SLOT &lt;slot number, 0 if none&gt;\nLOSS &lt;profit lost&gt;\nAFTER_PROFIT &lt;profit after removal&gt;\nAFTER_SLOTS &lt;job_id per slot after removal, 0 if empty&gt;</pre>' +
      '<div class="callout">' +
      icon("info", 16) +
      "<div><b>REJECTED carries a count.</b> For the first official sample the line is <span class=\"code-inline\">REJECTED 2 2 4</span>, meaning two rejected jobs with IDs 2 and 4.</div></div></section>" +
      '<section class="doc-section" id="doc-approach"><h2>Greedy approach</h2>' +
      "<p>Jobs are sorted by <strong>profit descending</strong>, then by <strong>job ID ascending</strong> for deterministic ties. Each job is placed in the <strong>latest free available slot at or before its deadline</strong>.</p>" +
      "<p>Using the latest feasible slot leaves earlier slots free for jobs with tighter deadlines. The high-profit-first order is the classic optimal greedy strategy for job sequencing with deadlines.</p>" +
      "<ul><li>A job is rejected only when every slot from its deadline down to slot 1 is unavailable or occupied.</li><li>Rejected jobs are reported in their original input order.</li><li>The sorted order is computed once and reused by every critical-slot rebuild.</li></ul></section>" +
      '<section class="doc-section" id="doc-critical"><h2>Critical-slot search</h2>' +
      "<p>For every <strong>originally available</strong> slot, the engine marks that slot unavailable, re-runs the greedy scheduler from the original job list, and records the profit loss.</p>" +
      "<ol><li>Start from the original availability map.</li><li>Remove one candidate slot.</li><li>Re-run the full greedy pass.</li><li>Keep the largest loss.</li><li>Break ties with the smallest slot number.</li></ol>" +
      "<p>Empty baseline slots are valid candidates. If every slot is initially unavailable, the critical slot is <strong>0</strong>, the loss is <strong>0</strong> and the after-loss assignment contains only zeros.</p></section>" +
      '<section class="doc-section" id="doc-example"><h2>Worked example</h2>' +
      '<div class="viz-section-label"><span>Input</span><span>Official sample 1</span></div>' +
      '<pre class="code-block">' +
      esc(configToInput(sample.config)) +
      "</pre>" +
      '<div class="viz-section-label" style="margin-top:12px"><span>Output</span><span>Exact contract</span></div>' +
      '<pre class="code-block">' +
      esc(sample.expected) +
      "</pre>" +
      '<table class="doc-table"><thead><tr><th>Candidate</th><th>Profit after removal</th><th>Loss</th></tr></thead><tbody>' +
      '<tr><td>Slot 1</td><td>115</td><td>27</td></tr>' +
      '<tr><td>Slot 2</td><td>115</td><td>27</td></tr>' +
      '<tr><td>Slot 3</td><td>127</td><td>15</td></tr>' +
      '</tbody></table><p>Slots 1 and 2 tie at a loss of 27. The smaller slot number, slot 1, is critical.</p></section>' +
      '<section class="doc-section" id="doc-edge"><h2>Edge cases</h2>' +
      "<ul><li><strong>All slots unavailable:</strong> baseline profit 0, critical slot 0, loss 0, after assignments all zeros.</li>" +
      "<li><strong>Zero-loss candidates:</strong> the smallest available slot is reported; the after-loss schedule may be identical to the baseline.</li>" +
      "<li><strong>Equal profits:</strong> job ID ascending is the deterministic tie-break.</li>" +
      "<li><strong>Equal deadlines:</strong> candidate rebuilds always start from the original jobs, not the baseline assignment.</li>" +
      "<li><strong>Empty baseline slots:</strong> they are still tested during the critical-slot audit.</li></ul></section>" +
      '<section class="doc-section" id="doc-proof"><h2>Correctness sketch</h2>' +
      "<p>The exchange argument for job sequencing with deadlines establishes that processing jobs in non-increasing profit order and assigning each job its latest free feasible slot is optimal. The critical-slot phase is exhaustive over all available slots, so it observes every possible single-slot loss. Selecting the maximum loss with the smallest-slot tie-break therefore satisfies the required output contract.</p></section>" +
      '<section class="doc-section" id="doc-complexity"><h2>Complexity</h2>' +
      '<table class="doc-table"><thead><tr><th>Operation</th><th>Time</th><th>Space</th><th>Note</th></tr></thead><tbody>' +
      "<tr><td>Sort jobs</td><td>O(n log n)</td><td>O(n)</td><td>Once, then reused.</td></tr>" +
      "<tr><td>Baseline pass</td><td>O(n · H)</td><td>O(H)</td><td>Latest free slot per job.</td></tr>" +
      "<tr><td>Critical search</td><td>O(n · H²)</td><td>O(H)</td><td>At most H candidate rebuilds.</td></tr>" +
      "<tr><td><b>Total</b></td><td><b>O(n log n + n · H²)</b></td><td><b>O(n + H)</b></td><td>Worst case O(n · H²).</td></tr>" +
      "</tbody></table>" +
      "<p>The current project has <strong>" +
      state.jobs.length +
      "</strong> jobs and <strong>" +
      state.numSlots +
      "</strong> slots. The active analysis tested <strong>" +
      result.candidates.length +
      "</strong> available candidate slots.</p></section>" +
      '<section class="doc-section" id="doc-verification"><h2>Verification</h2>' +
      "<p>The browser test runner covers both official samples, equal-profit tie-breaking, an all-slots-unavailable case and a zero-loss case. The repository also includes JavaScript algorithm tests, Python assertion tests and a parity suite that compares both engines on generated inputs.</p>" +
      '<pre class="code-block">python test_scheduler.py\nnode --test tests/algorithm.test.js\nnode --test tests/parity.test.js</pre>' +
      "<p>The parity suite deliberately shuffles input order so the deterministic job-ID tie-break is exercised.</p></section>" +
      '<section class="doc-section" id="doc-files"><h2>Project files</h2>' +
      '<table class="doc-table"><thead><tr><th>File</th><th>Role</th></tr></thead><tbody>' +
      "<tr><td><span class=\"code-inline\">deadline_scheduler.py</span></td><td>Python reference implementation and CLI.</td></tr>" +
      "<tr><td><span class=\"code-inline\">assets/js/algorithm.js</span></td><td>Browser and Node scheduling engine.</td></tr>" +
      "<tr><td><span class=\"code-inline\">assets/js/app.js</span></td><td>Dashboard state, routing and views.</td></tr>" +
      "<tr><td><span class=\"code-inline\">tests/parity.test.js</span></td><td>JavaScript/Python output parity checks.</td></tr>" +
      "<tr><td><span class=\"code-inline\">test_scheduler.py</span></td><td>Python assertion suite.</td></tr>" +
      "</tbody></table></section></div></div></div></div>"
    );
  }

  var PAGE_RENDERERS = {
    overview: renderOverview,
    jobs: renderJobs,
    configuration: renderConfiguration,
    visualization: renderVisualization,
    critical: renderCritical,
    tests: renderTests,
    complexity: renderComplexity,
    documentation: renderDocumentation
  };

  document.addEventListener("click", function (event) {
    var target = event.target.closest("[data-doc-target]");
    if (!target) return;
    event.preventDefault();
    var section = byId(target.getAttribute("data-doc-target"));
    if (!section) return;
    section.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start"
    });
  });

  init();
})();
