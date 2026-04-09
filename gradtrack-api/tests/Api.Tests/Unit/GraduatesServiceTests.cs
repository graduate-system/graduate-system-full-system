using Api.Graduates;
using Api.MustData;
using Api.Supabase;
using Api.Tests.Helpers;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace Api.Tests.Unit;

public class GraduatesServiceTests
{
    private readonly IGraduatesRepository _repo;
    private readonly SupabaseMetadataRepository _metadata;
    private readonly GraduatesService _svc;

    public GraduatesServiceTests()
    {
        _repo = Substitute.For<IGraduatesRepository>();

        // Build a real SupabaseMetadataRepository pre-loaded with test metadata
        // by using a subclass that exposes the cache setter
        _metadata = TestMetadataRepository.Create(MetadataFactory.Build());

        _repo.ResolveProgrammeIdAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>())
             .Returns((long?)1L);

        _repo.ExistsByStudentNumberAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
             .Returns(false);

        _svc = new GraduatesService(_metadata, _repo);
    }

    // ── ResolveRowAsync — name validation ────────────────────────────────────

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task ResolveRowAsync_EmptyOrNullFullName_ReturnsError(string? name)
    {
        var payload = GraduatePayloadDtoFactory.Build(fullName: name!);
        var (row, error) = await _svc.ResolveRowAsync(payload, CancellationToken.None);
        Assert.Null(row);
        Assert.NotNull(error);
    }

    // ── ResolveRowAsync — student number validation ──────────────────────────

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task ResolveRowAsync_MissingStudentNumber_ReturnsError(string? studentNumber)
    {
        var payload = GraduatePayloadDtoFactory.Build(studentNumber: studentNumber);
        var (row, error) = await _svc.ResolveRowAsync(payload, CancellationToken.None);
        Assert.Null(row);
        Assert.NotNull(error);
        Assert.Contains("admission number", error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ResolveRowAsync_DuplicateStudentNumber_ReturnsError()
    {
        _repo.ExistsByStudentNumberAsync("CT201/111945/23", Arg.Any<CancellationToken>())
             .Returns(true);

        var payload = GraduatePayloadDtoFactory.Build(studentNumber: "CT201/111945/23");
        var (row, error) = await _svc.ResolveRowAsync(payload, CancellationToken.None);
        Assert.Null(row);
        Assert.NotNull(error);
        Assert.Contains("already registered", error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ResolveRowAsync_StudentNumber_NormalisedToUppercase()
    {
        _repo.ExistsByStudentNumberAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
             .Returns(false);

        var payload = GraduatePayloadDtoFactory.Build(studentNumber: "ct201/111945/23");
        var (row, _) = await _svc.ResolveRowAsync(payload, CancellationToken.None);
        Assert.NotNull(row);
        Assert.Equal("CT201/111945/23", row!.StudentNumber);
    }

    [Theory]
    [InlineData("ct201/111945/23",  "CT201/111945/23")]
    [InlineData("CT201/111945/23",  "CT201/111945/23")]
    [InlineData("Ct201/111945/23",  "CT201/111945/23")]
    [InlineData("  ct201/111945/23  ", "CT201/111945/23")]
    public async Task ResolveRowAsync_StudentNumber_CaseInsensitiveNormalisation(string input, string expected)
    {
        _repo.ExistsByStudentNumberAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
             .Returns(false);

        var payload = GraduatePayloadDtoFactory.Build(studentNumber: input);
        var (row, _) = await _svc.ResolveRowAsync(payload, CancellationToken.None);
        Assert.NotNull(row);
        Assert.Equal(expected, row!.StudentNumber);
    }

    [Fact]
    public async Task ResolveRowAsync_DuplicateCheck_UsesNormalisedUppercaseValue()
    {
        // Verify the duplicate check is called with the uppercased value, not the raw input
        _repo.ExistsByStudentNumberAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
             .Returns(false);

        var payload = GraduatePayloadDtoFactory.Build(studentNumber: "ct201/111945/23");
        await _svc.ResolveRowAsync(payload, CancellationToken.None);

        await _repo.Received(1).ExistsByStudentNumberAsync(
            "CT201/111945/23", Arg.Any<CancellationToken>());
    }

    // ── ResolveRowAsync — school resolution ──────────────────────────────────

    [Fact]
    public async Task ResolveRowAsync_SchoolById_ExactMatch()
    {
        var payload = GraduatePayloadDtoFactory.Build(school: "sci");
        var (row, _) = await _svc.ResolveRowAsync(payload, CancellationToken.None);
        Assert.NotNull(row);
        Assert.Equal("sci", row!.SchoolId);
    }

    [Fact]
    public async Task ResolveRowAsync_SchoolByName_ContainsMatch()
    {
        var payload = GraduatePayloadDtoFactory.Build(school: "Computing");
        var (row, _) = await _svc.ResolveRowAsync(payload, CancellationToken.None);
        Assert.NotNull(row);
        Assert.Equal("sci", row!.SchoolId);
    }

    [Fact]
    public async Task ResolveRowAsync_SchoolByAbbreviation()
    {
        var payload = GraduatePayloadDtoFactory.Build(school: "SCI");
        var (row, _) = await _svc.ResolveRowAsync(payload, CancellationToken.None);
        Assert.NotNull(row);
        Assert.Equal("sci", row!.SchoolId);
    }

    [Fact]
    public async Task ResolveRowAsync_SchoolNull_FallsBackToFirstSchool()
    {
        var payload = GraduatePayloadDtoFactory.Build(school: null);
        var (row, _) = await _svc.ResolveRowAsync(payload, CancellationToken.None);
        Assert.NotNull(row);
        // First school in MetadataFactory is "sci"
        Assert.Equal("sci", row!.SchoolId);
    }

    // ── ResolveRowAsync — department resolution ──────────────────────────────

    [Fact]
    public async Task ResolveRowAsync_DepartmentById_ExactMatch()
    {
        var payload = GraduatePayloadDtoFactory.Build(school: "sci", department: "cs");
        var (row, _) = await _svc.ResolveRowAsync(payload, CancellationToken.None);
        Assert.NotNull(row);
        Assert.Equal("cs", row!.DepartmentId);
    }

    [Fact]
    public async Task ResolveRowAsync_DepartmentByName_ContainsMatch()
    {
        var payload = GraduatePayloadDtoFactory.Build(school: "sci", department: "Computer Science");
        var (row, _) = await _svc.ResolveRowAsync(payload, CancellationToken.None);
        Assert.NotNull(row);
        Assert.Equal("cs", row!.DepartmentId);
    }

    [Fact]
    public async Task ResolveRowAsync_DepartmentInDifferentSchool_UpdatesSchool()
    {
        // "pub_health" belongs to "shs", not "sci"
        var payload = GraduatePayloadDtoFactory.Build(school: "sci", department: "pub_health");
        var (row, _) = await _svc.ResolveRowAsync(payload, CancellationToken.None);
        Assert.NotNull(row);
        Assert.Equal("pub_health", row!.DepartmentId);
        Assert.Equal("shs", row.SchoolId);
    }

    [Fact]
    public async Task ResolveRowAsync_DepartmentNull_FallsBackToFirstDepartment()
    {
        var payload = GraduatePayloadDtoFactory.Build(school: "sci", department: null);
        var (row, _) = await _svc.ResolveRowAsync(payload, CancellationToken.None);
        Assert.NotNull(row);
        Assert.Equal("cs", row!.DepartmentId);
    }

    // ── ResolveRowAsync — programme resolution ───────────────────────────────

    [Fact]
    public async Task ResolveRowAsync_ProgrammeExactMatch_UsesIt()
    {
        var payload = GraduatePayloadDtoFactory.Build(
            programme: "Bachelor of Science (Computer Science)");
        var (row, _) = await _svc.ResolveRowAsync(payload, CancellationToken.None);
        Assert.NotNull(row);
        Assert.Equal("Bachelor of Science (Computer Science)", row!.ProgrammeName);
    }

    [Fact]
    public async Task ResolveRowAsync_ProgrammeContainsMatch_UsesClosest()
    {
        var payload = GraduatePayloadDtoFactory.Build(programme: "Computer Science");
        var (row, _) = await _svc.ResolveRowAsync(payload, CancellationToken.None);
        Assert.NotNull(row);
        Assert.Contains("Computer Science", row!.ProgrammeName);
    }

    [Fact]
    public async Task ResolveRowAsync_ProgrammeNull_FallsBackToFirstProgramme()
    {
        var payload = GraduatePayloadDtoFactory.Build(school: "sci", department: "cs", programme: null);
        var (row, _) = await _svc.ResolveRowAsync(payload, CancellationToken.None);
        Assert.NotNull(row);
        Assert.Equal("Bachelor of Science (Computer Science)", row!.ProgrammeName);
    }

    [Fact]
    public async Task ResolveRowAsync_ProgrammeNotInDb_FallsBackToFirstProgramme()
    {
        // First call returns null (not found), second call returns an ID for the fallback
        _repo.ResolveProgrammeIdAsync("cs", "Bachelor of Science (Computer Science)", Arg.Any<CancellationToken>())
             .Returns((long?)null, (long?)1L);

        var payload = GraduatePayloadDtoFactory.Build(
            school: "sci", department: "cs",
            programme: "Bachelor of Science (Computer Science)");
        var (row, _) = await _svc.ResolveRowAsync(payload, CancellationToken.None);
        Assert.NotNull(row);
    }

    [Fact]
    public async Task ResolveRowAsync_NoProgrammesAtAll_ReturnsError()
    {
        _repo.ResolveProgrammeIdAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>())
             .Returns((long?)null);

        var emptyMeta = TestMetadataRepository.Create(
        [
            new MustSchool("sci", "School of Computing (SCI)",
            [
                new MustDepartment("cs", "Department of Computer Science", []),
            ]),
        ]);
        var svc = new GraduatesService(emptyMeta, _repo);
        var payload = GraduatePayloadDtoFactory.Build(school: "sci", department: "cs", programme: null);
        var (row, error) = await svc.ResolveRowAsync(payload, CancellationToken.None);
        Assert.Null(row);
        Assert.NotNull(error);
    }

    // ── ResolveRowAsync — defaults ───────────────────────────────────────────

    [Fact]
    public async Task ResolveRowAsync_CampusNull_DefaultsToMainCampus()
    {
        var payload = GraduatePayloadDtoFactory.Build(campus: null);
        var (row, _) = await _svc.ResolveRowAsync(payload, CancellationToken.None);
        Assert.Equal("Main Campus (Nchiru)", row!.Campus);
    }

    [Fact]
    public async Task ResolveRowAsync_EmploymentStatusNull_DefaultsToUnknown()
    {
        var payload = GraduatePayloadDtoFactory.Build(employmentStatus: null);
        var (row, _) = await _svc.ResolveRowAsync(payload, CancellationToken.None);
        Assert.Equal("Unknown", row!.EmploymentStatus);
    }

    [Fact]
    public async Task ResolveRowAsync_InvalidGraduationYear_DefaultsToCurrentYear()
    {
        var payload = GraduatePayloadDtoFactory.Build(graduationYear: "not-a-year");
        var (row, _) = await _svc.ResolveRowAsync(payload, CancellationToken.None);
        Assert.Equal(DateTime.Now.Year, row!.GraduationYear);
    }

    [Fact]
    public async Task ResolveRowAsync_BothEmailAndPhoneNull_GeneratesPlaceholderEmail()
    {
        var payload = GraduatePayloadDtoFactory.Build(email: null, phone: null);
        var (row, _) = await _svc.ResolveRowAsync(payload, CancellationToken.None);
        Assert.NotNull(row!.Email);
        Assert.Contains("@must.ac.ke", row.Email);
    }

    [Fact]
    public async Task ResolveRowAsync_EmailProvided_UsedAsIs()
    {
        var payload = GraduatePayloadDtoFactory.Build(email: "test@example.com", phone: null);
        var (row, _) = await _svc.ResolveRowAsync(payload, CancellationToken.None);
        Assert.Equal("test@example.com", row!.Email);
    }

    [Fact]
    public async Task ResolveRowAsync_EmptyStringEmail_TreatedAsNull()
    {
        var payload = GraduatePayloadDtoFactory.Build(email: "  ", phone: null);
        var (row, _) = await _svc.ResolveRowAsync(payload, CancellationToken.None);
        // Both null → placeholder generated
        Assert.Contains("@must.ac.ke", row!.Email!);
    }

    [Fact]
    public async Task ResolveRowAsync_SkillsProvided_PassedThrough()
    {
        var skills = new[] { "Python", "SQL" };
        var payload = GraduatePayloadDtoFactory.Build(skills: skills);
        var (row, _) = await _svc.ResolveRowAsync(payload, CancellationToken.None);
        Assert.NotNull(row!.Skills);
        Assert.Equal(2, row.Skills!.Count);
    }

    [Fact]
    public async Task ResolveRowAsync_EmptySkillsList_StoredAsNull()
    {
        var payload = GraduatePayloadDtoFactory.Build(skills: []);
        var (row, _) = await _svc.ResolveRowAsync(payload, CancellationToken.None);
        Assert.Null(row!.Skills);
    }

    [Fact]
    public async Task ResolveRowAsync_FullNameTrimmed()
    {
        var payload = GraduatePayloadDtoFactory.Build(fullName: "  Jane Wanjiru  ");
        var (row, _) = await _svc.ResolveRowAsync(payload, CancellationToken.None);
        Assert.Equal("Jane Wanjiru", row!.FullName);
    }

    // ── InsertOneAsync ───────────────────────────────────────────────────────

    [Fact]
    public async Task InsertOneAsync_ValidPayload_ReturnsId()
    {
        _repo.InsertGraduateAsync(Arg.Any<GraduateRow>(), Arg.Any<CancellationToken>())
             .Returns(42L);
        var payload = GraduatePayloadDtoFactory.Build();
        var (id, error) = await _svc.InsertOneAsync(payload, CancellationToken.None);
        Assert.Equal(42L, id);
        Assert.Null(error);
    }

    [Fact]
    public async Task InsertOneAsync_InvalidPayload_ReturnsError_NoInsert()
    {
        var payload = GraduatePayloadDtoFactory.Build(fullName: "");
        var (id, error) = await _svc.InsertOneAsync(payload, CancellationToken.None);
        Assert.Null(id);
        Assert.NotNull(error);
        await _repo.DidNotReceive().InsertGraduateAsync(Arg.Any<GraduateRow>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task InsertOneAsync_SupabaseException_ReturnsError()
    {
        _repo.InsertGraduateAsync(Arg.Any<GraduateRow>(), Arg.Any<CancellationToken>())
             .Throws(new SupabaseRequestException(400, "duplicate key"));
        var payload = GraduatePayloadDtoFactory.Build();
        var (id, error) = await _svc.InsertOneAsync(payload, CancellationToken.None);
        Assert.Null(id);
        Assert.Equal("duplicate key", error);
    }

    [Fact]
    public async Task InsertOneAsync_UnexpectedException_ReturnsGenericError()
    {
        _repo.InsertGraduateAsync(Arg.Any<GraduateRow>(), Arg.Any<CancellationToken>())
             .Throws(new InvalidOperationException("unexpected"));
        var payload = GraduatePayloadDtoFactory.Build();
        var (id, error) = await _svc.InsertOneAsync(payload, CancellationToken.None);
        Assert.Null(id);
        Assert.Contains("unexpected error", error, StringComparison.OrdinalIgnoreCase);
    }

    // ── InsertManyAsync ──────────────────────────────────────────────────────

    [Fact]
    public async Task InsertManyAsync_AllValid_InsertsAll()
    {
        var payloads = Enumerable.Range(1, 5)
            .Select(i => GraduatePayloadDtoFactory.Build(fullName: $"Graduate {i}"))
            .ToList();
        var result = await _svc.InsertManyAsync(payloads, CancellationToken.None);
        Assert.Equal(5, result.Inserted);
        Assert.Empty(result.Failed);
    }

    [Fact]
    public async Task InsertManyAsync_SomeInvalid_RecordsFailures()
    {
        var payloads = new[]
        {
            GraduatePayloadDtoFactory.Build(fullName: "Valid Graduate"),
            GraduatePayloadDtoFactory.Build(fullName: ""),   // invalid
        };
        var result = await _svc.InsertManyAsync(payloads, CancellationToken.None);
        Assert.Equal(1, result.Inserted);
        Assert.Single(result.Failed);
        Assert.Equal(2, result.Failed[0].Row);
    }

    [Fact]
    public async Task InsertManyAsync_AllInvalid_ReturnsZeroInserted()
    {
        var payloads = new[]
        {
            GraduatePayloadDtoFactory.Build(fullName: ""),
            GraduatePayloadDtoFactory.Build(fullName: ""),
        };
        var result = await _svc.InsertManyAsync(payloads, CancellationToken.None);
        Assert.Equal(0, result.Inserted);
        Assert.Equal(2, result.Failed.Count);
    }

    [Fact]
    public async Task InsertManyAsync_EmptyList_ReturnsZeroInserted()
    {
        var result = await _svc.InsertManyAsync([], CancellationToken.None);
        Assert.Equal(0, result.Inserted);
        Assert.Empty(result.Failed);
    }

    [Fact]
    public async Task InsertManyAsync_RowNumbers_AreOneBased()
    {
        var payloads = new[]
        {
            GraduatePayloadDtoFactory.Build(fullName: ""),
            GraduatePayloadDtoFactory.Build(fullName: ""),
        };
        var result = await _svc.InsertManyAsync(payloads, CancellationToken.None);
        Assert.Equal(1, result.Failed[0].Row);
        Assert.Equal(2, result.Failed[1].Row);
    }

    [Fact]
    public async Task InsertManyAsync_BulkInsertFails_FallsBackToRowByRow()
    {
        _repo.InsertGraduatesAsync(Arg.Any<IEnumerable<GraduateRow>>(), Arg.Any<CancellationToken>())
             .Throws(new SupabaseRequestException(500, "bulk failed"));
        _repo.InsertGraduateAsync(Arg.Any<GraduateRow>(), Arg.Any<CancellationToken>())
             .Returns(1L);

        var payloads = Enumerable.Range(1, 3)
            .Select(i => GraduatePayloadDtoFactory.Build(fullName: $"Graduate {i}"))
            .ToList();
        var result = await _svc.InsertManyAsync(payloads, CancellationToken.None);
        Assert.Equal(3, result.Inserted);
        Assert.Empty(result.Failed);
    }

    [Fact]
    public async Task InsertManyAsync_FallbackRowFails_RecordsRowFailure()
    {
        _repo.InsertGraduatesAsync(Arg.Any<IEnumerable<GraduateRow>>(), Arg.Any<CancellationToken>())
             .Throws(new SupabaseRequestException(500, "bulk failed"));
        _repo.InsertGraduateAsync(Arg.Any<GraduateRow>(), Arg.Any<CancellationToken>())
             .Throws(new SupabaseRequestException(400, "row error"));

        var payloads = new[] { GraduatePayloadDtoFactory.Build() };
        var result = await _svc.InsertManyAsync(payloads, CancellationToken.None);
        Assert.Equal(0, result.Inserted);
        Assert.Single(result.Failed);
        Assert.Equal("row error", result.Failed[0].Error);
    }
}

/// <summary>
/// Test double that pre-loads the metadata cache without needing a real Supabase connection.
/// Uses reflection to set the private cache field directly on the sealed class.
/// </summary>
file static class TestMetadataRepository
{
    public static SupabaseMetadataRepository Create(IReadOnlyList<Api.MustData.MustSchool> schools)
    {
        var instance = new SupabaseMetadataRepository(null!);
        var field = typeof(SupabaseMetadataRepository)
            .GetField("_cache", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)!;
        field.SetValue(instance, schools);
        return instance;
    }
}
