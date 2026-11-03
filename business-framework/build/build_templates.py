"""Builds templates/Business-Toolkit.xlsx and templates/csv/*.csv.

Usage: python3 build/build_templates.py
"""
import csv
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

ROOT = Path(__file__).resolve().parent.parent / "templates"
CSV_DIR = ROOT / "csv"

LAYER_COLORS = {1: "8A5A2B", 2: "2F7D4F", 3: "2B5FA8", 4: "6A46A8", 5: "B8860B", 0: "15203B"}

# name -> (layer, headers, rows). Strings starting with "=" are formulas; "{r}" is the row number.
SHEETS = {}

SHEETS["Scorecard"] = (0, ["Layer", "Statement", "Score (0-2)"], [
    ["1 Foundation", "Registered as the right legal entity, all licences current", ""],
    ["1 Foundation", "Business and personal money in separate bank accounts", ""],
    ["1 Foundation", "Books updated weekly and reconciled monthly", ""],
    ["1 Foundation", "All statutory deadlines known; no late fees in 12 months", ""],
    ["1 Foundation", "13-week cash visibility", ""],
    ["2 People", "Written job descriptions and appointment letters for all", ""],
    ["2 People", "Documented onboarding; productive within 30 days", ""],
    ["2 People", "Digital attendance and leave feeding payroll", ""],
    ["2 People", "Clear goals and twice-yearly reviews", ""],
    ["2 People", "Business runs two weeks without the owner", ""],
    ["3 Systems", "Top 10 recurring tasks documented as SOPs", ""],
    ["3 Systems", "Written product and services catalogue with prices and margins", ""],
    ["3 Systems", "Customer, sales and inventory data in one system", ""],
    ["3 Systems", "Some recurring revenue", ""],
    ["3 Systems", "At least one process automated", ""],
    ["4 Growth", "Written one-page plan with 12-month and 90-day goals", ""],
    ["4 Growth", "5-10 KPIs reviewed weekly", ""],
    ["4 Growth", "CAC and LTV known", ""],
    ["4 Growth", "Every lead tracked through pipeline stages", ""],
    ["4 Growth", "Planned marketing calendar", ""],
    ["5 Scale", "Financials could pass due diligence today", ""],
    ["5 Scale", "Brand name and logo trademarked", ""],
    ["5 Scale", "Clean, documented cap table and agreements", ""],
    ["5 Scale", "One profitable, copyable unit with manuals", ""],
    ["5 Scale", "Written 3-year vision and funding/expansion strategy", ""],
    [],
    ["TOTALS", "1 Foundation", '=SUMIF(A2:A26,"1 Foundation",C2:C26)'],
    ["", "2 People", '=SUMIF(A2:A26,"2 People",C2:C26)'],
    ["", "3 Systems", '=SUMIF(A2:A26,"3 Systems",C2:C26)'],
    ["", "4 Growth", '=SUMIF(A2:A26,"4 Growth",C2:C26)'],
    ["", "5 Scale", '=SUMIF(A2:A26,"5 Scale",C2:C26)'],
])

