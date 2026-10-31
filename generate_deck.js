const PptxGenJS = require('pptxgenjs');
const fs = require('fs');

const pptx = new PptxGenJS();

// Set 16:9 widescreen layout (13.333 x 7.5 inches)
pptx.defineLayout({ name: 'WIDE16x9', width: 13.333, height: 7.5 });
pptx.layout = 'WIDE16x9';

// Global Color Palette
const COLORS = {
  bg: '0B1120',         // Deep slate 950
  cardBg: '1E293B',     // Slate 800
  cardBgAlt: '162032',  // Slightly darker slate
  border: '334155',     // Slate 700
  borderLight: '475569',// Slate 600
  textPrimary: 'F8FAFC',// Slate 50 (Crisp white)
  textSecondary: '94A3B8', // Slate 400 (Muted gray)
  textMuted: '64748B',  // Slate 500
  accentCyan: '38BDF8', // Cyan 400 (Primary accent)
  accentIndigo: '818CF8', // Indigo 400
  accentPurple: 'A855F7', // Purple 500
  success: '10B981',    // Emerald 500 (Base profit)
  danger: 'F43F5E',     // Rose 500 (Critical loss)
  warning: 'F59E0B',    // Amber 500
};

// Common Helper: Add Header
function addHeader(slide, eyebrow, title, subtitle) {
  // Eyebrow tag
  slide.addText(eyebrow.toUpperCase(), {
    x: 0.8, y: 0.4, w: 11.5, h: 0.28,
    fontSize: 10, fontFace: 'Segoe UI', color: COLORS.accentCyan, bold: true, letterSpacing: 1.5
  });
  
  // Title
  slide.addText(title, {
    x: 0.8, y: 0.68, w: 11.7, h: 0.55,
    fontSize: 22, fontFace: 'Segoe UI', color: COLORS.textPrimary, bold: true
  });

  // Optional subtitle
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.8, y: 1.25, w: 11.7, h: 0.35,
      fontSize: 12, fontFace: 'Segoe UI', color: COLORS.textSecondary
    });
  }
}

// Common Helper: Add Footer
function addFooter(slide, slideIndex, totalSlides = 12) {
  // Subtle top border line
  slide.addShape(pptx.shapes.LINE, {
    x: 0.8, y: 6.95, w: 11.733, h: 0,
    line: { color: COLORS.border, width: 0.75 }
  });

  slide.addText('Deadline Scheduler — Algorithm Lab | Design & Analysis of Algorithms', {
    x: 0.8, y: 7.05, w: 8.0, h: 0.3,
    fontSize: 9, fontFace: 'Segoe UI', color: COLORS.textMuted
  });

  slide.addText(`Slide ${slideIndex} of ${totalSlides}`, {
    x: 10.533, y: 7.05, w: 2.0, h: 0.3, align: 'right',
    fontSize: 9, fontFace: 'Segoe UI', color: COLORS.textMuted, bold: true
  });
}

// Helper: Add Standard Card Container
function addCard(slide, x, y, w, h, fill = COLORS.cardBg, border = COLORS.border) {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: 0.12,
    fill: { color: fill },
    line: { color: border, width: 1 }
  });
}

// ==========================================
// SLIDE 1: TITLE SLIDE
// ==========================================
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.bg };

  // Decorative subtle backdrop glow
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: 0.8, w: 11.733, h: 5.6, rectRadius: 0.2,
    fill: { color: '0F172A' },
    line: { color: COLORS.border, width: 1.5 }
  });

  // Badge
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 1.4, y: 1.3, w: 3.6, h: 0.4, rectRadius: 0.2,
    fill: { color: '1E293B' },
    line: { color: COLORS.accentCyan, width: 1 }
  });
  slide.addText('ALGORITHM LAB & RESILIENCE PLATFORM', {
    x: 1.4, y: 1.3, w: 3.6, h: 0.4, align: 'center', valign: 'middle',
    fontSize: 9, fontFace: 'Segoe UI', color: COLORS.accentCyan, bold: true, letterSpacing: 1
  });

  // Main Title
  slide.addText('Deadline Scheduler', {
    x: 1.4, y: 1.85, w: 10.5, h: 0.85,
    fontSize: 38, fontFace: 'Segoe UI', color: COLORS.textPrimary, bold: true
  });

  // Subtitle / Tagline
  slide.addText('Optimal Job Sequencing with Deadlines & Critical Time Slot Resilience Analysis', {
    x: 1.4, y: 2.7, w: 10.5, h: 0.5,
    fontSize: 16, fontFace: 'Segoe UI', color: COLORS.accentIndigo, bold: true
  });

  slide.addText('Building maximum-profit baseline schedules and identifying single-point time bottlenecks whose unexpected failure causes the catastrophic loss of operational yield.', {
    x: 1.4, y: 3.25, w: 10.5, h: 0.65,
    fontSize: 13, fontFace: 'Segoe UI', color: COLORS.textSecondary
  });

  // Feature Highlights Box Grid
  const boxes = [
    { title: 'Optimal Greedy Engine', desc: 'Exchange-optimal backward slot allocation with tie-breaking', color: COLORS.accentCyan },
    { title: 'Critical Slot Search', desc: 'Exhaustive perturbation testing with deterministic tie-break', color: COLORS.danger },
    { title: 'Dual-Runtime Parity', desc: '100% verified across Python reference & JavaScript engine', color: COLORS.success },
    { title: 'Interactive Dashboard', desc: 'Zero-dependency SPA with step visualizer & sensitivity chart', color: COLORS.warning }
  ];

  boxes.forEach((box, i) => {
    const bx = 1.4 + (i * 2.65);
    const by = 4.1;
    addCard(slide, bx, by, 2.45, 1.35, '1E293B', COLORS.border);
    slide.addText(box.title, {
      x: bx + 0.15, y: by + 0.18, w: 2.15, h: 0.35,
      fontSize: 11, fontFace: 'Segoe UI', color: box.color, bold: true
    });
    slide.addText(box.desc, {
      x: bx + 0.15, y: by + 0.55, w: 2.15, h: 0.7,
      fontSize: 9.5, fontFace: 'Segoe UI', color: COLORS.textSecondary
    });
  });

  // Presenter Footer Info
  slide.addText('Author: vennuprajwal • Project: Design & Analysis of Algorithms Lab • Live: vennuprajwal.github.io/Deadline-Scheduler', {
    x: 1.4, y: 5.75, w: 10.5, h: 0.35,
    fontSize: 10.5, fontFace: 'Segoe UI', color: COLORS.textMuted
  });

  slide.addNotes('Welcome everyone. Today we present the Deadline Scheduler project — an advanced algorithmic platform addressing both optimal Job Sequencing with Deadlines and critical-slot resilience analysis. We will cover the core mathematical formulation, our dual-engine solution, system architecture, interactive features, and live demo access.');
}

