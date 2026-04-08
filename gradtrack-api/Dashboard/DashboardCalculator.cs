using Api.Graduates;

namespace Api.Dashboard;

public static class DashboardCalculator
{
    private static readonly string[] EmployedStatuses =
    [
        "Employed (Full-time)",
        "Employed (Part-time)",
        "Self-employed / Entrepreneur",
        "Internship / Attachment",
    ];

    public static DashboardDataDto Calculate(IReadOnlyList<GraduateReadModel> graduates)
    {
        var total = graduates.Count;
        if (total == 0) return DashboardDataDto.Empty();

        var employed = graduates.Where(r => EmployedStatuses.Contains(r.EmploymentStatus, StringComparer.Ordinal)).ToList();

        var bySchool = graduates
            .GroupBy(r => r.SchoolName, StringComparer.Ordinal)
            .Select(g => new NamedCountDto(ShortSchool(g.Key), g.Count()))
            .OrderByDescending(x => x.Count)
            .ToList();

        var byStatus = graduates
            .GroupBy(r => r.EmploymentStatus, StringComparer.Ordinal)
            .Select(g => new NamedCountDto(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .ToList();

        var byYear = graduates
            .GroupBy(r => r.GraduationYear)
            .Select(g =>
            {
                var employedCount = g.Count(r => EmployedStatuses.Contains(r.EmploymentStatus, StringComparer.Ordinal));
                return new YearCountDto(g.Key, g.Count(), employedCount);
            })
            .OrderBy(x => x.Year)
            .ToList();

        var bySector = graduates
            .Where(r => !string.IsNullOrWhiteSpace(r.Sector))
            .GroupBy(r => r.Sector!, StringComparer.Ordinal)
            .Select(g => new NamedCountDto(ShortSector(g.Key), g.Count()))
            .OrderByDescending(x => x.Count)
            .ToList();

        var byCampus = graduates
            .GroupBy(r => r.Campus, StringComparer.Ordinal)
            .Select(g => new NamedCountDto(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .ToList();

        var byDepartment = graduates
            .GroupBy(r => r.DepartmentName, StringComparer.Ordinal)
            .Select(g =>
            {
                var school = ShortSchool(g.First().SchoolName);
                return new DepartmentCountDto(ShortDept(g.Key), school, g.Count());
            })
            .OrderByDescending(x => x.Count)
            .ToList();

        var byMonthsToEmploy = graduates
            .Where(r => !string.IsNullOrWhiteSpace(r.MonthsToEmploy))
            .GroupBy(r => r.MonthsToEmploy!, StringComparer.Ordinal)
            .Select(g => new NamedCountDto(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .ToList();

        var bySkill = graduates
            .Where(r => r.Skills is { Count: > 0 })
            .SelectMany(r => r.Skills!)
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .GroupBy(s => s, StringComparer.Ordinal)
            .Select(g => new NamedCountDto(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .ToList();

        return new DashboardDataDto(
            Graduates: graduates,
            TotalCount: total,
            BySchool: bySchool,
            ByStatus: byStatus,
            ByYear: byYear,
            BySector: bySector,
            ByCampus: byCampus,
            ByDepartment: byDepartment,
            ByMonthsToEmploy: byMonthsToEmploy,
            BySkill: bySkill,
            EmploymentRate: total > 0 ? (int)Math.Round(employed.Count / (double)total * 100) : 0
        );
    }

    private static string ShortSchool(string name)
    {
        var match = System.Text.RegularExpressions.Regex.Match(name, "\\(([^)]+)\\)");
        return match.Success ? match.Groups[1].Value : name;
    }

    private static string ShortDept(string name) => name.Replace("Department of ", "", StringComparison.Ordinal);

    private static string ShortSector(string name)
    {
        var match = System.Text.RegularExpressions.Regex.Match(name, "\\(([^)]+)\\)");
        return match.Success ? match.Groups[1].Value : name.Length > 25 ? name[..25] : name;
    }
}

public sealed record NamedCountDto(string Name, int Count);
public sealed record YearCountDto(int Year, int Count, int Employed);
public sealed record DepartmentCountDto(string Name, string School, int Count);

public sealed record DashboardDataDto(
    IReadOnlyList<GraduateReadModel> Graduates,
    int TotalCount,
    IReadOnlyList<NamedCountDto> BySchool,
    IReadOnlyList<NamedCountDto> ByStatus,
    IReadOnlyList<YearCountDto> ByYear,
    IReadOnlyList<NamedCountDto> BySector,
    IReadOnlyList<NamedCountDto> ByCampus,
    IReadOnlyList<DepartmentCountDto> ByDepartment,
    IReadOnlyList<NamedCountDto> ByMonthsToEmploy,
    IReadOnlyList<NamedCountDto> BySkill,
    int EmploymentRate
)
{
    public static DashboardDataDto Empty() => new(
        Graduates: [],
        TotalCount: 0,
        BySchool: [],
        ByStatus: [],
        ByYear: [],
        BySector: [],
        ByCampus: [],
        ByDepartment: [],
        ByMonthsToEmploy: [],
        BySkill: [],
        EmploymentRate: 0
    );
}

