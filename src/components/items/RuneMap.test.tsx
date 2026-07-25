import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RuneMap from './RuneMap';
import runes from '../../../data/runes.json';

describe('RuneMap', () => {
  it('renders all 33 runes as links', () => {
    render(<RuneMap runes={runes} locale="en" />);
    expect(screen.getByText('El')).toBeInTheDocument();
    expect(screen.getByText('Zod')).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(33);
  });

  it('each rune link points to its matching id anchor in the list below (e.g. #rune-r01 for El)', () => {
    render(<RuneMap runes={runes} locale="en" />);
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '#rune-r01'); // El
    expect(links[32]).toHaveAttribute('href', '#rune-r33'); // Zod
  });

  it('renders the icon when the rune has an invFile', () => {
    const rune = runes[0]; // El rune
    const { container } = render(<RuneMap runes={[rune]} locale="en" />);
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.src).toContain('/items/inv/invrEl.png');
  });

  it('highlights an owned rune tile', async () => {
    vi.resetModules();
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({
        userId: 'user-1', loading: false, ownedIds: new Set([runes[0].id]), toggle: vi.fn(), error: null,
      }),
    }));
    const { default: RuneMap } = await import('./RuneMap');
    render(<RuneMap runes={[runes[0]]} locale="en" />);
    expect(screen.getByRole('link')).toHaveClass('bg-green-950/30');
  });

  it('does not highlight a non-owned rune tile', async () => {
    vi.resetModules();
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({ userId: 'user-1', loading: false, ownedIds: new Set(), toggle: vi.fn(), error: null }),
    }));
    const { default: RuneMap } = await import('./RuneMap');
    render(<RuneMap runes={[runes[0]]} locale="en" />);
    expect(screen.getByRole('link')).toHaveClass('bg-panel-alt');
  });
});