// ==========================================
// SLIDE 2: THE PROBLEM
// ==========================================
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.bg };
  addHeader(slide, '01 / Problem Statement', 'The Challenge: Job Sequencing & Slot Fragility', 'Balancing profit maximization against the vulnerability of unexpected slot losses.');

  // 3 Column Cards
  const cards = [
    {
      title: '1. Classic Job Sequencing',
      badge: 'FOUNDATION',
      color: COLORS.accentCyan,
      points: [
        'n jobs with unique IDs, deadline d in [1..H], and profit p > 0.',
        'Unit execution: Each job requires exactly one discrete time slot.',
        'Feasibility condition: A job must be scheduled on or before its deadline (slot <= d).',
        'Capacity constraint: Each time slot holds at most one job. Rejected jobs yield zero profit.'
      ]
    },
    {
      title: '2. The Fragility Vulnerability',
      badge: 'THE BOTTLENECK',
      color: COLORS.danger,
      points: [
        'Traditional algorithms assume static, guaranteed time slot availability.',
        'In reality, pre-existing unavailable slots (k) restrict execution up front.',
        'Worst-case risk: What happens when an operating slot unexpectedly goes offline?',
        'Standard schedules lack resilience: The loss of one key slot can trigger cascading job rejections.'
      ]
    },
    {
      title: '3. Dual-Objective Mission',
      badge: 'OBJECTIVES',
      color: COLORS.warning,
      points: [
        'Objective 1: Compute maximum baseline profit and slot assignments.',
        'Objective 2: Enumerate rejected jobs in strict input order.',
        'Objective 3: Identify the Critical Slot — the available slot whose loss maximizes profit drop.',
        'Tie-breaking: Deterministically resolve equal-loss ties using the smallest slot index.'
      ]
    }
  ];

  cards.forEach((c, i) => {
    const x = 0.8 + i * 4.0;
    const y = 1.7;
    const w = 3.733;
    const h = 4.8;
    addCard(slide, x, y, w, h);

    // Header badge
    slide.addText(c.badge, {
      x: x + 0.25, y: y + 0.22, w: w - 0.5, h: 0.25,
      fontSize: 9, fontFace: 'Segoe UI', color: c.color, bold: true, letterSpacing: 1
    });

    slide.addText(c.title, {
      x: x + 0.25, y: y + 0.48, w: w - 0.5, h: 0.4,
      fontSize: 14, fontFace: 'Segoe UI', color: COLORS.textPrimary, bold: true
    });

    // Content bullets
    c.points.forEach((pt, idx) => {
      slide.addShape(pptx.shapes.OVAL, {
        x: x + 0.25, y: y + 1.1 + (idx * 0.88), w: 0.08, h: 0.08,
        fill: { color: c.color }, line: { color: c.color }
      });
      slide.addText(pt, {
        x: x + 0.45, y: y + 0.98 + (idx * 0.88), w: w - 0.7, h: 0.8,
        fontSize: 10.5, fontFace: 'Segoe UI', color: COLORS.textSecondary
      });
    });
  });

  addFooter(slide, 2);
  slide.addNotes('On this slide, we formalize the problem. We are given n jobs, horizon H, and k blocked slots. While traditional algorithms stop at finding the baseline profit, our problem demands identifying the single most critical time slot whose loss produces the maximum drop in overall profit.');
}

// ==========================================
// SLIDE 3: REAL-WORLD MOTIVATION
// ==========================================
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.bg };
  addHeader(slide, '02 / Real-World Motivation', 'Why Single-Slot Resilience Matters in Industry', 'From cloud infrastructure to high-precision manufacturing: failure to anticipate slot loss is costly.');

  const domains = [
    {
      title: 'Cloud Computing & Spot Instances',
      icon: 'CLOUD ARCHITECTURE',
      color: COLORS.accentCyan,
      desc: 'Modern cloud providers offer cost-effective Spot VMs and preemptible nodes that can be reclaimed with a 30-second warning. When batch pipelines execute high-priority customer SLAs across discrete processing windows, losing a critical window without precomputed resilience can cause SLA breach penalties exceeding hundreds of thousands of dollars.'
    },
    {
      title: 'Automated Manufacturing & Assembly',
      icon: 'INDUSTRIAL AUTOMATION',
      color: COLORS.warning,
      desc: 'Precision assembly lines and robotic work-cells operate on rigid discretized time cycles. If an unexpected sensor calibration or thermal safety trip halts station 4 during cycle t, the scheduler must instantly know whether to reroute alternative tasks or halt upstream feeder queues to minimize wasted material and idle machine cycles.'
    },
    {
      title: 'Airport Runway & Logistics Scheduling',
      icon: 'TRANSPORTATION & LOGISTICS',
      color: COLORS.accentIndigo,
      desc: 'Airport runway take-off slots and port container gantry cranes are heavily constrained finite horizons. Severe weather, surface debris, or emergency maintenance abruptly removes runway slots. Identifying which runway slot removal inflicts the largest passenger ripple disruption enables dispatchers to station emergency ground buffers proactively.'
    }
  ];

  domains.forEach((d, i) => {
    const x = 0.8;
    const y = 1.7 + i * 1.55;
    const w = 11.733;
    const h = 1.38;
    addCard(slide, x, y, w, h);

    slide.addText(d.icon, {
      x: x + 0.3, y: y + 0.15, w: 4.0, h: 0.25,
      fontSize: 9, fontFace: 'Segoe UI', color: d.color, bold: true, letterSpacing: 1
    });

    slide.addText(d.title, {
      x: x + 0.3, y: y + 0.38, w: 3.5, h: 0.35,
      fontSize: 13, fontFace: 'Segoe UI', color: COLORS.textPrimary, bold: true
    });

    slide.addText(d.desc, {
      x: x + 4.0, y: y + 0.18, w: 7.4, h: 1.05,
      fontSize: 10.5, fontFace: 'Segoe UI', color: COLORS.textSecondary
    });
  });

  // Bottom Takeaway Banner
  addCard(slide, 0.8, 6.2, 11.733, 0.55, '0F172A', COLORS.accentCyan);
  slide.addText('CORE TAKEAWAY: Optimizing solely for best-case baseline profit creates brittle schedules. Proactive resilience analysis guarantees operational survivability.', {
    x: 0.9, y: 6.2, w: 11.5, h: 0.55, align: 'center', valign: 'middle',
    fontSize: 10.5, fontFace: 'Segoe UI', color: COLORS.accentCyan, bold: true
  });

  addFooter(slide, 3);
  slide.addNotes('To appreciate the value of this research, consider real-world infrastructure. In cloud compute, spot instances vanish. In automated manufacturing, equipment maintenance interrupts production windows. In airport operations, weather closes runway slots. A system that knows its critical slot in advance can preemptively deploy reserves.');
}

