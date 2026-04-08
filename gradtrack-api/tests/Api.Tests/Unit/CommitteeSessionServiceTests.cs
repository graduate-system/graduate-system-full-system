using Api.Committee;
using Microsoft.Extensions.Options;

namespace Api.Tests.Unit;

public class CommitteeSessionServiceTests
{
    private static CommitteeSessionService CreateService(
        int maxAgeSeconds = 60 * 60 * 8,
        string secret = "test-secret-32-chars-long-enough!")
    {
        var options = Options.Create(new CommitteeAuthOptions
        {
            CookieMaxAgeSeconds = maxAgeSeconds,
            SessionSecret = secret,
        });
        return new CommitteeSessionService(options);
    }

    [Fact]
    public void CreateSessionCookieValue_IsValidImmediately()
    {
        var svc = CreateService();
        var now = DateTimeOffset.UtcNow;
        var cookie = svc.CreateSessionCookieValue(now);
        Assert.True(svc.IsValidSessionCookie(cookie, now));
    }

    [Fact]
    public void CreateSessionCookieValue_IsValidBeforeExpiry()
    {
        var svc = CreateService(maxAgeSeconds: 3600);
        var now = DateTimeOffset.UtcNow;
        var cookie = svc.CreateSessionCookieValue(now);
        Assert.True(svc.IsValidSessionCookie(cookie, now.AddSeconds(3599)));
    }

    [Fact]
    public void CreateSessionCookieValue_IsInvalidAfterExpiry()
    {
        var svc = CreateService(maxAgeSeconds: 3600);
        var now = DateTimeOffset.UtcNow;
        var cookie = svc.CreateSessionCookieValue(now);
        // Beyond expiry + max clock skew (2 min)
        Assert.False(svc.IsValidSessionCookie(cookie, now.AddSeconds(3600 + 121)));
    }

    [Fact]
    public void CreateSessionCookieValue_IsValidWithinClockSkew()
    {
        var svc = CreateService(maxAgeSeconds: 3600);
        var now = DateTimeOffset.UtcNow;
        var cookie = svc.CreateSessionCookieValue(now);
        // 1 second before the clock skew boundary expires — still valid
        Assert.True(svc.IsValidSessionCookie(cookie, now.AddSeconds(3600 + 119)));
    }

    [Fact]
    public void CreateSessionCookieValue_IsInvalidBeyondClockSkew()
    {
        var svc = CreateService(maxAgeSeconds: 3600);
        var now = DateTimeOffset.UtcNow;
        var cookie = svc.CreateSessionCookieValue(now);
        Assert.False(svc.IsValidSessionCookie(cookie, now.AddSeconds(3600 + 121)));
    }

    [Fact]
    public void IsValidSessionCookie_ReturnsFalse_ForNull()
    {
        var svc = CreateService();
        Assert.False(svc.IsValidSessionCookie(null, DateTimeOffset.UtcNow));
    }

    [Fact]
    public void IsValidSessionCookie_ReturnsFalse_ForEmpty()
    {
        var svc = CreateService();
        Assert.False(svc.IsValidSessionCookie("", DateTimeOffset.UtcNow));
    }

    [Fact]
    public void IsValidSessionCookie_ReturnsFalse_ForWhitespace()
    {
        var svc = CreateService();
        Assert.False(svc.IsValidSessionCookie("   ", DateTimeOffset.UtcNow));
    }

    [Fact]
    public void IsValidSessionCookie_ReturnsFalse_ForTamperedPayload()
    {
        var svc = CreateService();
        var now = DateTimeOffset.UtcNow;
        var cookie = svc.CreateSessionCookieValue(now);
        var parts = cookie.Split('.', 2);
        var tampered = parts[0] + "TAMPERED." + parts[1];
        Assert.False(svc.IsValidSessionCookie(tampered, now));
    }

    [Fact]
    public void IsValidSessionCookie_ReturnsFalse_ForTamperedSignature()
    {
        var svc = CreateService();
        var now = DateTimeOffset.UtcNow;
        var cookie = svc.CreateSessionCookieValue(now);
        var parts = cookie.Split('.', 2);
        var tampered = parts[0] + "." + parts[1] + "x";
        Assert.False(svc.IsValidSessionCookie(tampered, now));
    }

    [Fact]
    public void IsValidSessionCookie_ReturnsFalse_ForMissingDot()
    {
        var svc = CreateService();
        Assert.False(svc.IsValidSessionCookie("nodothere", DateTimeOffset.UtcNow));
    }

    [Fact]
    public void IsValidSessionCookie_ReturnsFalse_ForInvalidBase64()
    {
        var svc = CreateService();
        Assert.False(svc.IsValidSessionCookie("!!!.###", DateTimeOffset.UtcNow));
    }

    [Fact]
    public void IsValidSessionCookie_ReturnsFalse_ForDifferentSecret()
    {
        var svcA = CreateService(secret: "secret-A-32-chars-long-enough!!!");
        var svcB = CreateService(secret: "secret-B-32-chars-long-enough!!!");
        var now = DateTimeOffset.UtcNow;
        var cookie = svcA.CreateSessionCookieValue(now);
        Assert.False(svcB.IsValidSessionCookie(cookie, now));
    }

    [Fact]
    public void CreateSessionCookieValue_TwoCalls_ProduceDifferentValues()
    {
        var svc = CreateService();
        var now = DateTimeOffset.UtcNow;
        var cookie1 = svc.CreateSessionCookieValue(now);
        var cookie2 = svc.CreateSessionCookieValue(now);
        Assert.NotEqual(cookie1, cookie2);
    }
}
