using Api.Supabase;

namespace Api.MustData;

public sealed record MustSchool(string Id, string Name, IReadOnlyList<MustDepartment> Departments);
public sealed record MustDepartment(string Id, string Name, IReadOnlyList<string> Programmes);

public sealed class SupabaseMetadataRepository(SupabaseRestClient supabase)
{
    // Cached on first load — lookup data is static, no need to re-query per request
    private IReadOnlyList<MustSchool>? _cache;
    private readonly SemaphoreSlim _lock = new(1, 1);

    public async Task<IReadOnlyList<MustSchool>> GetSchoolsAsync(CancellationToken cancellationToken = default)
    {
        if (_cache is not null) return _cache;

        await _lock.WaitAsync(cancellationToken);
        try
        {
            if (_cache is not null) return _cache;
            _cache = await LoadFromSupabaseAsync(cancellationToken);
            return _cache;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<(MustSchool school, MustDepartment department)?> TryResolveDepartmentAsync(
        string schoolId, string departmentId, CancellationToken cancellationToken = default)
    {
        var schools = await GetSchoolsAsync(cancellationToken);
        var school = schools.FirstOrDefault(s => string.Equals(s.Id, schoolId, StringComparison.Ordinal));
        if (school is null) return null;

        var department = school.Departments.FirstOrDefault(d => string.Equals(d.Id, departmentId, StringComparison.Ordinal));
        return department is null ? null : (school, department);
    }

    private async Task<IReadOnlyList<MustSchool>> LoadFromSupabaseAsync(CancellationToken cancellationToken)
    {
        // Fetch all three tables in parallel
        var schoolsTask = supabase.GetJsonAsync<List<SchoolRow>>(
            "rest/v1/schools?select=id,name&order=name.asc", cancellationToken);

        var deptsTask = supabase.GetJsonAsync<List<DepartmentRow>>(
            "rest/v1/departments?select=id,school_id,name&order=name.asc", cancellationToken);

        var progsTask = supabase.GetJsonAsync<List<ProgrammeRow>>(
            "rest/v1/programmes?select=department_id,name&order=name.asc", cancellationToken);

        await Task.WhenAll(schoolsTask, deptsTask, progsTask);

        var schoolRows = await schoolsTask;
        var deptRows = await deptsTask;
        var progRows = await progsTask;

        // Group programmes by department_id
        var progsByDept = progRows
            .GroupBy(p => p.DepartmentId)
            .ToDictionary(g => g.Key, g => (IReadOnlyList<string>)g.Select(p => p.Name).ToList());

        // Group departments by school_id
        var deptsBySchool = deptRows
            .GroupBy(d => d.SchoolId)
            .ToDictionary(g => g.Key, g => g.Select(d => new MustDepartment(
                d.Id,
                d.Name,
                progsByDept.TryGetValue(d.Id, out var progs) ? progs : []
            )).ToList());

        return schoolRows
            .Select(s => new MustSchool(
                s.Id,
                s.Name,
                deptsBySchool.TryGetValue(s.Id, out var depts) ? depts : []
            ))
            .ToList();
    }

    private sealed record SchoolRow(string Id, string Name);
    private sealed record DepartmentRow(string Id, string SchoolId, string Name);
    private sealed record ProgrammeRow(string DepartmentId, string Name);
}
