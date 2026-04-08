namespace Api.Graduates;

public interface IGraduatesRepository
{
    Task<long?> ResolveProgrammeIdAsync(string departmentId, string programmeName, CancellationToken cancellationToken);
    Task<long> InsertGraduateAsync(GraduateRow row, CancellationToken cancellationToken);
    Task InsertGraduatesAsync(IEnumerable<GraduateRow> rows, CancellationToken cancellationToken);
    Task<IReadOnlyList<GraduateReadModel>> FetchGraduatesAsync(CancellationToken cancellationToken);
    Task<DbStatsReadModel> FetchDbStatsAsync(CancellationToken cancellationToken);
    Task<long> PurgeAllGraduatesAsync(CancellationToken cancellationToken);
}

public sealed record GraduateReadModel(
    long Id,
    DateTimeOffset CreatedAt,
    string FullName,
    string? StudentNumber,
    string? Email,
    string? Phone,
    string Campus,
    string SchoolId,
    string DepartmentId,
    long ProgrammeId,
    int GraduationYear,
    string EmploymentStatus,
    string? EmployerName,
    string? JobTitle,
    string? Sector,
    string? EmploymentCounty,
    string? MonthsToEmploy,
    string? LinkedinUrl,
    string SchoolName,
    string DepartmentName,
    string ProgrammeName,
    IReadOnlyList<string>? Skills
);

public sealed record DbStatsReadModel(
    long TotalGraduates,
    DateTimeOffset? OldestRecord,
    DateTimeOffset? NewestRecord,
    long SchoolCount,
    long ProgrammeCount
);
