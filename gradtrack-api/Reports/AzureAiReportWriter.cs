using Azure;
using Azure.AI.OpenAI;
using OpenAI.Chat;
using Microsoft.Extensions.Options;
using System.Text;

namespace Api.Reports;

public sealed class AzureAiOptions
{
    public string Endpoint { get; init; } = "";
    public string ApiKey { get; init; } = "";
    public string DeploymentName { get; init; } = "haven-gpt-4.1";
}

public sealed class AzureAiReportWriter(IOptions<AzureAiOptions> options, ILogger<AzureAiReportWriter> logger)
{
    public async Task<ReportNarrative> WriteNarrativeAsync(ReportData data, CancellationToken ct)
    {
        var opts = options.Value;

        if (string.IsNullOrWhiteSpace(opts.ApiKey) || string.IsNullOrWhiteSpace(opts.Endpoint))
        {
            logger.LogWarning("Azure AI not configured — returning placeholder narrative.");
            return FallbackNarrative(data);
        }

        try
        {
            var client = new AzureOpenAIClient(new Uri(opts.Endpoint), new AzureKeyCredential(opts.ApiKey));
            var chat = client.GetChatClient(opts.DeploymentName);

            var prompt = BuildPrompt(data);

            var response = await chat.CompleteChatAsync(
                [
                    new SystemChatMessage(SystemPrompt()),
                    new UserChatMessage(prompt),
                ],
                new ChatCompletionOptions { MaxOutputTokenCount = 3200 },
                ct
            );

            var text = response.Value.Content[0].Text;
            return ParseNarrative(text);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Azure AI narrative generation failed — using fallback.");
            return FallbackNarrative(data);
        }
    }

