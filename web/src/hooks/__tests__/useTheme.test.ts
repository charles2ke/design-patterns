import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { initialTheme, THEME_STORAGE_KEY, useTheme } from '../useTheme';

function mockPrefersLight(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches })),
  );
}

describe('useTheme', () => {
  it('defaults to dark when the OS has no light preference', () => {
    mockPrefersLight(false);

    expect(initialTheme()).toBe('dark');

    vi.unstubAllGlobals();
  });

  it('defaults to light when the OS prefers light', () => {
    mockPrefersLight(true);

    expect(initialTheme()).toBe('light');

    vi.unstubAllGlobals();
  });

  it('prefers a stored choice over the OS preference', () => {
    mockPrefersLight(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    expect(initialTheme()).toBe('dark');

    vi.unstubAllGlobals();
  });

  it('falls back to dark when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined);

    expect(initialTheme()).toBe('dark');

    vi.unstubAllGlobals();
  });

  it('ignores unreadable storage', () => {
    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('denied');
      });

    expect(initialTheme()).toBe('dark');

    getItem.mockRestore();
  });

  it('toggles the theme, persisting it and reflecting it on the document', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');

    act(() => result.current.toggleTheme());

    expect(result.current.theme).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');

    act(() => result.current.toggleTheme());

    expect(result.current.theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('still applies the theme when storage writes fail', () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('denied');
      });
    const { result } = renderHook(() => useTheme());

    act(() => result.current.toggleTheme());

    expect(result.current.theme).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');

    setItem.mockRestore();
  });
});