SHEETS["Chart of Accounts"] = (1, ["Code", "Account", "Group", "Type"], [
    [1010, "Bank - Current Account", "Assets", "Bank"], [1020, "Cash in Hand", "Assets", "Cash"],
    [1100, "Accounts Receivable", "Assets", "Current Asset"], [1200, "Inventory", "Assets", "Current Asset"],
    [1300, "GST Input Credit", "Assets", "Current Asset"], [1310, "TDS Receivable", "Assets", "Current Asset"],
    [1400, "Security Deposits", "Assets", "Current Asset"], [1500, "Fixed Assets", "Assets", "Fixed Asset"],
    [2010, "Accounts Payable", "Liabilities", "Current Liability"], [2100, "GST Output Payable", "Liabilities", "Duties & Taxes"],
    [2110, "TDS Payable", "Liabilities", "Duties & Taxes"], [2120, "PF / ESI / PT Payable", "Liabilities", "Duties & Taxes"],
    [2200, "Salaries Payable", "Liabilities", "Current Liability"], [2300, "Customer Advances", "Liabilities", "Current Liability"],
    [2500, "Loans", "Liabilities", "Long-term Liability"],
    [3010, "Share / Partner Capital", "Equity", "Capital"], [3100, "Reserves & Surplus", "Equity", "Capital"],
    [3200, "Drawings", "Equity", "Capital"],
    [4010, "Product Sales", "Income", "Sales"], [4020, "Service Income", "Income", "Sales"],
    [4030, "Subscription Income", "Income", "Sales"], [4040, "Franchise Fees", "Income", "Sales"],
    [4050, "Royalty Income", "Income", "Sales"], [4900, "Other Income", "Income", "Other Income"],
    [5010, "Purchases / Raw Material", "Direct Costs", "COGS"], [5020, "Direct Labour", "Direct Costs", "COGS"],
    [5030, "Freight Inward", "Direct Costs", "COGS"], [5040, "Payment Gateway Fees", "Direct Costs", "COGS"],
    [6010, "Salaries & Wages", "Operating Expenses", "Expense"], [6020, "Rent", "Operating Expenses", "Expense"],
    [6030, "Utilities", "Operating Expenses", "Expense"], [6040, "Software & Subscriptions", "Operating Expenses", "Expense"],
    [6050, "Marketing & Advertising", "Operating Expenses", "Expense"], [6060, "Travel", "Operating Expenses", "Expense"],
    [6070, "Professional Fees", "Operating Expenses", "Expense"], [6080, "Repairs & Maintenance", "Operating Expenses", "Expense"],
    [6090, "Insurance", "Operating Expenses", "Expense"],
    [7010, "Interest", "Finance & Other", "Expense"], [7020, "Bank Charges", "Finance & Other", "Expense"],
    [7030, "Depreciation", "Finance & Other", "Expense"], [7040, "Income Tax", "Finance & Other", "Tax"],
])

SHEETS["Compliance Calendar"] = (1, ["When", "Filing / payment", "Applies to", "Owner", "Status"], [
    ["7th monthly", "TDS/TCS deposit (March: 30 April)", "TDS deductors", "", ""],
    ["11th monthly", "GSTR-1 (or quarterly under QRMP)", "GST registered", "", ""],
    ["15th monthly", "EPF and ESI contributions", "Registered employers", "", ""],
    ["20th monthly", "GSTR-3B and GST payment (22nd/24th for QRMP)", "GST registered", "", ""],
    ["15 Jun / 15 Sep / 15 Dec / 15 Mar", "Advance tax (15% / 45% / 75% / 100%)", "Tax liability > Rs 10,000", "", ""],
    ["31 Jul / 31 Oct / 31 Jan / 31 May", "Quarterly TDS returns (24Q, 26Q)", "TDS deductors", "", ""],
    ["30 May", "LLP Form 11", "LLPs", "", ""],
    ["30 Oct", "LLP Form 8", "LLPs", "", ""],
    ["By 30 Sep", "AGM; DIR-3 KYC; tax audit report", "Companies / directors / audited", "", ""],
    ["AGM + 30 days", "AOC-4 financial statements", "Companies", "", ""],
    ["AGM + 60 days", "MGT-7 annual return", "Companies", "", ""],
    ["31 Jul / 31 Oct", "Income-tax return (non-audit / audit)", "All", "", ""],
    ["31 Dec", "GSTR-9 / 9C annual return", "GST registered above threshold", "", ""],
    ["Monthly (state dates)", "Professional Tax", "States levying PT", "", ""],
])

weeks = [f"Wk {i}" for i in range(1, 14)]
cash_rows = ["Opening cash", "+ Customer receipts", "+ Other inflows", "- Salaries & contractors",
             "- Rent & utilities", "- Suppliers & inventory", "- Taxes (GST, TDS, advance tax)",
             "- Loan EMIs & other", "Closing cash"]
cash = []
for i, label in enumerate(cash_rows):
    r = i + 2
    row = [label]
    for c in range(13):
        col = get_column_letter(c + 2)
        if label == "Opening cash" and c > 0:
            row.append(f"={get_column_letter(c + 1)}10")
        elif label == "Closing cash":
            row.append(f"={col}2+{col}3+{col}4-{col}5-{col}6-{col}7-{col}8-{col}9")
        else:
            row.append("")
    cash.append(row)
