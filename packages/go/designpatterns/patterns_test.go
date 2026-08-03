package designpatterns

import "testing"

func TestPatterns(t *testing.T) {
	if len(Patterns) != 23 {
		t.Fatalf("expected 23 patterns, got %d", len(Patterns))
	}
}

func TestFilterPatterns(t *testing.T) {
	filtered := FilterPatterns(Patterns, "global access", "Creational")
	if len(filtered) != 1 || filtered[0].Slug != "singleton" {
		t.Fatalf("unexpected filter result: %#v", filtered)
	}
}

func TestMatchesQuery(t *testing.T) {
	if !MatchesQuery(Patterns[18], "PUB/SUB") {
		t.Fatal("expected observer pattern to match pub/sub query")
	}
}

func TestCountByCategory(t *testing.T) {
	counts := CountByCategory(Patterns)
	if counts["Creational"] != 5 || counts["Structural"] != 7 || counts["Behavioral"] != 11 {
		t.Fatalf("unexpected counts: %#v", counts)
	}
}
