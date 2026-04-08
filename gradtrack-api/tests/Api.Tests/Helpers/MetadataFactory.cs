using Api.MustData;

namespace Api.Tests.Helpers;

/// <summary>
/// Builds a fixed in-memory MUST academic structure used across all GraduatesService tests.
/// Mirrors the real seed data so resolution logic can be tested realistically.
/// </summary>
public static class MetadataFactory
{
    public static IReadOnlyList<MustSchool> Build() =>
    [
        new MustSchool("sci", "School of Computing and Informatics (SCI)",
        [
            new MustDepartment("cs", "Department of Computer Science",
            [
                "Bachelor of Science (Computer Science)",
                "Master of Science (Computer Science)",
            ]),
            new MustDepartment("it", "Department of Information Technology",
            [
                "Bachelor of Science (Information Technology)",
                "Bachelor of Business Information Technology (BBIT)",
            ]),
        ]),
        new MustSchool("sbe", "School of Business and Economics (SBE)",
        [
            new MustDepartment("bus", "Department of Business Administration",
            [
                "Bachelor of Business Administration (BBA)",
                "Bachelor of Co-operative Management",
                "Master of Business Administration (MBA)",
            ]),
            new MustDepartment("fin", "Department of Finance and Accounting",
            [
                "Bachelor of Science (Actuarial Science)",
                "Bachelor of Science (Finance)",
            ]),
        ]),
        new MustSchool("shs", "School of Health Sciences (SHS)",
        [
            new MustDepartment("pub_health", "Department of Public Health",
            [
                "Bachelor of Science (Public Health)",
                "Master of Science (Public Health)",
            ]),
            new MustDepartment("med_lab", "Department of Medical Laboratory Science",
            [
                "Bachelor of Science (Medical Laboratory Science)",
            ]),
        ]),
    ];

    public static MustSchool Sci => Build()[0];
    public static MustSchool Sbe => Build()[1];
    public static MustSchool Shs => Build()[2];
}
