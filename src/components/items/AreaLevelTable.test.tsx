import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import AreaLevelTable from './AreaLevelTable';
import messages from '../../../messages/en.json';

describe('AreaLevelTable', () => {
  it('renders one row per area with normal/nightmare/hell levels', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AreaLevelTable
          areas={[{ id: 5, name: { en: 'Dark Wood', 'zh-TW': '黑森林', 'zh-CN': '黑森林' }, act: 0, normal: 5, nightmare: 38, hell: 68 }]}
        />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Dark Wood')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('38')).toBeInTheDocument();
    expect(screen.getByText('68')).toBeInTheDocument();
  });
});
