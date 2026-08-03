import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchBar } from '../SearchBar';

describe('SearchBar', () => {
  it('renders the current value with an accessible label', () => {
    render(<SearchBar value="proxy" onChange={vi.fn()} />);

    expect(screen.getByLabelText('Search patterns')).toHaveValue('proxy');
  });

  it('emits every typed character', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar value="" onChange={onChange} />);

    await user.type(screen.getByLabelText('Search patterns'), 'ab');

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenNthCalledWith(1, 'a');
    expect(onChange).toHaveBeenNthCalledWith(2, 'b');
  });
});
