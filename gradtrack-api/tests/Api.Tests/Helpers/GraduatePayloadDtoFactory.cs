using Api.Graduates;

namespace Api.Tests.Helpers;

public static class GraduatePayloadDtoFactory
{
    public static GraduatePayloadDto Build(
        string fullName = "Jane Wanjiru",
        string? studentNumber = null,
        string? email = "jane@example.com",
        string? phone = null,
        string? campus = "Main Campus (Nchiru)",
        string? school = "sci",
        string? department = "cs",
        string? programme = "Bachelor of Science (Computer Science)",
        string? graduationYear = "2023",
        string? employmentStatus = "Employed (Full-time)",
        string? employerName = "Safaricom PLC",
        string? jobTitle = "Software Engineer",
        string? sector = "Information & Communication Technology (ICT)",
        string? employmentCounty = "Nairobi",
        string? monthsToEmploy = "1 – 3 months",
        string? linkedinUrl = null,
        IReadOnlyList<string>? skills = null)
    {
        return new GraduatePayloadDto
        {
            FullName         = fullName,
            StudentNumber    = studentNumber,
            Email            = email,
            Phone            = phone,
            Campus           = campus,
            School           = school,
            Department       = department,
            Programme        = programme,
            GraduationYear   = graduationYear,
            EmploymentStatus = employmentStatus,
            EmployerName     = employerName,
            JobTitle         = jobTitle,
            Sector           = sector,
            EmploymentCounty = employmentCounty,
            MonthsToEmploy   = monthsToEmploy,
            LinkedinUrl      = linkedinUrl,
            Skills           = skills,
        };
    }
}
