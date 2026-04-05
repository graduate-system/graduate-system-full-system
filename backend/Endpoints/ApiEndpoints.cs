namespace Api.Endpoints;

public static class ApiEndpoints
{
    public static IEndpointRouteBuilder MapApiEndpoints(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("/api");

        api.MapGet("/health", () => Results.Ok(new { ok = true }));

        api.MapCommitteeEndpoints();
        api.MapMetadataEndpoints();
        api.MapGraduatesEndpoints();
        api.MapDashboardEndpoints();
        api.MapAdminEndpoints();

        return app;
    }
}
