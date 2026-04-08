using Api.Graduates;
using Api.Reports;
using Api.Tests.Helpers;
using NSubstitute;

namespace Api.Tests.Unit;

public class ReportServiceTests
{
    private static IReadOnlyList<GraduateReadModel> BuildDataset() =>
    [
        GraduateReadModelFactory.Build(id: 1, schoolId: "sci", departmentId: "cs",
            programmeName: "Bachelor of Science (Computer Science)",
            campus: "Main Campus (Nchiru)", graduationYear: 2023,
            employmentStatus: "Employed (Full-time)"),

        GraduateReadModelFactory.Build(id: 2, schoolId: "sci", departmentId: "it",
            programmeName: "Bachelor of Science (Information Technology)",
            campus: "Main Campus (Nchiru)", graduationYear: 2022,
            employmentStatus: "Unemployed \u2014 Seeking"),

        GraduateReadModelFactory.Build(id: 3, schoolId: "sbe", departmentId: "bus",
            programmeName: "Bachelor of Business Administration (BBA)",
            campus: "Meru Town Campus", graduationYear: 2024,
            employmentStatus: "Self-employed / Entrepreneur"),

        GraduateReadModelFactory.Build(id: 4, schoolId: "sbe", departmentId: "fin",
            programmeName: "Bachelor of Science (Finance)",
            campus: "Meru Town Campus", graduationYear: 2021,
            employmentStatus: "Further Studies"),

        GraduateReadModelFactory.Build(id: 5, schoolId: "shs", departmentId: "pub_health",
            programmeName: "Bachelor of Science (Public Health)",
            campus: "Main Campus (Nchiru)", graduationYear: 2023,
            employmentStatus: "Employed (Part-time)"),
    ];

    private static ReportService CreateService(IReadOnlyList<GraduateReadModel> data)
    {
        var repo = Substitute.For<IGraduatesRepository>();
        repo.FetchGraduatesAsync(Arg.Any<CancellationToken>()).Returns(data);
        return new ReportService(repo);
    }

    [Fact]
    public async Task Apply_NoFilters_ReturnsAll()
    {
        var data = BuildDataset();
        var svc = CreateService(data);
        var result = await svc.BuildAsync(new ReportFilters(), CancellationToken.None);
        Assert.Equal(5, result.Graduates.Count);
    }

    [Fact]
    public async Task Apply_SchoolId_FiltersCorrectly()
    {
        var svc = CreateService(BuildDataset());
        var result = await svc.BuildAsync(new ReportFilters { SchoolId = "sci" }, CancellationToken.None);
        Assert.Equal(2, result.Graduates.Count);
        Assert.All(result.Graduates, g => Assert.Equal("sci", g.SchoolId));
    }

    [Fact]
    public async Task Apply_SchoolId_IsCaseInsensitive()
    {
        var svc = CreateService(BuildDataset());
        var result = await svc.BuildAsync(new ReportFilters { SchoolId = "SCI" }, CancellationToken.None);
        Assert.Equal(2, result.Graduates.Count);
    }

    [Fact]
    public async Task Apply_DepartmentId_FiltersCorrectly()
    {
        var svc = CreateService(BuildDataset());
        var result = await svc.BuildAsync(new ReportFilters { DepartmentId = "bus" }, CancellationToken.None);
        Assert.Single(result.Graduates);
        Assert.Equal("bus", result.Graduates[0].DepartmentId);
    }

    [Fact]
    public async Task Apply_ProgrammeName_FiltersCorrectly()
    {
        var svc = CreateService(BuildDataset());
        var result = await svc.BuildAsync(
            new ReportFilters { ProgrammeName = "Bachelor of Science (Computer Science)" },
            CancellationToken.None);
        Assert.Single(result.Graduates);
    }

