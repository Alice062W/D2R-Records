import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import CategoryRecipeIcon from './CategoryRecipeIcon';

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
      {categories.map(({ category, count, icon }) => (
        <Link
          key={category}
          href={`${basePath}/${category}`}
          className="flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border text-sm font-semibold font-cinzel text-parchment-bright hover:border-gold hover:text-gold-bright transition-colors bg-panel border-panel-border"
        >
          <CategoryRecipeIcon invFile={icon} />
          {t(`cubeRecipesCategory_${category}` as never)}
          <span className="text-xs font-normal text-muted">{count}</span>
        </Link>
      ))}
    </div>
  );
}
