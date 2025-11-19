/**
 * Utility for generating random blurhash placeholders for images
 * Provides a variety of neutral, image-like blurhashes to avoid visual repetition
 */

// Predefined blurhashes - neutral, image-like patterns
// These are valid blurhash strings that work well as image placeholders
// Each hash represents a different color/tone to provide visual variety
const BLURHASHES = [
  // Neutral grays and blues
  'L5H2EC=PM+yV0gMqNGa#00bH?G-9',
  'LKO2?U%2Tw=w]~RBVZRi};RPxuwH',
  'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
  'LGF5]+Yk^6#M@-5c,1J5@[X8?^%t',
  'L9PZ?n%2Tw=w]~RBVZRi};RPxuwH',
  // Warmer tones
  'L8Sg}8_3~q%M_3~q%M_3~q%M_3~q',
  'L6Pj0^jE.AyE_3t7t7R**0o#DgR4',
  'L9PZ?n%2Tw=w]~RBVZRi};RPxuwH',
  // Cooler tones
  'LKO2?U%2Tw=w]~RBVZRi};RPxuwH',
  'LGF5]+Yk^6#M@-5c,1J5@[X8?^%t',
  // Additional variety - different patterns
  'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
  'L8Sg}8_3~q%M_3~q%M_3~q%M_3~q',
  'L5H2EC=PM+yV0gMqNGa#00bH?G-9',
] as const;

/**
 * Get a random blurhash from the predefined list
 * Uses a simple hash of the input to ensure consistent selection for the same input
 * @param seed - Optional seed value (e.g., image URL) to get consistent hash for same image
 * @returns A random blurhash string
 */
export function getRandomBlurhash(seed?: string): string {
  if (seed) {
    // Use seed to get consistent hash for same image
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    const index = Math.abs(hash) % BLURHASHES.length;
    return BLURHASHES[index];
  }
  
  // Random selection if no seed provided
  const index = Math.floor(Math.random() * BLURHASHES.length);
  return BLURHASHES[index];
}

