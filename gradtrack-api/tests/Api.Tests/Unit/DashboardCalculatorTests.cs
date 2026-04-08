using Api.Dashboard;
using Api.Tests.Helpers;

namespace Api.Tests.Unit;

public class DashboardCalculatorTests
{
    [Fact]
    public void Calculate_EmptyList_ReturnsEmpty()
    {
        var result = DashboardCalculator.Calculate([]);

        Assert.Equal(0, result.TotalCount);
        Assert.Equal(0, result.EmploymentRate);
        Assert.Empty(result.BySchool);
        Assert.Empty(result.ByStatus);
        Assert.Empty(result.ByYear);
        Assert.Empty(result.BySector);
        Assert.Empty(result.ByCampus);
        Assert.Empty(result.ByDepartment);
        Assert.Empty(result.ByMonthsToEmploy);
        Assert.Empty(result.BySkill);
    }

    [Fact]
    public void Calculate_TotalCount_IsCorrect()
    {
        var grads = GraduateReadModelFactory.BuildMixed();
        var result = DashboardCalculator.Calculate(grads);
        Assert.Equal(7, result.TotalCount);
    }

    [Fact]
    public void Calculate_EmploymentRate_AllEmployed()
    {
        var grads = new[]
        {
            GraduateReadModelFactory.Build(id: 1, employmentStatus: "Employed (Full-time)"),
            GraduateReadModelFactory.Build(id: 2, employmentStatus: "Employed (Part-time)"),
            GraduateReadModelFactory.Build(id: 3, employmentStatus: "Self-employed / Entrepreneur"),
            GraduateReadModelFactory.Build(id: 4, employmentStatus: "Internship / Attachment"),
        };
        var result = DashboardCalculator.Calculate(grads);
        Assert.Equal(100, result.EmploymentRate);
    }

    [Fact]
    public void Calculate_EmploymentRate_NoneEmployed()
    {
        var grads = new[]
        {
            GraduateReadModelFactory.Build(id: 1, employmentStatus: "Unemployed \u2014 Seeking"),
            GraduateReadModelFactory.Build(id: 2, employmentStatus: "Unemployed \u2014 Not Seeking"),
            GraduateReadModelFactory.Build(id: 3, employmentStatus: "Further Studies"),
        };
        var result = DashboardCalculator.Calculate(grads);
        Assert.Equal(0, result.EmploymentRate);
    }

    [Fact]
    public void Calculate_EmploymentRate_Mixed_RoundsCorrectly()
    {
        // 1 employed out of 3 = 33.33% → rounds to 33
        var grads = new[]
        {
            GraduateReadModelFactory.Build(id: 1, employmentStatus: "Employed (Full-time)"),
            GraduateReadModelFactory.Build(id: 2, employmentStatus: "Unemployed \u2014 Seeking"),
            GraduateReadModelFactory.Build(id: 3, employmentStatus: "Further Studies"),
        };
        var result = DashboardCalculator.Calculate(grads);
        Assert.Equal(33, result.EmploymentRate);
    }

    [Fact]
    public void Calculate_ByStatus_GroupsAndSortsByCount()
    {
        var grads = new[]
        {
            GraduateReadModelFactory.Build(id: 1, employmentStatus: "Employed (Full-time)"),
            GraduateReadModelFactory.Build(id: 2, employmentStatus: "Employed (Full-time)"),
            GraduateReadModelFactory.Build(id: 3, employmentStatus: "Unemployed \u2014 Seeking"),
        };
        var result = DashboardCalculator.Calculate(grads);
        Assert.Equal("Employed (Full-time)", result.ByStatus[0].Name);
        Assert.Equal(2, result.ByStatus[0].Count);
        Assert.Equal("Unemployed \u2014 Seeking", result.ByStatus[1].Name);
        Assert.Equal(1, result.ByStatus[1].Count);
    }

    [Fact]
    public void Calculate_BySchool_UsesShortName()
    {
        var grads = new[]
        {
            GraduateReadModelFactory.Build(id: 1, schoolName: "School of Computing and Informatics (SCI)"),
        };
        var result = DashboardCalculator.Calculate(grads);
        Assert.Equal("SCI", result.BySchool[0].Name);
    }

    [Fact]
    public void Calculate_BySchool_SortsByCount()
    {
        var grads = new[]
        {
            GraduateReadModelFactory.Build(id: 1, schoolName: "School of Business and Economics (SBE)"),
            GraduateReadModelFactory.Build(id: 2, schoolName: "School of Computing and Informatics (SCI)"),
            GraduateReadModelFactory.Build(id: 3, schoolName: "School of Computing and Informatics (SCI)"),
        };
        var result = DashboardCalculator.Calculate(grads);
        Assert.Equal("SCI", result.BySchool[0].Name);
        Assert.Equal(2, result.BySchool[0].Count);
    }

    [Fact]
    public void Calculate_ByDepartment_StripsPrefix()
    {
        var grads = new[]
        {
            GraduateReadModelFactory.Build(id: 1, departmentName: "Department of Computer Science"),
        };
        var result = DashboardCalculator.Calculate(grads);
        Assert.Equal("Computer Science", result.ByDepartment[0].Name);
    }

    [Fact]
    public void Calculate_ByDepartment_AttachesCorrectSchool()
    {
        var grads = new[]
        {
            GraduateReadModelFactory.Build(id: 1,
                schoolName: "School of Computing and Informatics (SCI)",
                departmentName: "Department of Computer Science"),
        };
        var result = DashboardCalculator.Calculate(grads);
        Assert.Equal("SCI", result.ByDepartment[0].School);
    }

