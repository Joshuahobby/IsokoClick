import { describe, it, expect } from 'vitest'
import { buildCategoryTree, collectSubtreeIds } from './category-tree'
import type { CategoryRow } from '@/types/database'

// The live taxonomy, shaped the way getCategories() returns it: flat, ordered
// by sort_order, parents before their children. Plumbing is the interesting
// one — it owns a single PVC pipe directly and gets the rest of its 21 from
// Bathroom and Kitchen.
function category(partial: Partial<CategoryRow> & { id: string; slug: string }): CategoryRow {
  return {
    parent_id: null,
    name_en: partial.slug,
    name_rw: null,
    icon_url: null,
    sort_order: 0,
    is_active: true,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
    ...partial,
  } as CategoryRow
}

const CATEGORIES: CategoryRow[] = [
  category({ id: 'construction', slug: 'construction', name_en: 'Construction' }),
  category({ id: 'roofing', slug: 'roofing', name_en: 'Roofing', parent_id: 'construction' }),
  category({ id: 'plumbing', slug: 'plumbing', name_en: 'Plumbing' }),
  category({ id: 'bathroom', slug: 'bathroom', name_en: 'Bathroom', parent_id: 'plumbing' }),
  category({ id: 'kitchen', slug: 'kitchen', name_en: 'Kitchen', parent_id: 'plumbing' }),
  category({ id: 'tiles', slug: 'tiles', name_en: 'Tiles' }),
  category({ id: 'lights', slug: 'lights', name_en: 'Lights' }),
]

const DIRECT_COUNTS = {
  construction: 6,
  plumbing: 1,
  bathroom: 15,
  kitchen: 5,
  tiles: 6,
}

describe('collectSubtreeIds', () => {
  it('returns a parent with all of its children', () => {
    expect(collectSubtreeIds(CATEGORIES, 'plumbing')).toEqual([
      'plumbing',
      'bathroom',
      'kitchen',
    ])
  })

  it('returns just the id for a leaf', () => {
    expect(collectSubtreeIds(CATEGORIES, 'bathroom')).toEqual(['bathroom'])
    expect(collectSubtreeIds(CATEGORIES, 'lights')).toEqual(['lights'])
  })

  // An unknown slug must not collapse to "no filter" — getProducts() reads the
  // empty array as an empty result page rather than dropping the filter and
  // showing the entire catalog.
  it('returns nothing for an unknown slug', () => {
    expect(collectSubtreeIds(CATEGORIES, 'nope')).toEqual([])
  })

  it('terminates on a parent_id cycle', () => {
    const cyclic = [
      category({ id: 'a', slug: 'a', parent_id: 'b' }),
      category({ id: 'b', slug: 'b', parent_id: 'a' }),
    ]
    expect(collectSubtreeIds(cyclic, 'a').sort()).toEqual(['a', 'b'])
  })
})

describe('buildCategoryTree', () => {
  const tree = buildCategoryTree(CATEGORIES, DIRECT_COUNTS)

  it('returns only root categories at the top level, in row order', () => {
    expect(tree.map((node) => node.slug)).toEqual([
      'construction',
      'plumbing',
      'tiles',
      'lights',
    ])
  })

  it('nests children under their parent', () => {
    const plumbing = tree.find((node) => node.slug === 'plumbing')
    expect(plumbing?.children.map((child) => child.slug)).toEqual(['bathroom', 'kitchen'])
  })

  // The number the menu prints has to be the number a click delivers.
  it('rolls descendant counts up into the parent', () => {
    const plumbing = tree.find((node) => node.slug === 'plumbing')
    expect(plumbing?.productCount).toBe(21) // 1 direct + 15 bathroom + 5 kitchen
  })

  it('leaves a childless category on its own count', () => {
    expect(tree.find((node) => node.slug === 'tiles')?.productCount).toBe(6)
  })

  it('counts a parent whose only child is empty', () => {
    const construction = tree.find((node) => node.slug === 'construction')
    expect(construction?.productCount).toBe(6)
    expect(construction?.children[0]).toMatchObject({ slug: 'roofing', productCount: 0 })
  })

  it('reports zero for a category with no products anywhere', () => {
    expect(tree.find((node) => node.slug === 'lights')?.productCount).toBe(0)
  })

  // Building descends from the roots, so a cycle is unreachable rather than
  // infinite: both rows have a non-null parent, neither is a root, and nothing
  // outside the cycle points at them. They drop out instead of hanging.
  it('drops categories orphaned by a parent_id cycle', () => {
    const cyclic = [
      category({ id: 'a', slug: 'a', parent_id: 'b' }),
      category({ id: 'b', slug: 'b', parent_id: 'a' }),
      category({ id: 'root', slug: 'root' }),
    ]
    expect(buildCategoryTree(cyclic, {}).map((node) => node.slug)).toEqual(['root'])
  })
})
