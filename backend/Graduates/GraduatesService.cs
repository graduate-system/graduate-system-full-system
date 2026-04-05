using Api.MustData;
using Api.Supabase;

namespace Api.Graduates;

public sealed class GraduatesService(SupabaseMetadataRepository metadata, IGraduatesRepository repo)
{
    public async Task<(GraduateRow? row, string? error)> ResolveRowAsync(GraduatePayloadDto payload, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(payload.FullName)) return (null, "Full name is required");
        if (string.IsNullOrWhiteSpace(payload.Campus)) return (null, "Campus is required");
        if (string.IsNullOrWhiteSpace(payload.School)) return (null, "Invalid school");
        if (string.IsNullOrWhiteSpace(payload.Department)) return (null, "Invalid department");
        if (string.IsNullOrWhiteSpace(payload.Programme)) return (null, "Invalid programme");

        if (string.IsNullOrWhiteSpace(payload.Email) && string.IsNullOrWhiteSpace(payload.Phone))
        {
            return (null, "Email or phone is required");
        }

        if (!int.TryParse(payload.GraduationYear, out var graduationYear))
        {
            return (null, "Invalid graduation year");
        }

        var schools = await metadata.GetSchoolsAsync(cancellationToken);
        var school = schools.FirstOrDefault(s => string.Equals(s.Id, payload.School, StringComparison.Ordinal));
        if (school is null) return (null, "Invalid school");

        var department = school.Departments.FirstOrDefault(d => string.Equals(d.Id, payload.Department, StringComparison.Ordinal));
        if (department is null) return (null, "Invalid department");

        if (!department.Programmes.Contains(payload.Programme, StringComparer.Ordinal))
        {
            return (null, "Invalid programme");
        }

        var programmeId = await repo.ResolveProgrammeIdAsync(payload.Department, payload.Programme, cancellationToken);
        if (programmeId is null) return (null, "Could not resolve programme");

        return (new GraduateRow
        {
            FullName = payload.FullName,
            StudentNumber = EmptyToNull(payload.StudentNumber),
            Email = EmptyToNull(payload.Email),
            Phone = EmptyToNull(payload.Phone),
            Campus = payload.Campus,
            SchoolId = payload.School,
            DepartmentId = payload.Department,
            ProgrammeId = programmeId.Value,
            GraduationYear = graduationYear,
            EmploymentStatus = payload.EmploymentStatus,
            EmployerName = EmptyToNull(payload.EmployerName),
            JobTitle = EmptyToNull(payload.JobTitle),
            Sector = EmptyToNull(payload.Sector),
            EmploymentCounty = EmptyToNull(payload.EmploymentCounty),
            MonthsToEmploy = EmptyToNull(payload.MonthsToEmploy),
            LinkedinUrl = EmptyToNull(payload.LinkedinUrl),
            SchoolName = school.Name,
            DepartmentName = department.Name,
            ProgrammeName = payload.Programme,
        }, null);
    }

    public async Task<(long? id, string? error)> InsertOneAsync(GraduatePayloadDto payload, CancellationToken cancellationToken)
    {
        try
        {
            var (row, error) = await ResolveRowAsync(payload, cancellationToken);
            if (row is null) return (null, error);

            var id = await repo.InsertGraduateAsync(row, cancellationToken);
            return (id, null);
        }
        catch (SupabaseRequestException ex)
        {
            return (null, ex.Message);
        }
        catch
        {
            return (null, "An unexpected error occurred. Please try again.");
        }
    }

    public async Task<BulkResultDto> InsertManyAsync(IReadOnlyList<GraduatePayloadDto> payloads, CancellationToken cancellationToken)
    {
        var inserted = 0;
        var failures = new List<BulkFailureDto>();

        var resolved = new List<(int Index, GraduateRow Row)>(payloads.Count);
        for (var i = 0; i < payloads.Count; i++)
        {
            var (row, error) = await ResolveRowAsync(payloads[i], cancellationToken);
            if (row is null)
            {
                failures.Add(new BulkFailureDto(Row: i + 1, Error: error!));
                continue;
            }
            resolved.Add((i, row));
        }

        if (resolved.Count == 0) return new BulkResultDto(Inserted: inserted, Failed: failures);

        const int ChunkSize = 100;
        for (var i = 0; i < resolved.Count; i += ChunkSize)
        {
            var chunk = resolved.Skip(i).Take(ChunkSize).ToList();
            try
            {
                await repo.InsertGraduatesAsync(chunk.Select(c => c.Row), cancellationToken);
                inserted += chunk.Count;
            }
            catch (SupabaseRequestException)
            {
                foreach (var item in chunk)
                {
                    try
                    {
                        await repo.InsertGraduateAsync(item.Row, cancellationToken);
                        inserted += 1;
                    }
                    catch (SupabaseRequestException rowEx)
                    {
                        failures.Add(new BulkFailureDto(Row: item.Index + 1, Error: rowEx.Message));
                    }
                    catch
                    {
                        failures.Add(new BulkFailureDto(Row: item.Index + 1, Error: "An unexpected error occurred. Please try again."));
                    }
                }
            }
        }

        return new BulkResultDto(Inserted: inserted, Failed: failures);
    }

    private static string? EmptyToNull(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();
}

public sealed record BulkFailureDto(int Row, string Error);
public sealed record BulkResultDto(int Inserted, List<BulkFailureDto> Failed);