// ==========================================
// SLIDE 4: OUR SOLUTION
// ==========================================
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.bg };
  addHeader(slide, '03 / Our Solution', 'The Dual-Engine Approach: Greedy & Resilience', 'A unified mathematical model delivering optimal profit baseline and guaranteed worst-case vulnerability identification.');

  // 2 Major Panels
  // Left: Tier 1 Baseline
  const leftX = 0.8, leftY = 1.7, leftW = 5.7, leftH = 4.9;
  addCard(slide, leftX, leftY, leftW, leftH);

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: leftX + 0.3, y: leftY + 0.25, w: 2.2, h: 0.32, rectRadius: 0.1,
    fill: { color: '0F172A' }, line: { color: COLORS.success, width: 1 }
  });
  slide.addText('TIER 1: OPTIMAL BASELINE', {
    x: leftX + 0.3, y: leftY + 0.25, w: 2.2, h: 0.32, align: 'center', valign: 'middle',
    fontSize: 9, fontFace: 'Segoe UI', color: COLORS.success, bold: true
  });

  slide.addText('Greedy Profit Maximizer', {
    x: leftX + 0.3, y: leftY + 0.65, w: 5.1, h: 0.45,
    fontSize: 16, fontFace: 'Segoe UI', color: COLORS.textPrimary, bold: true
  });

  const tier1Points = [
    { label: 'Single Pre-Sort', text: 'Sorts all n jobs once by profit descending, breaking ties by ascending Job ID for complete determinism.' },
    { label: 'Latest Feasible Slot Allocation', text: 'Scans backward from deadline d down to 1, claiming the latest free available slot. Preserves early slots for tighter deadlines.' },
    { label: 'Matroid Optimality', text: 'Provably yields the global maximum profit via the classic Greedy Exchange Argument.' },
    { label: 'Deterministic Rejection', text: 'Tracks unassigned jobs and exports them in their exact original input sequence.' }
  ];

  tier1Points.forEach((p, idx) => {
    const py = leftY + 1.25 + (idx * 0.88);
    slide.addText(p.label, {
      x: leftX + 0.3, y: py, w: 5.1, h: 0.28,
      fontSize: 11, fontFace: 'Segoe UI', color: COLORS.accentCyan, bold: true
    });
    slide.addText(p.text, {
      x: leftX + 0.3, y: py + 0.26, w: 5.1, h: 0.58,
      fontSize: 10, fontFace: 'Segoe UI', color: COLORS.textSecondary
    });
  });

  // Right: Tier 2 Resilience Engine
  const rightX = 6.833, rightY = 1.7, rightW = 5.7, rightH = 4.9;
  addCard(slide, rightX, rightY, rightW, rightH);

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: rightX + 0.3, y: rightY + 0.25, w: 2.4, h: 0.32, rectRadius: 0.1,
    fill: { color: '0F172A' }, line: { color: COLORS.danger, width: 1 }
  });
  slide.addText('TIER 2: RESILIENCE ENGINE', {
    x: rightX + 0.3, y: rightY + 0.25, w: 2.4, h: 0.32, align: 'center', valign: 'middle',
    fontSize: 9, fontFace: 'Segoe UI', color: COLORS.danger, bold: true
  });

  slide.addText('Critical-Slot Search Engine', {
    x: rightX + 0.3, y: rightY + 0.65, w: 5.1, h: 0.45,
    fontSize: 16, fontFace: 'Segoe UI', color: COLORS.textPrimary, bold: true
  });

  const tier2Points = [
    { label: 'Systematic Candidate Testing', text: 'Iterates through every originally available slot s in [1..H], including slots left unoccupied in the baseline schedule.' },
    { label: 'Isolated Schedule Rebuilding', text: 'Marks slot s unavailable and rebuilds an optimal schedule from the pre-sorted job list in O(n * H).' },
    { label: 'Exact Delta Computation', text: 'Evaluates Loss(s) = BaseProfit - CandidateProfit(s) and records the maximum revenue vulnerability.' },
    { label: 'Deterministic Tie Resolution', text: 'Ascending iteration order with strict comparison ensures that equal maximum losses tie-break to the smallest slot number.' }
  ];

  tier2Points.forEach((p, idx) => {
    const py = rightY + 1.25 + (idx * 0.88);
    slide.addText(p.label, {
      x: rightX + 0.3, y: py, w: 5.1, h: 0.28,
      fontSize: 11, fontFace: 'Segoe UI', color: COLORS.warning, bold: true
    });
    slide.addText(p.text, {
      x: rightX + 0.3, y: py + 0.26, w: 5.1, h: 0.58,
      fontSize: 10, fontFace: 'Segoe UI', color: COLORS.textSecondary
    });
  });

  addFooter(slide, 4);
  slide.addNotes('Our solution consists of two cleanly separated algorithmic tiers. Tier 1 computes the optimal baseline schedule using greedy backward slot assignment. Tier 2 conducts systematic single-slot failure perturbation. By reusing the sorted job list across all candidate evaluations, we achieve tight asymptotic complexity.');
}

