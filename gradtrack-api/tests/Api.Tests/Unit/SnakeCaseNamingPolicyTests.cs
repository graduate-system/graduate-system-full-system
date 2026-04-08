using Api.Json;

namespace Api.Tests.Unit;

public class SnakeCaseNamingPolicyTests
{
    private readonly SnakeCaseNamingPolicy _policy = new();

    [Theory]
    [InlineData("name",           "name")]
    [InlineData("campus",         "campus")]
    [InlineData("FullName",       "full_name")]
    [InlineData("GraduationYear", "graduation_year")]
    [InlineData("SchoolId",       "school_id")]
    [InlineData("DepartmentId",   "department_id")]
    [InlineData("ProgrammeName",  "programme_name")]
    [InlineData("EmploymentStatus", "employment_status")]
    [InlineData("MonthsToEmploy", "months_to_employ")]
    [InlineData("LinkedinUrl",    "linkedin_url")]
    [InlineData("TotalCount",     "total_count")]
    [InlineData("BySchool",       "by_school")]
    [InlineData("YearFrom",       "year_from")]
    [InlineData("YearTo",         "year_to")]
    public void ConvertName_ProducesExpectedSnakeCase(string input, string expected)
    {
        Assert.Equal(expected, _policy.ConvertName(input));
    }

    [Fact]
    public void ConvertName_EmptyString_ReturnsEmpty()
    {
        Assert.Equal("", _policy.ConvertName(""));
    }

    [Fact]
    public void ConvertName_SingleUpperChar_ReturnsLower()
    {
        Assert.Equal("a", _policy.ConvertName("A"));
    }

    [Fact]
    public void ConvertName_AlreadyLowercase_Unchanged()
    {
        Assert.Equal("alreadylower", _policy.ConvertName("alreadylower"));
    }
}
