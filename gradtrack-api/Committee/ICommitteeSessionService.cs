namespace Api.Committee;

public interface ICommitteeSessionService
{
    string CreateSessionCookieValue(DateTimeOffset now);
    bool IsValidSessionCookie(string? cookieValue, DateTimeOffset now);
}

