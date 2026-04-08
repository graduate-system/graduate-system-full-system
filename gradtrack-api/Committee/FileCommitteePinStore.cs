using Microsoft.Extensions.Options;

namespace Api.Committee;

public sealed class FileCommitteePinStore(IOptions<CommitteePinStoreOptions> options, IWebHostEnvironment env) : ICommitteePinStore
{
    private readonly CommitteePinStoreOptions _options = options.Value;
    private readonly string _absolutePath = Path.GetFullPath(Path.Combine(env.ContentRootPath, options.Value.FilePath));

    public async Task<string> GetCurrentPinAsync(CancellationToken cancellationToken)
    {
        var envPin = Environment.GetEnvironmentVariable(_options.EnvironmentVariableName);
        if (!string.IsNullOrWhiteSpace(envPin))
        {
            return envPin.Trim();
        }

        if (File.Exists(_absolutePath))
        {
            var pin = await File.ReadAllTextAsync(_absolutePath, cancellationToken);
            if (!string.IsNullOrWhiteSpace(pin))
            {
                return pin.Trim();
            }
        }

        return _options.DefaultPin;
    }

    public async Task SetPinAsync(string newPin, CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(_absolutePath)!);
        await File.WriteAllTextAsync(_absolutePath, newPin.Trim(), cancellationToken);
    }
}

