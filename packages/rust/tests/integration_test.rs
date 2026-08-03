
use design_patterns_catalog::{count_by_category, filter_patterns, matches_query, PATTERNS};

#[test]
fn exports_all_patterns() {
    assert_eq!(PATTERNS.len(), 23);
}

#[test]
fn filters_by_query_and_category() {
    let filtered = filter_patterns(PATTERNS, "global access", "Creational");
    assert_eq!(filtered.len(), 1);
    assert_eq!(filtered[0].slug, "singleton");
}

#[test]
fn matches_query_case_insensitively() {
    assert!(matches_query(&PATTERNS[18], "PUB/SUB"));
}

#[test]
fn counts_by_category() {
    let counts = count_by_category(PATTERNS);
    assert_eq!(counts.get("Creational"), Some(&5));
    assert_eq!(counts.get("Structural"), Some(&7));
    assert_eq!(counts.get("Behavioral"), Some(&11));
}