SHEETS["13-Week Cash Flow"] = (1, ["Line"] + weeks, cash)

days = [str(d) for d in range(1, 32)]
att_rows = []
for r in range(2, 22):
    rng = f"D{r}:AH{r}"
    att_rows.append(["", "", ""] + [""] * 31 + [
        f'=COUNTIF({rng},"P")+COUNTIF({rng},"WFH")+0.5*COUNTIF({rng},"HD")',
        f'=COUNTIF({rng},"A")',
        f'=COUNTIF({rng},"CL")+COUNTIF({rng},"SL")+COUNTIF({rng},"EL")+0.5*COUNTIF({rng},"HD")',
        f'=COUNTIF({rng},"H")+COUNTIF({rng},"WO")',
        "",
    ])
SHEETS["Attendance Register"] = (2, ["Emp ID", "Name", "Department"] + days +
                                 ["Present", "Absent", "Leave", "Holiday/WO", "OT hrs"], att_rows)

SHEETS["Leave Tracker"] = (2, ["Emp ID", "Name", "Leave type", "From", "To", "Days", "Reason",
                               "Approved by", "Status", "EL balance", "CL balance", "SL balance"],
                           [[""] * 5 + [f'=IF(AND(D{r}<>"",E{r}<>""),E{r}-D{r}+1,"")'] + [""] * 6 for r in range(2, 32)])

onb = [
    ("Pre-boarding", "Offer letter signed"), ("Pre-boarding", "Documents collected (ID, PAN, certificates, bank, UAN)"),
    ("Pre-boarding", "Background and reference checks"), ("Pre-boarding", "Email and software logins created"),
    ("Pre-boarding", "Laptop, desk, ID card ready"), ("Pre-boarding", "Buddy assigned"),
    ("Pre-boarding", "Welcome email sent"), ("Day 1", "Founder/manager welcome"),
    ("Day 1", "Appointment letter issued; policies acknowledged"), ("Day 1", "PF/ESI nomination and insurance enrolment"),
    ("Day 1", "Tools set up and tested"), ("Day 1", "30/60/90 plan shared"),
    ("Week 1", "Product and customer training"), ("Week 1", "Role SOPs read"), ("Week 1", "Shadowing completed"),
    ("Week 1", "First small deliverable"), ("Week 1", "Week-1 feedback conversation"),
    ("Day 30", "Owns small tasks independently"), ("Day 60", "Owns a full workflow; KPIs agreed"),
    ("Day 90", "Probation review and confirmation decision"), ("Day 90", "Onboarding survey"),
]
SHEETS["Onboarding Tracker"] = (2, ["Employee", "Stage", "Task", "Owner", "Due date", "Done (Y/N)", "Notes"],
                                [["", s, t, "", "", "", ""] for s, t in onb])

SHEETS["Product Catalogue"] = (3, ["SKU", "Name", "Type (Product/Service/Subscription)", "Description",
                                   "Unit", "Cost", "Price", "Margin %", "HSN/SAC", "GST %", "Price incl. GST"],
                               [[""] * 7 + [f'=IF(G{r}>0,(G{r}-F{r})/G{r},"")', "", "", f'=IF(G{r}<>"",G{r}*(1+J{r}),"")']
                                for r in range(2, 42)])

SHEETS["KPI Dashboard"] = (4, ["KPI", "Formula", "Target"] + weeks, [
    ["Revenue", "Total invoiced sales", ""], ["Gross margin %", "(Revenue - direct costs) / revenue", ""],
    ["Cash runway (months)", "Cash / monthly net burn", ""], ["Lead-to-customer %", "New customers / new leads", ""],
    ["CAC", "S&M spend / new customers", ""], ["LTV", "AOV x orders/yr x years x margin", ""],
    ["LTV : CAC", "LTV / CAC (aim >= 3)", "3"], ["DSO (days)", "Receivables / revenue x 365", ""],
    ["Repeat rate %", "Returning / total customers", ""], ["NPS", "% promoters - % detractors", ""],
    ["Revenue per employee", "Revenue / headcount", ""],
])

