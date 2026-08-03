
from design_patterns_catalog import count_by_category, filter_patterns, matches_query, patterns


def test_exports_all_patterns() -> None:
    assert len(patterns) == 23


def test_filter_patterns_by_query_and_category() -> None:
    result = filter_patterns(patterns, 'global access', 'Creational')
    assert [pattern.slug for pattern in result] == ['singleton']


def test_matches_query_is_case_insensitive() -> None:
    assert matches_query(patterns[18], 'PUB/SUB') is True


def test_count_by_category() -> None:
    assert count_by_category(patterns) == {
        'Creational': 5,
        'Structural': 7,
        'Behavioral': 11,
    }
