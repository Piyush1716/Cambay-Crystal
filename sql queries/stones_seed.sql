-- ─── Stones Seed Data ─────────────────────────────────────────────────────────
-- Run this in your Supabase SQL editor AFTER running stones_schema.sql.
-- You can upload stone cutout images to the "stones" bucket in Supabase Storage,
-- then update the image_url values accordingly.

-- 1. Insert popular crystal / gemstone types
INSERT INTO public.stones (name, slug, description, available)
VALUES
  (
    'Amethyst',
    'amethyst',
    'A powerful and protective crystal that relieves stress, soothes irritability, balances mood swings, and dispels anger, rage, fear, and anxiety. Enhances spiritual awareness and intuition.',
    true
  ),
  (
    'Amazonite',
    'amazonite',
    'Known as the Stone of Hope and Courage. Soothes emotional trauma, calms the mind and nervous system, and aligns the physical body with the etheric. Promotes truthful and harmonious communication.',
    true
  ),
  (
    'Rose Quartz',
    'rose-quartz',
    'The classic stone of unconditional love and infinite peace. Purifies and opens the heart at all levels to promote love, self-love, deep inner healing, and feelings of peace.',
    true
  ),
  (
    'Clear Quartz',
    'clear-quartz',
    'The "Master Healer" crystal that amplifies energy, thought, and the effect of other crystals. Absorbs, stores, releases, and regulates energy, unblocking spiritual vitality.',
    true
  ),
  (
    'Black Tourmaline',
    'black-tourmaline',
    'One of the premier stones for protection against negative energies and electromagnetic radiation. Grounds spiritual energy, increases physical vitality, and promotes clear rational thought.',
    true
  ),
  (
    'Citrine',
    'citrine',
    'The "Merchant''s Stone" or "Success Stone." Associated with abundance, prosperity, wealth, and manifestation. Inspires optimism, creativity, self-confidence, and joyful energy.',
    true
  ),
  (
    'Tiger Eye',
    'tiger-eye',
    'A stone of courage, motivation, and physical vitality. Helps release fear and anxiety, promotes mental clarity, and supports taking decisive action with confidence.',
    true
  ),
  (
    'Lapis Lazuli',
    'lapis-lazuli',
    'A stone of wisdom, truth, and royalty. Stimulates the Third Eye and Throat Chakras, encouraging self-awareness, authentic expression, and deep inner peace.',
    true
  ),
  (
    'Green Aventurine',
    'green-aventurine',
    'Known as the "Stone of Opportunity," thought to be the luckiest of all crystals. Attracts prosperity, boosts optimism, and comforts, harmonizes, and protects the heart.',
    true
  ),
  (
    'Pyrite',
    'pyrite',
    'Often called "Fool''s Gold," Pyrite is a potent stone of abundance, wealth, and protective shield against negative vibrations. Enhances willpower, focus, and leadership qualities.',
    true
  ),
  (
    'Labradorite',
    'labradorite',
    'A stone of mystical magic and transformation. Awakens intuitive and psychic abilities, strengthens faith in the self, and protects the aura against energy leaks.',
    true
  ),
  (
    'Carnelian',
    'carnelian',
    'A stabilizing stone with high vitality and energy. Anchors in reality, stimulates creativity, restores motivation, and encourages steadfast courage.',
    true
  ),
  (
    'Selenite',
    'selenite',
    'A luminous stone of pure white light and high vibration. Cleanses and charges other crystals, purifies negative auric fields, and fosters mental clarity and serenity.',
    true
  ),
  (
    'Moonstone',
    'moonstone',
    'A stone of inner growth and strength that channels soothing feminine lunar energy. Calms emotional instability, stress, and enhances intuition and new beginnings.',
    true
  ),
  (
    'Smoky Quartz',
    'smoky-quartz',
    'An outstanding grounding and anchoring stone. Neutralizes negative vibrations, dispels fear, lifts depression, and brings emotional calmness.',
    true
  ),
  (
    'Malachite',
    'malachite',
    'A stone of deep transformation and protection. Absorbs negative energies and pollutants, clears chakras, opens the heart to love, and stimulates risk-taking and change.',
    true
  ),
  (
    'Red Jasper',
    'red-jasper',
    'The "Supreme Nurturer." Sustains and supports through times of stress, brings tranquility and wholeness, and grounds energy while rectifying unjust situations.',
    true
  ),
  (
    'Turquoise',
    'turquoise',
    'An ancient sacred stone of purification, protection, and good fortune. Balances and aligns all chakras, stabilizing mood shifts and instilling inner tranquility.',
    true
  ),
  (
    'Howlite',
    'howlite',
    'An extremely calming stone that aids in sleep, meditation, and stress reduction. Prepares the mind to receive wisdom and insights, eliminating rage and uncontrolled anger.',
    true
  ),
  (
    'Seven Chakra Stones',
    '7-chakra',
    'A harmonious blend of seven distinct gemstones aligned with each energy vortex: Root, Sacral, Solar Plexus, Heart, Throat, Third Eye, and Crown. Balances mind, body, and spirit.',
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- ─── Example: Linking products to stones (multi-stone support) ────────────────
-- Once products exist, you can assign one or more stones to each product.
-- For example, to link product with ID 1 to Amethyst and Clear Quartz:
--
-- INSERT INTO public.product_stones (product_id, stone_id)
-- SELECT 1, id FROM public.stones WHERE slug IN ('amethyst', 'clear-quartz')
-- ON CONFLICT DO NOTHING;
--
-- Or auto-link products by matching keywords in product title/stone column:
-- INSERT INTO public.product_stones (product_id, stone_id)
-- SELECT p.id, s.id
-- FROM public.products p
-- CROSS JOIN public.stones s
-- WHERE (p.title ILIKE '%' || s.name || '%' OR p.stone ILIKE '%' || s.name || '%')
-- ON CONFLICT DO NOTHING;
