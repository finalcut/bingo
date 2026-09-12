import { describe, expect, it } from 'vitest'
import { getWebSocketUrl } from './gameClient'

describe('getWebSocketUrl', () => {
  it('uses secure same-origin WebSockets for HTTPS deployments', () => {
    expect(getWebSocketUrl({ protocol: 'https:', host: 'lootly-bingo.example.com', hostname: 'lootly-bingo.example.com', port: '' })).toBe('wss://lootly-bingo.example.com')
  })

  it('uses regular same-origin WebSockets for local HTTP development', () => {
    expect(getWebSocketUrl({ protocol: 'http:', host: 'localhost:5173', hostname: 'localhost', port: '5173' })).toBe('ws://localhost:3001')
  })

  it('keeps an explicit WebSocket URL override', () => {
    expect(getWebSocketUrl({ protocol: 'https:', host: 'lootly-bingo.example.com', hostname: 'lootly-bingo.example.com', port: '' }, 'wss://socket.example.com')).toBe('wss://socket.example.com')
  })
})