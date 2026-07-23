import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../../messages/en.json';

const mockUseGrailAuth = vi.fn();
vi.mock('@/lib/grail/useGrailAuth', () => ({
  useGrailAuth: () => mockUseGrailAuth(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
}));

const mockSave = vi.fn();
const mockUseProfile = vi.fn();
vi.mock('@/lib/grail/useProfile', () => ({ useProfile: () => mockUseProfile() }));

const mockUseOwnedItems = vi.fn();
vi.mock('@/lib/grail/useOwnedItems', () => ({ useOwnedItems: () => mockUseOwnedItems() }));

function renderWithIntl(ui: React.ReactElement) {
  return render(<NextIntlClientProvider locale="en" messages={messages}>{ui}</NextIntlClientProvider>);
}

describe('ProfileContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGrailAuth.mockReturnValue({
      userId: 'user-1',
      user: { email: 'jane@example.com', user_metadata: { full_name: 'Jane Doe' } },
      loading: false,
    });
    mockSave.mockResolvedValue(undefined);
    mockUseProfile.mockReturnValue({
      profile: { battletag: null, avatarChoice: null, server: null, gameMode: null, platform: null, seasonal: null },
      save: mockSave,
      error: null,
    });
    mockUseOwnedItems.mockReturnValue({ ownedIds: new Set(), loading: false });
  });

  it('renders Server, Mode, Platform, and Seasonal choice groups with the expected options', async () => {
    const { default: ProfileContent } = await import('./ProfileContent');
    renderWithIntl(<ProfileContent />);

    expect(screen.getByText('D2R Server')).toBeInTheDocument();
    for (const label of ['US', 'Europe', 'Asia', 'China']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }

    expect(screen.getByText('Mode')).toBeInTheDocument();
    for (const label of ['Hardcore', 'Softcore']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }

    expect(screen.getByText('Platform')).toBeInTheDocument();
    for (const label of ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }

    expect(screen.getByText('Seasonal')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
  });

  it('marks the currently-selected option as pressed for each group', async () => {
    mockUseProfile.mockReturnValue({
      profile: { battletag: null, avatarChoice: null, server: 'europe', gameMode: 'hardcore', platform: 'ns', seasonal: true },
      save: mockSave,
      error: null,
    });
    const { default: ProfileContent } = await import('./ProfileContent');
    renderWithIntl(<ProfileContent />);

    expect(screen.getByRole('button', { name: 'Europe' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'US' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Hardcore' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Nintendo Switch' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Yes' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'No' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('clicking a pill saves that field immediately, without touching the others', async () => {
    const { default: ProfileContent } = await import('./ProfileContent');
    renderWithIntl(<ProfileContent />);

    fireEvent.click(screen.getByRole('button', { name: 'Asia' }));
    expect(mockSave).toHaveBeenCalledWith({ server: 'asia' });

    fireEvent.click(screen.getByRole('button', { name: 'Softcore' }));
    expect(mockSave).toHaveBeenCalledWith({ gameMode: 'softcore' });

    fireEvent.click(screen.getByRole('button', { name: 'Xbox' }));
    expect(mockSave).toHaveBeenCalledWith({ platform: 'xbox' });

    fireEvent.click(screen.getByRole('button', { name: 'No' }));
    expect(mockSave).toHaveBeenCalledWith({ seasonal: false });
  });
});