SHEETS["Sales Pipeline"] = (4, ["Lead name", "Company", "Phone/email", "Source", "Stage", "Deal value",
                                "Win probability", "Weighted value", "Owner", "Next action", "Next action date", "Lost reason"],
                            [[""] * 6 + [f'=IFERROR(VLOOKUP(E{r},Stages!A:B,2,FALSE),"")', f'=IF(F{r}<>"",F{r}*G{r},"")'] + [""] * 4
                             for r in range(2, 52)])
SHEETS["Stages"] = (4, ["Stage", "Probability"], [
    ["1 New lead", 0.05], ["2 Qualified", 0.15], ["3 Meeting/Demo", 0.30], ["4 Proposal", 0.50],
    ["5 Negotiation", 0.75], ["6 Won", 1.0], ["6 Lost", 0.0]])

SHEETS["Cap Table"] = (5, ["Shareholder", "Shares before", "% before", "New shares", "Shares after", "% after", "Notes"], [
    ["Founder A", 600000, "=B2/$B$7", 0, "=B2+D2", "=E2/$E$7", ""],
    ["Founder B", 300000, "=B3/$B$7", 0, "=B3+D3", "=E3/$E$7", ""],
    ["ESOP pool", 100000, "=B4/$B$7", 50000, "=B4+D4", "=E4/$E$7", "Top-up in round"],
    ["Seed investor", 0, "=B5/$B$7", 200000, "=B5+D5", "=E5/$E$7", "Rs 2 cr at Rs 100/share"],
    ["", "", "", "", "", "", ""],
    ["TOTAL", "=SUM(B2:B6)", "=SUM(C2:C5)", "=SUM(D2:D6)", "=SUM(E2:E6)", "=SUM(F2:F5)", ""],
    [], ["Round inputs", "", "", "", "", "", ""],
    ["Investment (Rs)", 20000000, "", "", "", "", ""],
    ["Price per share (Rs)", "=B10/D5", "", "", "", "", ""],
    ["Post-money valuation (Rs)", "=B11*E7", "", "", "", "", ""],
    ["Pre-money valuation (Rs)", "=B12-B10", "", "", "", "", ""],
])

SHEETS["Franchise Unit Economics"] = (5, ["Line item", "Amount (Rs)"], [
    ["Franchise fee", ""], ["Fit-out, interiors & signage", ""], ["Equipment & technology", ""],
    ["Opening inventory", ""], ["Security deposit (rent)", ""], ["Working capital (3 months)", ""],
    ["TOTAL INVESTMENT (A)", "=SUM(B2:B7)"], [],
    ["Monthly revenue", ""], ["Cost of goods", ""], ["Rent, salaries, utilities", ""],
    ["Royalty %", ""], ["Marketing fund %", ""], ["Royalty + marketing (Rs)", "=B10*(B13+B14)"],
    ["MONTHLY OPERATING PROFIT (B)", "=B10-B11-B12-B15"], ["PAYBACK (months) = A / B", '=IF(B16>0,B8/B16,"n/a")'],
])

SHEETS["Franchisee Scorecard"] = (5, ["Criterion", "Weight", "Score (1-5)", "Weighted"], [
    ["Financial capacity (investment + 6 months buffer)", 0.25, "", "=B2*C2"],
    ["Operating involvement (full-time, hands-on)", 0.20, "", "=B3*C3"],
    ["Relevant business / people experience", 0.15, "", "=B4*C4"],
    ["Values fit, willingness to follow the system", 0.15, "", "=B5*C5"],
    ["Local network & market knowledge", 0.10, "", "=B6*C6"],
    ["Location quality", 0.10, "", "=B7*C7"],
    ["References & background", 0.05, "", "=B8*C8"],
    ["TOTAL (approve >= 3.8)", "=SUM(B2:B8)", "", "=SUM(D2:D8)"],
])


