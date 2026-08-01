import { getTranslations } from 'next-intl/server'
import { getCategoryTree } from '@/lib/supabase/queries/products'
import { ProductForm } from '@/components/admin/product-form'
import { createAdminProduct } from '../actions'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const t = await getTranslations('admin.productForm')
  return { title: t('newTitle') }
}

export default async function AdminNewProductPage() {
  const categories = await getCategoryTree()

  return <ProductForm action={createAdminProduct} categories={categories} />
}
