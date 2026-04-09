using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Api.Committee;
using Api.Graduates;
using Api.MustData;
using Api.Tests.Helpers;
using ClosedXML.Excel;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;
using NSubstitute;

namespace Api.Tests.Integration;

/// <summary>
/// Boots the real ASP.NET Core pipeline in-memory.
/// Replaces Supabase-dependent services with fakes so no real DB is needed.
/// </summary>
public class EndpointIntegrationTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;
    private HttpClient? _authedClient;

    public EndpointIntegrationTests(ApiFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateClient() => _factory.CreateClient();

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static StringContent Json(object body) =>
        new(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

    /// <summary>
    /// Returns a single authenticated client shared across all tests in this class.
    /// One login call avoids hitting the rate limiter (10/min per IP).
    /// </summary>
    private async Task<HttpClient> AuthenticatedClient()
    {
        if (_authedClient is not null) return _authedClient;
        _authedClient = CreateClient();
        var res = await _authedClient.PostAsync("/api/committee/login",
            Json(new { pin = ApiFactory.TestPin }));
        res.EnsureSuccessStatusCode();
        return _authedClient;
    }

    // ── Health ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GET_Health_Returns200()
    {
        var client = CreateClient();
        var res = await client.GetAsync("/api/health");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.GetProperty("ok").GetBoolean());
    }

    // ── Committee Login ───────────────────────────────────────────────────────

    [Fact]
    public async Task POST_CommitteeLogin_CorrectPin_Returns200_SetsCookie()
    {
        var client = CreateClient();
        var res = await client.PostAsync("/api/committee/login",
            Json(new { pin = ApiFactory.TestPin }));
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        Assert.True(res.Headers.Contains("Set-Cookie"));
    }

    [Fact]
    public async Task POST_CommitteeLogin_WrongPin_Returns401()
    {
        var client = CreateClient();
        var res = await client.PostAsync("/api/committee/login",
            Json(new { pin = "wrongpin" }));
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task POST_CommitteeLogin_EmptyPin_Returns400()
    {
        var client = CreateClient();
        var res = await client.PostAsync("/api/committee/login",
            Json(new { pin = "" }));
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    // ── Committee Session ─────────────────────────────────────────────────────

    [Fact]
    public async Task GET_CommitteeSession_WithValidCookie_ReturnsAuthenticated()
    {
        var client = await AuthenticatedClient();
        var res = await client.GetAsync("/api/committee/session");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.GetProperty("authenticated").GetBoolean());
    }

    [Fact]
    public async Task GET_CommitteeSession_WithNoCookie_ReturnsNotAuthenticated()
    {
        var client = CreateClient();
        var res = await client.GetAsync("/api/committee/session");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(body.GetProperty("authenticated").GetBoolean());
    }

    // ── Committee Logout ──────────────────────────────────────────────────────

    [Fact]
    public async Task POST_CommitteeLogout_Returns200()
    {
        var client = await AuthenticatedClient();
        var res = await client.PostAsync("/api/committee/logout", null);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
    }

    // ── Committee Change PIN ──────────────────────────────────────────────────

    [Fact]
    public async Task POST_CommitteePin_Unauthenticated_Returns401()
    {
        var client = CreateClient();
        var res = await client.PostAsync("/api/committee/pin",
            Json(new { current_pin = ApiFactory.TestPin, new_pin = "newpin99" }));
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task POST_CommitteePin_WrongCurrentPin_Returns400()
    {
        var client = await AuthenticatedClient();
        var res = await client.PostAsync("/api/committee/pin",
            Json(new { current_pin = "wrongpin", new_pin = "newpin99" }));
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task POST_CommitteePin_NewPinTooShort_Returns400()
    {
        var client = await AuthenticatedClient();
        var res = await client.PostAsync("/api/committee/pin",
            Json(new { current_pin = ApiFactory.TestPin, new_pin = "ab" }));
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task POST_CommitteePin_MissingFields_Returns400()
    {
        var client = await AuthenticatedClient();
        var res = await client.PostAsync("/api/committee/pin",
            Json(new { current_pin = "", new_pin = "" }));
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    // ── Metadata ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task GET_MetadataSchools_Returns200_WithSchools()
    {
        var client = CreateClient();
        var res = await client.GetAsync("/api/metadata/schools");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.GetProperty("schools").GetArrayLength() > 0);
    }

    [Fact]
    public async Task GET_MetadataDepartments_ValidSchool_Returns200()
    {
        var client = CreateClient();
        var res = await client.GetAsync("/api/metadata/departments?school_id=sci");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.GetProperty("departments").GetArrayLength() > 0);
    }

    [Fact]
    public async Task GET_MetadataDepartments_MissingSchoolId_Returns400()
    {
        var client = CreateClient();
        var res = await client.GetAsync("/api/metadata/departments");
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task GET_MetadataDepartments_UnknownSchool_Returns404()
    {
        var client = CreateClient();
        var res = await client.GetAsync("/api/metadata/departments?school_id=nonexistent");
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }

    [Fact]
    public async Task GET_MetadataProgrammes_ValidParams_Returns200()
    {
        var client = CreateClient();
        var res = await client.GetAsync("/api/metadata/programmes?school_id=sci&department_id=cs");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.GetProperty("programmes").GetArrayLength() > 0);
    }

    [Fact]
    public async Task GET_MetadataProgrammes_MissingParams_Returns400()
    {
        var client = CreateClient();
        var res = await client.GetAsync("/api/metadata/programmes");
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task GET_MetadataProgrammes_UnknownDepartment_Returns404()
    {
        var client = CreateClient();
        var res = await client.GetAsync("/api/metadata/programmes?school_id=sci&department_id=nonexistent");
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }

    // ── Graduates — Single Insert ─────────────────────────────────────────────

    [Fact]
    public async Task POST_Graduates_ValidPayload_Returns200_WithId()
    {
        var client = CreateClient();
        var res = await client.PostAsync("/api/graduates", Json(new
        {
            full_name = "Jane Wanjiru",
            student_number = "CT201/111945/23",
            email = "jane@example.com",
            campus = "Main Campus (Nchiru)",
            school = "sci",
            department = "cs",
            programme = "Bachelor of Science (Computer Science)",
            graduation_year = "2023",
            employment_status = "Employed (Full-time)",
        }));
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.GetProperty("success").GetBoolean());
        Assert.True(body.GetProperty("id").GetInt64() > 0);
    }

    [Fact]
    public async Task POST_Graduates_MissingFullName_Returns400()
    {
        var client = CreateClient();
        var res = await client.PostAsync("/api/graduates", Json(new
        {
            full_name = "",
            email = "jane@example.com",
        }));
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(body.GetProperty("success").GetBoolean());
    }

    [Fact]
    public async Task POST_Graduates_ResponseIsSnakeCase()
    {
        var client = CreateClient();
        var res = await client.PostAsync("/api/graduates", Json(new
        {
            full_name = "Jane Wanjiru",
            student_number = "CT201/111945/24",
            email = "jane@example.com",
            campus = "Main Campus (Nchiru)",
            school = "sci",
            department = "cs",
            programme = "Bachelor of Science (Computer Science)",
            graduation_year = "2023",
            employment_status = "Employed (Full-time)",
        }));
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        // Keys must be snake_case
        Assert.True(body.TryGetProperty("success", out _));
        Assert.True(body.TryGetProperty("id", out _));
    }

    // ── Graduates — Bulk Insert ───────────────────────────────────────────────

    [Fact]
    public async Task POST_GraduatesBulk_AllValid_Returns200()
    {
        var client = CreateClient();
        var payloads = Enumerable.Range(1, 3).Select(i => new
        {
            full_name = $"Graduate {i}",
            student_number = $"CT201/11194{i}/23",
            email = $"grad{i}@example.com",
            campus = "Main Campus (Nchiru)",
            school = "sci",
            department = "cs",
            programme = "Bachelor of Science (Computer Science)",
            graduation_year = "2023",
            employment_status = "Employed (Full-time)",
        }).ToList();

        var res = await client.PostAsync("/api/graduates/bulk", Json(payloads));
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(3, body.GetProperty("inserted").GetInt32());
    }

    [Fact]
    public async Task POST_GraduatesBulk_EmptyArray_Returns200_ZeroInserted()
    {
        var client = CreateClient();
        var res = await client.PostAsync("/api/graduates/bulk", Json(Array.Empty<object>()));
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(0, body.GetProperty("inserted").GetInt32());
    }

    // ── Graduates — Bulk Excel ────────────────────────────────────────────────

    [Fact]
    public async Task POST_GraduatesBulkExcel_ValidFile_Returns200()
    {
        var client = CreateClient();
        using var ms = new MemoryStream();
        var wb = new XLWorkbook();
        var ws = wb.AddWorksheet("Sheet1");
        ws.Cell(1, 1).Value = "full_name";
        ws.Cell(1, 2).Value = "email";
        ws.Cell(2, 1).Value = "Jane Wanjiru";
        ws.Cell(2, 2).Value = "jane@example.com";
        wb.SaveAs(ms);
        ms.Position = 0;

        using var content = new MultipartFormDataContent();
        content.Add(new StreamContent(ms), "file", "graduates.xlsx");

        var res = await client.PostAsync("/api/graduates/bulk-excel", content);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
    }

    [Fact]
    public async Task POST_GraduatesBulkExcel_WrongExtension_Returns400()
    {
        var client = CreateClient();
        using var content = new MultipartFormDataContent();
        content.Add(new StringContent("col1,col2\nval1,val2"), "file", "graduates.csv");
        var res = await client.PostAsync("/api/graduates/bulk-excel", content);
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task POST_GraduatesBulkExcel_NoFile_Returns400()
    {
        var client = CreateClient();
        // Send a valid multipart form but with no file attached
        using var content = new MultipartFormDataContent();
        var res = await client.PostAsync("/api/graduates/bulk-excel", content);
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task GET_Dashboard_Unauthenticated_Returns401()
    {
        var client = CreateClient();
        var res = await client.GetAsync("/api/dashboard");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task GET_Dashboard_Authenticated_Returns200_WithExpectedShape()
    {
        var client = await AuthenticatedClient();
        var res = await client.GetAsync("/api/dashboard");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();

        // Verify all expected snake_case keys are present
        Assert.True(body.TryGetProperty("graduates", out _));
        Assert.True(body.TryGetProperty("total_count", out _));
        Assert.True(body.TryGetProperty("by_school", out _));
        Assert.True(body.TryGetProperty("by_status", out _));
        Assert.True(body.TryGetProperty("by_year", out _));
        Assert.True(body.TryGetProperty("by_sector", out _));
        Assert.True(body.TryGetProperty("by_campus", out _));
        Assert.True(body.TryGetProperty("by_department", out _));
        Assert.True(body.TryGetProperty("by_months_to_employ", out _));
        Assert.True(body.TryGetProperty("by_skill", out _));
        Assert.True(body.TryGetProperty("employment_rate", out _));
    }

    [Fact]
    public async Task GET_Dashboard_Authenticated_EmptyDb_Returns200_WithZeros()
    {
        var client = _factory.WithEmptyRepo().CreateClient();
        // Login on the empty-repo factory client
        await client.PostAsync("/api/committee/login", Json(new { pin = ApiFactory.TestPin }));
        var res = await client.GetAsync("/api/dashboard");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(0, body.GetProperty("total_count").GetInt32());
        Assert.Equal(0, body.GetProperty("employment_rate").GetInt32());
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GET_AdminStats_Unauthenticated_Returns401()
    {
        var client = CreateClient();
        var res = await client.GetAsync("/api/admin/stats");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task GET_AdminStats_Authenticated_Returns200_WithShape()
    {
        var client = await AuthenticatedClient();
        var res = await client.GetAsync("/api/admin/stats");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.TryGetProperty("total_graduates", out _));
        Assert.True(body.TryGetProperty("school_count", out _));
        Assert.True(body.TryGetProperty("programme_count", out _));
    }

    [Fact]
    public async Task DELETE_AdminGraduates_WithoutConfirmHeader_Returns400()
    {
        var client = await AuthenticatedClient();
        var res = await client.DeleteAsync("/api/admin/graduates");
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task DELETE_AdminGraduates_WithConfirmHeader_Returns200()
    {
        var client = await AuthenticatedClient();
        var req = new HttpRequestMessage(HttpMethod.Delete, "/api/admin/graduates");
        req.Headers.Add("X-Confirm-Purge", "YES");
        var res = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.GetProperty("success").GetBoolean());
    }

    [Fact]
    public async Task DELETE_AdminGraduates_Unauthenticated_Returns401()
    {
        var client = CreateClient();
        var req = new HttpRequestMessage(HttpMethod.Delete, "/api/admin/graduates");
        req.Headers.Add("X-Confirm-Purge", "YES");
        var res = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    // ── Reports ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task GET_ReportsPreview_Unauthenticated_Returns401()
    {
        var client = CreateClient();
        var res = await client.GetAsync("/api/reports/preview");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task GET_ReportsPreview_NoFilters_Returns200_WithTotal()
    {
        var client = await AuthenticatedClient();
        var res = await client.GetAsync("/api/reports/preview");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.TryGetProperty("total", out _));
        Assert.True(body.TryGetProperty("scope", out _));
    }

    [Fact]
    public async Task GET_ReportsPreview_SchoolFilter_Returns200()
    {
        var client = await AuthenticatedClient();
        var res = await client.GetAsync("/api/reports/preview?school_id=sci");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
    }

    [Fact]
    public async Task GET_ReportsPreview_ImpossibleYearRange_ReturnsZero()
    {
        var client = await AuthenticatedClient();
        var res = await client.GetAsync("/api/reports/preview?year_from=2025&year_to=2020");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(0, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task POST_ReportsGenerate_Unauthenticated_Returns401()
    {
        var client = CreateClient();
        var res = await client.PostAsync("/api/reports/generate",
            Json(new { school_id = (string?)null }));
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task POST_ReportsGenerate_EmptyScope_Returns400()
    {
        // Use empty-repo factory so no graduates exist
        var client = _factory.WithEmptyRepo().CreateClient();
        await client.PostAsync("/api/committee/login", Json(new { pin = ApiFactory.TestPin }));
        var res = await client.PostAsync("/api/reports/generate",
            Json(new { school_id = (string?)null }));
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task POST_ReportsEditSection_MissingFields_Returns400()
    {
        var client = await AuthenticatedClient();
        var res = await client.PostAsync("/api/reports/edit-section",
            Json(new { section = "", instruction = "" }));
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task POST_ReportsPdf_Unauthenticated_Returns401()
    {
        var client = CreateClient();
        var res = await client.PostAsync("/api/reports/pdf", Json(new { }));
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task POST_ReportsExcel_Unauthenticated_Returns401()
    {
        var client = CreateClient();
        var res = await client.PostAsync("/api/reports/excel", Json(new { }));
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }
}

/// <summary>
/// Custom WebApplicationFactory that replaces Supabase-dependent services with fakes.
/// </summary>
public class ApiFactory : WebApplicationFactory<Program>
{
    public const string TestPin = "testpin99";

    private IReadOnlyList<GraduateReadModel> _graduates = GraduateReadModelFactory.BuildMixed();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            // Replace Supabase HTTP client — not needed in tests
            services.RemoveAll<Api.Supabase.SupabaseRestClient>();
            services.AddSingleton<Api.Supabase.SupabaseRestClient>(_ =>
                null!); // never called — repo is replaced below

            // Replace repository with a fake
            services.RemoveAll<IGraduatesRepository>();
            services.AddScoped<IGraduatesRepository>(_ => BuildFakeRepo(_graduates));

            // Replace metadata repository with pre-loaded test data
            services.RemoveAll<Api.MustData.SupabaseMetadataRepository>();
            services.AddSingleton<Api.MustData.SupabaseMetadataRepository>(_ =>
                CreateTestMetadataRepo(MetadataFactory.Build()));

            // Replace PIN store with a fixed test PIN
            services.RemoveAll<ICommitteePinStore>();
            services.AddSingleton<ICommitteePinStore>(_ =>
            {
                var store = Substitute.For<ICommitteePinStore>();
                store.GetCurrentPinAsync(Arg.Any<CancellationToken>()).Returns(TestPin);
                return store;
            });

            // Override Supabase options so the client doesn't throw on startup
            services.RemoveAll<IOptions<Api.Supabase.SupabaseOptions>>();
            services.AddSingleton(Options.Create(new Api.Supabase.SupabaseOptions
            {
                Url = "https://fake.supabase.co",
                ServiceRoleKey = "fake-key",
            }));

            // Disable Azure AI — use fallback narrative
            services.RemoveAll<IOptions<Api.Reports.AzureAiOptions>>();
            services.AddSingleton(Options.Create(new Api.Reports.AzureAiOptions
            {
                Endpoint = "",
                ApiKey = "",
            }));
        });
    }

    private static IGraduatesRepository BuildFakeRepo(IReadOnlyList<GraduateReadModel> graduates)
    {
        var repo = Substitute.For<IGraduatesRepository>();
        repo.FetchGraduatesAsync(Arg.Any<CancellationToken>()).Returns(graduates);
        repo.InsertGraduateAsync(Arg.Any<GraduateRow>(), Arg.Any<CancellationToken>()).Returns(99L);
        repo.InsertGraduatesAsync(Arg.Any<IEnumerable<GraduateRow>>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        repo.ResolveProgrammeIdAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns((long?)1L);
        repo.ExistsByStudentNumberAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(false);
        repo.FetchDbStatsAsync(Arg.Any<CancellationToken>()).Returns(
            new DbStatsReadModel(
                TotalGraduates: graduates.Count,
                OldestRecord: DateTimeOffset.UtcNow.AddYears(-2),
                NewestRecord: DateTimeOffset.UtcNow,
                SchoolCount: 3,
                ProgrammeCount: 10));
        repo.PurgeAllGraduatesAsync(Arg.Any<CancellationToken>()).Returns((long)graduates.Count);
        return repo;
    }

    /// <summary>Returns a new factory configured with an empty repository (zero graduates).</summary>
    public ApiFactory WithEmptyRepo()
    {
        var factory = new ApiFactory();
        factory._graduates = [];
        return factory;
    }
    private static Api.MustData.SupabaseMetadataRepository CreateTestMetadataRepo(
        IReadOnlyList<MustSchool> schools)
    {
        var instance = new Api.MustData.SupabaseMetadataRepository(null!);
        var field = typeof(Api.MustData.SupabaseMetadataRepository)
            .GetField("_cache", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)!;
        field.SetValue(instance, schools);
        return instance;
    }
}
