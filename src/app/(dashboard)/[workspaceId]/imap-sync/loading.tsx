import { ListSkeleton, Skeleton } from "@/components/ui/skeleton"

export default function ImapSyncLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-10 w-28" />
      </div>
      <ListSkeleton rows={5} />
    </div>
  )
}
