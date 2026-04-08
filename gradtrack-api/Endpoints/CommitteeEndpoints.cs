using Api.Committee;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace Api.Endpoints;

public static class CommitteeEndpoints
{
    public static RouteGroupBuilder MapCommitteeEndpoints(this RouteGroupBuilder api)
    {
        var group = api.MapGroup("/committee");

        group.MapPost("/login",
                async (LoginRequest request, ICommitteePinStore pinStore, ICommitteeSessionService sessions, IOptions<CommitteeAuthOptions> authOptions, IHostEnvironment hostEnvironment, HttpContext httpContext, CancellationToken ct) =>
                {
                    if (string.IsNullOrWhiteSpace(request.Pin))
                    {
                        return Results.BadRequest(new { success = false, error = "Please enter the committee PIN." });
                    }

                    var pin = await pinStore.GetCurrentPinAsync(ct);
                    if (!string.Equals(request.Pin.Trim(), pin, StringComparison.Ordinal))
                    {
                        return Results.Json(new { success = false, error = "Incorrect PIN. Please try again." }, statusCode: StatusCodes.Status401Unauthorized);
                    }

                    var cookieValue = sessions.CreateSessionCookieValue(DateTimeOffset.UtcNow);
                    httpContext.Response.Cookies.Append(authOptions.Value.CookieName, cookieValue, new CookieOptions
                    {
                        HttpOnly = true,
                        Secure = httpContext.Request.IsHttps || hostEnvironment.IsProduction(),
                        SameSite = SameSiteMode.Lax,
                        MaxAge = TimeSpan.FromSeconds(authOptions.Value.CookieMaxAgeSeconds),
                        Path = "/",
                    });

                    return Results.Ok(new { success = true });
                })
            .RequireRateLimiting("committee-login")
            .WithName("CommitteeLogin");

        group.MapPost("/logout",
            (IOptions<CommitteeAuthOptions> authOptions, HttpContext httpContext) =>
            {
                httpContext.Response.Cookies.Delete(authOptions.Value.CookieName, new CookieOptions { Path = "/" });
                return Results.Ok(new { success = true });
            })
            .WithName("CommitteeLogout");

        group.MapGet("/session",
            (ICommitteeSessionService sessions, IOptions<CommitteeAuthOptions> authOptions, HttpContext httpContext) =>
            {
                var cookie = httpContext.Request.Cookies.TryGetValue(authOptions.Value.CookieName, out var v) ? v : null;
                var authed = sessions.IsValidSessionCookie(cookie, DateTimeOffset.UtcNow);
                return Results.Ok(new { authenticated = authed });
            })
            .WithName("CommitteeSession");

        group.MapPost("/pin",
            async (ChangePinRequest request, ICommitteePinStore pinStore, ICommitteeSessionService sessions, IOptions<CommitteeAuthOptions> authOptions, HttpContext httpContext, CancellationToken ct) =>
            {
                var cookie = httpContext.Request.Cookies.TryGetValue(authOptions.Value.CookieName, out var v) ? v : null;
                if (!sessions.IsValidSessionCookie(cookie, DateTimeOffset.UtcNow))
                {
                    return Results.Json(new { success = false, error = "Unauthorized" }, statusCode: StatusCodes.Status401Unauthorized);
                }

                if (string.IsNullOrWhiteSpace(request.CurrentPin) || string.IsNullOrWhiteSpace(request.NewPin))
                {
                    return Results.BadRequest(new { success = false, error = "Current PIN and new PIN are required." });
                }

                var current = await pinStore.GetCurrentPinAsync(ct);
                if (!string.Equals(request.CurrentPin.Trim(), current, StringComparison.Ordinal))
                {
                    return Results.BadRequest(new { success = false, error = "Current PIN is incorrect." });
                }

                if (request.NewPin.Trim().Length < 4)
                {
                    return Results.BadRequest(new { success = false, error = "New PIN must be at least 4 characters." });
                }

                await pinStore.SetPinAsync(request.NewPin.Trim(), ct);
                return Results.Ok(new { success = true });
            })
            .WithName("CommitteeChangePin");

        return group;
    }

    public sealed record LoginRequest(string Pin);
    public sealed record ChangePinRequest(string CurrentPin, string NewPin);
}
