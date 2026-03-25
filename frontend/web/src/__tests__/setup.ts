import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './mocks/server'

// Start mock server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))

// Reset handlers after each test to avoid interference
afterEach(() => server.resetHandlers())

// Stop server after all tests
afterAll(() => server.close())