    [Fact]
    public async Task Apply_ProgrammeName_IsCaseInsensitive()
    {
        var svc = CreateService(BuildDataset());
        var result = await svc.BuildAsync(
            new ReportFilters { ProgrammeName = "bachelor of science (computer science)" },
            CancellationToken.None);
        Assert.Single(result.Graduates);
    }

    [Fact]
    public async Task Apply_Campus_FiltersCorrectly()
    {
        var svc = CreateService(BuildDataset());
        var result = await svc.BuildAsync(
            new ReportFilters { Campus = "Meru Town Campus" }, CancellationToken.None);
        Assert.Equal(2, result.Graduates.Count);
        Assert.All(result.Graduates, g => Assert.Equal("Meru Town Campus", g.Campus));
    }

    [Fact]
    public async Task Apply_EmploymentStatus_FiltersCorrectly()
    {
        var svc = CreateService(BuildDataset());
        var result = await svc.BuildAsync(
            new ReportFilters { EmploymentStatus = "Employed (Full-time)" }, CancellationToken.None);
        Assert.Single(result.Graduates);
        Assert.Equal("Employed (Full-time)", result.Graduates[0].EmploymentStatus);
    }

    [Fact]
    public async Task Apply_YearFrom_FiltersCorrectly()
    {
        var svc = CreateService(BuildDataset());
        var result = await svc.BuildAsync(new ReportFilters { YearFrom = 2023 }, CancellationToken.None);
        Assert.Equal(3, result.Graduates.Count);
        Assert.All(result.Graduates, g => Assert.True(g.GraduationYear >= 2023));
    }

    [Fact]
    public async Task Apply_YearTo_FiltersCorrectly()
    {
        var svc = CreateService(BuildDataset());
        var result = await svc.BuildAsync(new ReportFilters { YearTo = 2022 }, CancellationToken.None);
        Assert.Equal(2, result.Graduates.Count);
        Assert.All(result.Graduates, g => Assert.True(g.GraduationYear <= 2022));
    }

    [Fact]
    public async Task Apply_YearFromAndTo_FiltersRange()
    {
        var svc = CreateService(BuildDataset());
        var result = await svc.BuildAsync(
            new ReportFilters { YearFrom = 2022, YearTo = 2023 }, CancellationToken.None);
        Assert.Equal(3, result.Graduates.Count);
        Assert.All(result.Graduates, g =>
            Assert.True(g.GraduationYear >= 2022 && g.GraduationYear <= 2023));
    }

    [Fact]
    public async Task Apply_YearFromEqualsYearTo_ReturnsSingleYear()
    {
        var svc = CreateService(BuildDataset());
        var result = await svc.BuildAsync(
            new ReportFilters { YearFrom = 2024, YearTo = 2024 }, CancellationToken.None);
        Assert.Single(result.Graduates);
        Assert.Equal(2024, result.Graduates[0].GraduationYear);
    }

    [Fact]
    public async Task Apply_YearFromGreaterThanYearTo_ReturnsEmpty()
    {
        var svc = CreateService(BuildDataset());
        var result = await svc.BuildAsync(
            new ReportFilters { YearFrom = 2025, YearTo = 2020 }, CancellationToken.None);
        Assert.Empty(result.Graduates);
    }

    [Fact]
    public async Task Apply_MultipleFilters_AreAndCombined()
    {
        var svc = CreateService(BuildDataset());
        var result = await svc.BuildAsync(new ReportFilters
        {
            SchoolId = "sci",
            Campus = "Main Campus (Nchiru)",
            YearFrom = 2023,
        }, CancellationToken.None);
        Assert.Single(result.Graduates);
        Assert.Equal(1L, result.Graduates[0].Id);
    }

    [Fact]
    public async Task Apply_NoMatchingGraduates_ReturnsEmpty()
    {
        var svc = CreateService(BuildDataset());
        var result = await svc.BuildAsync(
            new ReportFilters { SchoolId = "nonexistent" }, CancellationToken.None);
        Assert.Empty(result.Graduates);
    }
}
