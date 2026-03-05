export type TextileMaterialType = 'fiber' | 'yarn' | 'fabric';

export type TextileMaterial = {
  name: string;
  type: TextileMaterialType;
  synonyms?: string[];
};

export const TEXTILE_MATERIALS: TextileMaterial[] = [
  { name: 'Cotton', type: 'fiber', synonyms: ['Organic Cotton', 'Pima Cotton', 'Egyptian Cotton'] },
  { name: 'Polyester', type: 'fiber', synonyms: ['PET'] },
  { name: 'Viscose / Rayon', type: 'fiber', synonyms: ['Rayon'] },
  { name: 'Modal', type: 'fiber' },
  { name: 'Lyocell (Tencel)', type: 'fiber', synonyms: ['Lyocell', 'Tencel'] },
  { name: 'Linen', type: 'fiber', synonyms: ['Flax'] },
  { name: 'Silk', type: 'fiber' },
  { name: 'Wool', type: 'fiber', synonyms: ['Merino Wool'] },
  { name: 'Nylon', type: 'fiber', synonyms: ['Polyamide'] },
  { name: 'Acrylic', type: 'fiber' },
  { name: 'Elastane / Spandex', type: 'fiber', synonyms: ['Spandex', 'Lycra'] },
  { name: 'Hemp', type: 'fiber' },
  { name: 'Jute', type: 'fiber' },
  { name: 'Bamboo (Regenerated)', type: 'fiber', synonyms: ['Bamboo Viscose'] },
  { name: 'Acetate', type: 'fiber' },
  { name: 'Triacetate', type: 'fiber' },
  { name: 'Polypropylene', type: 'fiber', synonyms: ['PP'] },
  { name: 'Polyethylene', type: 'fiber', synonyms: ['PE'] },
  { name: 'Aramid', type: 'fiber', synonyms: ['Kevlar', 'Nomex'] },

  { name: 'Cotton Yarn', type: 'yarn', synonyms: ['Carded Cotton Yarn', 'Combed Cotton Yarn'] },
  { name: 'Polyester Yarn', type: 'yarn' },
  { name: 'Viscose Yarn', type: 'yarn' },
  { name: 'Melange Yarn', type: 'yarn' },
  { name: 'Slub Yarn', type: 'yarn' },
  { name: 'Open-End (OE) Yarn', type: 'yarn', synonyms: ['OE Yarn', 'Rotor Yarn'] },
  { name: 'Ring Spun Yarn', type: 'yarn' },
  { name: 'Textured Yarn', type: 'yarn', synonyms: ['DTY', 'ATY'] },

  { name: 'Single Jersey Knit', type: 'fabric', synonyms: ['Single Jersey'] },
  { name: 'Rib Knit', type: 'fabric', synonyms: ['1x1 Rib', '2x2 Rib'] },
  { name: 'Interlock Knit', type: 'fabric', synonyms: ['Interlock'] },
  { name: 'Pique Knit', type: 'fabric', synonyms: ['Pique'] },
  { name: 'French Terry', type: 'fabric', synonyms: ['Terry'] },
  { name: 'Fleece', type: 'fabric' },
  { name: 'Denim', type: 'fabric' },
  { name: 'Twill', type: 'fabric' },
  { name: 'Poplin', type: 'fabric' },
  { name: 'Oxford', type: 'fabric' },
  { name: 'Satin', type: 'fabric' },
  { name: 'Chiffon', type: 'fabric' },
  { name: 'Georgette', type: 'fabric' },
  { name: 'Crepe', type: 'fabric' },
  { name: 'Canvas', type: 'fabric' },
  { name: 'Taffeta', type: 'fabric' },
  { name: 'Velvet', type: 'fabric' },
  { name: 'Corduroy', type: 'fabric' },
  { name: 'Jacquard', type: 'fabric' },
  { name: 'Lace', type: 'fabric' },
  { name: 'Non-woven', type: 'fabric', synonyms: ['Nonwoven'] }
];

export const MATERIAL_CATEGORY_SUGGESTIONS = Array.from(
  new Set(
    TEXTILE_MATERIALS.flatMap((m) => [m.name, ...(m.synonyms || [])])
      .map((s) => s.trim())
      .filter(Boolean)
  )
).sort((a, b) => a.localeCompare(b));
