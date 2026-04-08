using ClosedXML.Excel;

namespace Api.Reports;

public sealed class ExcelReportGenerator
{
    public byte[] Generate(ReportData data, ReportNarrative narrative)
    {
        using var wb = new XLWorkbook();

        AddReportSheet(wb, data, narrative);
        AddStatusSheet(wb, data);
        AddSectorsSheet(wb, data);
        AddDepartmentsSheet(wb, data);
        AddCampusSheet(wb, data);
        AddYearTrendSheet(wb, data);
        AddGraduatesSheet(wb, data);

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return ms.ToArray();
    }

    private static void AddReportSheet(XLWorkbook wb, ReportData data, ReportNarrative narrative)
    {
        var ws = wb.Worksheets.Add("Report");
        var s = data.Stats;
        const int cols = 6;

        // ── Title block ──────────────────────────────────────────────────────
        ws.Cell(1, 1).Value = "MERU UNIVERSITY OF SCIENCE AND TECHNOLOGY";
        ws.Cell(1, 1).Style.Font.Bold = true;
        ws.Cell(1, 1).Style.Font.FontSize = 14;
        ws.Cell(1, 1).Style.Font.FontColor = XLColor.FromHtml("#1a5c2a");
        ws.Range(1, 1, 1, cols).Merge();

        ws.Cell(2, 1).Value = "GradTrack Analytics — Graduate Employability Report";
        ws.Cell(2, 1).Style.Font.FontSize = 11;
        ws.Range(2, 1, 2, cols).Merge();

        ws.Cell(3, 1).Value = $"Scope: {data.Filters.ScopeLabel}";
        ws.Range(3, 1, 3, cols).Merge();
        ws.Cell(4, 1).Value = $"Generated: {DateTime.Now:dd MMM yyyy, HH:mm}";
        ws.Cell(4, 1).Style.Font.FontColor = XLColor.Gray;
        ws.Range(4, 1, 4, cols).Merge();

        // ── KPI row ───────────────────────────────────────────────────────────
        int row = 6;
        WriteSectionHeader(ws, row, cols, "KEY METRICS");
        row++;
        var employed = s.ByStatus
            .Where(x => new[] { "Employed (Full-time)", "Employed (Part-time)", "Self-employed / Entrepreneur", "Internship / Attachment" }
                .Contains(x.Name)).Sum(x => x.Count);
        var kpis = new[] {
            ("Total Graduates",     s.TotalCount.ToString("N0")),
            ("Employment Rate",     $"{s.EmploymentRate}%"),
            ("Employed",            employed.ToString("N0")),
            ("Schools Covered",     s.BySchool.Count.ToString()),
            ("Departments Covered", s.ByDepartment.Count.ToString()),
            ("Campuses",            s.ByCampus.Count.ToString()),
        };
        for (var i = 0; i < kpis.Length; i++)
        {
            ws.Cell(row,     i + 1).Value = kpis[i].Item1;
            ws.Cell(row,     i + 1).Style.Font.Bold = true;
            ws.Cell(row,     i + 1).Style.Fill.BackgroundColor = XLColor.FromHtml("#f0f7f2");
            ws.Cell(row + 1, i + 1).Value = kpis[i].Item2;
            ws.Cell(row + 1, i + 1).Style.Font.FontSize = 14;
            ws.Cell(row + 1, i + 1).Style.Font.Bold = true;
            ws.Cell(row + 1, i + 1).Style.Font.FontColor = XLColor.FromHtml("#1a5c2a");
        }
        row += 3;

        // ── Report Summary ────────────────────────────────────────────────────
        if (!string.IsNullOrWhiteSpace(narrative.ReportSummary))
        {
            WriteSectionHeader(ws, row, cols, "REPORT SUMMARY", "#f0f7f2");
            row++;
            WriteNarrativeBlock(ws, row, cols, narrative.ReportSummary);
            row += EstimateRows(narrative.ReportSummary) + 2;
        }

        // ── 1. Executive Summary + Status & Sector tables ─────────────────────
        WriteSectionHeader(ws, row, cols, "1. EXECUTIVE SUMMARY");
        row++;
        WriteNarrativeBlock(ws, row, cols, narrative.ExecutiveSummary);
        row += EstimateRows(narrative.ExecutiveSummary) + 2;

        WriteSubHeader(ws, row, "Table 1 — Employment Status Breakdown");
        row++;
        WriteTableHeader(ws, row, ["Employment Status", "Count", "Percentage"]);
        row++;
        foreach (var item in s.ByStatus)
        {
            ws.Cell(row, 1).Value = item.Name;
            ws.Cell(row, 2).Value = item.Count;
            ws.Cell(row, 3).Value = s.TotalCount > 0 ? $"{Math.Round(item.Count * 100.0 / s.TotalCount, 1)}%" : "0%";
            row++;
        }
        row++;

        WriteSubHeader(ws, row, "Table 2 — Top Employment Sectors");
        row++;
        WriteTableHeader(ws, row, ["Sector", "Count", "% of Total"]);
        row++;
        foreach (var item in s.BySector)
        {
            ws.Cell(row, 1).Value = item.Name;
            ws.Cell(row, 2).Value = item.Count;
            ws.Cell(row, 3).Value = s.TotalCount > 0 ? $"{Math.Round(item.Count * 100.0 / s.TotalCount, 1)}%" : "0%";
            row++;
        }
        row += 2;

        // ── 2. Key Findings + Department & Campus tables ──────────────────────
        WriteSectionHeader(ws, row, cols, "2. KEY FINDINGS");
        row++;
        WriteNarrativeBlock(ws, row, cols, narrative.KeyFindings);
        row += EstimateRows(narrative.KeyFindings) + 2;

        if (s.ByDepartment.Count > 0)
        {
            WriteSubHeader(ws, row, "Table 3 — Graduates by Department");
            row++;
            WriteTableHeader(ws, row, ["Department", "School", "Graduate Count"]);
            row++;
            foreach (var item in s.ByDepartment)
            {
                ws.Cell(row, 1).Value = item.Name;
                ws.Cell(row, 2).Value = item.School;
                ws.Cell(row, 3).Value = item.Count;
                row++;
            }
            row++;
        }

        if (s.ByCampus.Count > 0)
        {
            WriteSubHeader(ws, row, "Table 4 — Graduates by Campus");
            row++;
            WriteTableHeader(ws, row, ["Campus", "Graduate Count"]);
            row++;
            foreach (var item in s.ByCampus)
            {
                ws.Cell(row, 1).Value = item.Name;
                ws.Cell(row, 2).Value = item.Count;
                row++;
            }
            row++;
        }

        if (s.BySchool.Count > 1)
        {
            WriteSubHeader(ws, row, "Table 5 — Graduates by School");
            row++;
            WriteTableHeader(ws, row, ["School", "Graduate Count"]);
            row++;
            foreach (var item in s.BySchool)
            {
                ws.Cell(row, 1).Value = item.Name;
                ws.Cell(row, 2).Value = item.Count;
                row++;
            }
            row += 2;
        }

        // ── 3. Trends Analysis + Year trend & Time-to-employ tables ───────────
        WriteSectionHeader(ws, row, cols, "3. TRENDS ANALYSIS");
        row++;
        WriteNarrativeBlock(ws, row, cols, narrative.TrendsAnalysis);
        row += EstimateRows(narrative.TrendsAnalysis) + 2;

        WriteSubHeader(ws, row, "Table 6 — Year-on-Year Cohort Trend");
        row++;
        WriteTableHeader(ws, row, ["Graduation Year", "Total Graduates", "Employed", "Employment Rate"]);
        row++;
        foreach (var item in s.ByYear)
        {
            ws.Cell(row, 1).Value = item.Year;
            ws.Cell(row, 2).Value = item.Count;
            ws.Cell(row, 3).Value = item.Employed;
            ws.Cell(row, 4).Value = item.Count > 0 ? $"{Math.Round(item.Employed * 100.0 / item.Count, 1)}%" : "0%";
            row++;
        }
        row++;

        if (s.ByMonthsToEmploy.Count > 0)
        {
            WriteSubHeader(ws, row, "Table 7 — Time to First Employment");
            row++;
            WriteTableHeader(ws, row, ["Period", "Graduate Count"]);
            row++;
            foreach (var item in s.ByMonthsToEmploy)
            {
                ws.Cell(row, 1).Value = item.Name;
                ws.Cell(row, 2).Value = item.Count;
                row++;
            }
            row += 2;
        }

        // ── 4. Recommendations ────────────────────────────────────────────────
        WriteSectionHeader(ws, row, cols, "4. RECOMMENDATIONS");
        row++;
        WriteNarrativeBlock(ws, row, cols, narrative.Recommendations);

        // Column widths
        ws.Column(1).Width = 55;
        ws.Column(2).Width = 25;
        ws.Column(3).Width = 18;
        ws.Column(4).Width = 18;
        ws.Column(5).Width = 18;
        ws.Column(6).Width = 18;
    }

