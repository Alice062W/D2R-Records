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
});
