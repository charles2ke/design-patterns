
using System.Collections.Generic;

namespace DesignPatterns.Catalog;

public static class PatternCategory
{
    public const string Creational = "Creational";
    public const string Structural = "Structural";
    public const string Behavioral = "Behavioral";

    public static readonly IReadOnlyList<string> All = new[]
    {
        Creational,
        Structural,
        Behavioral,
    };
}
