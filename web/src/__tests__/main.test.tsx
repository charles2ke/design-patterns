import { afterEach, describe, expect, it, vi } from 'vitest';

const render = vi.fn();
const createRoot = vi.fn(() => ({ render, unmount: vi.fn() }));

vi.mock('react-dom/client', () => ({
  createRoot,
  default: { createRoot },
}));

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  document.body.innerHTML = '';
});

describe('main entry point', () => {
  it('mounts the app into the #root container', async () => {
    const container = document.createElement('div');
    container.id = 'root';
    document.body.appendChild(container);

    await import('../main');

    expect(createRoot).toHaveBeenCalledWith(container);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it('throws when the root container is missing', async () => {
    await expect(import('../main')).rejects.toThrow(
      'Root container #root was not found in the document.',
    );
    expect(createRoot).not.toHaveBeenCalled();
  });
});