// ==========================================
// SLIDE 5: MAIN WORKFLOW & PIPELINE
// ==========================================
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.bg };
  addHeader(slide, '04 / Workflow Pipeline', 'Main Workflow: End-to-End Execution Flow', 'Step-by-step pipeline from input parsing to failure mitigation output.');

  // 5 Step Horizontal Flow
  const steps = [
    {
      num: 'STEP 1',
      title: 'Input Ingestion',
      color: COLORS.accentCyan,
      details: 'Reads n, H, k, unavailable slots, and job tuples (id, deadline, profit). Validates constraints.'
    },
    {
      num: 'STEP 2',
      title: 'Deterministic Sort',
      color: COLORS.accentIndigo,
      details: 'Sorts jobs once: Profit descending (primary), Job ID ascending (tie-breaker). Precomputes priority queue.'
    },
    {
      num: 'STEP 3',
      title: 'Baseline Greedy',
      color: COLORS.success,
      details: 'Iterates through sorted jobs. Scans slots min(d, H) down to 1. Claims latest free slot; collects rejected jobs.'
    },
    {
      num: 'STEP 4',
      title: 'Slot Perturbation',
      color: COLORS.warning,
      details: 'For each candidate slot s, clones availability with s disabled. Re-runs greedy solver without re-sorting.'
    },
    {
      num: 'STEP 5',
      title: 'Critical Report',
      color: COLORS.danger,
      details: 'Selects slot with max loss (ties resolved by min index). Emits 7 standardized output records.'
    }
  ];

  steps.forEach((s, i) => {
    const x = 0.8 + i * 2.42;
    const y = 1.75;
    const w = 2.22;
    const h = 3.4;
    addCard(slide, x, y, w, h);

    // Number Badge
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: x + 0.2, y: y + 0.2, w: 0.9, h: 0.3, rectRadius: 0.08,
      fill: { color: '0F172A' }, line: { color: s.color, width: 1 }
    });
    slide.addText(s.num, {
      x: x + 0.2, y: y + 0.2, w: 0.9, h: 0.3, align: 'center', valign: 'middle',
      fontSize: 8.5, fontFace: 'Segoe UI', color: s.color, bold: true
    });

    slide.addText(s.title, {
      x: x + 0.2, y: y + 0.62, w: 1.82, h: 0.45,
      fontSize: 13, fontFace: 'Segoe UI', color: COLORS.textPrimary, bold: true
    });

    slide.addText(s.details, {
      x: x + 0.2, y: y + 1.15, w: 1.82, h: 2.0,
      fontSize: 10, fontFace: 'Segoe UI', color: COLORS.textSecondary
    });

    // Arrow indicator between steps
    if (i < steps.length - 1) {
      slide.addText('>', {
        x: x + 2.22, y: y + 1.3, w: 0.2, h: 0.4, align: 'center', valign: 'middle',
        fontSize: 14, fontFace: 'Segoe UI', color: COLORS.textMuted, bold: true
      });
    }
  });

  // Output Schema Box
  addCard(slide, 0.8, 5.35, 11.733, 1.4, '0F172A', COLORS.border);
  slide.addText('Standardized 7-Line Output Schema', {
    x: 1.1, y: 5.45, w: 4.5, h: 0.3,
    fontSize: 11, fontFace: 'Segoe UI', color: COLORS.accentCyan, bold: true
  });

  const outputExample = 'BASE_PROFIT 142\nBASE_SLOTS 3 1 5\nREJECTED 2 2 4';
  const outputExample2 = 'CRITICAL_SLOT 1\nLOSS 27\nAFTER_PROFIT 115\nAFTER_SLOTS 0 1 5';

  slide.addText(outputExample, {
    x: 1.1, y: 5.75, w: 5.0, h: 0.9,
    fontSize: 10, fontFace: 'JetBrains Mono, Consolas, Courier New', color: COLORS.success
  });
  slide.addText(outputExample2, {
    x: 6.2, y: 5.75, w: 6.0, h: 0.9,
    fontSize: 10, fontFace: 'JetBrains Mono, Consolas, Courier New', color: COLORS.warning
  });

  addFooter(slide, 5);
  slide.addNotes('This slide illustrates our full 5-stage pipeline. Notice step 2: we sort only once. Candidate rebuilding in step 4 reuses this sorted list, allowing each candidate pass to execute in O(n*H) time instead of O(n*H log n). The pipeline produces a deterministic 7-line output protocol.');
}

// ==========================================
// SLIDE 6: COMPLEXITY & CORRECTNESS
// ==========================================
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.bg };
  addHeader(slide, '05 / Complexity & Proofs', 'Theoretical Guarantees & Runtime Bounds', 'Mathematical proof of optimality combined with tight asymptotic complexity bounds.');

  // Left: Complexity Table
  const leftX = 0.8, leftY = 1.7, leftW = 6.2, leftH = 4.9;
  addCard(slide, leftX, leftY, leftW, leftH);

  slide.addText('Asymptotic Complexity Breakdown', {
    x: leftX + 0.3, y: leftY + 0.25, w: 5.6, h: 0.35,
    fontSize: 14, fontFace: 'Segoe UI', color: COLORS.accentCyan, bold: true
  });

  const tableRows = [
    [
      { text: 'Execution Phase', options: { bold: true, color: COLORS.textPrimary, fill: { color: '0F172A' } } },
      { text: 'Time Bound', options: { bold: true, color: COLORS.accentCyan, fill: { color: '0F172A' } } },
      { text: 'Space Bound', options: { bold: true, color: COLORS.accentIndigo, fill: { color: '0F172A' } } },
      { text: 'Operational Detail', options: { bold: true, color: COLORS.textSecondary, fill: { color: '0F172A' } } }
    ],
    [
      { text: '1. Sort Jobs' },
      { text: 'O(n log n)', options: { color: COLORS.accentCyan, bold: true } },
      { text: 'O(n)', options: { color: COLORS.accentIndigo } },
      { text: 'Sort by profit desc, ID asc once' }
    ],
    [
      { text: '2. Baseline Greedy' },
      { text: 'O(n * H)', options: { color: COLORS.accentCyan, bold: true } },
      { text: 'O(H)', options: { color: COLORS.accentIndigo } },
      { text: 'Linear scan of slots per job' }
    ],
    [
      { text: '3. Critical Search' },
      { text: 'O(n * H^2)', options: { color: COLORS.danger, bold: true } },
      { text: 'O(H)', options: { color: COLORS.accentIndigo } },
      { text: 'At most H rebuilds * O(n * H)' }
    ],
    [
      { text: 'Total Overall', options: { bold: true, color: COLORS.textPrimary } },
      { text: 'O(n log n + n*H^2)', options: { bold: true, color: COLORS.success } },
      { text: 'O(n + H)', options: { bold: true, color: COLORS.accentIndigo } },
      { text: 'Sub-millisecond on target sizes' }
    ]
  ];

  slide.addTable(tableRows, {
    x: leftX + 0.25, y: leftY + 0.75, w: 5.7,
    colW: [1.3, 1.4, 0.9, 2.1],
    rowH: [0.38, 0.42, 0.42, 0.42, 0.48],
    border: { pt: 0.75, color: COLORS.border },
    fill: { color: COLORS.cardBg },
    fontSize: 9.5, fontFace: 'Segoe UI', color: COLORS.textSecondary
  });

  // Benchmarks note
  slide.addText('Practical Constraints & Benchmark Execution:', {
    x: leftX + 0.3, y: leftY + 3.1, w: 5.6, h: 0.28,
    fontSize: 10.5, fontFace: 'Segoe UI', color: COLORS.warning, bold: true
  });

  slide.addText('• Maximum Problem Specs: n <= 200 jobs, H <= 60 time slots.\n• Maximum Operations: ~200 * 3,600 = 720,000 elementary operations.\n• Real-World Latency: Under 2 milliseconds in Node.js and Python.\n• Correctness over naive: Avoids re-sorting jobs per candidate (O(H * n log n)).', {
    x: leftX + 0.3, y: leftY + 3.42, w: 5.6, h: 1.3,
    fontSize: 9.5, fontFace: 'Segoe UI', color: COLORS.textSecondary
  });

  // Right: Proof Sketch
  const rightX = 7.25, rightY = 1.7, rightW = 5.283, rightH = 4.9;
  addCard(slide, rightX, rightY, rightW, rightH);

  slide.addText('Formal Correctness Arguments', {
    x: rightX + 0.3, y: rightY + 0.25, w: 4.6, h: 0.35,
    fontSize: 14, fontFace: 'Segoe UI', color: COLORS.accentIndigo, bold: true
  });

  const proofs = [
    {
      title: 'Lemma 1: Exchange Optimality',
      body: 'Processing jobs by descending profit and allocating the latest free feasible slot preserves the maximum feasible capacity for earlier deadlines. By standard matroid exchange, no alternate assignment yields higher total profit.'
    },
    {
      title: 'Lemma 2: Exhaustive Candidate Coverage',
      body: 'The single lost slot must belong to the initially available slots. Evaluating all candidate slots s in Available ensures the true critical slot is evaluated without heuristic pruning error.'
    },
    {
      title: 'Lemma 3: Rebuild Soundness',
      body: 'Rebuilding afresh from the pre-sorted list without slot s produces the exact optimal contingency schedule, correctly capturing job rescheduling effects and secondary displacements.'
    }
  ];

  proofs.forEach((pf, idx) => {
    const py = rightY + 0.75 + (idx * 1.32);
    slide.addText(pf.title, {
      x: rightX + 0.3, y: py, w: 4.6, h: 0.26,
      fontSize: 11, fontFace: 'Segoe UI', color: COLORS.accentCyan, bold: true
    });
    slide.addText(pf.body, {
      x: rightX + 0.3, y: py + 0.26, w: 4.6, h: 0.95,
      fontSize: 9.5, fontFace: 'Segoe UI', color: COLORS.textSecondary
    });
  });

  addFooter(slide, 6);
  slide.addNotes('On this slide we establish formal proofs and computational bounds. The previous documentation in the literature often assumed O(H * n log n) by needlessly re-sorting jobs for every candidate. Because job ordering is invariant to slot loss, we sort once, achieving a clean O(n log n + n * H^2) runtime bound.');
}

