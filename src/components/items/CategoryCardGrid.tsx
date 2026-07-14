import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function CategoryCardGrid({
  categories,
  basePath,
}: {
  categories: string[];
  basePath: string;
}) {
  const t = useTranslations('Grail');

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full">
      {categories.map(category => (
        <Link
          key={category}
          href={`${basePath}/${category}`}
          className="flex items-center justify-center px-4 py-6 rounded-xl bg-zinc-900 border border-zinc-700 text-sm font-semibold text-zinc-200 hover:border-amber-400 hover:text-amber-300 transition-colors"
        >
          {t(`slot_${category}`)}
        </Link>
      ))}
    </div>
  );
}
