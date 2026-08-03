package designpatterns

import "strings"

func MatchesQuery(pattern Pattern, query string) bool {
	needle := strings.ToLower(strings.TrimSpace(query))
	if needle == "" {
		return true
	}

	fields := []string{pattern.Name, pattern.Intent, pattern.UseWhen, pattern.Category}
	for _, field := range fields {
		if strings.Contains(strings.ToLower(field), needle) {
			return true
		}
	}

	return false
}

func FilterPatterns(patterns []Pattern, query string, category string) []Pattern {
	filtered := make([]Pattern, 0)
	for _, pattern := range patterns {
		if (category == "All" || strings.EqualFold(pattern.Category, category)) && MatchesQuery(pattern, query) {
			filtered = append(filtered, pattern)
		}
	}
	return filtered
}

func CountByCategory(patterns []Pattern) map[string]int {
	counts := map[string]int{
		"Creational": 0,
		"Structural": 0,
		"Behavioral": 0,
	}
	for _, pattern := range patterns {
		counts[pattern.Category]++
	}
	return counts
}
