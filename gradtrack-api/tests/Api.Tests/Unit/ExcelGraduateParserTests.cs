using Api.Graduates;
using ClosedXML.Excel;

namespace Api.Tests.Unit;

public class ExcelGraduateParserTests
{
    private static Stream BuildExcel(Action<IXLWorksheet> configure)
    {
        var wb = new XLWorkbook();
        var ws = wb.AddWorksheet("Sheet1");
        configure(ws);
        var ms = new MemoryStream();
        wb.SaveAs(ms);
        ms.Position = 0;
        return ms;
    }

    private static Stream BuildStandardFile(string nameHeader = "full_name")
    {
        return BuildExcel(ws =>
        {
            ws.Cell(1, 1).Value = nameHeader;
            ws.Cell(1, 2).Value = "email";
            ws.Cell(1, 3).Value = "school";
            ws.Cell(1, 4).Value = "graduation_year";
            ws.Cell(1, 5).Value = "employment_status";

            ws.Cell(2, 1).Value = "Jane Wanjiru";
            ws.Cell(2, 2).Value = "jane@example.com";
            ws.Cell(2, 3).Value = "sci";
            ws.Cell(2, 4).Value = "2023";
            ws.Cell(2, 5).Value = "Employed (Full-time)";
        });
    }

    [Fact]
    public void Parse_ValidFile_WithFullNameColumn_ReturnsRows()
    {
        using var stream = BuildStandardFile();
        var (rows, error) = ExcelGraduateParser.Parse(stream);
        Assert.NotNull(rows);
        Assert.Null(error);
        Assert.Single(rows!);
        Assert.Equal("Jane Wanjiru", rows![0].FullName);
    }

    [Fact]
    public void Parse_ValidFile_WithNameColumn_ReturnsRows()
    {
        using var stream = BuildStandardFile(nameHeader: "name");
        var (rows, error) = ExcelGraduateParser.Parse(stream);
        Assert.NotNull(rows);
        Assert.Null(error);
        Assert.Single(rows!);
    }

    [Fact]
    public void Parse_MissingFullNameAndNameColumn_ReturnsError()
    {
        using var stream = BuildExcel(ws =>
        {
            ws.Cell(1, 1).Value = "email";
            ws.Cell(2, 1).Value = "test@example.com";
        });
        var (rows, error) = ExcelGraduateParser.Parse(stream);
        Assert.Null(rows);
        Assert.NotNull(error);
    }

    [Fact]
    public void Parse_SkipsBlankRows()
    {
        using var stream = BuildExcel(ws =>
        {
            ws.Cell(1, 1).Value = "full_name";
            ws.Cell(2, 1).Value = "Jane Wanjiru";
            ws.Cell(3, 1).Value = "";           // blank — should be skipped
            ws.Cell(4, 1).Value = "John Kamau";
        });
        var (rows, _) = ExcelGraduateParser.Parse(stream);
        Assert.Equal(2, rows!.Count);
    }

    [Fact]
    public void Parse_HeaderNormalization_HandlesSpaces()
    {
        using var stream = BuildExcel(ws =>
        {
            ws.Cell(1, 1).Value = "Full Name";
            ws.Cell(2, 1).Value = "Jane Wanjiru";
        });
        var (rows, error) = ExcelGraduateParser.Parse(stream);
        Assert.NotNull(rows);
        Assert.Null(error);
        Assert.Equal("Jane Wanjiru", rows![0].FullName);
    }

    [Fact]
    public void Parse_HeaderNormalization_HandlesMixedCase()
    {
        using var stream = BuildExcel(ws =>
        {
            ws.Cell(1, 1).Value = "FULL_NAME";
            ws.Cell(2, 1).Value = "Jane Wanjiru";
        });
        var (rows, _) = ExcelGraduateParser.Parse(stream);
        Assert.NotNull(rows);
        Assert.Equal("Jane Wanjiru", rows![0].FullName);
    }

