/**
 * CATBOTICA Lunar New Year Badge — ERC-1155 Compatible Metadata
 * Lore Anchor: CAT-EVENT-LMRP-2026-HORSE
 *
 * This metadata schema follows the ERC-1155 Metadata URI JSON Schema
 * and is ready for IPFS upload via Pinata, NFT.Storage, or similar.
 *
 * Reference: https://eips.ethereum.org/EIPS/eip-1155#metadata
 */

export interface BadgeMetadata {
  name: string
  description: string
  image: string
  external_url: string
  animation_url?: string
  attributes: Array<{
    trait_type: string
    value: string | number
    display_type?: string
  }>
  properties: {
    event_id: string
    lore_uuid: string
    cycle: string
    zodiac: string
    elementals_linked: string[]
  }
}

/**
 * Generate badge metadata for a specific claim
 */
export function generateBadgeMetadata(claimId: string): BadgeMetadata {
  return {
    name: '2026 Lunar New Year Badge — Year of the Horse',
    description:
      'Proof of Luck-Module Recalibration for the 2026 Lunar cycle. ' +
      'This badge certifies that the holder\'s Catbotica unit has successfully ' +
      'synchronized its probability matrices with the Year of the Horse frequency. ' +
      'Enhanced attributes: speed, courage, forward momentum. ' +
      'Elemental resonance: VELOCITITE (Ability), AURUM (Luminary), LIAHONA (Navigation).',
    image: 'ipfs://PLACEHOLDER_BADGE_CID', // Replace after asset generation
    external_url: 'https://claimed.catbotica.com',
    attributes: [
      { trait_type: 'Event', value: 'Luck-Module Recalibration Protocol' },
      { trait_type: 'Cycle', value: '2026 Lunar New Year' },
      { trait_type: 'Zodiac', value: 'Horse' },
      { trait_type: 'Rarity', value: 'Limited Edition' },
      { trait_type: 'Color Palette', value: 'Imperial Red / Gold / Carbon Black' },
      { trait_type: 'Form Factor', value: 'Enamel Pin + Digital Badge' },
      { trait_type: 'Elemental: VELOCITITE', value: '+15% Speed' },
      { trait_type: 'Elemental: AURUM', value: 'Luminary Active' },
      { trait_type: 'Elemental: LIAHONA', value: 'Navigation Enhanced' },
      { trait_type: 'Claim ID', value: claimId },
      { trait_type: 'Year', value: 2026, display_type: 'number' },
    ],
    properties: {
      event_id: 'LMRP-2026-HORSE',
      lore_uuid: 'CAT-EVENT-LMRP-2026-HORSE',
      cycle: '2026',
      zodiac: 'Horse',
      elementals_linked: ['VELOCITITE', 'AURUM', 'LIAHONA'],
    },
  }
}

/**
 * Generate the metadata JSON string for IPFS upload
 */
export function generateBadgeMetadataJSON(claimId: string): string {
  return JSON.stringify(generateBadgeMetadata(claimId), null, 2)
}
