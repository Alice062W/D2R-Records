import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import CubeRecipeList from './CubeRecipeList';
import messages from '../../../messages/en.json';
import recipes from '../../../data/cube-recipes.json';

describe('CubeRecipeList', () => {
  it('renders all populated category sections with their recipes', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CubeRecipeList recipes={recipes} locale="en" />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Rune & Gem Upgrade')).toBeInTheDocument();
    expect(screen.getByText('3 El Runes -> Eld Rune')).toBeInTheDocument();
    expect(screen.getByText('Crafted Grand Charm')).toBeInTheDocument();
  });

  it('renders ingredient and output icons alongside the existing description text', () => {
    const recipe = {
      id: 'recipe-0',
      description: { en: 'Staff of Kings + Amulet of the Viper -> Horadric Staff', 'zh-TW': 'x', 'zh-CN': 'x' },
      category: 'quests' as const,
      ingredientIcons: ['invmsf', 'invvip'],
      outputIcon: 'invhst',
    };
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CubeRecipeList recipes={[recipe]} locale="en" />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Staff of Kings + Amulet of the Viper -> Horadric Staff')).toBeInTheDocument();
    const imgs = container.querySelectorAll('img');
    const srcs = Array.from(imgs).map(i => (i as HTMLImageElement).src);
    expect(srcs.some(s => s.includes('invmsf'))).toBe(true);
    expect(srcs.some(s => s.includes('invvip'))).toBe(true);
    expect(srcs.some(s => s.includes('invhst'))).toBe(true);
  });

  it('renders no output icon when outputIcon is null', () => {
    const recipe = {
      id: 'recipe-2',
      description: { en: "Wirt's Leg + Tome of Town Portal -> Portal to The Secret Cow Level", 'zh-TW': 'x', 'zh-CN': 'x' },
      category: 'quests' as const,
      ingredientIcons: ['invleg', 'invbbk'],
      outputIcon: null,
    };
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CubeRecipeList recipes={[recipe]} locale="en" />
      </NextIntlClientProvider>
    );
    const srcs = Array.from(container.querySelectorAll('img')).map(i => (i as HTMLImageElement).src);
    expect(srcs.filter(s => s.includes('invleg') || s.includes('invbbk')).length).toBe(2);
    expect(srcs.some(s => s.includes('invhst'))).toBe(false);
  });
});