// ==========================================
// SLIDE 7: SYSTEM ARCHITECTURE
// ==========================================
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.bg };
  addHeader(slide, '06 / System Architecture', 'Cross-Platform Dual-Runtime Architecture', 'Shared algorithmic core powering high-speed CLI engines and a zero-dependency web platform.');

  // 3 Horizontal Architecture Tiers
  const tiers = [
    {
      layer: 'PRESENTATION & VISUALIZATION LAYER',
      title: 'Interactive Web Dashboard (SPA)',
      tech: 'HTML5 • Modern CSS Custom Properties • Vanilla ES2022 • Hash Router',
      color: COLORS.accentCyan,
      items: [
        'Responsive Hash Router: #/overview, #/jobs, #/visualization, #/critical, #/tests, #/complexity',
        'State Management: Reactive in-memory state engine without React, Vue, or heavy bundle overhead',
        'Zero Runtime Dependencies: 100% self-contained, loads in < 30ms, offline-first execution'
      ]
    },
    {
      layer: 'ISOMORPHIC SCHEDULING ENGINE',
      title: 'Dual-Engine Parity Core',
      tech: 'Python 3 Reference CLI (deadline_scheduler.py) + JS Engine (assets/js/algorithm.js)',
      color: COLORS.success,
      items: [
        'Shared Algorithmic Logic: Universal CommonJS / ES Module running natively in browser and Node.js',
        'Reference CLI Implementation: High-performance stdin/stdout stream processing for automated evaluation',
        'Deterministic Tie-Breaker: Bit-level output parity between Python and JavaScript runtimes'
      ]
    },
    {
      layer: 'VERIFICATION & QUALITY ASSURANCE',
      title: 'Automated Parity & Fuzzing Harness',
      tech: 'Node Test Runner • Python Unittest • 120 Shuffled Stress Test Scenarios',
      color: COLORS.warning,
      items: [
        'Cross-Language Parity: Automated test suite feeding identical inputs into Python and Node.js',
        'Fuzzing & Edge Cases: Verifies all-slots-blocked, single-slot horizons, and multi-tier profit ties',
        'In-Browser Test View: Enables clients and evaluators to execute full test suites in the browser'
      ]
    }
  ];

  tiers.forEach((t, i) => {
    const x = 0.8;
    const y = 1.7 + i * 1.62;
    const w = 11.733;
    const h = 1.45;
    addCard(slide, x, y, w, h);

    slide.addText(t.layer, {
      x: x + 0.3, y: y + 0.15, w: 4.5, h: 0.22,
      fontSize: 8.5, fontFace: 'Segoe UI', color: t.color, bold: true, letterSpacing: 1
    });

    slide.addText(t.title, {
      x: x + 0.3, y: y + 0.35, w: 4.5, h: 0.35,
      fontSize: 13, fontFace: 'Segoe UI', color: COLORS.textPrimary, bold: true
    });

    slide.addText(t.tech, {
      x: x + 0.3, y: y + 0.72, w: 4.5, h: 0.6,
      fontSize: 9.5, fontFace: 'Segoe UI', color: COLORS.textMuted
    });

    // Right list
    t.items.forEach((item, idx) => {
      slide.addShape(pptx.shapes.OVAL, {
        x: x + 5.0, y: y + 0.24 + (idx * 0.38), w: 0.07, h: 0.07,
        fill: { color: t.color }, line: { color: t.color }
      });
      slide.addText(item, {
        x: x + 5.2, y: y + 0.18 + (idx * 0.38), w: 6.2, h: 0.34,
        fontSize: 9.5, fontFace: 'Segoe UI', color: COLORS.textSecondary
      });
    });
  });

  addFooter(slide, 7);
  slide.addNotes('Our system architecture is structured across three clean layers: a zero-dependency web dashboard at the top, a dual-runtime scheduling engine in the middle, and a cross-language parity harness at the bottom. This ensures algorithm correctness while delivering an accessible interactive interface.');
}

