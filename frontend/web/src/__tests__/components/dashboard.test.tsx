import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { StatCard } from '@/components/dashboard/StatCard'
import { BookOpen } from 'lucide-react'

describe('StatCard', () => {
  it('renders title and value', () => {
    render(<StatCard title="Total Students" value={42} icon={BookOpen} />)
    expect(screen.getByText('Total Students')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(<StatCard title="T" value="0" icon={BookOpen} subtitle="Last 30 days" />)
    expect(screen.getByText('Last 30 days')).toBeInTheDocument()
  })

  it('renders positive trend badge with correct text', () => {
    render(
      <StatCard
        title="T"
        value="100"
        icon={BookOpen}
        trend={{ value: '+12%', isPositive: true }}
      />
    )
    expect(screen.getByText('+12%')).toBeInTheDocument()
  })

  it('renders negative trend badge with correct text', () => {
    render(
      <StatCard
        title="T"
        value="50"
        icon={BookOpen}
        trend={{ value: '-5%', isPositive: false }}
      />
    )
    expect(screen.getByText('-5%')).toBeInTheDocument()
  })

  it('does not render trend badge when trend is omitted', () => {
    render(<StatCard title="T" value="0" icon={BookOpen} />)
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })
})
