export type Bingo75ModeId =
  | 'standard'
  | '7'
  | 'plus'
  | 'blackout'
  | 'checkerboard'
  | 'four-corners'
  | 'letter-h'
  | 'letter-t'
  | 'letter-x'
  | 'letter-z'
  | 'large-picture-frame'
  | 'tic-tac-toe'

export type BingoCoordinate = readonly [row: number, column: number]

export type Bingo75Mode = {
  id: Bingo75ModeId
  name: string
  description: string
  patterns: readonly (readonly BingoCoordinate[])[]
}

const row = (rowIndex: number): BingoCoordinate[] => Array.from({ length: 5 }, (_, column) => [rowIndex, column])
const column = (columnIndex: number): BingoCoordinate[] => Array.from({ length: 5 }, (_, rowIndex) => [rowIndex, columnIndex])
const diagonal = (reverse = false): BingoCoordinate[] => Array.from({ length: 5 }, (_, index) => [index, reverse ? 4 - index : index])
const allCells = (): BingoCoordinate[] => Array.from({ length: 25 }, (_, index) => [Math.floor(index / 5), index % 5])
const checkerboard = (): BingoCoordinate[] => allCells().filter(([rowIndex, columnIndex]) => (rowIndex + columnIndex) % 2 === 0)
const ticTacToe = (): BingoCoordinate[] => [0, 2, 4].flatMap((rowIndex) => [0, 2, 4].map((columnIndex) => [rowIndex, columnIndex] as BingoCoordinate))

// game modes defined at: https://www.compliance.lottery.nh.gov/sites/g/files/ehbemt686/files/inline-documents/approved-bingo-game-patterns.pdf
export const bingo75Modes: Record<Bingo75ModeId, Bingo75Mode> = {
  standard: {
    id: 'standard',
    name: 'Standard',
    description: 'Complete any row, column, or diagonal.',
    patterns: [...Array.from({ length: 5 }, (_, index) => row(index)), ...Array.from({ length: 5 }, (_, index) => column(index)), diagonal(), diagonal(true)],
  },
  '7': {
    id: '7',
    name: '7',
    description: 'Complete the top-left corner shape and center column.',
    patterns: [[[0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2]]],
  },
  plus: { id: 'plus', name: 'Plus', description: 'Complete the center row and center column.', patterns: [Array.from(new Map([...row(2), ...column(2)].map((coordinate) => [coordinate.join(','), coordinate])).values())] },
  blackout: { id: 'blackout', name: 'Blackout', description: 'Mark every space on the card.', patterns: [allCells()] },
  checkerboard: { id: 'checkerboard', name: 'Checkerboard', description: 'Mark the alternating checkerboard spaces.', patterns: [checkerboard()] },
  'four-corners': { id: 'four-corners', name: 'Four Corners', description: 'Mark all four corner spaces.', patterns: [[[0, 0], [0, 4], [4, 0], [4, 4]]] },
  'letter-h': { id: 'letter-h', name: 'Letter H', description: 'Complete both outside columns and the center row.', patterns: [Array.from(new Map([...column(0), ...column(4), ...row(2)].map((coordinate) => [coordinate.join(','), coordinate])).values())] },
  'letter-t': { id: 'letter-t', name: 'Letter T', description: 'Complete the top row and center column.', patterns: [Array.from(new Map([...row(0), ...column(2)].map((coordinate) => [coordinate.join(','), coordinate])).values())] },
  'letter-x': { id: 'letter-x', name: 'Letter X', description: 'Complete both diagonals.', patterns: [Array.from(new Map([...diagonal(), ...diagonal(true)].map((coordinate) => [coordinate.join(','), coordinate])).values())] },
  'letter-z': { id: 'letter-z', name: 'Letter Z', description: 'Complete the top row, bottom row, and reverse diagonal.', patterns: [Array.from(new Map([...row(0), ...row(4), ...diagonal(true)].map((coordinate) => [coordinate.join(','), coordinate])).values())] },
  'large-picture-frame': { id: 'large-picture-frame', name: 'Large Picture Frame', description: 'Complete the outside edge of the card.', patterns: [Array.from(new Map([...row(0), ...row(4), ...column(0), ...column(4)].map((coordinate) => [coordinate.join(','), coordinate])).values())] },
  'tic-tac-toe': { id: 'tic-tac-toe', name: 'Tic Tac Toe', description: 'Complete the nine spaces at the intersections of a 3x3 grid.', patterns: [ticTacToe()] },
}

export function getBingo75Mode(id: Bingo75ModeId): Bingo75Mode {
  return bingo75Modes[id]
}