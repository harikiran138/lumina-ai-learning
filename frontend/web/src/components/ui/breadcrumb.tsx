'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbProps {
  customLabels?: Record<string, string> // e.g. { 'ai_tutor': 'AI Tutor' }
  customHrefs?: Record<string, string> // e.g. { student: '/student/dashboard' }
  homeHref?: string
  homeLabel?: string
}

const defaultLabels: Record<string, string> = {
  ai_tutor: 'AI Tutor',
}

const defaultHrefs: Record<string, string> = {
  student: '/student/dashboard',
  teacher: '/teacher/dashboard',
  faculty: '/teacher/dashboard',
  admin: '/admin/dashboard',
  parent: '/parent/dashboard',
  mentor: '/mentor/dashboard',
  counselor: '/counselor/dashboard',
  alumni: '/alumni/dashboard',
  researcher: '/researcher/dashboard',
  creator: '/content_creator/dashboard',
  content_creator: '/content_creator/dashboard',
  'peer-tutor': '/peer_tutor/dashboard',
  peer_tutor: '/peer_tutor/dashboard',
}

export function Breadcrumb({
  customLabels = {},
  customHrefs = {},
  homeHref = '/',
  homeLabel = 'Home',
}: BreadcrumbProps) {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length <= 1) return null // hide on top-level pages

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center flex-wrap gap-1 text-sm text-muted-foreground">
        <li>
          <Link href={homeHref} className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lumina-primary rounded">
            {homeLabel}
          </Link>
        </li>
        {segments.map((segment, index) => {
          const href =
            customHrefs[segment] ||
            defaultHrefs[segment] ||
            '/' + segments.slice(0, index + 1).join('/')
          const rawLabel = segment.replace(/-|_/g, ' ')
          const label = customLabels[segment] ?? defaultLabels[segment] ?? rawLabel
          const isLast = index === segments.length - 1

          return (
            <li key={`${segment}-${index}`} className="flex items-center gap-1">
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
