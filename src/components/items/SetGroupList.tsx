import Link from 'next/link';

export default function SetGroupList({
  groups,
  basePath,
}: {
  groups: { slug: string; name: string }[];
  basePath: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
      {groups.map(g => (
        <Link
          key={g.slug}
          href={`${basePath}/${g.slug}`}
          className="flex items-center px-4 py-4 rounded-xl bg-zinc-900 border border-zinc-700 text-[#22ff55] font-semibold hover:border-amber-400 transition-colors"
        >
          {g.name}
        </Link>
      ))}
    </div>
  );
}
