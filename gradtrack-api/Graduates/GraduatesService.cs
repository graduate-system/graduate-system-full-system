using Api.MustData;
using Api.Supabase;

namespace Api.Graduates;

public sealed class GraduatesService(SupabaseMetadataRepository metadata, IGraduatesRepository repo)
{
    public async Task<(GraduateRow? row, string? error)> ResolveRowAsync(GraduatePayloadDto payload, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(payload.FullName)) return (null, "Full name is required");

        // Student number is required and must be unique
        if (string.IsNullOrWhiteSpace(payload.StudentNumber))
            return (null, "Admission number is required.");

        var studentNumber = payload.StudentNumber.Trim().ToUpperInvariant();
        if (await repo.ExistsByStudentNumberAsync(studentNumber, cancellationToken))
            return (null, $"Admission number '{studentNumber}' is already registered. Each graduate can only submit once.");
        var schools = await metadata.GetSchoolsAsync(cancellationToken);

        // ── Resolve school ───────────────────────────────────────────────────────────────
        // Try: exact ID match → name contains match → abbreviation in parentheses → first school
        MustSchool? school = null;
        if (!string.IsNullOrWhiteSpace(payload.School))
        {
            var q = payload.School.Trim();
            school = schools.FirstOrDefault(s => string.Equals(s.Id, q, StringComparison.OrdinalIgnoreCase))
                  ?? schools.FirstOrDefault(s => s.Name.Contains(q, StringComparison.OrdinalIgnoreCase))
                  ?? schools.FirstOrDefault(s => s.Id.Contains(q, StringComparison.OrdinalIgnoreCase));
        }
        school ??= schools.FirstOrDefault();
        if (school is null) return (null, "No schools found in the system");

        // ── Resolve department ───────────────────────────────────────────────────────────
        MustDepartment? department = null;
        if (!string.IsNullOrWhiteSpace(payload.Department))
        {
            var q = payload.Department.Trim();
            // Search across all schools if not found in resolved school
            department = school.Departments.FirstOrDefault(d => string.Equals(d.Id, q, StringComparison.OrdinalIgnoreCase))
                      ?? school.Departments.FirstOrDefault(d => d.Name.Contains(q, StringComparison.OrdinalIgnoreCase))
                      ?? schools.SelectMany(s => s.Departments).FirstOrDefault(d => d.Name.Contains(q, StringComparison.OrdinalIgnoreCase))
                      ?? schools.SelectMany(s => s.Departments).FirstOrDefault(d => string.Equals(d.Id, q, StringComparison.OrdinalIgnoreCase));

            // If found in a different school, update school to match
            if (department is not null)
            {
                var owningSchool = schools.FirstOrDefault(s => s.Departments.Any(d => d.Id == department.Id));
                if (owningSchool is not null) school = owningSchool;
            }
        }
        department ??= school.Departments.FirstOrDefault();
        if (department is null) return (null, $"No departments found for school '{school.Name}'");

        // ── Resolve programme ──────────────────────────────────────────────────────────────
        string programmeName;
        if (!string.IsNullOrWhiteSpace(payload.Programme))
        {
            var q = payload.Programme.Trim();
            programmeName = department.Programmes.FirstOrDefault(p => string.Equals(p, q, StringComparison.OrdinalIgnoreCase))
                         ?? department.Programmes.FirstOrDefault(p => p.Contains(q, StringComparison.OrdinalIgnoreCase))
                         ?? department.Programmes.FirstOrDefault()
                         ?? q; // store as-is if truly not found
        }
        else
        {
            programmeName = department.Programmes.FirstOrDefault() ?? "Unknown Programme";
        }

        var programmeId = await repo.ResolveProgrammeIdAsync(department.Id, programmeName, cancellationToken);
        if (programmeId is null)
        {
            // Programme name not in DB — use first available programme in the department
            var fallbackProg = department.Programmes.FirstOrDefault();
            if (fallbackProg is not null)
            {
                programmeId = await repo.ResolveProgrammeIdAsync(department.Id, fallbackProg, cancellationToken);
                programmeName = fallbackProg;
            }
            if (programmeId is null) return (null, $"Could not resolve any programme for department '{department.Name}'");
        }

        // ── Defaults for missing required DB fields ────────────────────────────────────────────
        var campus = !string.IsNullOrWhiteSpace(payload.Campus) ? payload.Campus.Trim() : "Main Campus (Nchiru)";
        var employmentStatus = !string.IsNullOrWhiteSpace(payload.EmploymentStatus) ? payload.EmploymentStatus.Trim() : "Unknown";

        if (!int.TryParse(payload.GraduationYear, out var graduationYear))
            graduationYear = DateTime.Now.Year;

        // DB requires email OR phone — generate a placeholder if both missing
        var email = EmptyToNull(payload.Email);
        var phone = EmptyToNull(payload.Phone);
        if (email is null && phone is null)
            email = $"unknown+{Guid.NewGuid():N}@must.ac.ke";

        return (new GraduateRow
        {
            FullName         = payload.FullName.Trim(),
            StudentNumber    = studentNumber,
            Email            = email,
            Phone            = phone,
            Campus           = campus,
            SchoolId         = school.Id,
            DepartmentId     = department.Id,
            ProgrammeId      = programmeId.Value,
            GraduationYear   = graduationYear,
            EmploymentStatus = employmentStatus,
            EmployerName     = EmptyToNull(payload.EmployerName),
            JobTitle         = EmptyToNull(payload.JobTitle),
            Sector           = EmptyToNull(payload.Sector),
            EmploymentCounty = EmptyToNull(payload.EmploymentCounty),
            MonthsToEmploy   = EmptyToNull(payload.MonthsToEmploy),
            LinkedinUrl      = EmptyToNull(payload.LinkedinUrl),
            Skills           = payload.Skills is { Count: > 0 } ? payload.Skills : null,
            SchoolName       = school.Name,
            DepartmentName   = department.Name,
            ProgrammeName    = programmeName,
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