// ==========================================
// SLIDE 8: KEY FEATURES
// ==========================================
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.bg };
  addHeader(slide, '07 / Key Features', 'Interactive Visualization & Decision Tools', 'Core interactive capabilities transforming theoretical algorithms into actionable operational tools.');

  // 4 Feature Cards (2x2 Grid)
  const features = [
    {
      title: 'Step-by-Step Greedy Visualizer',
      badge: 'ALGORITHM VISUALIZER',
      color: COLORS.accentCyan,
      desc: 'Watch the greedy algorithm execute step-by-step. Includes Play, Pause, Step-Forward, and Step-Backward controls. Animates candidate job sorting, backward slot search, and real-time slot claiming with color-coded status badges.'
    },
    {
      title: 'Critical Slot Loss Bar Chart',
      badge: 'SENSITIVITY ANALYTICS',
      color: COLORS.danger,
      desc: 'Dynamic SVG sensitivity bar chart illustrating profit loss for every candidate slot across the horizon. Highlights the critical slot in bright crimson and displays exact before-and-after revenue deltas.'
    },
    {
      title: 'Dual Timeline Gantt View',
      badge: 'SCHEDULE COMPARISON',
      color: COLORS.warning,
      desc: 'Side-by-side comparative timelines displaying the Baseline Optimal Schedule against the Rebuilt After-Loss Schedule. Instantly reveals which jobs shifted, which survived, and which were rejected.'
    },
    {
      title: 'Dynamic Job & Horizon Configurator',
      badge: 'REAL-TIME SIMULATION',
      color: COLORS.accentIndigo,
      desc: 'Interactive controls allowing users to adjust time horizon H, toggle unavailable slots, and perform CRUD operations on jobs. Schedule recalculates instantly in under 2ms upon any state change.'
    }
  ];

  features.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.8 + col * 6.0;
    const y = 1.7 + row * 2.5;
    const w = 5.733;
    const h = 2.3;
    addCard(slide, x, y, w, h);

    slide.addText(f.badge, {
      x: x + 0.3, y: y + 0.2, w: 4.5, h: 0.22,
      fontSize: 8.5, fontFace: 'Segoe UI', color: f.color, bold: true, letterSpacing: 1
    });

    slide.addText(f.title, {
      x: x + 0.3, y: y + 0.42, w: 5.1, h: 0.35,
      fontSize: 14, fontFace: 'Segoe UI', color: COLORS.textPrimary, bold: true
    });

    slide.addText(f.desc, {
      x: x + 0.3, y: y + 0.85, w: 5.1, h: 1.3,
      fontSize: 10, fontFace: 'Segoe UI', color: COLORS.textSecondary
    });
  });

  addFooter(slide, 8);
  slide.addNotes('Here are the four key user-facing features. The step-by-step visualizer lets students and engineers trace the backward scan in action. The critical-slot bar chart provides executive-level sensitivity analysis. The dual timeline allows instant visual comparison, and the live configurator enables dynamic sandbox experimentation.');
}

// ==========================================
// SLIDE 9: SOME FEATURES / DEEP DIVE
// ==========================================
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.bg };
  addHeader(slide, '08 / Deep-Dive Features', 'Engineering Excellence & Platform Details', 'Specialized architectural features ensuring production reliability, compliance, and developer convenience.');

  // 4 Horizontal strips
  const deepFeatures = [
    {
      badge: 'TESTING SUITE',
      title: 'In-Browser Test Verification Suite (#/tests)',
      desc: 'Users and instructors can execute the complete official algorithm test suite directly inside the web browser. The dashboard runs edge cases (all slots unavailable, single slot, zero-loss candidates) and displays detailed microsecond execution benchmarks and assertion checks with zero terminal commands required.',
      color: COLORS.success
    },
    {
      badge: 'DATA PORTABILITY',
      title: 'Standard CLI Input/Output Exporter',
      desc: 'Full interoperability with standard competitive programming and grading benchmarks. Paste raw space-delimited input directly into the configuration modal, or export the active schedule state to standard test format or JSON with a single click.',
      color: COLORS.accentCyan
    },
    {
      badge: 'UI/UX SYSTEM',
      title: 'Accessible Dark/Light Theming System',
      desc: 'Engineered with WCAG AA compliant contrast ratios across dark mode (#0B1120) and light mode (#F8FAFC). Persists user preference via localStorage and features responsive layouts with collapsible sidebar navigation for mobile, tablet, and desktop.',
      color: COLORS.warning
    },
    {
      badge: 'ROUTING & STATE',
      title: 'Hash-Based Zero-Reload Navigation',
      desc: 'Utilizes seamless hash routing (#/overview, #/jobs, #/visualization, #/critical, #/tests, #/complexity, #/documentation). Allows deep-linking to specific views without server-side rewrite rules, enabling instant deployment on GitHub Pages or static S3 buckets.',
      color: COLORS.accentIndigo
    }
  ];

  deepFeatures.forEach((df, i) => {
    const x = 0.8;
    const y = 1.7 + i * 1.25;
    const w = 11.733;
    const h = 1.15;
    addCard(slide, x, y, w, h);

    slide.addText(df.badge, {
      x: x + 0.3, y: y + 0.16, w: 2.2, h: 0.2,
      fontSize: 8, fontFace: 'Segoe UI', color: df.color, bold: true, letterSpacing: 1
    });

    slide.addText(df.title, {
      x: x + 0.3, y: y + 0.38, w: 3.5, h: 0.6,
      fontSize: 12, fontFace: 'Segoe UI', color: COLORS.textPrimary, bold: true
    });

    slide.addText(df.desc, {
      x: x + 3.8, y: y + 0.16, w: 7.6, h: 0.88,
      fontSize: 9.5, fontFace: 'Segoe UI', color: COLORS.textSecondary
    });
  });

  addFooter(slide, 9);
  slide.addNotes('Diving deeper into additional engineering features: we included an in-browser test runner, standardized CLI input/output support, responsive dark/light theming, and clean hash routing. These refinements make the tool immediately usable in both academic and production settings.');
}

