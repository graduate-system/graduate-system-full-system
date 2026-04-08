using Microsoft.Extensions.Options;

namespace Api.Committee;

public sealed class CommitteeAuthFilter(ICommitteeSessionService sessions, IOptions<CommitteeAuthOptions> authOptions) : IEndpointFilter
{
    public ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var httpContext = context.HttpContext;
        var cookie = httpContext.Request.Cookies.TryGetValue(authOptions.Value.CookieName, out var v) ? v : null;
        var authed = sessions.IsValidSessionCookie(cookie, DateTimeOffset.UtcNow);

        if (!authed)
        {
            return ValueTask.FromResult<object?>(Results.Json(new { success = false, error = "Unauthorized" }, statusCode: StatusCodes.Status401Unauthorized));
        }

        return next(context);
    }
}

