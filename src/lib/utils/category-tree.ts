import type { CategoryRow } from '@/types/database'

// Pure shaping for the category taxonomy, kept out of the query module so it
// can be tested without a database. The wrappers in
// src/lib/supabase/queries/products.ts fetch the rows and call these.
//
// Products attach to the most specific category that fits — every basin is
// filed under Bathroom, none directly under its parent Plumbing — so both
// functions here exist to make a parent behave like the sum of its subtree.
// Get this wrong and the menu advertises 21 items that a click cannot produce.

export type CategoryNode = {
  id: string
  slug: string
  name_en: string
  name_rw: string | null
  /** Products in this category *and* everything nested under it. */
  productCount: number
  children: CategoryNode[]
}

/**
 * A category's id plus every descendant's, for filtering products by a parent.
 *
 * Returns [] for an unknown slug, which callers read as "no such category"
 * rather than "no filter" — the difference between an empty result page and
 * silently showing the whole catalog.
 */
export function collectSubtreeIds(categories: CategoryRow[], slug: string): string[] {
  const root = categories.find((category) => category.slug === slug)
  if (!root) return []

  // Breadth-first over a growing array. `seen` guards against a parent_id
  // cycle, which the schema permits (parent_id is a plain self-reference with
  // no constraint against it) and which would otherwise spin forever.
  const ids = [root.id]
  const seen = new Set(ids)

  for (let i = 0; i < ids.length; i++) {
    for (const category of categories) {
      if (category.parent_id === ids[i] && !seen.has(category.id)) {
        seen.add(category.id)
        ids.push(category.id)
      }
    }
  }
  return ids
}

/**
 * Nests the flat category rows and rolls direct product counts up the tree, so
 * each node's productCount matches what filtering on that slug returns.
 *
 * Row order is preserved, so the caller's `ORDER BY sort_order` decides sibling
 * order at every level.
 */
export function buildCategoryTree(
  categories: CategoryRow[],
  directCounts: Record<string, number>
): CategoryNode[] {
  // Descends from the roots, so it needs no cycle guard: a category caught in
  // a parent_id cycle has a non-null parent and is therefore never a root, and
  // nothing outside the cycle links into it. Such rows are simply dropped —
  // see the test. Only collectSubtreeIds, which walks downwards from an
  // arbitrary node, can actually enter one.
  const build = (parentId: string | null): CategoryNode[] =>
    categories
      .filter((category) => (category.parent_id ?? null) === parentId)
      .map((category) => {
        const children = build(category.id)
        return {
          id: category.id,
          slug: category.slug,
          name_en: category.name_en,
          name_rw: category.name_rw,
          productCount:
            (directCounts[category.id] ?? 0) +
            children.reduce((sum, child) => sum + child.productCount, 0),
          children,
        }
      })

  return build(null)
}
