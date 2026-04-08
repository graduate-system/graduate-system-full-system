using Api.Committee;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Options;
using NSubstitute;

namespace Api.Tests.Unit;

public class FileCommitteePinStoreTests : IDisposable
{
    private readonly string _tempDir;
    private readonly string _pinFile;
    private readonly IWebHostEnvironment _env;
    private const string EnvVarName = "TEST_COMMITTEE_PIN_STORE";

    public FileCommitteePinStoreTests()
    {
        _tempDir = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
        Directory.CreateDirectory(_tempDir);
        _pinFile = Path.Combine(_tempDir, "committee-pin.txt");

        _env = Substitute.For<IWebHostEnvironment>();
        _env.ContentRootPath.Returns(_tempDir);

        // Ensure env var is clean before each test
        Environment.SetEnvironmentVariable(EnvVarName, null);
    }

    public void Dispose()
    {
        Environment.SetEnvironmentVariable(EnvVarName, null);
        if (Directory.Exists(_tempDir))
            Directory.Delete(_tempDir, recursive: true);
    }

    private FileCommitteePinStore CreateStore(string? defaultPin = "123456")
    {
        var options = Options.Create(new CommitteePinStoreOptions
        {
            FilePath = "committee-pin.txt",
            EnvironmentVariableName = EnvVarName,
            DefaultPin = defaultPin ?? "123456",
        });
        return new FileCommitteePinStore(options, _env);
    }

    [Fact]
    public async Task GetCurrentPinAsync_ReturnsEnvVar_WhenSet()
    {
        Environment.SetEnvironmentVariable(EnvVarName, "envpin99");
        var store = CreateStore();
        var pin = await store.GetCurrentPinAsync(CancellationToken.None);
        Assert.Equal("envpin99", pin);
    }

    [Fact]
    public async Task GetCurrentPinAsync_TrimsEnvVar()
    {
        Environment.SetEnvironmentVariable(EnvVarName, "  trimmed  ");
        var store = CreateStore();
        var pin = await store.GetCurrentPinAsync(CancellationToken.None);
        Assert.Equal("trimmed", pin);
    }

    [Fact]
    public async Task GetCurrentPinAsync_ReturnsFilePin_WhenFileExists()
    {
        await File.WriteAllTextAsync(_pinFile, "filepin42");
        var store = CreateStore();
        var pin = await store.GetCurrentPinAsync(CancellationToken.None);
        Assert.Equal("filepin42", pin);
    }

    [Fact]
    public async Task GetCurrentPinAsync_TrimsFilePin()
    {
        await File.WriteAllTextAsync(_pinFile, "  filepin  \n");
        var store = CreateStore();
        var pin = await store.GetCurrentPinAsync(CancellationToken.None);
        Assert.Equal("filepin", pin);
    }

    [Fact]
    public async Task GetCurrentPinAsync_ReturnsDefault_WhenNoEnvAndNoFile()
    {
        var store = CreateStore(defaultPin: "default99");
        var pin = await store.GetCurrentPinAsync(CancellationToken.None);
        Assert.Equal("default99", pin);
    }

    [Fact]
    public async Task GetCurrentPinAsync_ReturnsDefault_WhenFileIsEmpty()
    {
        await File.WriteAllTextAsync(_pinFile, "");
        var store = CreateStore(defaultPin: "fallback");
        var pin = await store.GetCurrentPinAsync(CancellationToken.None);
        Assert.Equal("fallback", pin);
    }

    [Fact]
    public async Task GetCurrentPinAsync_ReturnsDefault_WhenFileIsWhitespace()
    {
        await File.WriteAllTextAsync(_pinFile, "   \n  ");
        var store = CreateStore(defaultPin: "fallback");
        var pin = await store.GetCurrentPinAsync(CancellationToken.None);
        Assert.Equal("fallback", pin);
    }

    [Fact]
    public async Task SetPinAsync_WritesPin_ToFile()
    {
        var store = CreateStore();
        await store.SetPinAsync("newpin77", CancellationToken.None);
        var written = await File.ReadAllTextAsync(_pinFile);
        Assert.Equal("newpin77", written);
    }

    [Fact]
    public async Task SetPinAsync_TrimsPin_BeforeWriting()
    {
        var store = CreateStore();
        await store.SetPinAsync("  trimmed  ", CancellationToken.None);
        var written = await File.ReadAllTextAsync(_pinFile);
        Assert.Equal("trimmed", written);
    }

    [Fact]
    public async Task SetPinAsync_CreatesDirectory_IfNotExists()
    {
        var nestedDir = Path.Combine(_tempDir, "nested", "deep");
        var options = Options.Create(new CommitteePinStoreOptions
        {
            FilePath = Path.Combine("nested", "deep", "pin.txt"),
            EnvironmentVariableName = EnvVarName,
            DefaultPin = "123456",
        });
        var store = new FileCommitteePinStore(options, _env);
        await store.SetPinAsync("createdpin", CancellationToken.None);
        Assert.True(Directory.Exists(nestedDir));
        var written = await File.ReadAllTextAsync(Path.Combine(nestedDir, "pin.txt"));
        Assert.Equal("createdpin", written);
    }
}
