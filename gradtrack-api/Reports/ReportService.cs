using Api.Dashboard;
using Api.Graduates;

namespace Api.Reports;

public sealed class ReportService(IGraduatesRepository repo)
{
    private static readonly string[] EmployedStatuses =
    [
        "Employed (Full-time)",
        "Employed (Part-time)",
        "Self-employed / Entrepreneur",
        "Internship / Attachment",
    ];

    public async Task<ReportData> BuildAsync(ReportFilters filters, CancellationToken ct)
    {
        var all = await repo.FetchGraduatesAsync(ct);
        var filtered = Apply(all, filters);
        var stats = DashboardCalculator.Calculate(filtered);
        return new ReportData(filters, filtered, stats);
    }

    private static IReadOnlyList<GraduateReadModel> Apply(
        IReadOnlyList<GraduateReadModel> graduates, ReportFilters f)
    {
        var q = graduates.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(f.SchoolId))
            q = q.Where(g => string.Equals(g.SchoolId, f.SchoolId, StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrWhiteSpace(f.DepartmentId))
            q = q.Where(g => string.Equals(g.DepartmentId, f.DepartmentId, StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrWhiteSpace(f.ProgrammeName))
            q = q.Where(g => string.Equals(g.ProgrammeName, f.ProgrammeName, StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrWhiteSpace(f.Campus))
            q = q.Where(g => string.Equals(g.Campus, f.Campus, StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrWhiteSpace(f.EmploymentStatus))
            q = q.Where(g => string.Equals(g.EmploymentStatus, f.EmploymentStatus, StringComparison.OrdinalIgnoreCase));

        if (f.YearFrom.HasValue)
            q = q.Where(g => g.GraduationYear >= f.YearFrom.Value);

        if (f.YearTo.HasValue)
            q = q.Where(g => g.GraduationYear <= f.YearTo.Value);

        return q.ToList();
    }
}

public sealed record ReportData(
    ReportFilters Filters,
    IReadOnlyList<GraduateReadModel> Graduates,
    DashboardDataDto Stats
);
