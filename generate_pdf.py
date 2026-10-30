from fpdf import FPDF
import os


class PDF(FPDF):
    def header(self):
        self.set_font('Helvetica', 'B', 14)
        self.cell(0, 10, 'Deadline Scheduler: Survive a Lost Time Slot', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}/{{nb}}', 0, 0, 'C')

    def section_title(self, title):
        self.set_font('Helvetica', 'B', 12)
        self.cell(0, 8, title, 0, 1)
        self.set_draw_color(0, 0, 0)
        self.line(self.get_x(), self.get_y(), self.get_x() + 190, self.get_y())
        self.ln(3)

    def body_text(self, text):
        self.set_font('Helvetica', '', 10)
        self.multi_cell(0, 5, text)
        self.ln(2)

    def code_block(self, text):
        self.set_font('Courier', '', 9)
        self.set_fill_color(240, 240, 240)
        self.multi_cell(0, 4.5, text, fill=True)
        self.ln(2)

    def bullet_point(self, text):
        self.set_font('Helvetica', '', 10)
        self.cell(5, 5, '')
        self.cell(0, 5, '- ' + text, 0, 1)


def create_pdf():
    pdf = PDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # Problem Statement
    pdf.section_title('Problem Statement')
    pdf.body_text(
        'Given a set of jobs, each with a unique ID, deadline, and profit, and a set of time slots '
        '(some initially unavailable), we need to:'
    )
    pdf.bullet_point('Schedule jobs to maximize total profit (each job takes 1 slot, must be scheduled at or before its deadline)')
    pdf.bullet_point('Identify the critical slot -- the available slot whose loss would cause the maximum reduction in profit')
    pdf.bullet_point('Output baseline profit, slot assignments, rejected jobs, critical slot, loss, and post-loss profit/assignments')

    # Approach
    pdf.section_title('Approach and Algorithmic Decisions')

    pdf.section_title('Core Algorithm: Greedy Job Scheduling with Deadlines')
    pdf.body_text(
        'The problem is a variant of the classic Job Sequencing with Deadlines problem, solved optimally using a greedy approach:'
    )
    pdf.bullet_point('Sort jobs by profit in descending order \u2014 consider highest-profit jobs first')
    pdf.bullet_point('For each job, place it in the latest available slot \u2264 its deadline \u2014 this leaves earlier slots free for other jobs with tighter deadlines')
    pdf.bullet_point('Repeat until all jobs considered or no slots remain')

    pdf.body_text(
        'This greedy strategy is optimal because:'
    )
    pdf.bullet_point('Higher profit jobs should never be displaced by lower profit ones')
    pdf.bullet_point('Scheduling at the latest possible slot maximizes flexibility for remaining jobs')

    pdf.section_title('Handling Unavailable Slots')
    pdf.body_text(
        'We maintain a boolean array available_slots where True means the slot is available. '
        'Initially unavailable slots are marked False.'
    )

    pdf.section_title('Finding the Critical Slot')
    pdf.body_text(
        'For each initially available slot, we simulate its loss:'
    )
    pdf.bullet_point('Temporarily mark the slot as unavailable')
    pdf.bullet_point('Re-run the greedy scheduling algorithm')
    pdf.bullet_point('Compute profit loss = base_profit - new_profit')
    pdf.bullet_point('Track the slot with maximum loss (tie-break: smaller slot number)')

    pdf.body_text(
        'This is O(m x n log n) where m = slots, n = jobs. For typical constraints, this is efficient.'
    )

    pdf.section_title('Data Structures')
    pdf.bullet_point('Job class: Stores id, deadline, profit; implements __lt__ for sorting by profit')
    pdf.bullet_point('available_slots: List[bool] \u2014 O(1) slot availability check')
    pdf.bullet_point('slot_assignments: List[int] \u2014 job_id assigned to each slot (0 = empty)')

    # Complexity
    pdf.section_title('Time and Space Complexity')
    pdf.code_block(
        'Operation                  | Time Complexity | Space Complexity\n'
        '---------------------------|----------------|------------------\n'
        'Sorting jobs               | O(n log n)     | O(n)\n'
        'Baseline scheduling        | O(n x m)       | O(m)\n'
        'Critical slot search       | O(m x n log n) | O(m)\n'
        '---------------------------|----------------|------------------\n'
        'Total                      | O(m x n log n) | O(n + m)\n\n'
        'Where n = number of jobs, m = number of time slots.'
    )

    # Test Case 1
    pdf.section_title('Sample Test Case 1 (from problem statement)')
    pdf.body_text('Input:')
    pdf.code_block(
        '5 3 0\n'
        '1 2 100\n'
        '2 1 19\n'
        '3 2 27\n'
        '4 1 25\n'
        '5 3 15'
    )
    pdf.body_text('Output:')
    pdf.code_block(
        'BASE_PROFIT 142\n'
        'BASE_SLOTS 3 1 5\n'
        'REJECTED 2 4\n'
        'CRITICAL_SLOT 1\n'
        'LOSS 27\n'
        'AFTER_PROFIT 115\n'
        'AFTER_SLOTS 0 1 5'
    )
    pdf.body_text('Explanation:')
    pdf.bullet_point('Baseline: Jobs 3, 1, 5 scheduled in slots 1, 2, 3 -> profit = 27 + 100 + 15 = 142')
    pdf.bullet_point('Losing slot 1: best profit = 115 (loss = 27)')
    pdf.bullet_point('Losing slot 2: best profit = 115 (loss = 27)')
    pdf.bullet_point('Losing slot 3: best profit = 127 (loss = 15)')
    pdf.bullet_point('Tie between slots 1 and 2 -> choose slot 1 (smaller number)')

    # Test Case 2
    pdf.section_title('Sample Test Case 2 (from problem statement)')
    pdf.body_text('Input:')
    pdf.code_block(
        '3 3 2\n'
        '1 3\n'
        '10 1 50\n'
        '20 3 20\n'
        '30 2 10'
    )
    pdf.body_text('Output:')
    pdf.code_block(
        'BASE_PROFIT 20\n'
        'BASE_SLOTS 0 20 0\n'
        'REJECTED 10 30\n'
        'CRITICAL_SLOT 2\n'
        'LOSS 20\n'
        'AFTER_PROFIT 0\n'
        'AFTER_SLOTS 0 0 0'
    )
    pdf.body_text('Explanation:')
    pdf.bullet_point('Only slot 2 initially available (slots 1,3 unavailable)')
    pdf.bullet_point('Job 10 deadline=1 cannot use slot 2')
    pdf.bullet_point('Job 20 deadline=3 uses slot 2 -> profit = 20')
    pdf.bullet_point('Losing slot 2 leaves no usable slots -> profit = 0')

    # Test Case 3
    pdf.section_title('Test Case 3 (Original)')
    pdf.body_text('Input:')
    pdf.code_block(
        '4 4 1\n'
        '2\n'
        '10 4 100\n'
        '20 2 50\n'
        '30 3 75\n'
        '40 1 25'
    )
    pdf.body_text('Output:')
    pdf.code_block(
        'BASE_PROFIT 225\n'
        'BASE_SLOTS 10 20 30 0\n'
        'REJECTED 40\n'
        'CRITICAL_SLOT 1\n'
        'LOSS 100\n'
        'AFTER_PROFIT 125\n'
        'AFTER_SLOTS 0 20 30 0'
    )
    pdf.body_text('Explanation:')
    pdf.bullet_point('Slot 2 initially unavailable')
    pdf.bullet_point('Baseline: Job 10 in slot 1, Job 20 in slot 3, Job 30 in slot 4 -> profit = 100 + 50 + 75 = 225')
    pdf.bullet_point('Job 40 (deadline 1) rejected')
    pdf.bullet_point('Critical slot = 1 (losing it removes job 10 with profit 100)')
    pdf.bullet_point('After losing slot 1: Job 20 in slot 3, Job 30 in slot 4 -> profit = 125')

    # Test Case 4
    pdf.section_title('Test Case 4 (Original \u2014 Tie Breaking)')
    pdf.body_text('Input:')
    pdf.code_block(
        '3 3 0\n'
        '1 3 50\n'
        '2 2 50\n'
        '3 1 50'
    )
    pdf.body_text('Output:')
    pdf.code_block(
        'BASE_PROFIT 150\n'
        'BASE_SLOTS 3 2 1\n'
        'REJECTED \n'
        'CRITICAL_SLOT 1\n'
        'LOSS 50\n'
        'AFTER_PROFIT 100\n'
        'AFTER_SLOTS 0 2 1'
    )
    pdf.body_text('Explanation:')
    pdf.bullet_point('All jobs have same profit (50), all slots available')
    pdf.bullet_point('Baseline: Job 3 in slot 1, Job 2 in slot 2, Job 1 in slot 3 -> profit = 150')
    pdf.bullet_point('Losing any slot causes loss of 50 (one job)')
    pdf.bullet_point('Tie between slots 1, 2, 3 -> choose slot 1 (smallest)')

    # Test Case 5
    pdf.section_title('Test Case 5 (Original \u2014 No Jobs Can Be Scheduled After Loss)')
    pdf.body_text('Input:')
    pdf.code_block(
        '2 2 0\n'
        '1 1 100\n'
        '2 1 200'
    )
    pdf.body_text('Output:')
    pdf.code_block(
        'BASE_PROFIT 200\n'
        'BASE_SLOTS 2 0\n'
        'REJECTED 1\n'
        'CRITICAL_SLOT 1\n'
        'LOSS 200\n'
        'AFTER_PROFIT 0\n'
        'AFTER_SLOTS 0 0'
    )
    pdf.body_text('Explanation:')
    pdf.bullet_point('Both jobs have deadline 1, only slot 1 can be used')
    pdf.bullet_point('Job 2 (profit 200) gets slot 1, Job 1 rejected')
    pdf.bullet_point('Losing slot 1 -> no slots available -> profit 0')
    pdf.bullet_point('Critical slot = 1, loss = 200')

    # Member Contributions
    pdf.section_title('Member Contributions')
    pdf.body_text('Since this is an individual submission:')
    pdf.code_block(
        'Member        | Contribution\n'
        '--------------|--------------------------------------------------\n'
        '[Your Name]   | Complete algorithm design, implementation, testing, documentation'
    )

    # Files Submitted
    pdf.section_title('Files Submitted')
    pdf.bullet_point('deadline_scheduler.py -- Complete Python solution')
    pdf.bullet_point('code_doc.pdf -- This document')

    # How to Run
    pdf.section_title('How to Run')
    pdf.code_block(
        'python deadline_scheduler.py < input.txt\n\n'
        'Or pipe input directly:\n'
        'echo "5 3 0\n'
        '1 2 100\n'
        '2 1 19\n'
        '3 2 27\n'
        '4 1 25\n'
        '5 3 15" | python deadline_scheduler.py'
    )
    pdf.body_text('The program reads from stdin and writes to stdout.')

    # Save
    output_path = 'code_doc.pdf'
    pdf.output(output_path)
    print(f'PDF created: {os.path.abspath(output_path)}')


if __name__ == '__main__':
    create_pdf()