export function SkeletonCard() {
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden bg-zinc-900 border border-white/6">
      <div className="aspect-square skeleton"/>
      <div className="p-3 flex flex-col gap-2">
        <div className="skeleton h-3 w-full rounded"/>
        <div className="skeleton h-3 w-3/4 rounded"/>
        <div className="skeleton h-4 w-1/2 rounded mt-1"/>
      </div>
    </div>
  );
}
