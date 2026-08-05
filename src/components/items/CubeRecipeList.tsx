'use client';

import { useState } from 'react';
import type cubeRecipesJson from '../../../data/cube-recipes.json';
import { BASE_PATH } from '@/lib/basePath';

type Recipe = (typeof cubeRecipesJson)[number];
type Locale = 'en' | 'zh-TW' | 'zh-CN';

function RecipeIcon({ invFile }: { invFile: string }) {
  const [iconFailed, setIconFailed] = useState(false);
  if (!invFile || iconFailed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${BASE_PATH}/items/inv/${invFile}.png`}
      alt=""
      aria-hidden="true"
      className="w-6 h-6 object-contain inline-block"
      onError={() => setIconFailed(true)}
    />
  );
}

const GEM_ORDER = ['Amethyst', 'Ruby', 'Sapphire', 'Topaz', 'Emerald', 'Diamond', 'Skull'] as const;

// "3 Chipped Amethysts -> Flawed Amethyst" -> "Amethyst". Only gemUpgrade
// recipes are grouped this way, so a non-matching description just means
// this recipe isn't a gem-tier-upgrade line (shouldn't happen within a
// gemUpgrade-category list, but falls back to no group rather than throwing).
function gemGroupOf(descriptionEn: string): (typeof GEM_ORDER)[number] | null {
  return GEM_ORDER.find(gem => descriptionEn.includes(gem)) ?? null;
}

// A small "×" quantity marker inserted between an ingredient's count and its
// name (e.g. "3 Chipped Amethysts" -> "3 ✕ Chipped Amethysts"), so the
// count reads unambiguously as a multiplier rather than run into the name.
// Same lightweight-glyph convention this component's sibling pages already
// use for non-item-icon markers (e.g. the 🎲 dice glyph on variable stat
// rows) -- no game asset exists for "quantity", so a Unicode glyph styled
// to match is used instead of an <img>.
function QtyIcon() {
  return <span aria-hidden="true" className="text-muted text-xs">✕</span>;
}

// Splits a composed recipe description into its ingredient list and output
// ("3 X + 1 Y -> Z" / "3 X + 1 Y → Z"), and renders a QtyIcon after each
// ingredient's own leading count -- language-agnostic (digits and the "+"/
// "->" separators are identical across en/zh-TW/zh-CN's composed text), so
// this applies uniformly to every locale and every cube-recipe category
// without needing separate per-language data.
function DescriptionWithQtyIcons({ description }: { description: string }) {
  const arrowMatch = description.match(/\s*(?:->|→)\s*/);
  if (!arrowMatch) return <>{description}</>;
  const arrowIndex = arrowMatch.index!;
  const inputPart = description.slice(0, arrowIndex);
  const outputPart = description.slice(arrowIndex + arrowMatch[0].length);

  const ingredients = inputPart.split(' + ');
  return (
    <>
      {ingredients.map((ingredient, i) => {
        const m = ingredient.match(/^(\d+)(\s+)(.*)$/);
        return (
          <span key={i}>
            {i > 0 && ' + '}
            {m ? (
              <>
                {m[1]}
                {' '}
                <QtyIcon />
                {' '}
                {m[3]}
              </>
            ) : (
              ingredient
            )}
          </span>
        );
      })}
      {' → '}
      {outputPart}
    </>
  );
}

function RecipeCard({ r, locale }: { r: Recipe; locale: Locale }) {
  return (
    <div className="bg-panel border border-panel-border rounded-lg px-4 py-2 text-sm text-parchment">
      {(r.ingredientIcons.length > 0 || r.outputIcon) && (
        <div className="flex items-center gap-1 mb-1">
          {r.ingredientIcons.map((icon, i) => <RecipeIcon key={`${icon}-${i}`} invFile={icon} />)}
          {r.outputIcon && (
            <>
              <span className="text-muted mx-1">&rarr;</span>
              <RecipeIcon invFile={r.outputIcon} />
            </>
          )}
        </div>
      )}
      <DescriptionWithQtyIcons description={r.description[locale]} />
    </div>
  );
}

export default function CubeRecipeList({ recipes, locale }: { recipes: Recipe[]; locale: Locale }) {
  const isGemUpgrade = recipes.length > 0 && recipes.every(r => r.category === 'gemUpgrade');

  if (!isGemUpgrade) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-2 w-full">
        {recipes.map(r => <RecipeCard key={r.id} r={r} locale={locale} />)}
      </div>
    );
  }

  // Group gem-tier-upgrade recipes into one box per gem type (Ruby, Sapphire,
  // etc.) instead of a flat 28-card grid -- each gem's 4 chipped/flawed/
  // standard/flawless/perfect upgrade steps sit together. The box title uses
  // that gem's own "standard" tier name, already present verbatim in this
  // group's own recipe text (the bare gem word after "->" on the
  // Flawed->Standard recipe) -- no separate translation lookup needed.
  const groups = GEM_ORDER.map(gem => ({
    gem,
    items: recipes.filter(r => gemGroupOf(r.description.en) === gem),
  })).filter(g => g.items.length > 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {groups.map(({ gem, items }) => {
        const standardRecipe = items.find(r => r.description.en.includes(`Standard ${gem}`));
        // English's own composed text says "Standard Amethyst" (a
        // convenience label from the site's own data, not the game's -- the
        // real bare tier name has no "Standard" qualifier in enUS either,
        // matching zh-TW/zh-CN's already-bare output text), so strip that
        // prefix back off for the group title.
        const title = standardRecipe
          ? standardRecipe.description[locale].split(/->|→/).pop()!.trim().replace(/^Standard\s+/, '')
          : gem;
        return (
          <div key={gem} className="bg-panel-alt border border-panel-border rounded-xl p-4 flex flex-col gap-2">
            <h3 className="text-sm font-bold text-gold-bright font-cinzel">{title}</h3>
            <div className="flex flex-col gap-2">
              {items.map(r => <RecipeCard key={r.id} r={r} locale={locale} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