    [Fact]
    public void Calculate_BySector_ExcludesNullSectors()
    {
        var grads = new[]
        {
            GraduateReadModelFactory.Build(id: 1, sector: "ICT"),
            GraduateReadModelFactory.Build(id: 2, sector: null),
        };
        var result = DashboardCalculator.Calculate(grads);
        Assert.Single(result.BySector);
    }

    [Fact]
    public void Calculate_BySector_UsesShortSectorName()
    {
        var grads = new[]
        {
            GraduateReadModelFactory.Build(id: 1, sector: "Information & Communication Technology (ICT)"),
        };
        var result = DashboardCalculator.Calculate(grads);
        Assert.Equal("ICT", result.BySector[0].Name);
    }

    [Fact]
    public void Calculate_ByYear_OrderedAscending()
    {
        var grads = new[]
        {
            GraduateReadModelFactory.Build(id: 1, graduationYear: 2024),
            GraduateReadModelFactory.Build(id: 2, graduationYear: 2022),
            GraduateReadModelFactory.Build(id: 3, graduationYear: 2023),
        };
        var result = DashboardCalculator.Calculate(grads);
        var years = result.ByYear.Select(y => y.Year).ToList();
        Assert.Equal([2022, 2023, 2024], years);
    }

    [Fact]
    public void Calculate_ByYear_EmployedCount_IsCorrect()
    {
        var grads = new[]
        {
            GraduateReadModelFactory.Build(id: 1, graduationYear: 2023, employmentStatus: "Employed (Full-time)"),
            GraduateReadModelFactory.Build(id: 2, graduationYear: 2023, employmentStatus: "Unemployed \u2014 Seeking"),
            GraduateReadModelFactory.Build(id: 3, graduationYear: 2023, employmentStatus: "Further Studies"),
        };
        var result = DashboardCalculator.Calculate(grads);
        var year2023 = result.ByYear.Single(y => y.Year == 2023);
        Assert.Equal(3, year2023.Count);
        Assert.Equal(1, year2023.Employed);
    }

    [Fact]
    public void Calculate_ByCampus_GroupsCorrectly()
    {
        var grads = new[]
        {
            GraduateReadModelFactory.Build(id: 1, campus: "Main Campus (Nchiru)"),
            GraduateReadModelFactory.Build(id: 2, campus: "Main Campus (Nchiru)"),
            GraduateReadModelFactory.Build(id: 3, campus: "Meru Town Campus"),
        };
        var result = DashboardCalculator.Calculate(grads);
        Assert.Equal(2, result.ByCampus.Count);
        Assert.Equal("Main Campus (Nchiru)", result.ByCampus[0].Name);
        Assert.Equal(2, result.ByCampus[0].Count);
    }

    [Fact]
    public void Calculate_ByMonthsToEmploy_ExcludesNulls()
    {
        var grads = new[]
        {
            GraduateReadModelFactory.Build(id: 1, monthsToEmploy: "1 \u2013 3 months"),
            GraduateReadModelFactory.Build(id: 2, monthsToEmploy: null),
        };
        var result = DashboardCalculator.Calculate(grads);
        Assert.Single(result.ByMonthsToEmploy);
    }

    [Fact]
    public void Calculate_BySkill_FlattensAndCounts()
    {
        var grads = new[]
        {
            GraduateReadModelFactory.Build(id: 1, skills: ["Python", "SQL"]),
            GraduateReadModelFactory.Build(id: 2, skills: ["Python", "Excel"]),
            GraduateReadModelFactory.Build(id: 3, skills: ["SQL"]),
        };
        var result = DashboardCalculator.Calculate(grads);
        var python = result.BySkill.Single(s => s.Name == "Python");
        var sql    = result.BySkill.Single(s => s.Name == "SQL");
        var excel  = result.BySkill.Single(s => s.Name == "Excel");
        Assert.Equal(2, python.Count);
        Assert.Equal(2, sql.Count);
        Assert.Equal(1, excel.Count);
    }

    [Fact]
    public void Calculate_BySkill_ExcludesNullSkills()
    {
        var grads = new[]
        {
            GraduateReadModelFactory.Build(id: 1, skills: null),
            GraduateReadModelFactory.Build(id: 2, skills: ["Python"]),
        };
        var result = DashboardCalculator.Calculate(grads);
        Assert.Single(result.BySkill);
        Assert.Equal("Python", result.BySkill[0].Name);
    }

    [Fact]
    public void Calculate_BySkill_ExcludesEmptyStringSkills()
    {
        var grads = new[]
        {
            GraduateReadModelFactory.Build(id: 1, skills: ["Python", "", "  "]),
        };
        var result = DashboardCalculator.Calculate(grads);
        Assert.Single(result.BySkill);
        Assert.Equal("Python", result.BySkill[0].Name);
    }

    [Fact]
    public void Calculate_BySkill_SortsByCount()
    {
        var grads = new[]
        {
            GraduateReadModelFactory.Build(id: 1, skills: ["SQL"]),
            GraduateReadModelFactory.Build(id: 2, skills: ["Python", "SQL"]),
            GraduateReadModelFactory.Build(id: 3, skills: ["Python", "SQL"]),
        };
        var result = DashboardCalculator.Calculate(grads);
        Assert.Equal("SQL", result.BySkill[0].Name);
        Assert.Equal(3, result.BySkill[0].Count);
    }
}
