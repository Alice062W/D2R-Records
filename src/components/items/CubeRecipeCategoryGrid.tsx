import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import CategoryRecipeIcon from './CategoryRecipeIcon';

// One curated, high-quality (HD) representative image per cube-recipe
// category, picked by hand rather than derived from "whichever recipe
// happens to sort first" -- classicIcon is the invFile fallback used if the
// HD asset ever fails to load.
const CATEGORY_ICON: Record<string, { invFile: string; hdIcon: string }> = {
  gemUpgrade: { invFile: 'invgswe', hdIcon: 'perfect_diamond' },
  runeUpgrade: { invFile: 'invrJo', hdIcon: 'jah_rune' },
  quests: { invFile: 'invqf2', hdIcon: 'super_khalim_flail' }, // Khalim's Will
  consumables: { invFile: 'invvpl', hdIcon: 'full_rejuv_potion' },
  sockets: { invFile: 'invskz', hdIcon: 'perfect_skull' },
  itemUpgrade: { invFile: 'invgswe', hdIcon: 'fragment_lightning' }, // Guardian's Thunder
  itemRepair: { invFile: 'invhmr', hdIcon: 'horadric_malus' },
  magicItemRerolls: { invFile: 'invskz', hdIcon: 'recipes_rerolls' },
  magicItemCreation: { invFile: 'invbar', hdIcon: 'bardiche' }, // Savage Polearm
  craftedGrandCharm: { invFile: 'invsst', hdIcon: 'charm_large_lyel' }, // Renewed Crack of the Heavens
};

export default async function CubeRecipeCategoryGrid({
  categories,
  basePath,
}: {
  categories: { category: string; count: number; icon: string | null }[];
  basePath: string;
}) {
  const t = await getTranslations('Items');

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full">
      {categories.map(({ category, count, icon }) => {
        const curated = CATEGORY_ICON[category];
        return (
          <Link
            key={category}
            href={`${basePath}/${category}`}
            className="flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border text-sm font-semibold font-cinzel text-parchment-bright hover:border-gold hover:text-gold-bright transition-colors bg-panel border-panel-border"
          >
            <CategoryRecipeIcon invFile={curated?.invFile ?? icon} hdIcon={curated?.hdIcon} />
            {t(`cubeRecipesCategory_${category}` as never)}
            <span className="text-xs font-normal text-muted">{count}</span>
          </Link>
        );
      })}
    </div>
  );
}
