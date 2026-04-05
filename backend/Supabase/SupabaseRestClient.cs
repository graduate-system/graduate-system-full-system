using Microsoft.Extensions.Options;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Api.Json;

namespace Api.Supabase;

public sealed class SupabaseRestClient
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNamingPolicy = new SnakeCaseNamingPolicy(),
    };
    private readonly HttpClient _http;

    public SupabaseRestClient(HttpClient http, IOptions<SupabaseOptions> options)
    {
        var url = options.Value.Url;
        var key = options.Value.ServiceRoleKey;

        if (string.IsNullOrWhiteSpace(url) || string.IsNullOrWhiteSpace(key))
        {
            throw new InvalidOperationException("Supabase backend is not configured. Set Supabase:Url and Supabase:ServiceRoleKey (or env vars).");
        }

        _http = http;
        _http.BaseAddress = new Uri(url.TrimEnd('/') + "/");
        _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", key);
        _http.DefaultRequestHeaders.Remove("apikey");
        _http.DefaultRequestHeaders.Add("apikey", key);
    }

    public async Task<T> GetJsonAsync<T>(string relativeUrl, CancellationToken cancellationToken)
    {
        using var response = await _http.GetAsync(relativeUrl, cancellationToken);
        await EnsureSuccessAsync(response, cancellationToken);
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var value = await JsonSerializer.DeserializeAsync<T>(stream, JsonOptions, cancellationToken);
        return value ?? throw new InvalidOperationException("Supabase returned an empty response.");
    }

    public async Task<T> PostJsonAsync<T>(string relativeUrl, object body, IEnumerable<(string Name, string Value)>? headers, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, relativeUrl)
        {
            Content = new StringContent(JsonSerializer.Serialize(body, JsonOptions), Encoding.UTF8, "application/json"),
        };

        if (headers is not null)
        {
            foreach (var (name, headerValue) in headers)
            {
                request.Headers.TryAddWithoutValidation(name, headerValue);
            }
        }

        using var response = await _http.SendAsync(request, cancellationToken);
        await EnsureSuccessAsync(response, cancellationToken);

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var value = await JsonSerializer.DeserializeAsync<T>(stream, JsonOptions, cancellationToken);
        return value ?? throw new InvalidOperationException("Supabase returned an empty response.");
    }

    public async Task PostAsync(string relativeUrl, object body, IEnumerable<(string Name, string Value)>? headers, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, relativeUrl)
        {
            Content = new StringContent(JsonSerializer.Serialize(body, JsonOptions), Encoding.UTF8, "application/json"),
        };

        if (headers is not null)
        {
            foreach (var (name, headerValue) in headers)
            {
                request.Headers.TryAddWithoutValidation(name, headerValue);
            }
        }

        using var response = await _http.SendAsync(request, cancellationToken);
        await EnsureSuccessAsync(response, cancellationToken);
    }

    public async Task DeleteAsync(string relativeUrl, IEnumerable<(string Name, string Value)>? headers, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Delete, relativeUrl);
        if (headers is not null)
        {
            foreach (var (name, headerValue) in headers)
            {
                request.Headers.TryAddWithoutValidation(name, headerValue);
            }
        }

        using var response = await _http.SendAsync(request, cancellationToken);
        await EnsureSuccessAsync(response, cancellationToken);
    }

    public async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var response = await _http.SendAsync(request, cancellationToken);
        try
        {
            await EnsureSuccessAsync(response, cancellationToken);
            return response;
        }
        catch
        {
            response.Dispose();
            throw;
        }
    }

    private static async Task EnsureSuccessAsync(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        if (response.IsSuccessStatusCode) return;
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        var message = TryExtractJsonErrorMessage(body) ??
                      (string.IsNullOrWhiteSpace(body) ? response.ReasonPhrase ?? "Request failed" : body);
        throw new SupabaseRequestException((int)response.StatusCode, message);
    }

    private static string? TryExtractJsonErrorMessage(string body)
    {
        if (string.IsNullOrWhiteSpace(body)) return null;
        try
        {
            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.ValueKind != JsonValueKind.Object) return null;
            if (!doc.RootElement.TryGetProperty("message", out var messageEl)) return null;
            return messageEl.ValueKind == JsonValueKind.String ? messageEl.GetString() : null;
        }
        catch
        {
            return null;
        }
    }
}

public sealed class SupabaseRequestException(int statusCode, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
}
