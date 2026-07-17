import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getAdminProductById } from '@/lib/supabase/queries/admin'
import { getCategories } from '@/lib/supabase/queries/products'
import { ProductForm } from '@/components/admin/product-form'
import { updateAdminProduct } from '../actions'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const t = await getTranslations('admin.productForm')
  return { title: t('editTitle') }
}

type Props = { params: Promise<{ id: string }> }

export default async function AdminEditProductPage({ params }: Props) {
  const { id } = await params
  const [product, categories] = await Promise.all([getAdminProductById(id), getCategories()])

  if (!product) notFound()

  return (
    <ProductForm
      action={updateAdminProduct.bind(null, product.id)}
      categories={categories}
      product={product}
    />
  )
}
