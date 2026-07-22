import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfileAvatar from './ProfileAvatar';

describe('ProfileAvatar', () => {
  it('renders the chosen emoji avatar when avatarChoice is set, even if a photo is also available', () => {
    const { container } = render(
      <ProfileAvatar avatarChoice="⚔️" photoUrl="https://example.com/photo.jpg" name="Jane Doe" />
    );
    expect(screen.getByText('⚔️')).toBeInTheDocument();
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it('renders the Google photo when no avatarChoice is set', () => {
    const { container } = render(<ProfileAvatar photoUrl="https://example.com/photo.jpg" name="Jane Doe" />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('falls back to initials from the name when no avatarChoice or photo is available', () => {
    render(<ProfileAvatar name="Jane Doe" email="jane@example.com" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('falls back to initials from the email when no name is available', () => {
    render(<ProfileAvatar email="jane@example.com" />);
    expect(screen.getByText('JA')).toBeInTheDocument();
  });

  it('falls back to "?" when neither name, email, photo, nor avatarChoice is available', () => {
    render(<ProfileAvatar />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });
});