    private static void WriteSectionHeader(IXLWorksheet ws, int row, int cols, string title, string? bgColor = null)
    {
        var cell = ws.Cell(row, 1);
        cell.Value = title;
        cell.Style.Font.Bold = true;
        cell.Style.Font.FontSize = 12;
        cell.Style.Font.FontColor = XLColor.FromHtml("#1a5c2a");
        cell.Style.Fill.BackgroundColor = bgColor != null ? XLColor.FromHtml(bgColor) : XLColor.FromHtml("#e8f5e9");
        cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        var range = ws.Range(row, 1, row, cols);
        range.Merge();
        range.Style.Fill.BackgroundColor = bgColor != null ? XLColor.FromHtml(bgColor) : XLColor.FromHtml("#e8f5e9");
    }

    private static void WriteSubHeader(IXLWorksheet ws, int row, string title)
    {
        ws.Cell(row, 1).Value = title;
        ws.Cell(row, 1).Style.Font.Bold = true;
        ws.Cell(row, 1).Style.Font.FontSize = 10;
        ws.Cell(row, 1).Style.Font.FontColor = XLColor.FromHtml("#495057");
        ws.Cell(row, 1).Style.Fill.BackgroundColor = XLColor.FromHtml("#f8f9fa");
    }

    private static void WriteNarrativeBlock(IXLWorksheet ws, int row, int cols, string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return;
        var cell = ws.Cell(row, 1);
        cell.Value = text;
        cell.Style.Alignment.WrapText = true;
        cell.Style.Font.FontSize = 10;
        cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Top;
        ws.Range(row, 1, row, cols).Merge();
        ws.Row(row).Height = Math.Max(60, EstimateRows(text) * 15);
    }

