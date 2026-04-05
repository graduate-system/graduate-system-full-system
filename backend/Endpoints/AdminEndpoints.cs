using Api.Committee;
using Api.Graduates;

namespace Api.Endpoints;

public static class AdminEndpoints
{
    public static RouteGroupBuilder MapAdminEndpoints(this RouteGroupBuilder api)
    {
        var group = api.MapGroup("/admin").RequireCommitteeSession();

        group.MapGet("/stats", async (IGraduatesRepository repo, CancellationToken ct) =>
        {
            var stats = await repo.FetchDbStatsAsync(ct);
            return Results.Ok(stats);
        });

        group.MapDelete("/graduates",
            async (HttpContext httpContext, IGraduatesRepository repo, CancellationToken ct) =>
            {
                var confirm = httpContext.Request.Headers["X-Confirm-Purge"].ToString();
                if (!string.Equals(confirm, "YES", StringComparison.Ordinal))
                {
                    return Results.BadRequest(new { success = false, error = "Missing confirmation header X-Confirm-Purge: YES" });
                }

                var deleted = await repo.PurgeAllGraduatesAsync(ct);
                return Results.Ok(new { success = true, deleted });
            });

        return group;
    }
}