    [Fact]
    public void Parse_HeaderNormalization_HandlesDashes()
    {
        using var stream = BuildExcel(ws =>
        {
            ws.Cell(1, 1).Value = "full-name";
            ws.Cell(2, 1).Value = "Jane Wanjiru";
        });
        var (rows, _) = ExcelGraduateParser.Parse(stream);
        Assert.NotNull(rows);
        Assert.Equal("Jane Wanjiru", rows![0].FullName);
    }

    [Theory]
    [InlineData("email_address", "jane@example.com")]
    public void Parse_AlternativeColumnName_Email(string header, string value)
    {
        using var stream = BuildExcel(ws =>
        {
            ws.Cell(1, 1).Value = "full_name";
            ws.Cell(1, 2).Value = header;
            ws.Cell(2, 1).Value = "Jane Wanjiru";
            ws.Cell(2, 2).Value = value;
        });
        var (rows, _) = ExcelGraduateParser.Parse(stream);
        Assert.Equal(value, rows![0].Email);
    }

    [Theory]
    [InlineData("mobile")]
    [InlineData("phone_number")]
    public void Parse_AlternativeColumnName_Phone(string header)
    {
        using var stream = BuildExcel(ws =>
        {
            ws.Cell(1, 1).Value = "full_name";
            ws.Cell(1, 2).Value = header;
            ws.Cell(2, 1).Value = "Jane Wanjiru";
            ws.Cell(2, 2).Value = "+254712345678";
        });
        var (rows, _) = ExcelGraduateParser.Parse(stream);
        Assert.Equal("+254712345678", rows![0].Phone);
    }

    [Theory]
    [InlineData("faculty")]
    [InlineData("school_name")]
    public void Parse_AlternativeColumnName_School(string header)
    {
        using var stream = BuildExcel(ws =>
        {
            ws.Cell(1, 1).Value = "full_name";
            ws.Cell(1, 2).Value = header;
            ws.Cell(2, 1).Value = "Jane Wanjiru";
            ws.Cell(2, 2).Value = "sci";
        });
        var (rows, _) = ExcelGraduateParser.Parse(stream);
        Assert.Equal("sci", rows![0].School);
    }

    [Theory]
    [InlineData("course")]
    [InlineData("programme_name")]
    public void Parse_AlternativeColumnName_Programme(string header)
    {
        using var stream = BuildExcel(ws =>
        {
            ws.Cell(1, 1).Value = "full_name";
            ws.Cell(1, 2).Value = header;
            ws.Cell(2, 1).Value = "Jane Wanjiru";
            ws.Cell(2, 2).Value = "BSc CS";
        });
        var (rows, _) = ExcelGraduateParser.Parse(stream);
        Assert.Equal("BSc CS", rows![0].Programme);
    }

    [Theory]
    [InlineData("grad_year")]
    [InlineData("year")]
    public void Parse_AlternativeColumnName_GraduationYear(string header)
    {
        using var stream = BuildExcel(ws =>
        {
            ws.Cell(1, 1).Value = "full_name";
            ws.Cell(1, 2).Value = header;
            ws.Cell(2, 1).Value = "Jane Wanjiru";
            ws.Cell(2, 2).Value = "2023";
        });
        var (rows, _) = ExcelGraduateParser.Parse(stream);
        Assert.Equal("2023", rows![0].GraduationYear);
    }

    [Theory]
    [InlineData("status")]
    [InlineData("employment")]
    public void Parse_AlternativeColumnName_EmploymentStatus(string header)
    {
        using var stream = BuildExcel(ws =>
        {
            ws.Cell(1, 1).Value = "full_name";
            ws.Cell(1, 2).Value = header;
            ws.Cell(2, 1).Value = "Jane Wanjiru";
            ws.Cell(2, 2).Value = "Employed (Full-time)";
        });
        var (rows, _) = ExcelGraduateParser.Parse(stream);
        Assert.Equal("Employed (Full-time)", rows![0].EmploymentStatus);
    }

