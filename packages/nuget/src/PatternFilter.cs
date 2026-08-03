
using System;
using System.Collections.Generic;
using System.Linq;

namespace DesignPatterns.Catalog;

public static class PatternFilter
{
    public static IReadOnlyList<Pattern> FilterPatterns(IEnumerable<Pattern> source, string query, string category)
    {
        return source.Where(pattern =>
                (string.Equals(category, "All", StringComparison.OrdinalIgnoreCase) || string.Equals(pattern.Category, category, StringComparison.OrdinalIgnoreCase)) &&
                MatchesQuery(pattern, query))
            .ToList();
    }

    public static bool MatchesQuery(Pattern pattern, string query)
    {
        var needle = (query ?? string.Empty).Trim();
        if (needle.Length == 0)
        {
            return true;
        }

        return pattern.Name.IndexOf(needle, StringComparison.OrdinalIgnoreCase) >= 0 ||
               pattern.Intent.IndexOf(needle, StringComparison.OrdinalIgnoreCase) >= 0 ||
               pattern.UseWhen.IndexOf(needle, StringComparison.OrdinalIgnoreCase) >= 0 ||
               pattern.Category.IndexOf(needle, StringComparison.OrdinalIgnoreCase) >= 0;
    }

    public static IReadOnlyDictionary<string, int> CountByCategory(IEnumerable<Pattern> source)
    {
        var counts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
        {
            [PatternCategory.Creational] = 0,
            [PatternCategory.Structural] = 0,
            [PatternCategory.Behavioral] = 0,
        };

        foreach (var pattern in source)
        {
            counts[pattern.Category]++;
        }

        return counts;
    }
}
