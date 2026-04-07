namespace Api.Reports;

public sealed record ReportFilters
{
    public string? SchoolId { get; init; }
    public string? SchoolName { get; init; }
    public string? DepartmentId { get; init; }
    public string? DepartmentName { get; init; }
    public string? ProgrammeName { get; init; }
    public int? YearFrom { get; init; }
    public int? YearTo { get; init; }
    public string? Campus { get; init; }
    public string? EmploymentStatus { get; init; }

    public string ScopeLabel
    {
        get
        {
            var parts = new List<string>();
            if (!string.IsNullOrWhiteSpace(SchoolName)) parts.Add(SchoolName);
            else if (!string.IsNullOrWhiteSpace(SchoolId)) parts.Add(SchoolId.ToUpperInvariant());
            if (!string.IsNullOrWhiteSpace(DepartmentName)) parts.Add(DepartmentName);
            if (!string.IsNullOrWhiteSpace(ProgrammeName)) parts.Add(ProgrammeName);
            if (!string.IsNullOrWhiteSpace(Campus)) parts.Add(Campus);
            if (!string.IsNullOrWhiteSpace(EmploymentStatus)) parts.Add(EmploymentStatus);
            if (YearFrom.HasValue && YearTo.HasValue) parts.Add($"{YearFrom}–{YearTo}");
            else if (YearFrom.HasValue) parts.Add($"From {YearFrom}");
            else if (YearTo.HasValue) parts.Add($"Up to {YearTo}");
            return parts.Count > 0 ? string.Join(" · ", parts) : "All Graduates";
        }
    }
}
