import type { ClientCommand, ServerEvent } from '../shared/protocol'

export class GameClient {
  private socket: WebSocket | undefined
  private readonly onEvent: (event: ServerEvent) => void

  constructor(onEvent: (event: ServerEvent) => void) {
    this.onEvent = onEvent
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3001'
      this.socket = new WebSocket(url)
      this.socket.onopen = () => resolve()
      this.socket.onerror = () => reject(new Error('Unable to connect to the bingo server'))
      this.socket.onmessage = (message) => this.onEvent(JSON.parse(message.data as string) as ServerEvent)
    })
  }

  send(command: ClientCommand): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) throw new Error('Not connected')
    this.socket.send(JSON.stringify(command))
  }
}