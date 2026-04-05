namespace Api.Graduates;

public sealed record GraduateRow
{
    public required string FullName { get; init; }
    public string? StudentNumber { get; init; }
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public required string Campus { get; init; }
    public required string SchoolId { get; init; }
    public required string DepartmentId { get; init; }
    public required long ProgrammeId { get; init; }
    public required int GraduationYear { get; init; }
    public required string EmploymentStatus { get; init; }
    public string? EmployerName { get; init; }
    public string? JobTitle { get; init; }
    public string? Sector { get; init; }
    public string? EmploymentCounty { get; init; }
    public string? MonthsToEmploy { get; init; }
    public string? LinkedinUrl { get; init; }
    public required string SchoolName { get; init; }
    public required string DepartmentName { get; init; }
    public required string ProgrammeName { get; init; }
}
