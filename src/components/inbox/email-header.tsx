"use client"

import { useMemo } from "react"
import { decodeMimeSubject, formatAddress } from "@/lib/email-utils"
import { Avatar } from "@/components/ui/avatar"
import type { Email } from "@/types"
import { Badge } from "@/components/ui/badge"

interface EmailHeaderProps {
  email: Email
}

/**
 * Email header showing sender info, recipients, date, and address chips.
 * Long emails are truncated with title tooltip. Empty recipients hidden.
 */
export function EmailHeader({ email }: EmailHeaderProps) {
  const decodedSubject = useMemo(
    () => decodeMimeSubject(email.subject),
    [email.subject]
  )

  const formattedDate = useMemo(() => {
    try {
      const date = new Date(email.created_at)
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    } catch {
      return email.created_at || ""
    }
  }, [email.created_at])

  return (
    <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
      {/* Subject */}
      <h1
        className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 truncate"
        title={decodedSubject}
      >
        {decodedSubject}
      </h1>

      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar
          name={email.from_name || email.from_address || "Unknown"}
          size="md"
          className="flex-shrink-0"
        />

        {/* Sender details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate max-w-[200px] sm:max-w-[300px]" title={email.from_name || email.from_address}>
              {email.from_name || email.from_address || "Unknown Sender"}
            </span>
            {email.from_name && email.from_address ? (
              <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[180px] sm:max-w-[250px]" title={email.from_address}>
                {formatAddress(email.from_address)}
              </span>
            ) : null}
          </div>

          {/* To / CC recipients as chips */}
          {email.to_addresses && email.to_addresses.length > 0 ? (
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-xs text-gray-400 dark:text-gray-500">To:</span>
              {email.to_addresses.slice(0, 3).map((addr, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 truncate max-w-[150px]"
                  title={addr}
                >
                  {formatAddress(addr, 24)}
                </span>
              ))}
              {email.to_addresses.length > 3 ? (
                <Badge variant="default" className="text-xs">
                  +{email.to_addresses.length - 3} more
                </Badge>
              ) : null}
            </div>
          ) : null}

          {email.cc_addresses && email.cc_addresses.length > 0 ? (
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-xs text-gray-400 dark:text-gray-500">CC:</span>
              {email.cc_addresses.slice(0, 3).map((addr, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 truncate max-w-[150px]"
                  title={addr}
                >
                  {formatAddress(addr, 24)}
                </span>
              ))}
              {email.cc_addresses.length > 3 ? (
                <Badge variant="default" className="text-xs">
                  +{email.cc_addresses.length - 3} more
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Date */}
        <div className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0 hidden sm:block">
          {formattedDate}
        </div>
      </div>
    </div>
  )
}
