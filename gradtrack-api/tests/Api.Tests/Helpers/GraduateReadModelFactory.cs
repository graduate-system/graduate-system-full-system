using Api.Graduates;

namespace Api.Tests.Helpers;

public static class GraduateReadModelFactory
{
    private static long _nextId = 1;

    public static GraduateReadModel Build(
        long? id = null,
        string fullName = "Jane Wanjiru",
        string campus = "Main Campus (Nchiru)",
        string schoolId = "sci",
        string schoolName = "School of Computing and Informatics (SCI)",
        string departmentId = "cs",
        string departmentName = "Department of Computer Science",
        long programmeId = 1,
        string programmeName = "Bachelor of Science (Computer Science)",
        int graduationYear = 2023,
        string employmentStatus = "Employed (Full-time)",
        string? email = "jane@example.com",
        string? phone = null,
        string? employerName = "Safaricom PLC",
        string? jobTitle = "Software Engineer",
        string? sector = "Information & Communication Technology (ICT)",
        string? employmentCounty = "Nairobi",
        string? monthsToEmploy = "1 – 3 months",
        string? linkedinUrl = null,
        string? studentNumber = null,
        IReadOnlyList<string>? skills = null)
    {
        return new GraduateReadModel(
            Id: id ?? _nextId++,
            CreatedAt: DateTimeOffset.UtcNow,
            FullName: fullName,
            StudentNumber: studentNumber,
            Email: email,
            Phone: phone,
            Campus: campus,
            SchoolId: schoolId,
            DepartmentId: departmentId,
            ProgrammeId: programmeId,
            GraduationYear: graduationYear,
            EmploymentStatus: employmentStatus,
            EmployerName: employerName,
            JobTitle: jobTitle,
            Sector: sector,
            EmploymentCounty: employmentCounty,
            MonthsToEmploy: monthsToEmploy,
            LinkedinUrl: linkedinUrl,
            SchoolName: schoolName,
            DepartmentName: departmentName,
            ProgrammeName: programmeName,
            Skills: skills
        );
    }

    /// <summary>Builds a list of graduates with varied statuses for dashboard tests.</summary>
    public static IReadOnlyList<GraduateReadModel> BuildMixed()
    {
        return
        [
            Build(id: 1, employmentStatus: "Employed (Full-time)",          schoolId: "sci", graduationYear: 2023),
            Build(id: 2, employmentStatus: "Employed (Part-time)",           schoolId: "sci", graduationYear: 2023),
            Build(id: 3, employmentStatus: "Self-employed / Entrepreneur",   schoolId: "sbe", graduationYear: 2022),
            Build(id: 4, employmentStatus: "Internship / Attachment",        schoolId: "sbe", graduationYear: 2022),
            Build(id: 5, employmentStatus: "Further Studies",                schoolId: "shs", graduationYear: 2021),
            Build(id: 6, employmentStatus: "Unemployed \u2014 Seeking",      schoolId: "shs", graduationYear: 2021),
            Build(id: 7, employmentStatus: "Unemployed \u2014 Not Seeking",  schoolId: "sci", graduationYear: 2020),
        ];
    }
}