// ==========================================
// SLIDE 10: EXPERIMENTAL IMPACT & RESULTS
// ==========================================
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.bg };
  addHeader(slide, '09 / Impact & Results', 'Quantitative Results & Experimental Validation', 'Empirical validation across official test benches, stress suites, and operational case studies.');

  // Left Column: Official Case Study Walkthrough
  const leftX = 0.8, leftY = 1.7, leftW = 5.7, leftH = 4.9;
  addCard(slide, leftX, leftY, leftW, leftH);

  slide.addText('Case Study: Official Sample 1 Analysis', {
    x: leftX + 0.3, y: leftY + 0.22, w: 5.1, h: 0.35,
    fontSize: 14, fontFace: 'Segoe UI', color: COLORS.accentCyan, bold: true
  });

  slide.addText('Input: n = 5 jobs, H = 3 slots, k = 0 unavailable slots.', {
    x: leftX + 0.3, y: leftY + 0.62, w: 5.1, h: 0.28,
    fontSize: 10, fontFace: 'Segoe UI', color: COLORS.textMuted
  });

  // Table of Sample 1 Jobs
  const sampleRows = [
    [
      { text: 'Job ID', options: { bold: true, fill: { color: '0F172A' }, color: COLORS.textPrimary } },
      { text: 'Deadline', options: { bold: true, fill: { color: '0F172A' }, color: COLORS.textPrimary } },
      { text: 'Profit', options: { bold: true, fill: { color: '0F172A' }, color: COLORS.textPrimary } },
      { text: 'Baseline Status', options: { bold: true, fill: { color: '0F172A' }, color: COLORS.textPrimary } }
    ],
    [{ text: 'Job 1' }, { text: '2' }, { text: '100' }, { text: 'Slot 2 (Claimed)', options: { color: COLORS.success } }],
    [{ text: 'Job 3' }, { text: '2' }, { text: '27' }, { text: 'Slot 1 (Claimed)', options: { color: COLORS.success } }],
    [{ text: 'Job 4' }, { text: '1' }, { text: '25' }, { text: 'Rejected (No slot)', options: { color: COLORS.danger } }],
    [{ text: 'Job 2' }, { text: '1' }, { text: '19' }, { text: 'Rejected (No slot)', options: { color: COLORS.danger } }],
    [{ text: 'Job 5' }, { text: '3' }, { text: '15' }, { text: 'Slot 3 (Claimed)', options: { color: COLORS.success } }]
  ];

  slide.addTable(sampleRows, {
    x: leftX + 0.25, y: leftY + 1.0, w: 5.2,
    colW: [0.9, 1.0, 0.9, 2.4], rowH: [0.3, 0.28, 0.28, 0.28, 0.28, 0.28],
    border: { pt: 0.75, color: COLORS.border }, fill: { color: COLORS.cardBg },
    fontSize: 9, fontFace: 'Segoe UI', color: COLORS.textSecondary
  });

  slide.addText('Key Findings on Sample 1:', {
    x: leftX + 0.3, y: leftY + 2.9, w: 5.1, h: 0.26,
    fontSize: 10.5, fontFace: 'Segoe UI', color: COLORS.warning, bold: true
  });

  slide.addText('• Optimal Baseline: Profit = 142 (Jobs 3, 1, 5). Rejected = 2 jobs (2, 4).\n• Critical Slot Tie: Removing Slot 1 causes loss of 27; removing Slot 2 causes loss of 27. Tied!\n• Deterministic Resolution: Slot 1 is chosen (min slot index).\n• After-Loss Retention: 115 profit successfully protected.', {
    x: leftX + 0.3, y: leftY + 3.22, w: 5.1, h: 1.45,
    fontSize: 9.5, fontFace: 'Segoe UI', color: COLORS.textSecondary
  });

  // Right Column: Parity & Test Suite Benchmarks
  const rightX = 6.833, rightY = 1.7, rightW = 5.7, rightH = 4.9;
  addCard(slide, rightX, rightY, rightW, rightH);

  slide.addText('Verification Metrics & Parity Suite', {
    x: rightX + 0.3, y: rightY + 0.22, w: 5.1, h: 0.35,
    fontSize: 14, fontFace: 'Segoe UI', color: COLORS.success, bold: true
  });

  const metrics = [
    { num: '100%', label: 'Test Parity Rate', desc: 'Identical outputs across 120 randomized stress test cases' },
    { num: '< 2ms', label: 'Maximum Latency', desc: 'Worst-case compute time on maximum constraints (n=200, H=60)' },
    { num: '120+', label: 'Stress Scenarios', desc: 'Tested with shuffled job permutations, tie-breakers, and edge cases' },
    { num: '0', label: 'Runtime Dependencies', desc: 'Zero external packages required to run the web dashboard' }
  ];

  metrics.forEach((m, idx) => {
    const mx = rightX + 0.3 + (idx % 2) * 2.65;
    const my = rightY + 0.75 + Math.floor(idx / 2) * 1.3;
    addCard(slide, mx, my, 2.45, 1.15, '0F172A', COLORS.border);

    slide.addText(m.num, {
      x: mx + 0.15, y: my + 0.1, w: 2.15, h: 0.4,
      fontSize: 20, fontFace: 'Segoe UI', color: COLORS.accentCyan, bold: true
    });
    slide.addText(m.label, {
      x: mx + 0.15, y: my + 0.52, w: 2.15, h: 0.25,
      fontSize: 10, fontFace: 'Segoe UI', color: COLORS.textPrimary, bold: true
    });
    slide.addText(m.desc, {
      x: mx + 0.15, y: my + 0.78, w: 2.15, h: 0.35,
      fontSize: 8.5, fontFace: 'Segoe UI', color: COLORS.textMuted
    });
  });

  // Resilience impact banner
  addCard(slide, rightX + 0.3, rightY + 3.55, 5.1, 1.1, '162032', COLORS.accentIndigo);
  slide.addText('BUSINESS & ENGINEERING VALUE', {
    x: rightX + 0.45, y: rightY + 3.65, w: 4.8, h: 0.22,
    fontSize: 8.5, fontFace: 'Segoe UI', color: COLORS.accentIndigo, bold: true, letterSpacing: 1
  });
  slide.addText('Transforms scheduling from a passive planning tool into an active risk management system. Teams know exactly which resource window requires standby redundancy before an incident occurs.', {
    x: rightX + 0.45, y: rightY + 3.9, w: 4.8, h: 0.65,
    fontSize: 9.5, fontFace: 'Segoe UI', color: COLORS.textSecondary
  });

  addFooter(slide, 10);
  slide.addNotes('This slide details empirical impact. In Sample 1, both slot 1 and slot 2 tie at 27 profit loss. Our deterministic rule selects slot 1, retaining 115 profit. On the right, our test metrics show 100% cross-language parity across 120 randomized scenarios and sub-2 millisecond runtimes.');
}

