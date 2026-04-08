using ClosedXML.Excel;

namespace Api.Graduates;

public static class ExcelGraduateParser
{
    public static (IReadOnlyList<GraduatePayloadDto>? rows, string? error) Parse(Stream stream)
    {
        using var wb = new XLWorkbook(stream);
        var ws = wb.Worksheets.First();

        // Build header map — normalise to snake_case, tolerate spaces/caps
        var headers = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var cell in ws.Row(1).CellsUsed())
        {
            var key = cell.GetString().Trim().ToLowerInvariant()
                .Replace(" ", "_").Replace("-", "_");
            headers[key] = cell.Address.ColumnNumber;
        }

        if (!headers.ContainsKey("full_name") && !headers.ContainsKey("name"))
            return (null, "The file must have at least a 'full_name' (or 'name') column.");

        // Accept both 'full_name' and 'name'
        if (!headers.ContainsKey("full_name") && headers.ContainsKey("name"))
            headers["full_name"] = headers["name"];

        string Get(IXLRow row, params string[] keys)
        {
            foreach (var key in keys)
                if (headers.TryGetValue(key, out var idx))
                    return row.Cell(idx).GetString().Trim();
            return "";
        }

        var payloads = new List<GraduatePayloadDto>();
        var lastRow = ws.LastRowUsed()?.RowNumber() ?? 1;

        for (var i = 2; i <= lastRow; i++)
        {
            var row = ws.Row(i);
            var fullName = Get(row, "full_name");
            if (string.IsNullOrWhiteSpace(fullName)) continue;

            payloads.Add(new GraduatePayloadDto
            {
                FullName         = fullName,
                StudentNumber    = NullIfEmpty(Get(row, "student_number", "student_no", "reg_no")),
                Email            = NullIfEmpty(Get(row, "email", "email_address")),
                Phone            = NullIfEmpty(Get(row, "phone", "phone_number", "mobile")),
                Campus           = NullIfEmpty(Get(row, "campus")),
                School           = NullIfEmpty(Get(row, "school", "school_name", "faculty")),
                Department       = NullIfEmpty(Get(row, "department", "department_name", "dept")),
                Programme        = NullIfEmpty(Get(row, "programme", "program", "course", "programme_name")),
                GraduationYear   = NullIfEmpty(Get(row, "graduation_year", "grad_year", "year")),
                EmploymentStatus = NullIfEmpty(Get(row, "employment_status", "status", "employment")),
                EmployerName     = NullIfEmpty(Get(row, "employer_name", "employer")),
                JobTitle         = NullIfEmpty(Get(row, "job_title", "title", "position")),
                Sector           = NullIfEmpty(Get(row, "sector", "industry")),
                EmploymentCounty = NullIfEmpty(Get(row, "employment_county", "county", "location")),
                MonthsToEmploy   = NullIfEmpty(Get(row, "months_to_employ", "months_to_employment", "months")),
                LinkedinUrl      = NullIfEmpty(Get(row, "linkedin_url", "linkedin")),
            });
        }

        if (payloads.Count == 0)
            return (null, "No valid data rows found in the file.");

        return (payloads, null);
    }

    private static string? NullIfEmpty(string s) =>
        string.IsNullOrWhiteSpace(s) ? null : s;
}
