import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Mock next/navigation for any components that use it
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/student'),
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
}))
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a>,
}))
vi.mock('next-themes', () => ({
  useTheme: vi.fn(() => ({ theme: 'dark', setTheme: vi.fn() })),
}))

import TopNav from '@/components/dashboard/TopNav'

describe('TopNav', () => {
  it('renders the search input with aria-label="Search"', () => {
    render(<TopNav />)
    expect(screen.getByRole('textbox', { name: 'Search' })).toBeInTheDocument()
  })

  it('renders notifications button with aria-label="Notifications"', () => {
    render(<TopNav />)
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument()
  })

  it('renders menu button with aria-label="Open menu"', () => {
    render(<TopNav />)
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
  })

  it('calls onMenuClick when hamburger button is clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<TopNav onMenuClick={handleClick} />)
    await user.click(screen.getByRole('button', { name: /open menu/i }))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('displays user name and role when user prop is provided', () => {
    render(
      <TopNav
        user={{ name: 'Alice Smith', role: 'Teacher', initial: 'A' }}
      />
    )
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('Teacher')).toBeInTheDocument()
  })

  it('renders user initial avatar', () => {
    render(<TopNav user={{ name: 'Bob', role: 'Student', initial: 'B' }} />)
    expect(screen.getByText('B')).toBeInTheDocument()
  })
})