// ==========================================
// SLIDE 11: LIVE DEMO ACCESS
// ==========================================
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.bg };
  addHeader(slide, '10 / Live Demo & Access', 'Live Demo Access & Execution Guide', 'Deploy or run the Deadline Scheduler platform locally or directly on the web.');

  // 3 Access Methods
  const accessCards = [
    {
      title: '1. Hosted Cloud Demo',
      badge: 'INSTANT WEB ACCESS',
      color: COLORS.accentCyan,
      details: [
        'Public Web URL: Available 24/7 on GitHub Pages / Vercel static hosting.',
        'URL: https://vennuprajwal.github.io/Deadline-Scheduler/',
        'No installation or setup required. Zero cookies, zero tracking.',
        'Full desktop, tablet, and mobile responsive layout support.'
      ]
    },
    {
      title: '2. Local Web Dashboard',
      badge: 'OFFLINE / LOCAL SERVER',
      color: COLORS.success,
      details: [
        'Clone the repository and start an instant local web server:',
        'git clone https://github.com/vennuprajwal/Deadline-Scheduler.git',
        'python -m http.server 8080',
        'Open http://localhost:8080 or launch dashboard.html directly.'
      ]
    },
    {
      title: '3. Command-Line Reference',
      badge: 'CLI AUTOMATION & GRADING',
      color: COLORS.warning,
      details: [
        'Run the Python reference implementation via standard streams:',
        'python deadline_scheduler.py < input.txt',
        'Windows PowerShell: Get-Content input.txt | python deadline_scheduler.py',
        'Runs all tests: npm test  or  python test_scheduler.py'
      ]
    }
  ];

  accessCards.forEach((ac, i) => {
    const x = 0.8 + i * 4.0;
    const y = 1.7;
    const w = 3.733;
    const h = 4.8;
    addCard(slide, x, y, w, h);

    slide.addText(ac.badge, {
      x: x + 0.25, y: y + 0.2, w: w - 0.5, h: 0.22,
      fontSize: 8.5, fontFace: 'Segoe UI', color: ac.color, bold: true, letterSpacing: 1
    });

    slide.addText(ac.title, {
      x: x + 0.25, y: y + 0.45, w: w - 0.5, h: 0.4,
      fontSize: 14, fontFace: 'Segoe UI', color: COLORS.textPrimary, bold: true
    });

    ac.details.forEach((dt, idx) => {
      const isCode = dt.includes('http') || dt.includes('git') || dt.includes('python') || dt.includes('npm');
      slide.addShape(pptx.shapes.OVAL, {
        x: x + 0.25, y: y + 1.1 + (idx * 0.9), w: 0.08, h: 0.08,
        fill: { color: ac.color }, line: { color: ac.color }
      });
      slide.addText(dt, {
        x: x + 0.45, y: y + 0.98 + (idx * 0.9), w: w - 0.7, h: 0.82,
        fontSize: isCode ? 9.5 : 10,
        fontFace: isCode ? 'JetBrains Mono, Consolas, Courier New' : 'Segoe UI',
        color: isCode ? COLORS.accentCyan : COLORS.textSecondary
      });
    });
  });

  addFooter(slide, 11);
  slide.addNotes('Accessing the platform is completely frictionless. You can open the live hosted web app at vennuprajwal.github.io/Deadline-Scheduler, launch dashboard.html locally on your machine with python http.server, or execute the CLI directly via standard pipes.');
}

// ==========================================
// SLIDE 12: SOURCE CODE & ROADMAP
// ==========================================
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.bg };
  addHeader(slide, '11 / Source & Roadmap', 'Source Code, Documentation & Future Work', 'Open-source repository resources, formal documentation, and research extensions.');

  // Left Column: Source Links & Documentation
  const leftX = 0.8, leftY = 1.7, leftW = 5.7, leftH = 4.9;
  addCard(slide, leftX, leftY, leftW, leftH);

  slide.addText('Open Source Project Hub', {
    x: leftX + 0.3, y: leftY + 0.25, w: 5.1, h: 0.35,
    fontSize: 14, fontFace: 'Segoe UI', color: COLORS.accentCyan, bold: true
  });

  const links = [
    {
      title: 'GitHub Repository',
      url: 'https://github.com/vennuprajwal/Deadline-Scheduler',
      desc: 'Complete source code, algorithm engines, interactive dashboard, and automated test runners.'
    },
    {
      title: 'Comprehensive Technical Documentation',
      url: 'code_doc.md / code_doc.pdf (in repository)',
      desc: 'In-depth problem analysis, mathematical proofs, worked examples, and edge-case catalogs.'
    },
    {
      title: 'Live Interactive Dashboard',
      url: 'https://vennuprajwal.github.io/Deadline-Scheduler/',
      desc: 'Hosted static progressive web app with zero dependencies and dark/light theming.'
    }
  ];

  links.forEach((lk, idx) => {
    const ly = leftY + 0.75 + (idx * 1.32);
    slide.addText(lk.title, {
      x: leftX + 0.3, y: ly, w: 5.1, h: 0.26,
      fontSize: 11, fontFace: 'Segoe UI', color: COLORS.textPrimary, bold: true
    });
    slide.addText(lk.url, {
      x: leftX + 0.3, y: ly + 0.28, w: 5.1, h: 0.28,
      fontSize: 9.5, fontFace: 'JetBrains Mono, Consolas, Courier New', color: COLORS.accentCyan, bold: true
    });
    slide.addText(lk.desc, {
      x: leftX + 0.3, y: ly + 0.58, w: 5.1, h: 0.65,
      fontSize: 9.5, fontFace: 'Segoe UI', color: COLORS.textSecondary
    });
  });

  // Right Column: Future Research & Extensions
  const rightX = 6.833, rightY = 1.7, rightW = 5.7, rightH = 4.9;
  addCard(slide, rightX, rightY, rightW, rightH);

  slide.addText('Future Development Roadmap', {
    x: rightX + 0.3, y: rightY + 0.25, w: 5.1, h: 0.35,
    fontSize: 14, fontFace: 'Segoe UI', color: COLORS.accentIndigo, bold: true
  });

  const roadmaps = [
    {
      title: '1. Multi-Processor / Multi-Machine Scheduling',
      desc: 'Extend single-slot horizon H to m parallel processors, allowing up to m concurrent jobs per time slot with cross-machine rebalancing.'
    },
    {
      title: '2. Online Streaming Job Arrivals',
      desc: 'Transition from static offline batch scheduling to online competitive algorithms handling real-time job arrival distributions.'
    },
    {
      title: '3. Disjoint Set Union (DSU) Optimization',
      desc: 'Integrate tree-based path compression to reduce greedy baseline allocation to near-linear O(n * alpha(H)) runtime.'
    },
    {
      title: '4. Multi-Slot Failure Resilience (k-Slot Loss)',
      desc: 'Model concurrent disruptions where combinations of k slots fail simultaneously, utilizing integer linear programming bounds.'
    }
  ];

  roadmaps.forEach((rm, idx) => {
    const ry = rightY + 0.72 + (idx * 1.0);
    slide.addText(rm.title, {
      x: rightX + 0.3, y: ry, w: 5.1, h: 0.26,
      fontSize: 11, fontFace: 'Segoe UI', color: COLORS.warning, bold: true
    });
    slide.addText(rm.desc, {
      x: rightX + 0.3, y: ry + 0.26, w: 5.1, h: 0.68,
      fontSize: 9.5, fontFace: 'Segoe UI', color: COLORS.textSecondary
    });
  });

  addFooter(slide, 12);
  slide.addNotes('Thank you for your time. In summary, Deadline Scheduler provides a complete, mathematically verified, and interactive framework for optimal scheduling and critical-slot resilience analysis. We invite you to explore the GitHub repository, read code_doc.md, and test the live demo. We now open the floor for questions.');
}

// Write the presentation to file
const outputPath = 'Deadline_Scheduler_Presentation.pptx';
pptx.writeFile({ fileName: outputPath })
  .then(() => {
    console.log(`Presentation generated successfully: ${outputPath}`);
  })
  .catch((err) => {
    console.error('Error generating presentation:', err);
    process.exit(1);
  });
