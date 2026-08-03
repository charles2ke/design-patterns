
namespace DesignPatterns.Catalog;

public class Pattern
{
    public Pattern(int id, string slug, string name, string category, string intent, string useWhen)
    {
        Id = id;
        Slug = slug;
        Name = name;
        Category = category;
        Intent = intent;
        UseWhen = useWhen;
    }

    public int Id { get; }
    public string Slug { get; }
    public string Name { get; }
    public string Category { get; }
    public string Intent { get; }
    public string UseWhen { get; }
}
