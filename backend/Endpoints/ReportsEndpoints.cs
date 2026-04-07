using Api.Committee;
using Api.Reports;

namespace Api.Endpoints;

public static class ReportsEndpoints
{
    public static RouteGroupBuilder MapReportsEndpoints(this RouteGroupBuilder api)
    {
        var group = api.MapGroup("/reports").RequireCommitteeSession();

        // Lightweight preview — just counts, no AI
        group.MapGet("/preview", async (
            string? school_id, string? department_id, string? programme_name,
            int? year_from, int? year_to, string? campus, string? employment_status,
            ReportService svc, CancellationToken ct) =>
        {
            var filters = BuildFilters(school_id, department_id, programme_name,
                year_from, year_to, campus, employment_status);
            var data = await svc.BuildAsync(filters, ct);
            return Results.Ok(new
            {
                total           = data.Stats.TotalCount,
                employment_rate = data.Stats.EmploymentRate,
                scope           = filters.ScopeLabel,
            });
        });

        // Generate AI narrative + full stats — returns JSON for in-browser review
        group.MapPost("/generate", async (
            GenerateReportRequest req,
            ReportService svc, AzureAiReportWriter ai, CancellationToken ct) =>
        {
            var filters = BuildFilters(
                req.SchoolId, req.DepartmentId, req.ProgrammeName,
                req.YearFrom, req.YearTo, req.Campus, req.EmploymentStatus,
                req.SchoolName, req.DepartmentName);

            var data = await svc.BuildAsync(filters, ct);

            if (data.Stats.TotalCount == 0)
                return Results.BadRequest(new { error = "No graduates match the selected filters." });

            var narrative = await ai.WriteNarrativeAsync(data, ct);

            return Results.Ok(new
            {
                scope          = filters.ScopeLabel,
                generated_at   = DateTime.Now,
                stats = new
                {
                    total               = data.Stats.TotalCount,
                    employment_rate     = data.Stats.EmploymentRate,
                    by_status           = data.Stats.ByStatus,
                    by_school           = data.Stats.BySchool,
                    by_department       = data.Stats.ByDepartment,
                    by_sector           = data.Stats.BySector,
                    by_year             = data.Stats.ByYear,
                    by_campus           = data.Stats.ByCampus,
                    by_months_to_employ = data.Stats.ByMonthsToEmploy,
                },
                narrative = new
                {
                    report_summary    = narrative.ReportSummary,
                    executive_summary = narrative.ExecutiveSummary,
                    key_findings      = narrative.KeyFindings,
                    trends_analysis   = narrative.TrendsAnalysis,
                    recommendations   = narrative.Recommendations,
                },
            });
        });

        // Edit a specific section via AI instruction
        group.MapPost("/edit-section", async (
            EditSectionRequest req,
            AzureAiReportWriter ai, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(req.Section) || string.IsNullOrWhiteSpace(req.Instruction))
                return Results.BadRequest(new { error = "Section and instruction are required." });

            var updated = await ai.EditSectionAsync(
                req.Section, req.CurrentContent, req.Instruction, req.Context, ct);
            return Results.Ok(new { content = updated });
        });

        // PDF — accepts cached narrative so AI is not called again
        group.MapPost("/pdf", async (
            DownloadReportRequest req,
            ReportService svc, PdfReportGenerator pdf, CancellationToken ct) =>
        {
            var filters = BuildFilters(
                req.SchoolId, req.DepartmentId, req.ProgrammeName,
                req.YearFrom, req.YearTo, req.Campus, req.EmploymentStatus,
                req.SchoolName, req.DepartmentName);

            var data = await svc.BuildAsync(filters, ct);

            if (data.Stats.TotalCount == 0)
                return Results.BadRequest(new { error = "No graduates match the selected filters." });

            var narrative = new ReportNarrative(
                req.Narrative.ExecutiveSummary,
                req.Narrative.KeyFindings,
                req.Narrative.TrendsAnalysis,
                req.Narrative.Recommendations,
                req.Narrative.ReportSummary);

            var bytes = pdf.Generate(data, narrative);
            var filename = $"MUST_GradTrack_Report_{DateTime.Now:yyyyMMdd_HHmm}.pdf";
            return Results.File(bytes, "application/pdf", filename);
        });

        // Excel — same pattern
        group.MapPost("/excel", async (
            DownloadReportRequest req,
            ReportService svc, ExcelReportGenerator excel, CancellationToken ct) =>
        {
            var filters = BuildFilters(
                req.SchoolId, req.DepartmentId, req.ProgrammeName,
                req.YearFrom, req.YearTo, req.Campus, req.EmploymentStatus,
                req.SchoolName, req.DepartmentName);

            var data = await svc.BuildAsync(filters, ct);

            if (data.Stats.TotalCount == 0)
                return Results.BadRequest(new { error = "No graduates match the selected filters." });

            var narrative = new ReportNarrative(
                req.Narrative.ExecutiveSummary,
                req.Narrative.KeyFindings,
                req.Narrative.TrendsAnalysis,
                req.Narrative.Recommendations,
                req.Narrative.ReportSummary);

            var bytes = excel.Generate(data, narrative);
            var filename = $"MUST_GradTrack_Report_{DateTime.Now:yyyyMMdd_HHmm}.xlsx";
            return Results.File(bytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                filename);
        });

        return group;
    }

    private static ReportFilters BuildFilters(
        string? schoolId, string? departmentId, string? programmeName,
        int? yearFrom, int? yearTo, string? campus, string? employmentStatus,
        string? schoolName = null, string? departmentName = null) => new()
    {
        SchoolId         = schoolId,
        SchoolName       = schoolName,
        DepartmentId     = departmentId,
        DepartmentName   = departmentName,
        ProgrammeName    = programmeName,
        YearFrom         = yearFrom,
        YearTo           = yearTo,
        Campus           = campus,
        EmploymentStatus = employmentStatus,
    };
}

public sealed record GenerateReportRequest(
    string? SchoolId, string? SchoolName,
    string? DepartmentId, string? DepartmentName,
    string? ProgrammeName,
    int? YearFrom, int? YearTo,
    string? Campus, string? EmploymentStatus);

public sealed record NarrativeDto(
    string ReportSummary,
    string ExecutiveSummary,
    string KeyFindings,
    string TrendsAnalysis,
    string Recommendations);

public sealed record EditSectionRequest(
    string Section,
    string CurrentContent,
    string Instruction,
    string? Context);

public sealed record DownloadReportRequest(
    string? SchoolId, string? SchoolName,
    string? DepartmentId, string? DepartmentName,
    string? ProgrammeName,
    int? YearFrom, int? YearTo,
    string? Campus, string? EmploymentStatus,
    NarrativeDto Narrative);
