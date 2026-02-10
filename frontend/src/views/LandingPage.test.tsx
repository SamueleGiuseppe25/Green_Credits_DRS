import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../test/server'
import { AuthProvider } from '../context/AuthContext'
import { LandingPage } from './LandingPage'

// Start MSW server for all tests in this file
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
})
afterAll(() => server.close())

// Override /auth/me to return 401 so LandingPage shows the public view
// (otherwise AuthContext would think user is logged in and redirect)
beforeEach(() => {
  server.use(
    http.get('*/auth/me', () => {
      return new HttpResponse(null, { status: 401 })
    })
  )
})

function renderLanding() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <LandingPage />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('LandingPage', () => {
  it('renders the hero heading', async () => {
    renderLanding()
    expect(
      await screen.findByRole('heading', { level: 1, name: /green credits/i })
    ).toBeInTheDocument()
  })

  it('renders Get Started CTA linking to signup', async () => {
    renderLanding()
    const cta = await screen.findByRole('link', { name: /get started free/i })
    expect(cta).toBeInTheDocument()
    expect(cta).toHaveAttribute('href', '/signup')
  })

  it('renders How It Works section', async () => {
    renderLanding()
    expect(
      await screen.findByRole('heading', { name: /how it works/i })
    ).toBeInTheDocument()
  })

  it('renders pricing section with 3 plans', async () => {
    renderLanding()
    expect(
      await screen.findByRole('heading', { name: /simple, transparent pricing/i })
    ).toBeInTheDocument()
    // Each plan has a "Get Started" link
    const planButtons = await screen.findAllByRole('link', { name: /^get started$/i })
    expect(planButtons).toHaveLength(3)
  })

  it('newsletter form clears the input on submit', async () => {
    const user = userEvent.setup()
    renderLanding()
    const input = await screen.findByPlaceholderText(/enter your email/i)
    const button = screen.getByRole('button', { name: /subscribe/i })

    await user.type(input, 'hello@test.com')
    expect(input).toHaveValue('hello@test.com')

    await user.click(button)
    expect(input).toHaveValue('')
  })
})
