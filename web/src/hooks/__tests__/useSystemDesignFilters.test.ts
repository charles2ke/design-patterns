import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { urlShortener } from '../../data/system-design/url-shortener';
import type { SystemDesignQuestion } from '../../types/system-design';
import { useSystemDesignFilters } from '../useSystemDesignFilters';

const source: SystemDesignQuestion[] = [
  urlShortener,
  { ...urlShortener, slug: 'hard-openai', difficulty: 'Hard', companies: ['OpenAI'] },
];

describe('useSystemDesignFilters', () => {
  it('restores valid filters from the URL hash and ignores unknown ones', () => {
    window.history.replaceState(null, '', '#/system-design?difficulty=Hard&company=Initech');

    const { result } = renderHook(() => useSystemDesignFilters(source));

    expect(result.current.difficulty).toBe('Hard');
    expect(result.current.company).toBe('All');
    expect(result.current.visibleQuestions.map(({ slug }) => slug)).toEqual(['hard-openai']);
  });

  it('mirrors the active filters in the URL hash', () => {
    const { result } = renderHook(() => useSystemDesignFilters(source));

    act(() => {
      result.current.setDifficulty('Hard');
      result.current.setCompany('OpenAI');
    });

    expect(window.location.hash).toBe('#/system-design?difficulty=Hard&company=OpenAI');

    act(() => {
      result.current.reset();
    });

    expect(window.location.hash).toBe('#/system-design');
    expect(result.current.visibleQuestions).toHaveLength(2);
  });

  it('follows filter hash changes but ignores hashes for other pages', () => {
    const { result } = renderHook(() => useSystemDesignFilters(source));

    act(() => {
      window.history.replaceState(null, '', '#/system-design?company=OpenAI');
      window.dispatchEvent(new Event('hashchange'));
    });

    expect(result.current.company).toBe('OpenAI');

    act(() => {
      window.history.replaceState(null, '', '#/interview-questions');
      window.dispatchEvent(new Event('hashchange'));
    });

    expect(result.current.company).toBe('OpenAI');
  });
});
