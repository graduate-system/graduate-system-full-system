using Api.MustData;

namespace Api.Endpoints;

public static class MetadataEndpoints
{
    public static RouteGroupBuilder MapMetadataEndpoints(this RouteGroupBuilder api)
    {
        var group = api.MapGroup("/metadata");

        group.MapGet("/schools", async (SupabaseMetadataRepository repo, CancellationToken ct) =>
        {
            var schools = await repo.GetSchoolsAsync(ct);
            return Results.Ok(new
            {
                schools = schools.Select(s => new { s.Id, s.Name }),
            });
        });

        group.MapGet("/departments", async (string school_id, SupabaseMetadataRepository repo, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(school_id))
                return Results.BadRequest(new { error = "school_id is required" });

            var schools = await repo.GetSchoolsAsync(ct);
            var school = schools.FirstOrDefault(s => string.Equals(s.Id, school_id, StringComparison.Ordinal));
            if (school is null)
                return Results.NotFound(new { error = "School not found" });

            return Results.Ok(new
            {
                departments = school.Departments.Select(d => new { d.Id, d.Name }),
            });
        });

        group.MapGet("/programmes", async (string school_id, string department_id, SupabaseMetadataRepository repo, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(school_id))
                return Results.BadRequest(new { error = "school_id is required" });

            if (string.IsNullOrWhiteSpace(department_id))
                return Results.BadRequest(new { error = "department_id is required" });

            var resolved = await repo.TryResolveDepartmentAsync(school_id, department_id, ct);
            if (resolved is null)
                return Results.NotFound(new { error = "Department not found" });

            return Results.Ok(new { programmes = resolved.Value.department.Programmes });
        });

        return group;
    }
}
