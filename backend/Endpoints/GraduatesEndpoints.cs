using Api.Graduates;

namespace Api.Endpoints;

public static class GraduatesEndpoints
{
    public static RouteGroupBuilder MapGraduatesEndpoints(this RouteGroupBuilder api)
    {
        var group = api.MapGroup("/graduates");

        group.MapPost("/",
            async (GraduatePayloadDto payload, GraduatesService service, CancellationToken ct) =>
            {
                var (id, error) = await service.InsertOneAsync(payload, ct);
                return id is not null
                    ? Results.Ok(new { success = true, id })
                    : Results.BadRequest(new { success = false, error });
            });

        group.MapPost("/bulk",
            async (IReadOnlyList<GraduatePayloadDto> payloads, GraduatesService service, CancellationToken ct) =>
            {
                var result = await service.InsertManyAsync(payloads, ct);
                return Results.Ok(new { inserted = result.Inserted, failed = result.Failed });
            });

        return group;
    }
}

