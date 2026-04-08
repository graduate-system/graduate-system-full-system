using Api.Supabase;
using System.Net.Http.Headers;

namespace Api.Graduates;

public sealed class SupabaseGraduatesRepository(SupabaseRestClient supabase) : IGraduatesRepository
{
    public async Task<long?> ResolveProgrammeIdAsync(string departmentId, string programmeName, CancellationToken cancellationToken)
    {
        var url = $"rest/v1/programmes?select=id&department_id=eq.{Escape(departmentId)}&name=eq.{Escape(programmeName)}&limit=1";
        var rows = await supabase.GetJsonAsync<List<IdRow>>(url, cancellationToken);
        return rows.FirstOrDefault()?.Id;
    }

    public async Task<long> InsertGraduateAsync(GraduateRow row, CancellationToken cancellationToken)
    {
        var url = "rest/v1/graduates?select=id";
        var inserted = await supabase.PostJsonAsync<List<IdRow>>(url, row, headers: [("Prefer", "return=representation")], cancellationToken);
        return inserted.FirstOrDefault()?.Id ?? throw new InvalidOperationException("Insert succeeded but no id was returned.");
    }

    public async Task InsertGraduatesAsync(IEnumerable<GraduateRow> rows, CancellationToken cancellationToken)
    {
        var url = "rest/v1/graduates";
        await supabase.PostAsync(url, rows, headers: [("Prefer", "return=minimal")], cancellationToken);
    }

    public async Task<IReadOnlyList<GraduateReadModel>> FetchGraduatesAsync(CancellationToken cancellationToken)
    {
        var url = "rest/v1/graduates?select=*&order=created_at.desc";
        var rows = await supabase.GetJsonAsync<List<GraduateReadModel>>(url, cancellationToken);
        return rows;
    }

    public async Task<DbStatsReadModel> FetchDbStatsAsync(CancellationToken cancellationToken)
    {
        var total = await CountAsync("graduates", cancellationToken);
        var oldest = await FirstCreatedAtAsync(orderAsc: true, cancellationToken);
        var newest = await FirstCreatedAtAsync(orderAsc: false, cancellationToken);

        var schools = await DistinctCountAsync("graduates", "school_id", cancellationToken);
        var programmes = await DistinctCountAsync("graduates", "programme_id", cancellationToken);

        return new DbStatsReadModel(
            TotalGraduates: total,
            OldestRecord: oldest,
            NewestRecord: newest,
            SchoolCount: schools,
            ProgrammeCount: programmes
        );
    }

    public async Task<long> PurgeAllGraduatesAsync(CancellationToken cancellationToken)
    {
        var total = await CountAsync("graduates", cancellationToken);
        await supabase.DeleteAsync("rest/v1/graduates?id=neq.0", headers: [("Prefer", "return=minimal")], cancellationToken);
        return total;
    }

    private async Task<long> CountAsync(string table, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, $"rest/v1/{table}?select=id&limit=1");
        request.Headers.TryAddWithoutValidation("Prefer", "count=exact");
        request.Headers.Range = new RangeHeaderValue(0, 0);

        using var response = await supabase.SendAsync(request, cancellationToken);
        var contentRange = response.Content.Headers.ContentRange;
        if (contentRange?.Length is long length)
        {
            return length;
        }

        // Fallback: attempt to parse Content-Range manually (some proxies strip typed header info).
        if (response.Headers.TryGetValues("Content-Range", out var values))
        {
            var raw = values.FirstOrDefault();
            var slash = raw?.LastIndexOf('/') ?? -1;
            if (slash >= 0 && long.TryParse(raw!.Substring(slash + 1), out var parsed))
            {
                return parsed;
            }
        }

        return 0;
    }

    private async Task<DateTimeOffset?> FirstCreatedAtAsync(bool orderAsc, CancellationToken cancellationToken)
    {
        var dir = orderAsc ? "asc" : "desc";
        var url = $"rest/v1/graduates?select=created_at&order=created_at.{dir}&limit=1";
        var rows = await supabase.GetJsonAsync<List<CreatedAtRow>>(url, cancellationToken);
        return rows.FirstOrDefault()?.CreatedAt;
    }

    private async Task<long> DistinctCountAsync(string table, string column, CancellationToken cancellationToken)
    {
        var url = $"rest/v1/{table}?select={Escape(column)}&limit=1000";
        var values = await supabase.GetJsonAsync<List<Dictionary<string, object?>>>(url, cancellationToken);
        return values
            .Select(v => v.TryGetValue(column, out var raw) ? raw?.ToString() : null)
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Distinct(StringComparer.Ordinal)
            .LongCount();
    }

    private static string Escape(string s) => Uri.EscapeDataString(s);

    private sealed record IdRow(long Id);
    private sealed record CreatedAtRow(DateTimeOffset CreatedAt);
}
