namespace Api.Committee;

public sealed class CommitteePinStoreOptions
{
    public string FilePath { get; init; } = "Api_Data/committee-pin.txt";
    public string EnvironmentVariableName { get; init; } = "COMMITTEE_PIN";
    public string DefaultPin { get; init; } = "123456";
}