def build():
    CSV_DIR.mkdir(parents=True, exist_ok=True)
    wb = Workbook()
    wb.remove(wb.active)
    for name, (layer, headers, rows) in SHEETS.items():
        ws = wb.create_sheet(name)
        ws.append(headers)
        for row in rows:
            ws.append(row)
        fill = PatternFill("solid", fgColor=LAYER_COLORS[layer])
        for cell in ws[1]:
            cell.font = Font(bold=True, color="FFFFFF")
            cell.fill = fill
            cell.alignment = Alignment(vertical="center", wrap_text=True)
        ws.freeze_panes = "B2" if name in ("Attendance Register", "13-Week Cash Flow", "KPI Dashboard") else "A2"
        for i, h in enumerate(headers, 1):
            longest = max([len(str(h))] + [len(str(r[i - 1])) for r in rows if len(r) >= i and not str(r[i - 1]).startswith("=")])
            ws.column_dimensions[get_column_letter(i)].width = min(max(longest + 2, 6 if name == "Attendance Register" and 4 <= i <= 34 else 10), 55)
        ws.sheet_properties.tabColor = LAYER_COLORS[layer]
        with open(CSV_DIR / (name.lower().replace(" ", "-").replace("13-week", "13-week") + ".csv"), "w", newline="") as f:
            w = csv.writer(f)
            w.writerow(headers)
            for row in rows:
                w.writerow(["" if str(v).startswith("=") else v for v in row])

    # Formats and validations
    ws = wb["Attendance Register"]
    dv = DataValidation(type="list", formula1='"P,A,HD,CL,SL,EL,WO,H,WFH"', allow_blank=True)
    ws.add_data_validation(dv)
    dv.add("D2:AH21")
    ws = wb["Scorecard"]
    dv = DataValidation(type="whole", operator="between", formula1="0", formula2="2", allow_blank=True)
    ws.add_data_validation(dv)
    dv.add("C2:C26")
    ws = wb["Sales Pipeline"]
    dv = DataValidation(type="list", formula1="=Stages!$A$2:$A$8", allow_blank=True)
    ws.add_data_validation(dv)
    dv.add("E2:E51")
    for c in ("G", "H"):
        for r in range(2, 52):
            ws[f"{c}{r}"].number_format = "0%" if c == "G" else "#,##0"
    for r in range(2, 9):
        wb["Stages"][f"B{r}"].number_format = "0%"
    for r in range(2, 42):
        wb["Product Catalogue"][f"H{r}"].number_format = "0.0%"
        wb["Product Catalogue"][f"J{r}"].number_format = "0%"
    ct = wb["Cap Table"]
    for r in range(2, 8):
        for c in "BDE":
            ct[f"{c}{r}"].number_format = "#,##0"
        for c in "CF":
            ct[f"{c}{r}"].number_format = "0.0%"
    for r in (10, 11, 12, 13):
        ct[f"B{r}"].number_format = "#,##0"
    for r in (2, 3, 4, 5, 6, 7, 8, 9):
        wb["Franchisee Scorecard"][f"B{r}"].number_format = "0%"
    for r in (13, 14):
        wb["Franchise Unit Economics"][f"B{r}"].number_format = "0%"
    for ws_name, cells in (("Cap Table", ("A7",)), ("Franchise Unit Economics", ("A8", "A16", "A17")),
                           ("Franchisee Scorecard", ("A9",)), ("Scorecard", ("A28",))):
        for c in cells:
            wb[ws_name][c].font = Font(bold=True)

    readme = wb.create_sheet("Read Me", 0)
    readme.column_dimensions["A"].width = 110
    lines = [
        "Pancha Khosha Business Framework: Business Toolkit",
        "Companion workbook to the e-book by Khosha Systems (khoshasystems.com).",
        "",
        "Tab colours follow the five layers: brown = Foundation, green = People, blue = Systems, purple = Growth, gold = Scale.",
        "Grey-formula cells calculate automatically. Type only in blank cells.",
        "Attendance codes: P, A, HD (half day), CL, SL, EL, WO (weekly off), H (holiday), WFH.",
        "Sales Pipeline: choose a stage from the drop-down; probability fills in from the Stages tab.",
        "",
        "General guidance only, not legal, tax or investment advice. Verify statutory dates with your CA.",
    ]
    for i, line in enumerate(lines, 1):
        readme.cell(row=i, column=1, value=line)
    readme["A1"].font = Font(bold=True, size=14)

    out = ROOT / "Business-Toolkit.xlsx"
    wb.save(out)
    print("Wrote", out, "and", len(SHEETS), "CSVs")


if __name__ == "__main__":
    build()
