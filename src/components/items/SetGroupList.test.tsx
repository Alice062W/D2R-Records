import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import SetGroupList from './SetGroupList';
import messages from '../../../messages/en.json';

describe('SetGroupList', () => {
  it('renders one link per set group with the correct href', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SetGroupList
          groups={[{ slug: 'aldurs-watchtower', name: "Aldur's Watchtower" }]}
          basePath="/en/items/set"
        />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('link', { name: "Aldur's Watchtower" })).toHaveAttribute(
      'href',
      '/en/items/set/aldurs-watchtower'
    );
  });
});
