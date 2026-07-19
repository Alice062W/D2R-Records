import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import Alvl85AreaList from './Alvl85AreaList';
import messages from '../../../messages/en.json';
import type { Alvl85Area } from '@/lib/grail/alvl85Areas';

describe('Alvl85AreaList', () => {
  it('renders area name, monster name/type, and starred immunity', () => {
    const areas: Alvl85Area[] = [{
      areaName: { en: 'Ruined Temple', 'zh-TW': 'x', 'zh-CN': 'x' },
      monsters: [{ name: { en: 'Night Lord', 'zh-TW': 'x', 'zh-CN': 'x' }, type: 'undead', immunities: [{ element: 'cold', value: 120, starred: true }] }],
    }];
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Alvl85AreaList areas={areas} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Ruined Temple')).toBeInTheDocument();
    expect(screen.getByText('Night Lord')).toBeInTheDocument();
    expect(screen.getByText('Undead')).toBeInTheDocument();
    expect(screen.getByText(/Co 120/)).toBeInTheDocument();
    expect(screen.getAllByText(/★/)).toHaveLength(2);
  });

  it('renders a monster with no immunities without error', () => {
    const areas: Alvl85Area[] = [{
      areaName: { en: 'The Worldstone Chamber', 'zh-TW': 'x', 'zh-CN': 'x' },
      monsters: [],
    }];
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Alvl85AreaList areas={areas} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('The Worldstone Chamber')).toBeInTheDocument();
  });

  it('renders localized area and monster names for zh-TW', () => {
    const areas: Alvl85Area[] = [{
      areaName: { en: 'Mausoleum', 'zh-TW': '大陵墓', 'zh-CN': '大陵墓' },
      monsters: [{ name: { en: 'Skeleton', 'zh-TW': '骷髏', 'zh-CN': '骷髅' }, type: 'undead', immunities: [] }],
    }];
    render(
      <NextIntlClientProvider locale="zh-TW" messages={messages}>
        <Alvl85AreaList areas={areas} />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('大陵墓')).toBeInTheDocument();
    expect(screen.getByText('骷髏')).toBeInTheDocument();
    expect(screen.queryByText('Mausoleum')).not.toBeInTheDocument();
  });
});