    public async Task<string> EditSectionAsync(
        string sectionName, string currentContent, string instruction, string? context, CancellationToken ct)
    {
        var opts = options.Value;
        if (string.IsNullOrWhiteSpace(opts.ApiKey) || string.IsNullOrWhiteSpace(opts.Endpoint))
            return currentContent;

        try
        {
            var client = new AzureOpenAIClient(new Uri(opts.Endpoint), new AzureKeyCredential(opts.ApiKey));
            var chat = client.GetChatClient(opts.DeploymentName);

            var prompt = $"""
                You are a senior institutional research analyst at Meru University of Science and Technology (MUST), Kenya.
                You are revising the "{sectionName}" section of an official Graduate Employability Report.

                WRITING STANDARDS:
                - Formal academic register; write in flowing paragraphs, no bullet points.
                - Embed specific numbers naturally within prose.
                - Name responsible parties in recommendations (e.g. "the Directorate of Career Services").
                - Each paragraph should open with a strong, direct topic sentence.

                {(string.IsNullOrWhiteSpace(context) ? "" : $"REPORT CONTEXT (use for grounding):\n{context}\n")}

                CURRENT SECTION CONTENT:
                {currentContent}

                REVISION INSTRUCTION FROM COMMITTEE:
                {instruction}

                Return ONLY the revised section text. No heading, no preamble, no commentary.
                """;

            var response = await chat.CompleteChatAsync(
                [new UserChatMessage(prompt)],
                new ChatCompletionOptions { MaxOutputTokenCount = 800 },
                ct);

            return response.Value.Content[0].Text.Trim();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "EditSectionAsync failed — returning original content.");
            return currentContent;
        }
    }

    private static string SystemPrompt() =>
        """
        You are a senior institutional research analyst producing a formal Graduate Employability Report
        for Meru University of Science and Technology (MUST), Kenya.

        AUDIENCE: University Senate, academic deans, accreditation bodies (CUE), government ministries,
        development partners, and donors. Write accordingly — authoritative, evidence-based, and strategic.

        SCOPE DISCIPLINE — THIS IS CRITICAL:
        - You will be given a REPORT SCOPE at the top of the data.
        - Write ONLY about the graduates, schools, departments, and programmes within that scope.
        - If the scope is a single programme (e.g. "Bachelor of Co-operative Management"), every
          statistic, finding, and recommendation must relate exclusively to that programme.
        - NEVER introduce data, schools, departments, or programmes that are not in the provided data.
        - If a table (e.g. By School, By Department) is not provided, do not invent or reference it.

        WRITING STANDARDS:
        - Open each section with a strong topic sentence that states the key finding directly.
        - Embed specific numbers and percentages naturally within prose — do not use bullet lists.
        - Use comparative and contextual language: "compared to the previous cohort", "notably",
          "a significant proportion", "this represents a X percentage-point improvement".
        - Attribute findings to specific schools, departments, or cohort years where data supports it.
        - Recommendations must name the responsible party (e.g. "the Directorate of Career Services",
          "School Deans", "the Senate") and include a measurable outcome or timeline where possible.
        - Maintain formal academic register throughout. Avoid hedging phrases like "it seems" or
          "it could be argued". State findings with confidence.
        - Each section should be 3–5 well-developed paragraphs.

        OUTPUT FORMAT — use exactly these five headings, nothing else before or after:
        ## Report Summary
        ## Executive Summary
        ## Key Findings
        ## Trends Analysis
        ## Recommendations

        SECTION GUIDANCE:
        ## Report Summary
        A single cohesive overview of 3–4 paragraphs. Weave together the scope, headline numbers,
        top sectors, year-on-year direction, and the single most important recommendation into one
        flowing narrative. This is what a Vice-Chancellor or donor reads first — it must stand alone.
        Do NOT use sub-headings inside this section.

        ## Executive Summary
        2–3 paragraphs. State the purpose of the report, the scope, and the overall employment outcome.
        Cite the employment rate and total graduate count in the opening sentence.

        ## Key Findings
        3–4 paragraphs. Lead with the strongest finding. Cover status breakdown, top sectors,
        school/department variation, and campus differences where data exists.

        ## Trends Analysis
        3–4 paragraphs. Analyse year-on-year movement. Reference the computed trend direction.
        Discuss time-to-employment distribution if available. Identify improving and declining cohorts.

        ## Recommendations
        4–5 paragraphs, one per recommendation. Each must name the responsible party and a
        measurable target or timeline. Cover curriculum alignment, career services, industry linkages,
        data quality, and policy advocacy.
        """;

    private static string BuildPrompt(ReportData data)
    {
        var s = data.Stats;
        var f = data.Filters;
        var sb = new StringBuilder();

        // ── Scope header — tell the AI exactly what was filtered ─────────────
        sb.AppendLine("=== REPORT SCOPE ===");
        sb.AppendLine($"Scope label      : {f.ScopeLabel}");
        if (!string.IsNullOrWhiteSpace(f.SchoolName))      sb.AppendLine($"School           : {f.SchoolName}");
        if (!string.IsNullOrWhiteSpace(f.DepartmentName))  sb.AppendLine($"Department       : {f.DepartmentName}");
        if (!string.IsNullOrWhiteSpace(f.ProgrammeName))   sb.AppendLine($"Programme        : {f.ProgrammeName}");
        if (!string.IsNullOrWhiteSpace(f.Campus))          sb.AppendLine($"Campus           : {f.Campus}");
        if (!string.IsNullOrWhiteSpace(f.EmploymentStatus)) sb.AppendLine($"Employment filter: {f.EmploymentStatus}");
        if (f.YearFrom.HasValue || f.YearTo.HasValue)
            sb.AppendLine($"Year range       : {f.YearFrom?.ToString() ?? "earliest"} – {f.YearTo?.ToString() ?? "latest"}");
        sb.AppendLine($"Report date      : {DateTime.Now:MMMM dd, yyyy}");
        sb.AppendLine();
        sb.AppendLine("IMPORTANT: Write the entire report ONLY about the graduates in this scope.");
        sb.AppendLine("Do NOT reference data, schools, departments, or programmes outside this scope.");
        sb.AppendLine();

        // ── Headline figures ────────────────────────────────────────────────
        sb.AppendLine("=== HEADLINE FIGURES ===");
        sb.AppendLine($"Total graduates in scope : {s.TotalCount:N0}");
        sb.AppendLine($"Overall employment rate  : {s.EmploymentRate}%");
        sb.AppendLine($"Unemployed (seeking)     : {s.ByStatus.FirstOrDefault(x => x.Name.Contains("Seeking"))?.Count ?? 0}");
        sb.AppendLine();

        // ── Employment status ───────────────────────────────────────────────
        sb.AppendLine("=== EMPLOYMENT STATUS BREAKDOWN ===");
        foreach (var item in s.ByStatus)
        {
            var pct = s.TotalCount > 0 ? Math.Round(item.Count * 100.0 / s.TotalCount, 1) : 0;
            sb.AppendLine($"  {item.Name,-40} {item.Count,5} graduates  ({pct}%)");
        }
        sb.AppendLine();

        // ── Sectors ─────────────────────────────────────────────────────────
        if (s.BySector.Count > 0)
        {
            sb.AppendLine("=== TOP EMPLOYMENT SECTORS ===");
            foreach (var item in s.BySector.Take(8))
            {
                var pct = s.TotalCount > 0 ? Math.Round(item.Count * 100.0 / s.TotalCount, 1) : 0;
                sb.AppendLine($"  {item.Name,-40} {item.Count,5} graduates  ({pct}%)");
            }
            sb.AppendLine();
        }

        // ── By school — only show when scope spans multiple schools ──────────
        if (s.BySchool.Count > 1 && string.IsNullOrWhiteSpace(f.SchoolId))
        {
            sb.AppendLine("=== GRADUATES BY SCHOOL ===");
            foreach (var item in s.BySchool)
                sb.AppendLine($"  {item.Name,-40} {item.Count,5} graduates");
            sb.AppendLine();
        }

        // ── By department — only show when scope spans multiple departments ──
        if (s.ByDepartment.Count > 1 && string.IsNullOrWhiteSpace(f.DepartmentId))
        {
            sb.AppendLine("=== TOP DEPARTMENTS ===");
            foreach (var item in s.ByDepartment.Take(10))
                sb.AppendLine($"  {item.Name,-35} ({item.School})  {item.Count,5} graduates");
            sb.AppendLine();
        }

        // ── By campus — only show when scope spans multiple campuses ─────────
        if (s.ByCampus.Count > 1 && string.IsNullOrWhiteSpace(f.Campus))
        {
            sb.AppendLine("=== GRADUATES BY CAMPUS ===");
            foreach (var item in s.ByCampus)
                sb.AppendLine($"  {item.Name,-40} {item.Count,5} graduates");
            sb.AppendLine();
        }

        // ── Year-on-year trend ──────────────────────────────────────────────
        sb.AppendLine("=== YEAR-ON-YEAR COHORT TREND ===");
        foreach (var item in s.ByYear)
        {
            var rate = item.Count > 0 ? Math.Round(item.Employed * 100.0 / item.Count, 1) : 0;
            sb.AppendLine($"  {item.Year}  |  {item.Count,5} graduates  |  {item.Employed,5} employed  |  {rate}% employment rate");
        }

        if (s.ByYear.Count >= 2)
        {
            var latest  = s.ByYear[^1];
            var prior   = s.ByYear[^2];
            var latestRate = latest.Count > 0 ? Math.Round(latest.Employed * 100.0 / latest.Count, 1) : 0;
            var priorRate  = prior.Count  > 0 ? Math.Round(prior.Employed  * 100.0 / prior.Count,  1) : 0;
            var delta = Math.Round(latestRate - priorRate, 1);
            var direction = delta >= 0 ? "up" : "down";
            sb.AppendLine($"  → Latest cohort ({latest.Year}) employment rate is {direction} {Math.Abs(delta)} percentage points vs {prior.Year}.");
        }
        sb.AppendLine();

        // ── Time to employment ──────────────────────────────────────────────
        if (s.ByMonthsToEmploy.Count > 0)
        {
            sb.AppendLine("=== TIME TO FIRST EMPLOYMENT ===");
            foreach (var item in s.ByMonthsToEmploy)
                sb.AppendLine($"  {item.Name,-30} {item.Count,5} graduates");
            sb.AppendLine();
        }

        sb.AppendLine("Using ONLY the data above, write the report now. Write in flowing paragraphs — no bullet points.");
        sb.AppendLine($"Every statistic you cite must come from the data above. The scope is: {f.ScopeLabel}.");

        return sb.ToString();
    }

    private static ReportNarrative ParseNarrative(string text)
    {
        static string Extract(string text, string heading, string? nextHeading)
        {
            var start = text.IndexOf($"## {heading}", StringComparison.OrdinalIgnoreCase);
            if (start < 0) return "";
            start = text.IndexOf('\n', start) + 1;
            var end = nextHeading != null
                ? text.IndexOf($"## {nextHeading}", start, StringComparison.OrdinalIgnoreCase)
                : text.Length;
            if (end < 0) end = text.Length;
            return text[start..end].Trim();
        }

        return new ReportNarrative(
            ExecutiveSummary:  Extract(text, "Executive Summary", "Key Findings"),
            KeyFindings:       Extract(text, "Key Findings", "Trends Analysis"),
            TrendsAnalysis:    Extract(text, "Trends Analysis", "Recommendations"),
            Recommendations:   Extract(text, "Recommendations", null),
            ReportSummary:     Extract(text, "Report Summary", "Executive Summary")
        );
    }

    private static ReportNarrative FallbackNarrative(ReportData data) => new(
        ReportSummary:     $"This report presents the graduate employability outcomes for {data.Stats.TotalCount:N0} graduates under the scope: {data.Filters.ScopeLabel}. The overall employment rate stands at {data.Stats.EmploymentRate}%. The full narrative could not be generated automatically; please refer to the statistical tables for detailed breakdowns by status, sector, department, and cohort year.",
        ExecutiveSummary:  $"This report covers {data.Stats.TotalCount:N0} graduates with an overall employment rate of {data.Stats.EmploymentRate}%. AI narrative generation was unavailable at the time of report generation.",
        KeyFindings:       "Data is available in the statistics tables below.",
        TrendsAnalysis:    "Please refer to the year-on-year breakdown in the tables section.",
        Recommendations:   "Review the employment status and sector distribution data to identify areas for curriculum and career services improvement."
    );
}

public sealed record ReportNarrative(
    string ExecutiveSummary,
    string KeyFindings,
    string TrendsAnalysis,
    string Recommendations,
    string ReportSummary
);