    [Fact]
    public void Parse_EmptyFile_NoDataRows_ReturnsError()
    {
        using var stream = BuildExcel(ws =>
        {
            ws.Cell(1, 1).Value = "full_name";
            // No data rows
        });
        var (rows, error) = ExcelGraduateParser.Parse(stream);
        Assert.Null(rows);
        Assert.NotNull(error);
    }

    [Fact]
    public void Parse_NullIfEmpty_EmptyCells_StoredAsNull()
    {
        using var stream = BuildExcel(ws =>
        {
            ws.Cell(1, 1).Value = "full_name";
            ws.Cell(1, 2).Value = "email";
            ws.Cell(2, 1).Value = "Jane Wanjiru";
            ws.Cell(2, 2).Value = ""; // empty
        });
        var (rows, _) = ExcelGraduateParser.Parse(stream);
        Assert.Null(rows![0].Email);
    }

    [Fact]
    public void Parse_AllFieldsPopulated_MapsCorrectly()
    {
        using var stream = BuildExcel(ws =>
        {
            ws.Cell(1, 1).Value = "full_name";
            ws.Cell(1, 2).Value = "student_number";
            ws.Cell(1, 3).Value = "email";
            ws.Cell(1, 4).Value = "phone";
            ws.Cell(1, 5).Value = "campus";
            ws.Cell(1, 6).Value = "school";
            ws.Cell(1, 7).Value = "department";
            ws.Cell(1, 8).Value = "programme";
            ws.Cell(1, 9).Value = "graduation_year";
            ws.Cell(1, 10).Value = "employment_status";
            ws.Cell(1, 11).Value = "employer_name";
            ws.Cell(1, 12).Value = "job_title";
            ws.Cell(1, 13).Value = "sector";
            ws.Cell(1, 14).Value = "employment_county";
            ws.Cell(1, 15).Value = "months_to_employ";
            ws.Cell(1, 16).Value = "linkedin_url";

            ws.Cell(2, 1).Value = "Jane Wanjiru";
            ws.Cell(2, 2).Value = "MUST/PG/001/2023";
            ws.Cell(2, 3).Value = "jane@example.com";
            ws.Cell(2, 4).Value = "+254712345678";
            ws.Cell(2, 5).Value = "Main Campus (Nchiru)";
            ws.Cell(2, 6).Value = "sci";
            ws.Cell(2, 7).Value = "cs";
            ws.Cell(2, 8).Value = "Bachelor of Science (Computer Science)";
            ws.Cell(2, 9).Value = "2023";
            ws.Cell(2, 10).Value = "Employed (Full-time)";
            ws.Cell(2, 11).Value = "Safaricom PLC";
            ws.Cell(2, 12).Value = "Software Engineer";
            ws.Cell(2, 13).Value = "ICT";
            ws.Cell(2, 14).Value = "Nairobi";
            ws.Cell(2, 15).Value = "1 – 3 months";
            ws.Cell(2, 16).Value = "https://linkedin.com/in/jane";
        });

        var (rows, _) = ExcelGraduateParser.Parse(stream);
        var r = rows![0];
        Assert.Equal("Jane Wanjiru", r.FullName);
        Assert.Equal("MUST/PG/001/2023", r.StudentNumber);
        Assert.Equal("jane@example.com", r.Email);
        Assert.Equal("+254712345678", r.Phone);
        Assert.Equal("Main Campus (Nchiru)", r.Campus);
        Assert.Equal("sci", r.School);
        Assert.Equal("cs", r.Department);
        Assert.Equal("Bachelor of Science (Computer Science)", r.Programme);
        Assert.Equal("2023", r.GraduationYear);
        Assert.Equal("Employed (Full-time)", r.EmploymentStatus);
        Assert.Equal("Safaricom PLC", r.EmployerName);
        Assert.Equal("Software Engineer", r.JobTitle);
        Assert.Equal("ICT", r.Sector);
        Assert.Equal("Nairobi", r.EmploymentCounty);
        Assert.Equal("1 \u2013 3 months", r.MonthsToEmploy);
        Assert.Equal("https://linkedin.com/in/jane", r.LinkedinUrl);
    }
}
