namespace Api.Committee;

public sealed class CommitteeAuthOptions
{
    public string CookieName { get; init; } = "committee_auth";
    public int CookieMaxAgeSeconds { get; init; } = 60 * 60 * 8;
    public string SessionSecret { get; init; } = "dev-session-secret-change-me";
}

