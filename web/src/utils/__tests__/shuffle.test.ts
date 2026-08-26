import { afterEach, describe, expect, it, vi } from 'vitest';
import { shuffle } from '../shuffle';

describe('shuffle', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps every item exactly once', () => {
    const source = [1, 2, 3, 4, 5];

    expect([...shuffle(source)].sort()).toEqual(source);
  });

  it('does not mutate the source array', () => {
    const source = ['a', 'b', 'c'];
    shuffle(source);

    expect(source).toEqual(['a', 'b', 'c']);
  });

  it('reorders items based on the random source', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    expect(shuffle(['a', 'b', 'c'])).toEqual(['b', 'c', 'a']);
  });

  it('returns an empty array for an empty source', () => {
    expect(shuffle([])).toEqual([]);
  });
});
