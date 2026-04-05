using ClosedXML.Excel;

namespace Api.Graduates;

public static class ExcelGraduateParser
{
    private static readonly string[] RequiredColumns =
    [
        "full_name", "campus", "school", "department",
        "programme", "graduation_year", "employment_status",
    ];

    public static (IReadOnlyList<GraduatePayloadDto>? rows, string? error) Parse(Stream stream)
    {
        using var wb = new XLWorkbook(stream);
        var ws = wb.Worksheets.First();

        var headerRow = ws.Row(1);
        var headers = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var cell in headerRow.CellsUsed())
        {
            var key = cell.GetString().Trim().ToLowerInvariant().Replace(" ", "_");
            headers[key] = cell.Address.ColumnNumber;
        }

        var missing = RequiredColumns.Where(c => !headers.ContainsKey(c)).ToList();
        if (missing.Count > 0)
            return (null, $"Missing required columns: {string.Join(", ", missing)}");

        string Get(IXLRow row, string col) =>
            headers.TryGetValue(col, out var idx) ? row.Cell(idx).GetString().Trim() : "";

        var payloads = new List<GraduatePayloadDto>();
        var lastRow = ws.LastRowUsed()?.RowNumber() ?? 1;

        for (var i = 2; i <= lastRow; i++)
        {
            var row = ws.Row(i);
            var fullName = Get(row, "full_name");
            if (string.IsNullOrWhiteSpace(fullName)) continue;

            payloads.Add(new GraduatePayloadDto
            {
                FullName          = fullName,
                StudentNumber     = NullIfEmpty(Get(row, "student_number")),
                Email             = NullIfEmpty(Get(row, "email")),
                Phone             = NullIfEmpty(Get(row, "phone")),
                Campus            = Get(row, "campus"),
                School            = Get(row, "school"),
                Department        = Get(row, "department"),
                Programme         = Get(row, "programme"),
                GraduationYear    = Get(row, "graduation_year"),
                EmploymentStatus  = Get(row, "employment_status"),
                EmployerName      = NullIfEmpty(Get(row, "employer_name")),
                JobTitle          = NullIfEmpty(Get(row, "job_title")),
                Sector            = NullIfEmpty(Get(row, "sector")),
                EmploymentCounty  = NullIfEmpty(Get(row, "employment_county")),
                MonthsToEmploy    = NullIfEmpty(Get(row, "months_to_employ")),
                LinkedinUrl       = NullIfEmpty(Get(row, "linkedin_url")),
            });
        }

        if (payloads.Count == 0)
            return (null, "No valid data rows found in the file.");

        return (payloads, null);
    }

    private static string? NullIfEmpty(string s) =>
        string.IsNullOrWhiteSpace(s) ? null : s;
}
