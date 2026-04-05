using Api.Committee;
using Api.Dashboard;
using Api.Graduates;

namespace Api.Endpoints;

public static class DashboardEndpoints
{
    public static RouteGroupBuilder MapDashboardEndpoints(this RouteGroupBuilder api)
    {
        var group = api.MapGroup("/dashboard").RequireCommitteeSession();

        group.MapGet("/",
            async (IGraduatesRepository repo, CancellationToken ct) =>
            {
                var grads = await repo.FetchGraduatesAsync(ct);
                var dashboard = DashboardCalculator.Calculate(grads);
                return Results.Ok(dashboard);
            });

        return group;
    }
}

