# The Pancha Khosha Business Framework

A Khosha Systems e-book of checklists, step-by-step guides and fill-in templates that any business can use to build, run, fund and franchise itself. It is organised around five layers:

| Layer | Focus | Chapter |
|---|---|---|
| 1 · Annamaya | Foundation: legal entity, registrations, compliance calendar, books, cash flow | 01 |
| 2 · Pranamaya | People: hiring, appointment letters, onboarding, attendance and leave, payroll, reviews, exits | 02 |
| 3 · Manomaya | Systems: SOPs, the value ladder, product and service ideas, catalogue, pricing, digital stack | 03 |
| 4 · Vijnanamaya | Growth: one-page plan, KPIs, sales pipeline, marketing, operating rhythm | 04 |
| 5 · Anandamaya | Scale: getting investors (05) and starting your own franchise (06) | 05–06 |

Chapter 00 is a 25-point Business Health Scorecard. Chapter 07 is a 90-day implementation roadmap.

## Files

- `Pancha-Khosha-Business-Framework.pdf`: the printable e-book (A4)
- `Pancha-Khosha-Business-Framework.html`: source of the e-book (edit this, then rebuild)
- `templates/Business-Toolkit.xlsx`: every template as a working spreadsheet, with formulas and drop-downs
- `templates/csv/`: the same sheets as CSV files for Google Sheets, Notion or Airtable
- `templates/*.md`: editable onboarding checklist, attendance and leave policy, appointment letter, SOP, pitch deck and franchise manual outlines

## Rebuilding

```bash
python3 build/build_templates.py     # regenerates the workbook and CSVs (needs openpyxl)
node build/render-pdf.js             # regenerates the PDF (needs Playwright + Chromium)
```

*General guidance only, not legal, tax or investment advice. Indian compliance details were checked in November 2026. Verify them with your CA or lawyer.*
