import { getBingo75Mode, type Bingo75Mode } from './bingo75Modes'

export type RandomSource = () => number

export type BingoCell = {
  value: number | null
  marked: boolean
  free: boolean
}

export type BingoCard = {
  columns: readonly ['B', 'I', 'N', 'G', 'O']
  cells: BingoCell[]
}

const columns = ['B', 'I', 'N', 'G', 'O'] as const

function shuffle(values: number[], random: RandomSource): number[] {
  const result = [...values]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }

  return result
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

export function createCard(random: RandomSource = Math.random): BingoCard {
  const cells: BingoCell[] = []
  const columnValues = columns.map((_, column) => {
    const start = column * 15 + 1
    return shuffle(range(start, start + 14), random)
  })

  for (let row = 0; row < columns.length; row += 1) {
    for (let column = 0; column < columns.length; column += 1) {
      if (row === 2 && column === 2) {
        cells.push({ value: null, marked: true, free: true })
        continue
      }

      const valueIndex = row - (column === 2 && row > 2 ? 1 : 0)
      cells.push({ value: columnValues[column][valueIndex], marked: false, free: false })
    }
  }

  return { columns, cells }
}

export function createDrawBag(random: RandomSource = Math.random): number[] {
  return shuffle(range(1, 75), random)
}

export function markCell(card: BingoCard, row: number, column: number): BingoCard {
  if (row < 0 || row >= columns.length || column < 0 || column >= columns.length) {
    throw new Error('Cell coordinates must be between 0 and 4')
  }

  const index = row * 5 + column
  const cell = card.cells[index]
  if (!cell || cell.value === null) return card

  return {
    ...card,
    cells: card.cells.map((current, currentIndex) => currentIndex === index ? { ...current, marked: !current.marked } : current),
  }
}

export function isWinningCard(card: BingoCard, called: Set<number>, mode: Bingo75Mode = getBingo75Mode('standard')): boolean {
  const marked = (row: number, column: number): boolean => {
    const cell = card.cells[row * 5 + column]
    return Boolean(cell?.free || (cell?.value !== null && called.has(cell.value)))
  }

  return mode.patterns.some((pattern) => pattern.every(([row, column]) => marked(row, column)))
}

export function isWinningSelection(card: BingoCard, called: Set<number>, mode: Bingo75Mode = getBingo75Mode('standard')): boolean {
  const selected = (row: number, column: number): boolean => {
    const cell = card.cells[row * 5 + column]
    return Boolean(cell?.free || (cell?.marked && cell.value !== null && called.has(cell.value)))
  }
  return mode.patterns.some((pattern) => pattern.every(([row, column]) => selected(row, column)))
}