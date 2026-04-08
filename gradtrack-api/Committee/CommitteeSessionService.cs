using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;
using System.Text;

namespace Api.Committee;

public sealed class CommitteeSessionService(IOptions<CommitteeAuthOptions> options) : ICommitteeSessionService
{
    private static readonly TimeSpan MaxClockSkew = TimeSpan.FromMinutes(2);
    private readonly CommitteeAuthOptions _options = options.Value;
    private readonly byte[] _secret = Encoding.UTF8.GetBytes(options.Value.SessionSecret);

    public string CreateSessionCookieValue(DateTimeOffset now)
    {
        var exp = now.AddSeconds(_options.CookieMaxAgeSeconds).ToUnixTimeSeconds();
        var nonce = RandomNumberGenerator.GetInt32(int.MaxValue);
        var payload = $"{exp}:{nonce}";
        var payloadBytes = Encoding.UTF8.GetBytes(payload);
        var sig = Sign(payloadBytes);

        return $"{Base64UrlEncode(payloadBytes)}.{Base64UrlEncode(sig)}";
    }

    public bool IsValidSessionCookie(string? cookieValue, DateTimeOffset now)
    {
        if (string.IsNullOrWhiteSpace(cookieValue)) return false;

        var parts = cookieValue.Split('.', 2);
        if (parts.Length != 2) return false;

        byte[] payloadBytes;
        byte[] signatureBytes;
        try
        {
            payloadBytes = Base64UrlDecode(parts[0]);
            signatureBytes = Base64UrlDecode(parts[1]);
        }
        catch
        {
            return false;
        }

        var expectedSig = Sign(payloadBytes);
        if (!CryptographicOperations.FixedTimeEquals(expectedSig, signatureBytes))
        {
            return false;
        }

        var payload = Encoding.UTF8.GetString(payloadBytes);
        var expPart = payload.Split(':', 2).FirstOrDefault();
        if (!long.TryParse(expPart, out var expUnix))
        {
            return false;
        }

        var exp = DateTimeOffset.FromUnixTimeSeconds(expUnix);
        return exp >= now.Subtract(MaxClockSkew);
    }

    private byte[] Sign(byte[] payload)
    {
        using var hmac = new HMACSHA256(_secret);
        return hmac.ComputeHash(payload);
    }

    private static string Base64UrlEncode(byte[] bytes) => WebEncoders.Base64UrlEncode(bytes);
    private static byte[] Base64UrlDecode(string s) => WebEncoders.Base64UrlDecode(s);
}

