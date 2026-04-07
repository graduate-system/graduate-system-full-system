using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Api.Reports;

public sealed class PdfReportGenerator
{
    private static readonly string MustGreen = "#1a5c2a";
    private static readonly string MustGold  = "#f5a623";
    private static readonly string LightGray = "#f8f9fa";
    private static readonly string BorderGray = "#dee2e6";

    public byte[] Generate(ReportData data, ReportNarrative narrative)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        return Document.Create(doc =>
        {
            doc.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(40);
                page.DefaultTextStyle(t => t.FontSize(10).FontFamily("Arial"));

                page.Header().Element(c => BuildHeader(c, data));
                page.Content().Element(c => BuildContent(c, data, narrative));
                page.Footer().Element(BuildFooter);
            });
        }).GeneratePdf();
    }

    private static void BuildHeader(IContainer container, ReportData data)
    {
        container.Column(col =>
        {
            // Top bar
            col.Item().Background(MustGreen).Padding(16).Row(row =>
            {
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text("MERU UNIVERSITY OF SCIENCE AND TECHNOLOGY")
                        .FontColor(Colors.White).FontSize(13).Bold();
                    c.Item().Text("GradTrack Analytics — Graduate Employability Report")
                        .FontColor(MustGold).FontSize(10);
                });
                row.ConstantItem(80).AlignRight().AlignMiddle()
                    .Text("MUST").FontColor(MustGold).FontSize(22).Bold();
            });

            // Scope bar
            col.Item().Background(LightGray).BorderBottom(1).BorderColor(BorderGray)
                .Padding(10).Row(row =>
                {
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Text("Report Scope").FontSize(8).FontColor("#6c757d");
                        c.Item().Text(data.Filters.ScopeLabel).FontSize(11).Bold();
                    });
                    row.ConstantItem(160).AlignRight().Column(c =>
                    {
                        c.Item().Text("Generated").FontSize(8).FontColor("#6c757d");
                        c.Item().Text(DateTime.Now.ToString("dd MMM yyyy, HH:mm")).FontSize(9);
                    });
                });
        });
    }

    private static void BuildContent(IContainer container, ReportData data, ReportNarrative narrative)
    {
        container.PaddingTop(16).Column(col =>
        {
            col.Spacing(20);

            // 1. KPI cards
            col.Item().Element(c => BuildKpiRow(c, data));

            // 2. Report Summary — standalone highlighted overview
            if (!string.IsNullOrWhiteSpace(narrative.ReportSummary))
                col.Item().Element(c => BuildReportSummary(c, narrative.ReportSummary));

            // 3. Executive Summary + status & sector tables
            col.Item().Element(c => BuildNarrativeSection(c, "Executive Summary", narrative.ExecutiveSummary, "1."));
            col.Item().Element(c => BuildStatusAndSectorTables(c, data));

            // 4. Key Findings + department & campus tables
            col.Item().Element(c => BuildNarrativeSection(c, "Key Findings", narrative.KeyFindings, "2."));
            col.Item().Element(c => BuildDepartmentAndCampusTables(c, data));

            // 5. Trends Analysis + year trend & time-to-employ tables
            col.Item().Element(c => BuildNarrativeSection(c, "Trends Analysis", narrative.TrendsAnalysis, "3."));
            col.Item().Element(c => BuildYearAndTimeTables(c, data));

            // 6. Recommendations
            col.Item().Element(c => BuildNarrativeSection(c, "Recommendations", narrative.Recommendations, "4."));

            // 7. Graduate records appendix
            if (data.Graduates.Count > 0)
                col.Item().Element(c => BuildGraduateTable(c, data));
        });
    }

    private static void BuildKpiRow(IContainer container, ReportData data)
    {
        var s = data.Stats;
        var employed = s.ByStatus
            .Where(x => new[] { "Employed (Full-time)", "Employed (Part-time)", "Self-employed / Entrepreneur", "Internship / Attachment" }
                .Contains(x.Name)).Sum(x => x.Count);

        container.Row(row =>
        {
            KpiCard(row.RelativeItem(), "Total Graduates", s.TotalCount.ToString("N0"), MustGreen);
            row.ConstantItem(8);
            KpiCard(row.RelativeItem(), "Employment Rate", $"{s.EmploymentRate}%", MustGold);
            row.ConstantItem(8);
            KpiCard(row.RelativeItem(), "Employed", employed.ToString("N0"), "#0d6efd");
            row.ConstantItem(8);
            KpiCard(row.RelativeItem(), "Schools Covered", s.BySchool.Count.ToString(), "#6f42c1");
        });
    }

    private static void KpiCard(IContainer container, string label, string value, string color)
    {
        container.Border(1).BorderColor(BorderGray).Padding(12).Column(c =>
        {
            c.Item().Text(label).FontSize(8).FontColor("#6c757d");
            c.Item().Text(value).FontSize(20).Bold().FontColor(color);
        });
    }

    private static void BuildReportSummary(IContainer container, string text)
    {
        container.Border(1).BorderColor(MustGreen)
            .Background("#f0f7f2")
            .Padding(16)
            .Column(col =>
            {
                col.Item().BorderBottom(2).BorderColor(MustGreen).PaddingBottom(6)
                    .Text("\U0001f4c4  Report Summary")
                    .FontSize(13).Bold().FontColor(MustGreen);
                col.Item().PaddingTop(10).Element(c => RenderParagraphs(c, text, 10f));
            });
    }

    private static void BuildNarrativeSection(IContainer container, string title, string text, string number)
    {
        if (string.IsNullOrWhiteSpace(text)) return;

        container.Column(col =>
        {
            col.Item().BorderBottom(2).BorderColor(MustGreen).PaddingBottom(4).Row(row =>
            {
                row.ConstantItem(22)
                    .Background(MustGreen).AlignCenter().AlignMiddle()
                    .Text(number).FontColor(Colors.White).FontSize(9).Bold();
                row.RelativeItem().PaddingLeft(8)
                    .Text(title).FontSize(12).Bold().FontColor(MustGreen);
            });
            col.Item().PaddingTop(10).Element(c => RenderParagraphs(c, text, 9.5f));
        });
    }

    /// <summary>
    /// Splits text on blank lines and renders each paragraph as a separate block,
    /// producing proper paragraph spacing in the PDF.
    /// </summary>
    private static void RenderParagraphs(IContainer container, string text, float fontSize)
    {
        var paragraphs = text
            .Split(["\r\n\r\n", "\n\n"], StringSplitOptions.RemoveEmptyEntries)
            .Select(p => p.Replace("\r\n", " ").Replace("\n", " ").Trim())
            .Where(p => p.Length > 0)
            .ToList();

        container.Column(col =>
        {
            col.Spacing(8);
            foreach (var para in paragraphs)
                col.Item().Text(para).FontSize(fontSize).LineHeight(1.6f);
        });
    }

    private static void BuildStatusAndSectorTables(IContainer container, ReportData data)
    {
        var s = data.Stats;
        container.Column(col =>
        {
            col.Item().Text("Supporting Data").FontSize(8).Bold().FontColor("#6c757d").Italic();
            col.Item().PaddingTop(6).Row(row =>
            {
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text("Table 1 — Employment Status Breakdown").FontSize(8).Bold().FontColor("#495057");
                    c.Item().PaddingTop(4).Element(t => BuildTable(t,
                        ["Status", "Count", "%"],
                        s.ByStatus.Select(x => new[] {
                            x.Name,
                            x.Count.ToString(),
                            s.TotalCount > 0 ? $"{Math.Round(x.Count * 100.0 / s.TotalCount, 1)}%" : "0%"
                        }).ToList()
                    ));
                });
                row.ConstantItem(16);
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text("Table 2 — Top Employment Sectors").FontSize(8).Bold().FontColor("#495057");
                    c.Item().PaddingTop(4).Element(t => BuildTable(t,
                        ["Sector", "Count", "%"],
                        s.BySector.Take(10).Select(x => new[] {
                            x.Name,
                            x.Count.ToString(),
                            s.TotalCount > 0 ? $"{Math.Round(x.Count * 100.0 / s.TotalCount, 1)}%" : "0%"
                        }).ToList()
                    ));
                });
            });
        });
    }

    private static void BuildDepartmentAndCampusTables(IContainer container, ReportData data)
    {
        var s = data.Stats;
        container.Column(col =>
        {
            col.Item().Text("Supporting Data").FontSize(8).Bold().FontColor("#6c757d").Italic();
            col.Item().PaddingTop(6).Row(row =>
            {
                if (s.ByDepartment.Count > 0)
                {
                    row.RelativeItem(2).Column(c =>
                    {
                        c.Item().Text("Table 3 — Graduates by Department").FontSize(8).Bold().FontColor("#495057");
                        c.Item().PaddingTop(4).Element(t => BuildTable(t,
                            ["Department", "School", "Graduates"],
                            s.ByDepartment.Take(15).Select(x => new[] { x.Name, x.School, x.Count.ToString() }).ToList()
                        ));
                    });
                    row.ConstantItem(16);
                }
                if (s.ByCampus.Count > 0)
                {
                    row.RelativeItem(1).Column(c =>
                    {
                        c.Item().Text("Table 4 — Graduates by Campus").FontSize(8).Bold().FontColor("#495057");
                        c.Item().PaddingTop(4).Element(t => BuildTable(t,
                            ["Campus", "Count"],
                            s.ByCampus.Select(x => new[] { x.Name, x.Count.ToString() }).ToList()
                        ));
                        if (s.BySchool.Count > 1)
                        {
                            c.Item().PaddingTop(10).Text("Table 5 — Graduates by School").FontSize(8).Bold().FontColor("#495057");
                            c.Item().PaddingTop(4).Element(t => BuildTable(t,
                                ["School", "Count"],
                                s.BySchool.Select(x => new[] { x.Name, x.Count.ToString() }).ToList()
                            ));
                        }
                    });
                }
            });
        });
    }

    private static void BuildYearAndTimeTables(IContainer container, ReportData data)
    {
        var s = data.Stats;
        if (s.ByYear.Count == 0) return;

        container.Column(col =>
        {
            col.Item().Text("Supporting Data").FontSize(8).Bold().FontColor("#6c757d").Italic();
            col.Item().PaddingTop(6).Row(row =>
            {
                row.RelativeItem(2).Column(c =>
                {
                    c.Item().Text("Table 6 — Year-on-Year Cohort Trend").FontSize(8).Bold().FontColor("#495057");
                    c.Item().PaddingTop(4).Element(t => BuildTable(t,
                        ["Year", "Total", "Employed", "Rate"],
                        s.ByYear.Select(x => new[] {
                            x.Year.ToString(),
                            x.Count.ToString(),
                            x.Employed.ToString(),
                            x.Count > 0 ? $"{Math.Round(x.Employed * 100.0 / x.Count, 1)}%" : "0%"
                        }).ToList()
                    ));
                });
                if (s.ByMonthsToEmploy.Count > 0)
                {
                    row.ConstantItem(16);
                    row.RelativeItem(1).Column(c =>
                    {
                        c.Item().Text("Table 7 — Time to First Employment").FontSize(8).Bold().FontColor("#495057");
                        c.Item().PaddingTop(4).Element(t => BuildTable(t,
                            ["Period", "Graduates"],
                            s.ByMonthsToEmploy.Select(x => new[] { x.Name, x.Count.ToString() }).ToList()
                        ));
                    });
                }
            });
        });
    }

    private static void BuildGraduateTable(IContainer container, ReportData data)
    {
        var grads = data.Graduates.Take(50).ToList();
        container.Column(col =>
        {
            col.Item().BorderBottom(2).BorderColor(MustGreen).PaddingBottom(4)
                .Text($"🎓  Graduate Records (showing {grads.Count} of {data.Graduates.Count})")
                .FontSize(12).Bold().FontColor(MustGreen);

            col.Item().PaddingTop(8).Element(t => BuildTable(t,
                ["Name", "Programme", "Year", "Status", "Employer"],
                grads.Select(g => new[]
                {
                    g.FullName,
                    g.ProgrammeName.Length > 35 ? g.ProgrammeName[..35] + "…" : g.ProgrammeName,
                    g.GraduationYear.ToString(),
                    g.EmploymentStatus,
                    g.EmployerName ?? "—"
                }).ToList()
            ));
        });
    }

    private static void BuildTable(IContainer container, string[] headers, List<string[]> rows)
    {
        container.Table(table =>
        {
            table.ColumnsDefinition(cols =>
            {
                foreach (var _ in headers) cols.RelativeColumn();
            });

            // Header row
            table.Header(header =>
            {
                foreach (var h in headers)
                {
                    header.Cell().Background(MustGreen).Padding(5)
                        .Text(h).FontColor(Colors.White).FontSize(8).Bold();
                }
            });

            // Data rows
            for (var i = 0; i < rows.Count; i++)
            {
                var bg = i % 2 == 0 ? Colors.White : Colors.Grey.Lighten5;
                foreach (var cell in rows[i])
                {
                    table.Cell().Background(bg).Border(0.5f).BorderColor(BorderGray)
                        .Padding(4).Text(cell).FontSize(8);
                }
            }
        });
    }

    private static void BuildFooter(IContainer container)
    {
        container.BorderTop(1).BorderColor(BorderGray).PaddingTop(6).Row(row =>
        {
            row.RelativeItem().Text("MUST GradTrack Analytics — Confidential")
                .FontSize(7).FontColor("#6c757d");
            row.ConstantItem(100).AlignRight()
                .Text(x =>
                {
                    x.Span("Page ").FontSize(7).FontColor("#6c757d");
                    x.CurrentPageNumber().FontSize(7).FontColor("#6c757d");
                    x.Span(" of ").FontSize(7).FontColor("#6c757d");
                    x.TotalPages().FontSize(7).FontColor("#6c757d");
                });
        });
    }
}
