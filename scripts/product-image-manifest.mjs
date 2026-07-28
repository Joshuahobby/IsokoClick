/**
 * Maps catalog slugs to source photographs in the ISOKOCLICK asset folder.
 *
 * Kept as plain data so swapping a photo is a one-line edit and re-running the
 * uploader picks it up.
 *
 * `crop` values are fractions of the source to REMOVE from each edge, applied
 * before the square resize. They exist to cut third-party marks out of
 * otherwise usable frames — a supplier logo band, a burned-in model number, a
 * stock-library caption. Sources whose marks cannot be cropped without
 * destroying the subject are excluded entirely and listed in EXCLUDED below.
 *
 * Order matters: index 0 becomes the primary image and the PDP hero, the rest
 * become the thumbnail row. The PDP shows at most 4 thumbnails, so 5 entries
 * per product is the useful ceiling.
 */

/** Sources deliberately never shipped, with the reason. */
export const EXCLUDED = {
  'image-gen (1).png': 'Shutterstock watermark and image-ID strip across the footer',
  'image-gen (15).png': 'Chinese supplier catalog sheet with a competitor name and model numbers',
  'image-gen (66).png': 'full-frame Fyeer brand advertisement, mark cannot be cropped out',
  'image-gen (61).png': 'Chinese marketing copy overlaps the subject',
  'image-gen (32).png': 'competitor model codes (OTIT-*) printed under every unit',
}

