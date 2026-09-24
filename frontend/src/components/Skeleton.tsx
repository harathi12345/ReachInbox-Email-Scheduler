type SkeletonProps = { className?: string };

export const Skeleton = ({ className = "" }: SkeletonProps) => <span aria-hidden="true" className={`skeleton-block ${className}`} />;

export const SkeletonCard = () => <div className="surface-card p-5"><Skeleton className="h-9 w-9 rounded-lg" /><Skeleton className="mt-5 h-3 w-24" /><Skeleton className="mt-2 h-7 w-20" /></div>;

export const SkeletonTableRow = () => <div className="flex items-center gap-4 border-b border-white/[0.05] px-5 py-4"><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-16" /><Skeleton className="h-5 w-20 rounded-full" /><Skeleton className="h-4 w-24" /></div>;