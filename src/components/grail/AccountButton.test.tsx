import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../../messages/en.json';

const mockUseGrailAuth = vi.fn();
vi.mock('@/lib/grail/useGrailAuth', () => ({
  useGrailAuth: () => mockUseGrailAuth(),
  signInWithGoogle: vi.fn(),
}));

const mockUseProfile = vi.fn();
vi.mock('@/lib/grail/useProfile', () => ({ useProfile: () => mockUseProfile() }));

function renderWithIntl(ui: React.ReactElement) {
  return render(<NextIntlClientProvider locale="en" messages={messages}>{ui}</NextIntlClientProvider>);
}

describe('AccountButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProfile.mockReturnValue({ profile: null });
  });

  it('renders nothing visible while auth is loading', async () => {
    mockUseGrailAuth.mockReturnValue({ userId: null, user: null, loading: true });
    const { default: AccountButton } = await import('./AccountButton');
    renderWithIntl(<AccountButton />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows a Login button when signed out', async () => {
    mockUseGrailAuth.mockReturnValue({ userId: null, user: null, loading: false });
    const { default: AccountButton } = await import('./AccountButton');
    renderWithIntl(<AccountButton />);
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('shows an avatar link to /profile when signed in', async () => {
    mockUseGrailAuth.mockReturnValue({
      userId: 'user-1',
      user: { email: 'jane@example.com', user_metadata: { full_name: 'Jane Doe' } },
      loading: false,
    });
    const { default: AccountButton } = await import('./AccountButton');
    renderWithIntl(<AccountButton />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/en/profile');
    expect(screen.getByText('JD')).toBeInTheDocument(); // initials fallback (no photo/avatarChoice)
  });
});
