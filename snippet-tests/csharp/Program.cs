using Snippets.TemplateMethod;

const string TwoValidRows = "2 rows [ada\t42 | cy\t7]";
var failures = 0;

Check("CSV import treats CRLF like LF",
    ImportAndDescribe(new RecordingCsvImporter(), "ada,42\r\nbob,\r\ncy,7"), TwoValidRows);
Check("TSV import treats CRLF like LF",
    ImportAndDescribe(new RecordingTsvImporter(), "ada\t42\r\nbob\t\r\ncy\t7"), TwoValidRows);
Check("CSV import rejects whitespace-only cells",
    ImportAndDescribe(new RecordingCsvImporter(), "ada,42\nbob, \ncy,7"), TwoValidRows);

return failures == 0 ? 0 : 1;

void Check(string description, string actual, string expected)
{
    var passed = actual == expected;
    Console.WriteLine(passed
        ? $"PASS {description}"
        : $"FAIL {description}: got {Escape(actual)}, want {Escape(expected)}");
    if (!passed) failures++;
}

static string ImportAndDescribe(IRecordingImporter importer, string raw)
{
    var count = importer.Import(raw);
    return $"{count} rows [{string.Join(" | ", importer.Saved.Select(row => string.Join("\t", row)))}]";
}

static string Escape(string text) => text.Replace("\r", "\\r").Replace("\t", "\\t");

interface IRecordingImporter
{
    List<string[]> Saved { get; }
    int Import(string raw);
}

sealed class RecordingCsvImporter : CsvImporter, IRecordingImporter
{
    public List<string[]> Saved { get; private set; } = new();
    protected override void Save(List<string[]> rows) => Saved = rows;
}

sealed class RecordingTsvImporter : TsvImporter, IRecordingImporter
{
    public List<string[]> Saved { get; private set; } = new();
    protected override void Save(List<string[]> rows) => Saved = rows;
}
