'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type cubeRecipesJson from '../../../data/cube-recipes.json';
import runesJson from '../../../data/runes.json';
import { BASE_PATH } from '@/lib/basePath';

type Recipe = (typeof cubeRecipesJson)[number];
type Locale = 'en' | 'zh-TW' | 'zh-CN';

function RecipeIcon({ invFile, hdIcon }: { invFile: string; hdIcon?: string | null }) {
  const [iconFailed, setIconFailed] = useState(false);
  const [hdIconFailed, setHdIconFailed] = useState(false);
  if ((!hdIcon && !invFile) || iconFailed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={hdIcon && !hdIconFailed ? `${BASE_PATH}/items/hd/${hdIcon}.png` : `${BASE_PATH}/items/inv/${invFile}.png`}
      alt=""
      aria-hidden="true"
      className="w-8 h-8 object-contain inline-block"
      onError={() => {
        if (hdIcon && !hdIconFailed) setHdIconFailed(true);
        else setIconFailed(true);
      }}
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

// El(1) -> Zod(33) -- used to append "(#N)" after every rune mention, same
// convention referenced sites (e.g. d2r.world) use for the Rune/Gem Upgrade
// recipe list. Keyed by the rune's own English name, which is what
// cube-recipes.json's ENGLISH description text always carries verbatim
// (regardless of which locale is being displayed) -- so this lookup works
// the same way no matter which locale's text is being annotated.
const RUNE_NUMBER_BY_EN = new Map(runesJson.map(r => [r.name.en, r.number]));

// Given one English ingredient/output segment (already qty-stripped, e.g.
// "El Runes" or "Eld Rune"), returns its rune number if it names a rune,
// else null (e.g. a gem ingredient like "Chipped Topaz").
function runeNumberFromEnSegment(enSegment: string): number | null {
  const m = enSegment.match(/^(\w+) Runes?$/);
  if (!m) return null;
  return RUNE_NUMBER_BY_EN.get(m[1]) ?? null;
}

function RuneNumberBadge({ n }: { n: number }) {
  return <span className="text-muted text-xs"> (#{n})</span>;
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
// without needing separate per-language data. When `descriptionEn` is given
// (the same recipe's English text), each ingredient/output segment is also
// checked against RUNE_NUMBER_BY_EN so rune mentions get a "(#N)" badge --
// a no-op for any category that isn't runeUpgrade, since none of those
// segments will match a rune name.
function DescriptionWithQtyIcons({ description, descriptionEn }: { description: string; descriptionEn?: string }) {
  const arrowMatch = description.match(/\s*(?:->|→)\s*/);
  if (!arrowMatch) return <>{description}</>;
  const arrowIndex = arrowMatch.index!;
  const inputPart = description.slice(0, arrowIndex);
  const outputPart = description.slice(arrowIndex + arrowMatch[0].length);

  let inputPartEn: string | undefined;
  let outputPartEn: string | undefined;
  if (descriptionEn) {
    const arrowMatchEn = descriptionEn.match(/\s*(?:->|→)\s*/);
    if (arrowMatchEn) {
      inputPartEn = descriptionEn.slice(0, arrowMatchEn.index!);
      outputPartEn = descriptionEn.slice(arrowMatchEn.index! + arrowMatchEn[0].length);
    }
  }

  const ingredients = inputPart.split(' + ');
  const ingredientsEn = inputPartEn?.split(' + ');
  const outputRuneNum = outputPartEn ? runeNumberFromEnSegment(outputPartEn) : null;

  return (
    <>
      {ingredients.map((ingredient, i) => {
        const m = ingredient.match(/^(\d+)(\s+)(.*)$/);
        const enSegment = ingredientsEn?.[i];
        const runeNum = enSegment ? runeNumberFromEnSegment(m ? enSegment.replace(/^\d+\s+/, '') : enSegment) : null;
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
            {runeNum != null && <RuneNumberBadge n={runeNum} />}
          </span>
        );
      })}
      {' → '}
      {outputPart}
      {outputRuneNum != null && <RuneNumberBadge n={outputRuneNum} />}
    </>
  );
}

// Extracts just the output half of a composed "X + Y -> Z" description
// (same arrow split DescriptionWithQtyIcons uses), for recipes whose output
// has no item icon of its own (e.g. a cube-created Town Portal) -- shown as
// text next to the arrow instead, matching the reference site's convention.
function outputTextOf(description: string): string {
  const arrowMatch = description.match(/\s*(?:->|→)\s*/);
  if (!arrowMatch) return description;
  return description.slice(arrowMatch.index! + arrowMatch[0].length);
}

function RecipeCard({ r, locale }: { r: Recipe; locale: Locale }) {
  // Portal-output quest recipes (Secret Cow Level / Matron's Den etc. /
  // Tristram / Colossal Summit) have no output item icon since the output is
  // a temporary map portal, not an item -- show the destination name as text
  // next to the arrow instead, same as the reference site. Sockets/Item
  // Repair/Item Upgrade recipes have no output icon either (the output is
  // the same input item, just with sockets added/cleared, durability/charges
  // restored, or its quality tier bumped up -- not a distinct item), so get
  // the same text treatment.
  const CATEGORIES_WITH_OUTPUT_TEXT = ['quests', 'sockets', 'itemRepair', 'itemUpgrade'];
  const showOutputText = !r.outputIcon && CATEGORIES_WITH_OUTPUT_TEXT.includes(r.category);
  return (
    <div className="bg-panel border border-panel-border rounded-lg px-4 py-2 text-sm text-parchment">
      {(r.ingredientIcons.length > 0 || r.outputIcon || showOutputText) && (
        <div className="flex items-center gap-1 mb-1">
          {r.ingredientIcons.map((icon, i) => (
            <RecipeIcon key={`${icon}-${i}`} invFile={icon} hdIcon={r.ingredientHdIcons?.[i]} />
          ))}
          {r.outputIcon && (
            <>
              <span className="text-muted mx-1">&rarr;</span>
              <RecipeIcon invFile={r.outputIcon} hdIcon={r.outputHdIcon} />
            </>
          )}
          {showOutputText && (
            <>
              <span className="text-muted mx-1">&rarr;</span>
              <span className="text-parchment-bright text-xs">{outputTextOf(r.description[locale])}</span>
            </>
          )}
        </div>
      )}
      <DescriptionWithQtyIcons description={r.description[locale]} descriptionEn={r.description.en} />
    </div>
  );
}

export default function CubeRecipeList({ recipes, locale }: { recipes: Recipe[]; locale: Locale }) {
  const t = useTranslations('Items');
  const isGemUpgrade = recipes.length > 0 && recipes.every(r => r.category === 'gemUpgrade');
  const isRuneUpgrade = recipes.length > 0 && recipes.every(r => r.category === 'runeUpgrade');
  const isConsumables = recipes.length > 0 && recipes.every(r => r.category === 'consumables');
  const isCraftedGrandCharm = recipes.length > 0 && recipes.every(r => r.category === 'craftedGrandCharm');
  const isQuests = recipes.length > 0 && recipes.every(r => r.category === 'quests');

  const isItemUpgrade = recipes.length > 0 && recipes.every(r => r.category === 'itemUpgrade');
  const isMagicItemCreation = recipes.length > 0 && recipes.every(r => r.category === 'magicItemCreation');
  const isSockets = recipes.length > 0 && recipes.every(r => r.category === 'sockets');
  const isItemRepair = recipes.length > 0 && recipes.every(r => r.category === 'itemRepair');
  const isMagicItemRerolls = recipes.length > 0 && recipes.every(r => r.category === 'magicItemRerolls');

  if (isItemUpgrade) {
    // Group by the item's own rarity tier -- Normal (Low Quality -> Normal,
    // no rarity qualifier), Unique, Rare, Set -- detected from the recipe's
    // own English text, matching cube-recipes.json's fixed ordering.
    const normalGroup = recipes.filter(r => !/Unique|Rare|Set/.test(r.description.en));
    const uniqueGroup = recipes.filter(r => r.description.en.includes('Unique'));
    const rareGroup = recipes.filter(r => r.description.en.includes('Rare'));
    const setGroup = recipes.filter(r => r.description.en.includes('Set'));
    const groups = [
      { key: 'normal', title: t('cubeRecipesItemUpgradeGroupNormal'), items: normalGroup },
      { key: 'unique', title: t('cubeRecipesItemUpgradeGroupUnique'), items: uniqueGroup },
      { key: 'rare', title: t('cubeRecipesItemUpgradeGroupRare'), items: rareGroup },
      { key: 'set', title: t('cubeRecipesItemUpgradeGroupSet'), items: setGroup },
    ].filter(g => g.items.length > 0);

    return (
      <div className="flex flex-col gap-4 w-full">
        {groups.map(({ key, title, items }) => (
          <div key={key} className="bg-panel-alt border border-panel-border rounded-xl p-4 flex flex-col gap-2">
            <h3 className="text-sm font-bold text-gold-bright font-cinzel">{title}</h3>
            <div className="grid grid-cols-1 gap-2">
              {items.map(r => <RecipeCard key={r.id} r={r} locale={locale} />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isCraftedGrandCharm || isQuests || isMagicItemCreation || isSockets || isItemRepair) {
    // Long multi-ingredient descriptions (4-6 ingredients, verbose quality/
    // rune/gem/charm-size wording), or -- for Sockets/Item Repair -- the
    // added output-text row makes each card wide enough that a single column
    // reads more clearly than wrapping them into a multi-column grid.
    return (
      <div className="grid grid-cols-1 gap-2 w-full">
        {recipes.map(r => <RecipeCard key={r.id} r={r} locale={locale} />)}
      </div>
    );
  }

  if (isMagicItemRerolls) {
    // Shorter descriptions than Item Upgrade/Magic Item Creation -- 2 columns
    // fits comfortably without wrapping awkwardly.
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 w-full">
        {recipes.map(r => <RecipeCard key={r.id} r={r} locale={locale} />)}
      </div>
    );
  }

  if (isRuneUpgrade) {
    // Group rune-upgrade recipes by how many runes each merge takes: the
    // first 9 (El->Eld ... Ort->Thul) take 3 runes and no gem; the next 11
    // (Thul->Amn ... Fal->Lem, runes #10-20) take 3 runes + 1 gem; the
    // remaining 12 (Pul->Um ... Cham->Zod, runes #21-32) take 2 runes + 1
    // gem -- matches cube-recipes.json's own fixed ordering, detected here
    // by whether the recipe has a "+" (gem ingredient) and its rune count.
    const noGemGroup = recipes.filter(r => !r.description.en.includes(' + '));
    const rune3Group = recipes.filter(r => r.description.en.includes(' + ') && /^3\s/.test(r.description.en));
    const rune2Group = recipes.filter(r => r.description.en.includes(' + ') && /^2\s/.test(r.description.en));
    const groups = [
      { key: 'noGem', title: t('cubeRecipesRuneGroupNoGem'), items: noGemGroup },
      { key: '3rune', title: t('cubeRecipesRuneGroup3Rune'), items: rune3Group },
      { key: '2rune', title: t('cubeRecipesRuneGroup2Rune'), items: rune2Group },
    ].filter(g => g.items.length > 0);

    return (
      <div className="flex flex-col gap-4 w-full">
        {groups.map(({ key, title, items }) => (
          <div key={key} className="bg-panel-alt border border-panel-border rounded-xl p-4 flex flex-col gap-2">
            <h3 className="text-sm font-bold text-gold-bright font-cinzel">{title}</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {items.map(r => <RecipeCard key={r.id} r={r} locale={locale} />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isConsumables) {
    // Group consumables recipes into 2 boxes: potion formulas (Healing/Mana/
    // Rejuvenation/Antidote Potion, all mention "Potion" in the recipe's own
    // English text) vs. the Arrows/Bolts/Javelin/Throwing Axe formulas
    // (everything else in this category) -- keeps the two unrelated families
    // of recipes from being visually mixed in one flat grid.
    const potionGroup = recipes.filter(r => r.description.en.includes('Potion'));
    const ammoGroup = recipes.filter(r => !r.description.en.includes('Potion'));
    const groups = [
      { key: 'potions', title: t('cubeRecipesConsumablesGroupPotions'), items: potionGroup },
      { key: 'ammo', title: t('cubeRecipesConsumablesGroupAmmo'), items: ammoGroup },
    ].filter(g => g.items.length > 0);

    return (
      <div className="flex flex-col gap-4 w-full">
        {groups.map(({ key, title, items }) => (
          <div key={key} className="bg-panel-alt border border-panel-border rounded-xl p-4 flex flex-col gap-2">
            <h3 className="text-sm font-bold text-gold-bright font-cinzel">{title}</h3>
            <div className="grid grid-cols-1 gap-2">
              {items.map(r => <RecipeCard key={r.id} r={r} locale={locale} />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!isGemUpgrade) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-2 w-full">
        {recipes.map(r => <RecipeCard key={r.id} r={r} locale={locale} />)}
      </div>
    );
  }

  // Group gem-tier-upgrade recipes into one box per gem type (Ruby, Sapphire,
  // etc.) instead of a flat 28-card grid -- each gem's 4 chipped/flawed/
  // standard/flawless/perfect upgrade steps sit together, always in that
  // fixed order (matching cube-recipes.json's own ordering). The box title
  // uses that gem's own bare "standard" tier name -- the 2nd recipe's own
  // output (Flawed -> Standard) -- already present verbatim in this group's
  // own recipe text, no separate translation lookup needed.
  const groups = GEM_ORDER.map(gem => ({
    gem,
    items: recipes.filter(r => gemGroupOf(r.description.en) === gem),
  })).filter(g => g.items.length > 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {groups.map(({ gem, items }) => {
        const standardRecipe = items[1];
        const title = standardRecipe
          ? standardRecipe.description[locale].split(/->|→/).pop()!.trim()
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
