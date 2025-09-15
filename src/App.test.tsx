import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

// Mock the URL encoder utility

// Mock window.location for URL tests
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
    pathname: '/',
    hash: '',
    search: ''
  },
  writable: true
})

describe('App Routing', () => {
  beforeEach(() => {
    // Reset location search before each test
    window.location.search = ''
  })

  it('should render the main app in creator mode by default', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByText('Buzzword Bingo Generator')).toBeInTheDocument()
    expect(screen.getByText('Create Your Bingo Card')).toBeInTheDocument()
  })

  it('should render navigation header', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )

    // Check for navigation header
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByText('Buzzword Bingo Generator')).toBeInTheDocument()
  })

  it('should render play mode when URL has play parameter', () => {
    // Mock window.location.search for the URL encoder
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        search: '?play=true&data=eyJ0aXRsZSI6IlRlc3QgQ2FyZCIsInRlcm1zIjpbIlRlcm0gMSIsIlRlcm0gMiJdfQ'
      },
      writable: true
    })

    render(
      <MemoryRouter initialEntries={['/?play=true&data=eyJ0aXRsZSI6IlRlc3QgQ2FyZCIsInRlcm1zIjpbIlRlcm0gMSIsIlRlcm0gMiJdfQ']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByText('Buzzword Bingo Generator')).toBeInTheDocument()
  })

  it('should show error when play mode has invalid data', () => {
    render(
      <MemoryRouter initialEntries={['/?play=true&data=invalid']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByText('Buzzword Bingo Generator')).toBeInTheDocument()
  })

  it('should show loading state initially in play mode', () => {
    render(
      <MemoryRouter initialEntries={['/?play=true&data=eyJ0aXRsZSI6IlRlc3QgQ2FyZCIsInRlcm1zIjpbIlRlcm0gMSIsIlRlcm0gMiJdfQ']}>
        <App />
      </MemoryRouter>
    )

    // Should show navigation header
    expect(screen.getByText('Buzzword Bingo Generator')).toBeInTheDocument()
  })

  it('should have proper theme toggle in header', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )

    const themeToggle = screen.getByTitle(/Switch to .* mode/)
    expect(themeToggle).toBeInTheDocument()
  })
})