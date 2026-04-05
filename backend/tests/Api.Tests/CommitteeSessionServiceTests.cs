using Api.Committee;
using Microsoft.Extensions.Options;

namespace Api.Tests;

public class CommitteeSessionServiceTests
{
    [Fact]
    public void CreateSessionCookieValue_ValidatesUntilExpiry()
    {
        var options = Options.Create(new CommitteeAuthOptions
        {
            CookieMaxAgeSeconds = 60 * 60 * 8,
            SessionSecret = "test-secret",
        });

        var service = new CommitteeSessionService(options);
        var now = DateTimeOffset.UtcNow;

        var cookie = service.CreateSessionCookieValue(now);

        Assert.True(service.IsValidSessionCookie(cookie, now));
        Assert.True(service.IsValidSessionCookie(cookie, now.AddHours(7)));
        Assert.False(service.IsValidSessionCookie(cookie, now.AddHours(9)));
    }

    [Fact]
    public void IsValidSessionCookie_RejectsTamperedValue()
    {
        var options = Options.Create(new CommitteeAuthOptions
        {
            CookieMaxAgeSeconds = 60 * 60 * 8,
            SessionSecret = "test-secret",
        });

        var service = new CommitteeSessionService(options);
        var now = DateTimeOffset.UtcNow;

        var cookie = service.CreateSessionCookieValue(now);
        var tampered = cookie + "x";

        Assert.False(service.IsValidSessionCookie(tampered, now));
    }
}