    private static int EstimateRows(string? text) =>
        string.IsNullOrWhiteSpace(text) ? 4 : Math.Max(4, (int)Math.Ceiling(text.Length / 400.0) * 4);

    private static void AddCampusSheet(XLWorkbook wb, ReportData data)
    {
        var ws = wb.Worksheets.Add("Campus");
        WriteTableHeader(ws, 1, ["Campus", "Graduate Count"]);
        var row = 2;
        foreach (var item in data.Stats.ByCampus)
        {
            ws.Cell(row, 1).Value = item.Name;
            ws.Cell(row, 2).Value = item.Count;
            row++;
        }
        AutoFit(ws);
    }

    private static void AddStatusSheet(XLWorkbook wb, ReportData data)
    {
        var ws = wb.Worksheets.Add("Employment Status");
        var s = data.Stats;

        WriteTableHeader(ws, 1, ["Employment Status", "Count", "Percentage"]);
        var row = 2;
        foreach (var item in s.ByStatus)
        {
            ws.Cell(row, 1).Value = item.Name;
            ws.Cell(row, 2).Value = item.Count;
            ws.Cell(row, 3).Value = s.TotalCount > 0 ? $"{Math.Round(item.Count * 100.0 / s.TotalCount)}%" : "0%";
            row++;
        }
        AutoFit(ws);
    }

