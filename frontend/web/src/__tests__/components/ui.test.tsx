import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// ── Modal ──────────────────────────────────────────────────────────────────────
import { Modal } from '@/components/ui/modal'

describe('Modal', () => {
  it('renders title and children when open=true', () => {
    render(
      <Modal open={true} onOpenChange={vi.fn()} title="Test Modal">
        <p>Modal Content</p>
      </Modal>
    )
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Modal Content')).toBeInTheDocument()
  })

  it('does not render content when open=false', () => {
    render(
      <Modal open={false} onOpenChange={vi.fn()} title="Hidden Modal">
        <p>Should Not Appear</p>
      </Modal>
    )
    expect(screen.queryByText('Hidden Modal')).not.toBeInTheDocument()
  })

  it('renders optional description when provided', () => {
    render(
      <Modal open={true} onOpenChange={vi.fn()} title="T" description="A helpful description">
        <span />
      </Modal>
    )
    expect(screen.getByText('A helpful description')).toBeInTheDocument()
  })

  it('calls onOpenChange(false) when close button is clicked', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(
      <Modal open={true} onOpenChange={handleChange} title="Close Test">
        <span />
      </Modal>
    )
    const closeBtn = screen.getByLabelText('Close modal')
    await user.click(closeBtn)
    expect(handleChange).toHaveBeenCalledWith(false)
  })

  it('close button has accessible aria-label', () => {
    render(
      <Modal open={true} onOpenChange={vi.fn()} title="Accessible">
        <span />
      </Modal>
    )
    expect(screen.getByLabelText('Close modal')).toBeInTheDocument()
  })
})

// ── EmptyState ─────────────────────────────────────────────────────────────────
import { EmptyState } from '@/components/ui/empty-state'
import { BookOpen } from 'lucide-react'

describe('EmptyState', () => {
  it('renders title text', () => {
    render(<EmptyState title="No courses yet" />)
    expect(screen.getByText('No courses yet')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(<EmptyState title="T" description="Browse the catalogue to get started." />)
    expect(screen.getByText('Browse the catalogue to get started.')).toBeInTheDocument()
  })

  it('does not render description when omitted', () => {
    render(<EmptyState title="T" />)
    expect(screen.queryByText('Browse')).not.toBeInTheDocument()
  })

  it('renders action button when actionLabel + onAction are both provided', () => {
    const handleAction = vi.fn()
    render(<EmptyState title="T" actionLabel="Add Course" onAction={handleAction} />)
    expect(screen.getByRole('button', { name: 'Add Course' })).toBeInTheDocument()
  })

  it('does not render button when onAction is missing', () => {
    render(<EmptyState title="T" actionLabel="Add" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls onAction when action button is clicked', async () => {
    const user = userEvent.setup()
    const handleAction = vi.fn()
    render(<EmptyState title="T" actionLabel="Click Me" onAction={handleAction} />)
    await user.click(screen.getByRole('button', { name: 'Click Me' }))
    expect(handleAction).toHaveBeenCalledTimes(1)
  })

  it('renders icon when provided', () => {
    render(<EmptyState title="T" icon={BookOpen} />)
    // Icon wrapper div should be present
    const wrapper = document.querySelector('.rounded-full')
    expect(wrapper).toBeInTheDocument()
  })
})

// ── Breadcrumb ─────────────────────────────────────────────────────────────────
// Next.js usePathname needs to be mocked in test environment
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a>,
}))

import { Breadcrumb } from '@/components/ui/breadcrumb'
import { usePathname } from 'next/navigation'

describe('Breadcrumb', () => {
  it('returns null when pathname has only one segment', () => {
    vi.mocked(usePathname).mockReturnValue('/student')
    const { container } = render(<Breadcrumb />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nav with aria-label="Breadcrumb" for nested paths', () => {
    vi.mocked(usePathname).mockReturnValue('/student/courses')
    render(<Breadcrumb />)
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument()
  })

  it('displays Home as the first crumb', () => {
    vi.mocked(usePathname).mockReturnValue('/student/courses')
    render(<Breadcrumb />)
    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  it('renders last segment as non-link span', () => {
    vi.mocked(usePathname).mockReturnValue('/student/courses')
    render(<Breadcrumb />)
    // Last segment "courses" should be a span, not a link
    const spans = screen.getAllByText(/courses/i)
    const span = spans.find(el => el.tagName === 'SPAN')
    expect(span).toBeInTheDocument()
  })

  it('replaces underscores with spaces in labels', () => {
    vi.mocked(usePathname).mockReturnValue('/student/my_notes/view')
    render(<Breadcrumb />)
    expect(screen.getByText(/my notes/i)).toBeInTheDocument()
  })

  it('applies customLabels override', () => {
    vi.mocked(usePathname).mockReturnValue('/student/ai_tutor')
    render(<Breadcrumb customLabels={{ ai_tutor: 'AI Tutor' }} />)
    expect(screen.getByText('AI Tutor')).toBeInTheDocument()
  })
})
