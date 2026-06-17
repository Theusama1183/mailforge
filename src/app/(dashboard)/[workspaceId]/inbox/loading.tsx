export default function InboxLoading() {
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Email list skeleton */}
      <div className="flex flex-col w-full md:w-96 md:border-r border-gray-100 dark:border-gray-800">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
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

      {/* Email viewer skeleton */}
      <div className="hidden md:flex flex-1 flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex-1 p-6 space-y-4">
          <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3.5 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-3">
            <div className="h-3.5 w-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-3.5 w-5/6 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-3.5 w-4/6 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-3.5 w-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-3.5 w-3/4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
