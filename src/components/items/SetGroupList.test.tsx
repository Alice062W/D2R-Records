import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import SetGroupList from './SetGroupList';
import messages from '../../../messages/en.json';

describe('SetGroupList', () => {
  it('renders one link per set group with the correct href', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SetGroupList
          groups={[{ slug: 'aldurs-watchtower', name: "Aldur's Watchtower", repInvFile: 'invskul', pieceIds: ['set-1', 'set-2'] }]}
          basePath="/en/items/set"
        />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('link', { name: "Aldur's Watchtower" })).toHaveAttribute(
      'href',
      '/en/items/set/aldurs-watchtower'
    );
  });

  it('renders the representative icon when repInvFile is present', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SetGroupList groups={[{ slug: 'aldurs-watchtower', name: "Aldur's Watchtower", repInvFile: 'invskul', pieceIds: ['set-1', 'set-2'] }]} basePath="/en/items/set" />
      </NextIntlClientProvider>
    );
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.src).toContain('/items/inv/invskul.png');
  });

  it('renders no icon when repInvFile is empty', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SetGroupList groups={[{ slug: 'x', name: 'X', repInvFile: '', pieceIds: [] }]} basePath="/en/items/set" />
      </NextIntlClientProvider>
    );
    expect(container.querySelector('img')).toBeNull();
  });

  it('shows no badge and no highlight when signed out', () => {
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({ userId: null, loading: false, ownedIds: new Set(), toggle: vi.fn(), error: null }),
    }));
    vi.resetModules();
    return import('./SetGroupList').then(({ default: SetGroupListMocked }) => {
      render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <SetGroupListMocked
            groups={[{ slug: 'a', name: 'A', repInvFile: '', pieceIds: ['set-1', 'set-2'] }]}
            basePath="/en/items/set"
          />
        </NextIntlClientProvider>
      );
      expect(screen.queryByText(/\d\/\d/)).not.toBeInTheDocument();
      expect(screen.getByRole('link')).toHaveClass('bg-panel');
    });
  });

  it('shows a partial x/y badge (no highlight) when some but not all pieces are owned', async () => {
    vi.resetModules();
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({
        userId: 'user-1', loading: false, ownedIds: new Set(['set-1']), toggle: vi.fn(), error: null,
      }),
    }));
    const { default: SetGroupListMocked } = await import('./SetGroupList');
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SetGroupListMocked
          groups={[{ slug: 'a', name: 'A', repInvFile: '', pieceIds: ['set-1', 'set-2'] }]}
          basePath="/en/items/set"
        />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('1/2 (50%)')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveClass('bg-panel');
  });

  it('shows the complete badge and highlight when every piece is owned', async () => {
    vi.resetModules();
    vi.doMock('@/lib/grail/useOwnedItems', () => ({
      useOwnedItems: () => ({
        userId: 'user-1', loading: false, ownedIds: new Set(['set-1', 'set-2']), toggle: vi.fn(), error: null,
      }),
    }));
    const { default: SetGroupListMocked } = await import('./SetGroupList');
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SetGroupListMocked
          groups={[{ slug: 'a', name: 'A', repInvFile: '', pieceIds: ['set-1', 'set-2'] }]}
          basePath="/en/items/set"
        />
      </NextIntlClientProvider>
    );
    expect(screen.getByText(/Complete!/)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveClass('bg-green-950/30');
  });
});
