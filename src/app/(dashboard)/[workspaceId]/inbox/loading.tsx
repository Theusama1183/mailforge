export default function InboxLoading() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      <div className="flex-1 divide-y divide-gray-50 dark:divide-gray-800">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3.5">
            <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="h-3.5 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="h-3.5 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-36 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
