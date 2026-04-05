using Api.Committee;
using Api.Endpoints;
using Api.Json;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = new SnakeCaseNamingPolicy();
    options.SerializerOptions.DictionaryKeyPolicy = new SnakeCaseNamingPolicy();
});

var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
if (corsOrigins.Length > 0)
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("default", policy =>
        {
            policy
                .WithOrigins(corsOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });
    });
}

builder.Services.AddProblemDetails();

builder.Services.AddOpenApi();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("committee-login", httpContext =>
    {
        var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: ip,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                Window = TimeSpan.FromMinutes(1),
                PermitLimit = 10,
                QueueLimit = 0,
                AutoReplenishment = true,
            });
    });
});

builder.Services.AddOptions<CommitteeAuthOptions>()
    .Bind(builder.Configuration.GetSection("CommitteeAuth"))
    .ValidateOnStart();

builder.Services.AddOptions<CommitteePinStoreOptions>()
    .Bind(builder.Configuration.GetSection("CommitteePinStore"))
    .ValidateOnStart();

builder.Services.AddSingleton<ICommitteePinStore, FileCommitteePinStore>();
builder.Services.AddSingleton<ICommitteeSessionService, CommitteeSessionService>();
builder.Services.AddSingleton<Api.MustData.SupabaseMetadataRepository>();
builder.Services.AddSingleton<CommitteeAuthFilter>();

builder.Services.AddOptions<Api.Supabase.SupabaseOptions>()
    .Bind(builder.Configuration.GetSection("Supabase"));

builder.Services.AddHttpClient<Api.Supabase.SupabaseRestClient>();
builder.Services.AddScoped<Api.Graduates.IGraduatesRepository, Api.Graduates.SupabaseGraduatesRepository>();
builder.Services.AddScoped<Api.Graduates.GraduatesService>();

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseRateLimiter();

if (corsOrigins.Length > 0)
{
    app.UseCors("default");
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapApiEndpoints();

app.Run();
