import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePatternFilter } from '../usePatternFilter';
import { patterns } from '../../data/patterns';

describe('usePatternFilter', () => {
  it('restores filters from the URL hash', () => {
    window.history.replaceState(null, '', '#/?q=proxy&category=Structural');

    const { result } = renderHook(() => usePatternFilter(patterns));

    expect(result.current.query).toBe('proxy');
    expect(result.current.category).toBe('Structural');
    expect(result.current.visiblePatterns.map((p) => p.slug)).toEqual([
      'proxy',
    ]);
  });

  it('ignores unknown categories in the hash', () => {
    window.history.replaceState(null, '', '#/?category=Imaginary');

    const { result } = renderHook(() => usePatternFilter(patterns));

    expect(result.current.category).toBe('All');
  });

  it('mirrors the active filters in the URL hash', () => {
    const { result } = renderHook(() => usePatternFilter(patterns));

    act(() => {
      result.current.setQuery('proxy');
    });
    act(() => {
      result.current.setCategory('Structural');
    });

    expect(window.location.hash).toBe('#/?q=proxy&category=Structural');

    act(() => {
      result.current.reset();
    });

    expect(window.location.hash).toBe('#/');
  });

  it('follows hash changes made outside the hook', () => {
    const { result } = renderHook(() => usePatternFilter(patterns));

    act(() => {
      window.history.replaceState(null, '', '#/?q=builder');
      window.dispatchEvent(new Event('hashchange'));
    });

    expect(result.current.query).toBe('builder');
  });

  it('starts with no query and the "All" category', () => {
    const { result } = renderHook(() => usePatternFilter(patterns));

    expect(result.current.query).toBe('');
    expect(result.current.category).toBe('All');
    expect(result.current.visiblePatterns).toHaveLength(23);
  });

  it('narrows results when the query changes', () => {
    const { result } = renderHook(() => usePatternFilter(patterns));

    act(() => {
      result.current.setQuery('builder');
    });

    expect(result.current.visiblePatterns.map((p) => p.slug)).toEqual([
      'builder',
    ]);
  });

  it('narrows results when the category changes', () => {
    const { result } = renderHook(() => usePatternFilter(patterns));

    act(() => {
      result.current.setCategory('Creational');
    });

    expect(result.current.visiblePatterns).toHaveLength(5);
  });

  it('resets query and category', () => {
    const { result } = renderHook(() => usePatternFilter(patterns));

    act(() => {
      result.current.setQuery('proxy');
      result.current.setCategory('Structural');
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.query).toBe('');
    expect(result.current.category).toBe('All');
    expect(result.current.visiblePatterns).toHaveLength(23);
  });
});
