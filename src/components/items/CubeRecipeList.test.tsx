import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import CubeRecipeList from './CubeRecipeList';
import messages from '../../../messages/en.json';
import recipes from '../../../data/cube-recipes.json';

describe('CubeRecipeList', () => {
  it('renders runeUpgrade recipes with a "(#N)" rune-number badge on every rune mention', () => {
    const category = recipes.filter(r => r.category === 'runeUpgrade');
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CubeRecipeList recipes={category} locale="en" />
      </NextIntlClientProvider>
    );
    expect(container.textContent).toContain('3 ✕ El Runes (#1) → Eld Rune (#2)');
    // A gem ingredient never gets a rune-number badge.
    expect(container.textContent).toContain('3 ✕ Thul Runes (#10) + 1 ✕ Chipped Topaz → Amn Rune (#11)');
  });

  it('groups runeUpgrade recipes into 3 boxes: no-gem (runes 1-9), 3-rune (10-20), 2-rune (21-33)', () => {
    const category = recipes.filter(r => r.category === 'runeUpgrade');
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CubeRecipeList recipes={category} locale="en" />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('heading', { name: 'Rune #1–9 (No Gem Required)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Rune #10–20 (Requires 3 Runes)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Rune #21–33 (Requires 2 Runes)' })).toBeInTheDocument();
  });

  it('renders ingredient and output icons alongside the existing description text', () => {
    const recipe = {
      id: 'recipe-0',
      description: { en: 'Staff of Kings + Amulet of the Viper -> Horadric Staff', 'zh-TW': 'x', 'zh-CN': 'x' },
      category: 'quests' as const,
      ingredientIcons: ['invmsf', 'invvip'],
      outputIcon: 'invhst',
      ingredientHdIcons: ['staff_of_the_kings', 'viper_amulet'],
      outputHdIcon: 'horadric_staff',
    };
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CubeRecipeList recipes={[recipe]} locale="en" />
      </NextIntlClientProvider>
    );
    expect(container.textContent).toContain('Staff of Kings + Amulet of the Viper → Horadric Staff');
    const imgs = container.querySelectorAll('img');
    const srcs = Array.from(imgs).map(i => (i as HTMLImageElement).src);
    expect(srcs.some(s => s.includes('/items/hd/staff_of_the_kings.png'))).toBe(true);
    expect(srcs.some(s => s.includes('/items/hd/viper_amulet.png'))).toBe(true);
    expect(srcs.some(s => s.includes('/items/hd/horadric_staff.png'))).toBe(true);
  });

  it('falls back to the classic inv icon when no HD icon is available', () => {
    const recipe = {
      id: 'recipe-0b',
      description: { en: 'x -> y', 'zh-TW': 'x', 'zh-CN': 'x' },
      category: 'quests' as const,
      ingredientIcons: ['invmsf'],
      outputIcon: null,
      ingredientHdIcons: [null as unknown as string],
      outputHdIcon: null,
    };
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CubeRecipeList recipes={[recipe]} locale="en" />
      </NextIntlClientProvider>
    );
    const srcs = Array.from(container.querySelectorAll('img')).map(i => (i as HTMLImageElement).src);
    expect(srcs.some(s => s.includes('/items/inv/invmsf.png'))).toBe(true);
  });

  it('repeats an ingredient icon per its required quantity (e.g. 3 icons for "3 Chipped Amethysts")', () => {
    const recipe = {
      id: 'recipe-23',
      description: { en: '3 Chipped Amethysts -> Flawed Amethyst', 'zh-TW': 'x', 'zh-CN': 'x' },
      category: 'gemUpgrade' as const,
      ingredientIcons: ['invgsva', 'invgsva', 'invgsva'],
      outputIcon: 'invgsvb',
      ingredientHdIcons: ['chipped_amethyst', 'chipped_amethyst', 'chipped_amethyst'],
      outputHdIcon: 'flawed_amethyst',
    };
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CubeRecipeList recipes={[recipe]} locale="en" />
      </NextIntlClientProvider>
    );
    const srcs = Array.from(container.querySelectorAll('img')).map(i => (i as HTMLImageElement).src);
    expect(srcs.filter(s => s.includes('/items/hd/chipped_amethyst.png')).length).toBe(3);
    expect(container.textContent).toContain('3 ✕ Chipped Amethysts → Flawed Amethyst');
  });

  it('renders no output icon when outputIcon is null', () => {
    const recipe = {
      id: 'recipe-2',
      description: { en: "Wirt's Leg + Tome of Town Portal -> Portal to The Secret Cow Level", 'zh-TW': 'x', 'zh-CN': 'x' },
      category: 'quests' as const,
      ingredientIcons: ['invleg', 'invbbk'],
      outputIcon: null,
      ingredientHdIcons: ["wirt's_leg", 'tome_of_town_portal'],
      outputHdIcon: null,
    };
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CubeRecipeList recipes={[recipe]} locale="en" />
      </NextIntlClientProvider>
    );
    const srcs = Array.from(container.querySelectorAll('img')).map(i => (i as HTMLImageElement).src);
    expect(srcs.length).toBe(2);
    expect(srcs.some(s => s.includes('invhst'))).toBe(false);
  });

  it('groups all gemUpgrade recipes into one box per gem type, titled with that gem\'s own name', () => {
    const gemRecipes = recipes.filter(r => r.category === 'gemUpgrade');
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CubeRecipeList recipes={gemRecipes} locale="en" />
      </NextIntlClientProvider>
    );
    // 7 gem types -> 7 group headings, each the gem's own standard-tier name.
    for (const gem of ['Amethyst', 'Ruby', 'Sapphire', 'Topaz', 'Emerald', 'Diamond', 'Skull']) {
      expect(screen.getByRole('heading', { name: gem })).toBeInTheDocument();
    }
    // All 4 tiers for Ruby end up under the same heading's box.
    expect(container.textContent).toContain('3 ✕ Chipped Rubies → Flawed Ruby');
    expect(container.textContent).toContain('3 ✕ Flawless Rubies → Perfect Ruby');
  });

  it('inserts a quantity marker after each ingredient count, including in multi-ingredient recipes', () => {
    const recipe = {
      id: 'recipe-x',
      description: {
        en: '3 Healing Potions (Any) + 3 Mana Potions (Any) + 1 Standard Gem (Any) -> Full Rejuvenation Potion',
        'zh-TW': 'x',
        'zh-CN': 'x',
      },
      category: 'consumables' as const,
      ingredientIcons: [],
      outputIcon: null,
      ingredientHdIcons: [],
      outputHdIcon: null,
    };
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CubeRecipeList recipes={[recipe]} locale="en" />
      </NextIntlClientProvider>
    );
    expect(container.textContent).toContain(
      '3 ✕ Healing Potions (Any) + 3 ✕ Mana Potions (Any) + 1 ✕ Standard Gem (Any) → Full Rejuvenation Potion'
    );
  });

  it('groups consumables recipes into a Potions box and an Arrows & Javelins box', () => {
    const category = recipes.filter(r => r.category === 'consumables');
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CubeRecipeList recipes={category} locale="en" />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('heading', { name: 'Potions' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Arrows & Javelins' })).toBeInTheDocument();
    expect(container.textContent).toContain('Strangling Gas Potion');
    expect(container.textContent).toContain('Throwing Axe');
  });
});
