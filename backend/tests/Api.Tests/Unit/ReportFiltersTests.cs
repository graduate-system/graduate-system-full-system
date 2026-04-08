using Api.Reports;

namespace Api.Tests.Unit;

public class ReportFiltersTests
{
    [Fact]
    public void ScopeLabel_NoFilters_ReturnsAllGraduates()
    {
        var f = new ReportFilters();
        Assert.Equal("All Graduates", f.ScopeLabel);
    }

    [Fact]
    public void ScopeLabel_SchoolNameSet_UsesSchoolName()
    {
        var f = new ReportFilters { SchoolName = "SBE" };
        Assert.Contains("SBE", f.ScopeLabel);
    }

    [Fact]
    public void ScopeLabel_SchoolIdOnly_UsesUppercaseId()
    {
        var f = new ReportFilters { SchoolId = "sci" };
        Assert.Contains("SCI", f.ScopeLabel);
    }

    [Fact]
    public void ScopeLabel_SchoolNameTakesPriorityOverId()
    {
        var f = new ReportFilters { SchoolId = "sci", SchoolName = "School of Computing" };
        Assert.Contains("School of Computing", f.ScopeLabel);
        Assert.DoesNotContain("SCI", f.ScopeLabel);
    }

    [Fact]
    public void ScopeLabel_DepartmentName_Appended()
    {
        var f = new ReportFilters { SchoolName = "SCI", DepartmentName = "Computer Science" };
        Assert.Contains("Computer Science", f.ScopeLabel);
    }

    [Fact]
    public void ScopeLabel_ProgrammeName_Appended()
    {
        var f = new ReportFilters { ProgrammeName = "Bachelor of Science (Computer Science)" };
        Assert.Contains("Bachelor of Science (Computer Science)", f.ScopeLabel);
    }

    [Fact]
    public void ScopeLabel_Campus_Appended()
    {
        var f = new ReportFilters { Campus = "Main Campus (Nchiru)" };
        Assert.Contains("Main Campus (Nchiru)", f.ScopeLabel);
    }

    [Fact]
    public void ScopeLabel_EmploymentStatus_Appended()
    {
        var f = new ReportFilters { EmploymentStatus = "Employed (Full-time)" };
        Assert.Contains("Employed (Full-time)", f.ScopeLabel);
    }

    [Fact]
    public void ScopeLabel_YearFromAndTo_FormatsRange()
    {
        var f = new ReportFilters { YearFrom = 2020, YearTo = 2024 };
        Assert.Contains("2020\u20132024", f.ScopeLabel);
    }

    [Fact]
    public void ScopeLabel_YearFromOnly_FormatsFromLabel()
    {
        var f = new ReportFilters { YearFrom = 2020 };
        Assert.Contains("From 2020", f.ScopeLabel);
    }

    [Fact]
    public void ScopeLabel_YearToOnly_FormatsUpToLabel()
    {
        var f = new ReportFilters { YearTo = 2024 };
        Assert.Contains("Up to 2024", f.ScopeLabel);
    }

    [Fact]
    public void ScopeLabel_AllFiltersSet_JoinsWithDot()
    {
        var f = new ReportFilters
        {
            SchoolName = "SCI",
            DepartmentName = "Computer Science",
            ProgrammeName = "BSc CS",
            Campus = "Main Campus (Nchiru)",
            EmploymentStatus = "Employed (Full-time)",
            YearFrom = 2022,
            YearTo = 2024,
        };
        Assert.Contains(" \u00b7 ", f.ScopeLabel);
    }
}
