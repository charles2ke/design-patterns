
package com.designpatterns;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public final class PatternFilter {
    private PatternFilter() {
    }

    public static List<Pattern> filterPatterns(List<Pattern> patterns, String query, String category) {
        List<Pattern> filtered = new ArrayList<>();
        for (Pattern pattern : patterns) {
            if (("All".equalsIgnoreCase(category) || pattern.getCategory().equalsIgnoreCase(category))
                    && matchesQuery(pattern, query)) {
                filtered.add(pattern);
            }
        }
        return filtered;
    }

    public static boolean matchesQuery(Pattern pattern, String query) {
        String needle = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        if (needle.isEmpty()) {
            return true;
        }

        return pattern.getName().toLowerCase(Locale.ROOT).contains(needle)
                || pattern.getIntent().toLowerCase(Locale.ROOT).contains(needle)
                || pattern.getUseWhen().toLowerCase(Locale.ROOT).contains(needle)
                || pattern.getCategory().toLowerCase(Locale.ROOT).contains(needle);
    }

    public static Map<String, Integer> countByCategory(List<Pattern> patterns) {
        Map<String, Integer> counts = new LinkedHashMap<>();
        counts.put(PatternCategory.CREATIONAL.value(), 0);
        counts.put(PatternCategory.STRUCTURAL.value(), 0);
        counts.put(PatternCategory.BEHAVIORAL.value(), 0);

        for (Pattern pattern : patterns) {
            counts.computeIfPresent(pattern.getCategory(), (key, value) -> value + 1);
        }

        return counts;
    }
}
