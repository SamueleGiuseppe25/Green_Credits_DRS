import { getToken, setToken, isAuthenticated, logout } from './auth'

beforeEach(() => {
  localStorage.clear()
})

describe('getToken', () => {
  it('returns null when no token is stored', () => {
    expect(getToken()).toBeNull()
  })
})

describe('setToken', () => {
  it('stores a token and retrieves it', () => {
    setToken('abc123')
    expect(getToken()).toBe('abc123')
  })

  it('removes the token when called with null', () => {
    setToken('abc123')
    setToken(null)
    expect(getToken()).toBeNull()
  })
})

describe('isAuthenticated', () => {
  it('returns false when no token exists', () => {
    expect(isAuthenticated()).toBe(false)
  })

  it('returns true when a token exists', () => {
    setToken('token')
    expect(isAuthenticated()).toBe(true)
  })
})

describe('logout', () => {
  it('clears the stored token', () => {
    setToken('token')
    logout()
    expect(getToken()).toBeNull()
  })
})
