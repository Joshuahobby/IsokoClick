import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getPartnerByUserId, getPartnerProductById } from '@/lib/supabase/queries/partners'
import { getProductImages } from '@/lib/supabase/queries/product-images'
import { ProductImageManager } from '@/components/shared/product-image-manager'
import { formatRwf } from '@/lib/utils/currency'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const t = await getTranslations('partner.catalogDetail')
  return { title: t('metaTitle') }
}

type Props = { params: Promise<{ id: string }> }

export default async function PartnerProductPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const partner = await getPartnerByUserId(user.id)
  if (!partner) redirect('/partner/dashboard')

  // Scoped to this partner, so another partner's id 404s rather than leaking.
  const product = await getPartnerProductById(partner.id, id)
  if (!product) notFound()

  const [images, t, tCommon] = await Promise.all([
    getProductImages(product.id),
    getTranslations('partner.catalogDetail'),
    getTranslations('common'),
  ])

  return (
    <div className="max-w-3xl space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-neutral-400">
        <Link href="/partner/catalog" className="flex items-center gap-1 hover:text-white">
          <ChevronLeft size={16} aria-hidden="true" /> {t('backToCatalog')}
        </Link>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-white">{product.name_en}</h1>
        <p className="mt-1 text-sm text-neutral-400">{t('subtitle')}</p>
      </div>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-neutral-400">{t('price')}</dt>
            <dd className="mt-0.5 font-medium text-white">
              {formatRwf(product.sale_price ?? product.base_price)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-400">{t('unit')}</dt>
            <dd className="mt-0.5 font-medium text-white">{product.unit_label_en}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-400">{t('status')}</dt>
            <dd className="mt-0.5">
              <Badge
                className={
                  product.is_active
                    ? 'border-0 bg-green-500/10 text-green-400'
                    : 'border-0 bg-neutral-800 text-neutral-400'
                }
              >
                {product.is_active ? tCommon('active') : tCommon('inactive')}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-400">{t('slug')}</dt>
            <dd className="mt-0.5 truncate font-mono text-xs text-neutral-400">{product.slug}</dd>
          </div>
        </dl>
      </section>

      {partner.status === 'approved' ? (
        <ProductImageManager productId={product.id} images={images} />
      ) : (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-400">
          {t('notApproved')}
        </p>
      )}
    </div>
  )
}
