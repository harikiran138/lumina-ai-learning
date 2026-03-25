'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbProps {
  customLabels?: Record<string, string> // e.g. { 'ai_tutor': 'AI Tutor' }
}

export function Breadcrumb({ customLabels = {} }: BreadcrumbProps) {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length <= 1) return null // hide on top-level pages

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center flex-wrap gap-1 text-sm text-muted-foreground">
        <li>
          <Link href="/" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lumina-primary rounded">
            Home
          </Link>
        </li>
        {segments.map((segment, index) => {
          const href = '/' + segments.slice(0, index + 1).join('/')
          const rawLabel = segment.replace(/-|_/g, ' ')
          const label = customLabels[segment] ?? rawLabel
          const isLast = index === segments.length - 1

          return (
            <li key={href} className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3" aria-hidden="true" />
              {isLast ? (
                <span className="text-foreground capitalize font-medium">
                  {label}
                </span>
              ) : (
                <Link
                  href={href}
                  className="capitalize hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lumina-primary rounded"
                >
                  {label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
