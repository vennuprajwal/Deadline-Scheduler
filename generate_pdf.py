#!/usr/bin/env python3
"""Render code_doc.md as code_doc.pdf using fpdf."""

import os
import re

try:
    from fpdf import FPDF
    from fpdf.enums import XPos, YPos
except ModuleNotFoundError:
    raise SystemExit("fpdf2 is required: python -m pip install fpdf2")

DOC_PATH = "code_doc.md"
OUTPUT_PATH = "code_doc.pdf"


class PDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 13)
        self.cell(0, 9, "Deadline Scheduler: Survive a Lost Time Slot", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_draw_color(180, 180, 180)
        self.line(10, 19, 200, 19)
        self.ln(6)

    def footer(self):
        self.set_y(-14)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, f"Page {self.page_no()}/{{nb}}", align="C", new_x=XPos.RIGHT, new_y=YPos.TOP)
        self.set_text_color(0, 0, 0)


def clean_inline(text):
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"`([^`]*)`", r"\1", text)
    text = text.replace("\u2014", "-").replace("\u2013", "-")
    return text


def write_heading(pdf, text, level):
    sizes = {1: 18, 2: 13, 3: 11}
    pdf.ln(3)
    pdf.set_font("Helvetica", "B", sizes.get(level, 10))
    pdf.multi_cell(0, 6, clean_inline(text))
    pdf.set_font("Helvetica", "", 10)
    pdf.ln(1)


def write_body(pdf, text, indent=0):
    pdf.set_font("Helvetica", "", 10)
    pdf.set_x(10 + indent)
    pdf.multi_cell(0, 5, clean_inline(text), align="L")


def write_code(pdf, lines):
    pdf.ln(1)
    pdf.set_font("Courier", "", 8)
    pdf.set_fill_color(242, 242, 242)
    for line in lines:
        pdf.set_x(10)
        pdf.multi_cell(0, 4, line.rstrip() or " ", fill=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.ln(2)


def write_table(pdf, lines):
    pdf.ln(1)
    pdf.set_font("Courier", "", 7)
    for line in lines:
        pdf.set_x(10)
        pdf.multi_cell(0, 3.5, line.rstrip())
    pdf.set_font("Helvetica", "", 10)
    pdf.ln(2)


def render_markdown(pdf, markdown):
    code_lines = []
    table_lines = []
    in_code = False
    in_table = False

    def flush_table():
        nonlocal in_table, table_lines
        if table_lines:
            write_table(pdf, table_lines)
            table_lines = []
        in_table = False

    for raw_line in markdown.splitlines():
        line = raw_line.rstrip()

        if line.startswith("```"):
            if in_code:
                write_code(pdf, code_lines)
                code_lines = []
                in_code = False
            else:
                flush_table()
                in_code = True
            continue

        if in_code:
            code_lines.append(line)
            continue

        if line.startswith("|"):
            in_table = True
            table_lines.append(line)
            continue
        if in_table:
            flush_table()

        if not line.strip():
            pdf.ln(2)
            continue

        heading = re.match(r"^(#{1,6})\s+(.*)$", line)
        if heading:
            write_heading(pdf, heading.group(2), len(heading.group(1)))
            continue

        if line.strip() in {"---", "***"}:
            pdf.ln(2)
            continue

        bullet = re.match(r"^\s*[-*]\s+(.*)$", line)
        if bullet:
            pdf.set_x(14)
            pdf.set_font("Helvetica", "", 10)
            pdf.multi_cell(0, 5, "- " + clean_inline(bullet.group(1)))
            continue

        numbered = re.match(r"^\s*\d+\.\s+(.*)$", line)
        if numbered:
            pdf.set_x(14)
            pdf.set_font("Helvetica", "", 10)
            pdf.multi_cell(0, 5, clean_inline(line.strip()))
            continue

        write_body(pdf, line)

    if in_code:
        write_code(pdf, code_lines)
    if in_table:
        flush_table()


def main():
    with open(DOC_PATH, "r", encoding="utf-8") as handle:
        markdown = handle.read()

    pdf = PDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.set_margins(10, 12, 10)
    pdf.add_page()
    render_markdown(pdf, markdown)
    pdf.output(OUTPUT_PATH)
    print(f"PDF created: {os.path.abspath(OUTPUT_PATH)}")


if __name__ == "__main__":
    main()
