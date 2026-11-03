import { describe, expect, it } from 'vitest'
import { entourage } from '../src/data/entourage'

describe('entourage transcription', () => {
  it('has every expected role count', () => {
    expect(entourage.parents.flat()).toHaveLength(4)
    expect(entourage.principalSponsors).toHaveLength(16)
    expect(entourage.principalSponsors.flatMap(({ left, right }) => [left, right])).toHaveLength(32)
    expect(entourage.honor[0].names).toHaveLength(1)
    expect(entourage.honor[1].names).toHaveLength(1)
    expect(entourage.attendants.map(({ left }) => left)).toHaveLength(8)
    expect(entourage.attendants.map(({ right }) => right)).toHaveLength(8)
    expect(entourage.symbols.map(({ names }) => names.length)).toEqual([2, 2, 2])
    expect(entourage.bearers.map(({ names }) => names.length)).toEqual([1, 1, 1])
    expect(entourage.flowerGirls.flatMap(({ left, right }) => [left, right])).toHaveLength(4)
    expect(entourage.cousin).toBe('Josel Francis M. Aguelo')
  })

  it('preserves supplied order and intentional repeated names', () => {
    expect(entourage.principalSponsors[0]).toEqual({ left: 'Dr. Josel Rey L. Aguelo', right: 'Dr. Allyne Montecillo Aguelo' })
    expect(entourage.principalSponsors[15]).toEqual({ left: 'Hon. Joel G. Calma', right: 'Mrs. Mina C. Calma' })
    expect(entourage.symbols[0].names).toEqual(['Mr. Marc Jayson C. Abe', 'Mrs. Allyza A. Abe'])
    expect(entourage.attendants[7]).toEqual({ left: 'Glenn Angelo V. Oliva', right: 'Samantha J. Berongoy' })
  })
})
