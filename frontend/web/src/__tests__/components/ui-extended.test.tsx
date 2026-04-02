import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'

// ── Button ────────────────────────────────────────────────────────────────────

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('calls onClick handler when clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Go</Button>)
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when the disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('does not fire onClick when disabled', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button disabled onClick={handleClick}>Nope</Button>)
    await user.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies a custom className', () => {
    render(<Button className="my-custom-class">Styled</Button>)
    expect(screen.getByRole('button')).toHaveClass('my-custom-class')
  })

  it('renders as an anchor element when asChild is used with an <a>', () => {
    render(
      <Button asChild>
        <a href="/home">Home</a>
      </Button>
    )
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
  })

  it('accepts type="submit"', () => {
    render(<Button type="submit">Submit</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('renders variant="destructive" without throwing', () => {
    expect(() => render(<Button variant="destructive">Delete</Button>)).not.toThrow()
  })

  it('renders size="sm" without throwing', () => {
    expect(() => render(<Button size="sm">Small</Button>)).not.toThrow()
  })

  it('renders size="lg" without throwing', () => {
    expect(() => render(<Button size="lg">Large</Button>)).not.toThrow()
  })
})

// ── Badge ─────────────────────────────────────────────────────────────────────

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge>Active</Badge>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders the default variant without throwing', () => {
    expect(() => render(<Badge>Default</Badge>)).not.toThrow()
  })

  it('renders the secondary variant without throwing', () => {
    expect(() => render(<Badge variant="secondary">Beta</Badge>)).not.toThrow()
  })

  it('renders the destructive variant without throwing', () => {
    expect(() => render(<Badge variant="destructive">Error</Badge>)).not.toThrow()
  })

  it('renders the outline variant without throwing', () => {
    expect(() => render(<Badge variant="outline">Outline</Badge>)).not.toThrow()
  })

  it('applies a custom className', () => {
    render(<Badge className="custom-badge">Tag</Badge>)
    expect(screen.getByText('Tag')).toHaveClass('custom-badge')
  })
})

// ── Input ─────────────────────────────────────────────────────────────────────

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input />)
    expect(document.querySelector('input')).toBeInTheDocument()
  })

  it('accepts text typed by the user', async () => {
    const user = userEvent.setup()
    render(<Input />)
    const input = document.querySelector('input') as HTMLInputElement
    await user.type(input, 'hello')
    expect(input.value).toBe('hello')
  })

  it('is disabled when the disabled prop is set', () => {
    render(<Input disabled />)
    expect(document.querySelector('input')).toBeDisabled()
  })

  it('renders type="password" correctly', () => {
    render(<Input type="password" />)
    expect(document.querySelector('input')).toHaveAttribute('type', 'password')
  })

  it('renders a placeholder', () => {
    render(<Input placeholder="Enter email" />)
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument()
  })

  it('applies a custom className', () => {
    render(<Input className="my-input" />)
    expect(document.querySelector('input')).toHaveClass('my-input')
  })

  it('fires onChange when the value changes', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Input onChange={handleChange} />)
    const input = document.querySelector('input') as HTMLInputElement
    await user.type(input, 'a')
    expect(handleChange).toHaveBeenCalled()
  })

  it('respects a controlled value', () => {
    render(<Input value="controlled" readOnly />)
    expect((document.querySelector('input') as HTMLInputElement).value).toBe('controlled')
  })
})

// ── Label ─────────────────────────────────────────────────────────────────────

describe('Label', () => {
  it('renders its children', () => {
    render(<Label>Email address</Label>)
    expect(screen.getByText('Email address')).toBeInTheDocument()
  })

  it('is associated with an input via htmlFor', () => {
    render(
      <>
        <Label htmlFor="email-input">Email</Label>
        <Input id="email-input" />
      </>
    )
    const label = screen.getByText('Email')
    expect(label).toHaveAttribute('for', 'email-input')
  })

  it('applies a custom className', () => {
    render(<Label className="custom-label">Name</Label>)
    expect(screen.getByText('Name')).toHaveClass('custom-label')
  })
})

// ── Card ──────────────────────────────────────────────────────────────────────

describe('Card', () => {
  it('renders a Card with content', () => {
    render(<Card>Card body</Card>)
    expect(screen.getByText('Card body')).toBeInTheDocument()
  })

  it('applies a custom className', () => {
    const { container } = render(<Card className="my-card">Content</Card>)
    expect(container.firstChild).toHaveClass('my-card')
  })

  it('renders CardHeader with children', () => {
    render(
      <Card>
        <CardHeader>Header content</CardHeader>
      </Card>
    )
    expect(screen.getByText('Header content')).toBeInTheDocument()
  })

  it('renders CardTitle', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>My Title</CardTitle>
        </CardHeader>
      </Card>
    )
    expect(screen.getByRole('heading', { name: 'My Title' })).toBeInTheDocument()
  })

  it('renders CardDescription', () => {
    render(
      <Card>
        <CardHeader>
          <CardDescription>A short description</CardDescription>
        </CardHeader>
      </Card>
    )
    expect(screen.getByText('A short description')).toBeInTheDocument()
  })

  it('renders CardContent', () => {
    render(
      <Card>
        <CardContent>Body text here</CardContent>
      </Card>
    )
    expect(screen.getByText('Body text here')).toBeInTheDocument()
  })

  it('renders CardFooter', () => {
    render(
      <Card>
        <CardFooter>Footer info</CardFooter>
      </Card>
    )
    expect(screen.getByText('Footer info')).toBeInTheDocument()
  })

  it('composes all Card sub-components together', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    )
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })
})
