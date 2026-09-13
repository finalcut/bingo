// game modes defined at: https://www.compliance.lottery.nh.gov/sites/g/files/ehbemt686/files/inline-documents/approved-bingo-game-patterns.pdf

// To add a mode: add its ID here, then register it below with one or more patterns.
// Coordinates are [row, column], zero-based from the top-left. Every coordinate in
// one pattern is required; multiple patterns mean any one complete pattern wins.
// The center square is free and automatically counts as marked.

export type Bingo75ModeId =
  | 'standard'
  | '7'
  | 'plus'
  | 'goalpost'
  | 'letter-a'
  | 'letter-u'
  | 'letter-w'
  | 'postage-stamp'
  | 'lucky-clover'
  | 'railroad-tracks'
  | 'small-diamond'
  | 'small-pyramid'
  | 'smiley-face'
  | 'starburst'
  | 'letter-y'
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
const goalpost = (): BingoCoordinate[] => Array.from(new Map([
  ...column(0).slice(0, 3),
  ...column(4).slice(0, 3),
  ...row(2),
  ...column(2).slice(2),
].map((coordinate) => [coordinate.join(','), coordinate])).values())

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
  goalpost: { id: 'goalpost', name: 'Goalpost', description: 'Complete the upper outside columns, center row, and lower center column.', patterns: [goalpost()] },
  blackout: { id: 'blackout', name: 'Blackout', description: 'Mark every space on the card.', patterns: [allCells()] },
  checkerboard: { id: 'checkerboard', name: 'Checkerboard', description: 'Mark the alternating checkerboard spaces.', patterns: [checkerboard()] },
  'four-corners': { id: 'four-corners', name: 'Four Corners', description: 'Mark all four corner spaces.', patterns: [[[0, 0], [0, 4], [4, 0], [4, 4]]] },
  'letter-a': { id: 'letter-a', name: 'Letter A', description: 'Complete the top of the letter A, its crossbar, and both lower outside columns.', patterns: [[[0, 2], [1, 1], [1, 3], ...row(2), ...column(0).slice(3), ...column(4).slice(3)]] },
  'letter-h': { id: 'letter-h', name: 'Letter H', description: 'Complete both outside columns and the center row.', patterns: [Array.from(new Map([...column(0), ...column(4), ...row(2)].map((coordinate) => [coordinate.join(','), coordinate])).values())] },
  'letter-t': { id: 'letter-t', name: 'Letter T', description: 'Complete the top row and center column.', patterns: [Array.from(new Map([...row(0), ...column(2)].map((coordinate) => [coordinate.join(','), coordinate])).values())] },
  'letter-u': { id: 'letter-u', name: 'Letter U', description: 'Complete both outside columns and the bottom row.', patterns: [Array.from(new Map([...column(0), ...column(4), ...row(4)].map((coordinate) => [coordinate.join(','), coordinate])).values())] },
  'letter-w': { id: 'letter-w', name: 'Letter W', description: 'Complete both outside columns and the lower inner points.', patterns: [[...column(0), ...column(4), [3, 1], [3, 3]]] },
  'letter-x': { id: 'letter-x', name: 'Letter X', description: 'Complete both diagonals.', patterns: [Array.from(new Map([...diagonal(), ...diagonal(true)].map((coordinate) => [coordinate.join(','), coordinate])).values())] },
  'letter-y': { id: 'letter-y', name: 'Letter Y', description: 'Complete the upper branches and center-column stem.', patterns: [[[0, 0], [0, 4], [1, 1], [1, 3], ...column(2).slice(2)]] },
  'letter-z': { id: 'letter-z', name: 'Letter Z', description: 'Complete the top row, bottom row, and reverse diagonal.', patterns: [Array.from(new Map([...row(0), ...row(4), ...diagonal(true)].map((coordinate) => [coordinate.join(','), coordinate])).values())] },
  'lucky-clover': { id: 'lucky-clover', name: 'Lucky Clover', description: 'Complete the four 2x2 corner blocks.', patterns: [[[0, 0], [0, 1], [0, 3], [0, 4], [1, 0], [1, 1], [1, 3], [1, 4], [3, 0], [3, 1], [3, 3], [3, 4], [4, 0], [4, 1], [4, 3], [4, 4]]] },
  'postage-stamp': { id: 'postage-stamp', name: 'Postage Stamp', description: 'Complete the upper-right 2x2 block.', patterns: [[[0, 3], [0, 4], [1, 3], [1, 4]]] },
  'railroad-tracks': { id: 'railroad-tracks', name: 'Railroad Tracks', description: 'Complete both outside columns.', patterns: [[...column(0), ...column(4)]] },
  'small-diamond': { id: 'small-diamond', name: 'Small Diamond', description: 'Complete the centered five-space diamond.', patterns: [[[1, 2], ...row(2).slice(1, 4), [3, 2]]] },
  'small-pyramid': { id: 'small-pyramid', name: 'Small Pyramid', description: 'Complete the centered three-level pyramid.', patterns: [[[2, 2], ...row(3).slice(1, 4), ...row(4)]] },
  'smiley-face': { id: 'smiley-face', name: 'Smiley Face', description: 'Complete the eyes, nose, and smiling mouth.', patterns: [[[1, 1], [1, 3], [2, 2], [3, 0], [3, 4], [4, 1], [4, 2], [4, 3]]] },
  starburst: { id: 'starburst', name: 'Starburst', description: 'Complete the corner points, inner points, and center bar.', patterns: [[[0, 0], [0, 4], [1, 1], [1, 3], [2, 1], [2, 2], [2, 3], [3, 1], [3, 3], [4, 0], [4, 4]]] },
  'large-picture-frame': { id: 'large-picture-frame', name: 'Large Picture Frame', description: 'Complete the outside edge of the card.', patterns: [Array.from(new Map([...row(0), ...row(4), ...column(0), ...column(4)].map((coordinate) => [coordinate.join(','), coordinate])).values())] },
  'tic-tac-toe': { id: 'tic-tac-toe', name: 'Tic Tac Toe', description: 'Complete the nine spaces at the intersections of a 3x3 grid.', patterns: [ticTacToe()] },
}

export function getBingo75Mode(id: Bingo75ModeId): Bingo75Mode {
  return bingo75Modes[id]
}