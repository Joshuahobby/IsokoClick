# Kinyarwanda strings awaiting native review

37 strings in `messages/rw.json` were written without a fluent speaker.
They were built from vocabulary already established in that file — `Nta foto`
for "no photo", `Ongeraho` for "add", `byanze` for "failed", `Guhindura`
for "update" — and follow its existing register, but they have not been checked
by anyone who speaks the language.

They are listed here rather than left as a code comment because the rest of
`rw.json` is a genuine translation and there is otherwise no way to tell which
entries are trustworthy.

**Everything else in `rw.json` predates this and is not in question.**

Two guards are already in place, so this is a quality review and not a
correctness one:

- `src/i18n/messages.test.ts` fails the build if either locale gains a key the
  other lacks, if any message is empty, or if a translation drops an
  interpolated value. `src/i18n/request.ts` loads a single locale file with no
  fallback chain, so a missing key throws at render time for every Kinyarwanda
  reader — the test exists to make that impossible to ship.
- Locale keys are never invented ad hoc in components; every string routes
  through these files.

Delete this document once the table has been reviewed.

### Product image manager (admin + partner)

| Key | English | Kinyarwanda |
|---|---|---|
| `productImages.title` | Product images | Amafoto y’igicuruzwa |
| `productImages.subtitle` | The first image is the one shoppers see in search and on cards. | Ifoto ya mbere ni yo abaguzi babona mu bushakashatsi no ku makarita. |
| `productImages.count` | {used} of {max} | {used} kuri {max} |
| `productImages.primary` | Main | Iy’ibanze |
| `productImages.altLabel` | Image description | Ibisobanuro by’ifoto |
| `productImages.altPlaceholder` | Describe what the photo shows | Sobanura icyo ifoto yerekana |
| `productImages.setPrimaryAt` | Make image {position} the main image | Shyira ifoto ya {position} ku mwanya w’ibanze |
| `productImages.moveUpAt` | Move image {position} earlier | Imura ifoto ya {position} imbere |
| `productImages.moveDownAt` | Move image {position} later | Imura ifoto ya {position} inyuma |
| `productImages.removeAt` | Remove image {position} | Kuraho ifoto ya {position} |
| `productImages.confirmRemove` | Confirm | Emeza |
| `productImages.addLabel` | Add images | Ongeraho amafoto |
| `productImages.addHint` | JPEG, PNG or WebP. Photos are resized on your device before upload. | JPEG, PNG cyangwa WebP. Amafoto agabanywa ku gikoresho cyawe mbere yo kohererezwa. |
| `productImages.atCapacity` | You have reached the limit of {max} images. Remove one to add another. | Wageze ku mubare ntarengwa w’amafoto {max}. Kuraho rimwe kugira ngo wongereho irindi. |
| `productImages.processing` | Preparing images… | Gutegura amafoto… |
| `productImages.uploading` | Uploading… | Kohereza… |

### Partner product page

| Key | English | Kinyarwanda |
|---|---|---|
| `partner.catalogDetail.metaTitle` | Product | Igicuruzwa |
| `partner.catalogDetail.backToCatalog` | Back to catalog | Subira ku bicuruzwa |
| `partner.catalogDetail.subtitle` | Manage the photos shoppers see for this listing. | Genzura amafoto abaguzi babona kuri iki gicuruzwa. |
| `partner.catalogDetail.price` | Price | Igiciro |
| `partner.catalogDetail.unit` | Unit | Igipimo |
| `partner.catalogDetail.status` | Status | Uko bihagaze |
| `partner.catalogDetail.slug` | Slug | Slug |
| `partner.catalogDetail.notApproved` | Your partner account must be approved before you can manage product images. | Konti yawe y’umufatanyabikorwa igomba kwemezwa mbere yo kugenzura amafoto y’ibicuruzwa. |

### Image upload errors

| Key | English | Kinyarwanda |
|---|---|---|
| `errors.imageNoneSelected` | No image selected. | Nta foto watoranyije. |
| `errors.imageTooMany` | A product can have at most {max} images. | Igicuruzwa gishobora kugira amafoto {max} gusa. |
| `errors.imageTooLarge` | That image is too large. Please use a smaller file. | Iyi foto ni nini cyane. Koresha indi ntoya. |
| `errors.imageBadFormat` | Only JPEG, PNG and WebP images are accepted. | Amafoto ya JPEG, PNG na WebP gusa ni yo yemewe. |
| `errors.imageUploadFailed` | Failed to upload the image. Please try again. | Kohereza ifoto byanze. Ongera ugerageze. |
| `errors.imageNotFound` | Image not found. | Ifoto ntiyabonetse. |
| `errors.imageDeleteFailed` | Failed to remove the image. Please try again. | Gukuraho ifoto byanze. Ongera ugerageze. |
| `errors.imageUpdateFailed` | Failed to update the image. Please try again. | Guhindura ifoto byanze. Ongera ugerageze. |
| `errors.imageAltRequired` | Image description is required. | Ibisobanuro by’ifoto birasabwa. |
| `errors.imageAltTooLong` | Image description must be 200 characters or fewer. | Ibisobanuro by’ifoto ntibigomba kurenga inyuguti 200. |

### Admin orders

| Key | English | Kinyarwanda |
|---|---|---|
| `admin.orders.filterByStatus` | Filter by status | Shungura ukurikije uko bihagaze |
| `admin.orders.viewOrder` | View order {order} | Reba itumiza {order} |

### Admin partners

| Key | English | Kinyarwanda |
|---|---|---|
| `admin.partners.viewPartner` | View partner {partner} | Reba umufatanyabikorwa {partner} |
