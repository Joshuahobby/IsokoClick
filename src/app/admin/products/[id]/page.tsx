import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getAdminProductById } from '@/lib/supabase/queries/admin'
import { getCategoryTree } from '@/lib/supabase/queries/products'
import { getProductImages } from '@/lib/supabase/queries/product-images'
import { ProductForm } from '@/components/admin/product-form'
import { ProductImageManager } from '@/components/shared/product-image-manager'
import { updateAdminProduct } from '../actions'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const t = await getTranslations('admin.productForm')
  return { title: t('editTitle') }
}

type Props = { params: Promise<{ id: string }> }

export default async function AdminEditProductPage({ params }: Props) {
  const { id } = await params
  const [product, categories, images] = await Promise.all([
    getAdminProductById(id),
    getCategoryTree(),
    getProductImages(id),
  ])

  if (!product) notFound()

  return (
    <div className="max-w-3xl space-y-6">
      <ProductForm
        action={updateAdminProduct.bind(null, product.id)}
        categories={categories}
        product={product}
      />
      {/* Outside the product form on purpose: image mutations save immediately
          against their own actions, so nesting them would make the surrounding
          form's submit look like it owned unsaved image changes. */}
      <ProductImageManager productId={product.id} images={images} />
    </div>
  )
}