export const MANIFEST = [
  // ── Existing products that had no image, or a better one available ──
  {
    slug: 'ceramic-tiles-60x60',
    images: [
      { file: 'image-gen (48).png', alt: 'Polished porcelain floor tiles laid in an open-plan living room' },
      { file: 'image-gen (45).png', alt: 'Polished porcelain floor reflecting light in a furnished lounge' },
      { file: 'image-gen (16).png', alt: 'Porcelain floor tiles running through a living and dining area' },
      { file: 'image-gen (2).png', alt: 'Tile showroom display racks holding porcelain floor tile samples' },
    ],
  },
  {
    slug: 'interior-emulsion-20l',
    images: [
      { file: 'Iyaga-plus.png', alt: 'Two tins of Iyaga Plus Premium Emulsion weather guard paint in white' },
    ],
  },

  // ── Plumbing: WC ────────────────────────────────────────────────────
  {
    slug: 'wall-hung-toilet',
    images: [
      {
        file: 'image-gen (27).png',
        crop: { top: 0.1 },
        alt: 'White rimless wall-hung toilet mounted in a dark tiled bathroom',
      },
    ],
  },
  {
    slug: 'smart-bidet-toilet',
    images: [
      { file: 'image-gen (29).png', alt: 'Black smart bidet toilet with the lid open showing the blue-lit bowl' },
      { file: 'image-gen (30).png', alt: 'Dimension drawing of the smart bidet toilet: 700 by 445 by 145 millimetres' },
      { file: 'image-gen (26).png', alt: 'Cutaway diagram showing the toilet booster pump and auxiliary punching ports' },
      { file: 'image-gen (28).png', alt: 'Transparent cutaway of the toilet trapway and flush mechanism' },
    ],
  },
  {
    slug: 'close-coupled-toilet',
    images: [
      { file: 'image-gen (24).png', alt: 'Row of white close-coupled toilet suites on a showroom display' },
      { file: 'image-gen (25).png', alt: 'White close-coupled toilet suites lined up on a dark showroom floor' },
      { file: 'image-gen (7).png', alt: 'Close-coupled toilet installed in a tiled bathroom with a shower screen' },
      { file: 'image-gen (41).png', alt: 'Close-coupled toilet with a bidet spray fitted beside a vanity unit' },
    ],
  },

  // ── Plumbing: basins ────────────────────────────────────────────────
  {
    slug: 'countertop-basin-white',
    images: [
      { file: 'image-gen (52).png', alt: 'White ceramic countertop basin under a round mirror with a black tap' },
    ],
  },
  {
    slug: 'vessel-basin-black-round',
    images: [
      { file: 'image-gen (55).png', alt: 'Matte black round vessel basin on a white countertop with a tall black mixer' },
      { file: 'image-gen (57).png', alt: 'Matte black basin on a dark vanity beneath a backlit round mirror' },
    ],
  },
  {
    slug: 'vessel-basin-black-rect',
    images: [
      { file: 'image-gen (58).png', alt: 'Matte black rectangular vessel basin with a matching black basin mixer' },
    ],
  },
  {
    slug: 'vessel-basin-duotone',
    images: [
      { file: 'image-gen (59).png', alt: 'Round vessel basin glazed white inside and black outside with a black tap' },
      { file: 'image-gen (63).png', alt: 'Overhead view of the white and black round vessel basin and its mixer' },
    ],
  },
  {
    slug: 'vessel-basin-marble',
    images: [
      { file: 'image-gen (56).png', alt: 'Marble-pattern round vessel basin on a dark timber countertop' },
      { file: 'image-gen (60).png', alt: 'Marble-pattern basin installed on a white vanity top over oak drawers' },
      { file: 'image-gen (62).png', alt: 'Marble-pattern vessel basin beside a window on a fitted vanity unit' },
    ],
  },

  // ── Plumbing: showers ───────────────────────────────────────────────
  {
    slug: 'shower-column-black',
    images: [
      { file: 'image-gen (11).png', alt: 'Matte black rain shower column with hand shower on a white tiled wall' },
      { file: 'image-gen (12).png', alt: 'Matte black shower column installed in a walk-in shower enclosure' },
      { file: 'image-gen (10).png', alt: 'Matte black shower column shown with its exposed mixer valve options' },
    ],
  },
  {
    slug: 'shower-column-chrome',
    images: [
      { file: 'IMG-20251031-WA0045_6905e1f6003c1.jpg', alt: 'Chrome shower mixer set with hand shower and slide rail' },
      { file: 'IMG-20251031-WA0047_6905e0d4de7f8.jpg', alt: 'Chart of shower outlet types: rain, hand, muslim and wall shower' },
    ],
  },
  {
    slug: 'rain-shower-head-wall',
    images: [
      { file: 'image-gen (9).png', alt: 'Wall-mounted stainless rain shower head with a separate waterfall outlet' },
    ],
  },

  // ── Plumbing: taps ──────────────────────────────────────────────────
  {
    slug: 'basin-mixer-black-square',
    images: [
      { file: 'image-gen (68).png', alt: 'Matte black square basin mixer tap on a white basin' },
      {
        file: 'image-gen (65).png',
        crop: { top: 0.12 },
        alt: 'Matte black square basin mixer mounted on a white bathroom basin',
      },
    ],
  },
  {
    slug: 'basin-mixer-black-round',
    images: [
      {
        file: 'image-gen (13).png',
        crop: { bottom: 0.15 },
        alt: 'Matte black round basin mixer tap with a pull-out aerator spout',
      },
      {
        file: 'image-gen (14).png',
        crop: { bottom: 0.15 },
        alt: 'Side view of the matte black round basin mixer tap',
      },
    ],
  },
  {
    slug: 'sensor-basin-tap',
    images: [
      {
        file: 'image-gen (67).png',
        crop: { top: 0.12 },
        alt: 'Chrome infrared sensor basin tap mounted on a tiled bathroom counter',
      },
    ],
  },
  {
    slug: 'kitchen-faucet-spring',
    images: [
      { file: 'image-gen (31).png', alt: 'Matte black kitchen faucet with an exposed spring neck and pull-down spray' },
    ],
  },
  {
    slug: 'kitchen-faucet-gooseneck',
    images: [
      { file: 'image-gen (33).png', alt: 'Matte black square gooseneck kitchen faucet over a stainless sink' },
      { file: 'image-gen (34).png', alt: 'Dimension drawing of the gooseneck faucet: 190 millimetre reach, 230 millimetre height' },
      { file: 'image-gen (35).png', alt: 'Side profile of the matte black square gooseneck kitchen faucet' },
    ],
  },

  // ── Plumbing: sinks ─────────────────────────────────────────────────
  {
    slug: 'kitchen-sink-multifunction',
    images: [
      { file: 'image-gen (39).png', alt: 'Stainless workstation sink with waterfall mixer, cutting board and drying rack' },
      { file: 'image-gen (20).png', alt: 'Black workstation kitchen sink with the pull-out spray running' },
      { file: 'image-gen (22).png', alt: 'Workstation sink installed in a light oak kitchen run' },
      { file: 'image-gen (23).png', alt: 'The workstation sink shown with all included accessories laid out' },
      { file: 'image-gen (36).png', alt: 'Dimension drawing of the workstation sink: 750 by 450 millimetres' },
    ],
  },
  {
    slug: 'kitchen-sink-double-bowl',
    images: [
      { file: 'image-gen (40).png', alt: 'Brushed stainless steel double-bowl undermount kitchen sink' },
    ],
  },
  {
    slug: 'sink-accessory-set',
    images: [
      { file: 'image-gen (42).png', alt: 'Sink accessory set: drying rollers, adjustable baskets, soap dispenser and cutting boards' },
    ],
  },

  // ── Finishes: tiles and stone ───────────────────────────────────────
  {
    slug: 'marble-tile-calacatta-60x60',
    images: [
      { file: 'image-gen (19).png', alt: 'Calacatta marble-effect porcelain tiles with gold and grey veining' },
      { file: 'image-gen (18).png', alt: 'Edge view of Calacatta marble-effect porcelain tiles showing the gold veining' },
      { file: 'image-gen (17).png', alt: 'Calacatta marble-effect porcelain panels standing against a pale wall' },
      { file: 'image-gen (49).png', alt: 'Calacatta marble-effect floor tiles in a bright furnished room' },
    ],
  },
  {
    slug: 'marble-slab-bookmatched',
    images: [
      { file: 'image-gen (5).png', alt: 'Book-matched marble slabs lit as a feature wall with mirrored veining' },
      { file: 'image-gen (6).png', alt: 'Large-format marble slabs displayed upright in a stone showroom' },
    ],
  },
  {
    slug: 'porcelain-tile-grey-60x60',
    images: [
      { file: 'image-gen (53).png', alt: 'Grey and white marble-effect porcelain tiles stacked and fanned out' },
      { file: 'image-gen (47).png', alt: 'Grey porcelain floor tiles running through an open-plan living room' },
      { file: 'image-gen (50).png', alt: 'Grey porcelain floor in a showroom lounge with green armchairs' },
    ],
  },
  {
    slug: 'stone-tile-dark-60x60',
    images: [
      {
        file: 'image-gen.png',
        crop: { bottom: 0.15 },
        alt: 'Dark slate and rust stone-effect porcelain tiles fanned out on a pale surface',
      },
      { file: 'image-gen (3).png', alt: 'Dark stone-effect tiles displayed along a curved showroom wall' },
    ],
  },
  {
    slug: 'porcelain-tile-polished-80x80',
    images: [
      { file: 'image-gen (51).png', alt: 'Large-format polished porcelain floor tiles in a white bathroom' },
      { file: 'image-gen (4).png', alt: 'Large-format polished porcelain panels on a showroom display frame' },
    ],
  },
  {
    slug: 'mortise-lock-set',
    images: [
      {
        file: 'IMG-20251031-WA00581_6905de6ee0320.jpg',
        alt: 'Antique brass mortise door lock set with lever handle, backplate and keys',
      },
    ],
  },
]
