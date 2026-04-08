namespace Api.Graduates;

public sealed record GraduatePayloadDto
{
    public required string FullName { get; init; }
    public string? StudentNumber { get; init; }
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public string? Campus { get; init; }
    public string? School { get; init; }
    public string? Department { get; init; }
    public string? Programme { get; init; }
    public string? GraduationYear { get; init; }
    public string? EmploymentStatus { get; init; }
    public string? EmployerName { get; init; }
    public string? JobTitle { get; init; }
    public string? Sector { get; init; }
    public string? EmploymentCounty { get; init; }
    public string? MonthsToEmploy { get; init; }
    public string? LinkedinUrl { get; init; }
    public IReadOnlyList<string>? Skills { get; init; }
}
