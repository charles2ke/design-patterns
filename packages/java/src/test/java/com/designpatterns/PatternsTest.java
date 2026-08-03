
package com.designpatterns;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class PatternsTest {
    @Test
    void exportsAllPatterns() {
        assertEquals(23, Patterns.ALL.size());
    }

    @Test
    void filtersByQueryAndCategory() {
        List<Pattern> filtered = PatternFilter.filterPatterns(Patterns.ALL, "global access", "Creational");
        assertEquals(1, filtered.size());
        assertEquals("singleton", filtered.get(0).getSlug());
    }

    @Test
    void matchesQueryCaseInsensitively() {
        assertTrue(PatternFilter.matchesQuery(Patterns.ALL.get(18), "PUB/SUB"));
    }

    @Test
    void countsByCategory() {
        Map<String, Integer> counts = PatternFilter.countByCategory(Patterns.ALL);
        assertEquals(5, counts.get("Creational"));
        assertEquals(7, counts.get("Structural"));
        assertEquals(11, counts.get("Behavioral"));
    }
}
