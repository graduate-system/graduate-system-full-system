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

        group.MapPost("/bulk-excel",
            async (HttpRequest request, GraduatesService service, CancellationToken ct) =>
            {
                try
                {
                    if (!request.HasFormContentType)
                        return Results.BadRequest(new { success = false, error = "Upload an Excel file (.xlsx or .xls)." });

                    var form = await request.ReadFormAsync(ct);
                    if (form.Files.Count == 0)
                        return Results.BadRequest(new { success = false, error = "Upload an Excel file (.xlsx or .xls)." });

                    var file = form.Files[0];
                    var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                    if (ext is not (".xlsx" or ".xls"))
                        return Results.BadRequest(new { success = false, error = "Only .xlsx and .xls files are accepted." });

                    using var stream = file.OpenReadStream();
                    var (payloads, parseError) = ExcelGraduateParser.Parse(stream);
                    if (payloads is null)
                        return Results.BadRequest(new { success = false, error = parseError });

                    var result = await service.InsertManyAsync(payloads, ct);
                    return Results.Ok(new { inserted = result.Inserted, failed = result.Failed });
                }
                catch (Exception)
                {
                    return Results.BadRequest(new { success = false, error = "Invalid request. Upload a valid .xlsx or .xls file." });
                }
            });

        return group;
    }
}

