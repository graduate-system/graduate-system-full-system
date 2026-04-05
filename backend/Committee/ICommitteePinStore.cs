namespace Api.Committee;

public interface ICommitteePinStore
{
    Task<string> GetCurrentPinAsync(CancellationToken cancellationToken);
    Task SetPinAsync(string newPin, CancellationToken cancellationToken);
}