    private static void AddSectorsSheet(XLWorkbook wb, ReportData data)
    {
        var ws = wb.Worksheets.Add("Sectors");
        WriteTableHeader(ws, 1, ["Sector", "Graduate Count"]);
        var row = 2;
        foreach (var item in data.Stats.BySector)
        {
            ws.Cell(row, 1).Value = item.Name;
            ws.Cell(row, 2).Value = item.Count;
            row++;
        }
        AutoFit(ws);
    }

    private static void AddDepartmentsSheet(XLWorkbook wb, ReportData data)
    {
        var ws = wb.Worksheets.Add("Departments");
        WriteTableHeader(ws, 1, ["Department", "School", "Graduate Count"]);
        var row = 2;
        foreach (var item in data.Stats.ByDepartment)
        {
            ws.Cell(row, 1).Value = item.Name;
            ws.Cell(row, 2).Value = item.School;
            ws.Cell(row, 3).Value = item.Count;
            row++;
        }
        AutoFit(ws);
    }

    private static void AddYearTrendSheet(XLWorkbook wb, ReportData data)
    {
        var ws = wb.Worksheets.Add("Year Trend");
        WriteTableHeader(ws, 1, ["Year", "Total Graduates", "Employed", "Employment Rate"]);
        var row = 2;
        foreach (var item in data.Stats.ByYear)
        {
            ws.Cell(row, 1).Value = item.Year;
            ws.Cell(row, 2).Value = item.Count;
            ws.Cell(row, 3).Value = item.Employed;
            ws.Cell(row, 4).Value = item.Count > 0 ? $"{Math.Round(item.Employed * 100.0 / item.Count)}%" : "0%";
            row++;
        }
        AutoFit(ws);
    }

    private static void AddGraduatesSheet(XLWorkbook wb, ReportData data)
    {
        var ws = wb.Worksheets.Add("Graduate Records");
        WriteTableHeader(ws, 1, [
            "ID", "Full Name", "Student Number", "Email", "Phone",
            "Campus", "School", "Department", "Programme",
            "Graduation Year", "Employment Status",
            "Employer", "Job Title", "Sector", "County",
            "Months to Employment", "LinkedIn"
        ]);

        var row = 2;
        foreach (var g in data.Graduates)
        {
            ws.Cell(row, 1).Value = g.Id;
            ws.Cell(row, 2).Value = g.FullName;
            ws.Cell(row, 3).Value = g.StudentNumber ?? "";
            ws.Cell(row, 4).Value = g.Email ?? "";
            ws.Cell(row, 5).Value = g.Phone ?? "";
            ws.Cell(row, 6).Value = g.Campus;
            ws.Cell(row, 7).Value = g.SchoolName;
            ws.Cell(row, 8).Value = g.DepartmentName;
            ws.Cell(row, 9).Value = g.ProgrammeName;
            ws.Cell(row, 10).Value = g.GraduationYear;
            ws.Cell(row, 11).Value = g.EmploymentStatus;
            ws.Cell(row, 12).Value = g.EmployerName ?? "";
            ws.Cell(row, 13).Value = g.JobTitle ?? "";
            ws.Cell(row, 14).Value = g.Sector ?? "";
            ws.Cell(row, 15).Value = g.EmploymentCounty ?? "";
            ws.Cell(row, 16).Value = g.MonthsToEmploy ?? "";
            ws.Cell(row, 17).Value = g.LinkedinUrl ?? "";
            row++;
        }
        AutoFit(ws);
    }

    private static void WriteTableHeader(IXLWorksheet ws, int row, string[] headers)
    {
        for (var i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cell(row, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#1a5c2a");
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }
    }

    private static void AutoFit(IXLWorksheet ws)
    {
        ws.Columns().AdjustToContents();
    }
}
