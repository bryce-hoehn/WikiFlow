/**
 * Utility functions for image URL manipulation
 */

/**
 * Common thumbnail sizes that Wikipedia typically has available
 * These are standard sizes that are more likely to exist
 */
const COMMON_THUMBNAIL_SIZES = [800, 600, 400, 300, 220, 200];

/**
 * Round a width to the nearest common thumbnail size
 * 
 * @param width - Desired width in pixels
 * @returns Nearest common thumbnail size
 */
function roundToCommonThumbnailSize(width: number): number {
  const roundedWidth = Math.round(width);
  
  // Find the closest common size
  let closest = COMMON_THUMBNAIL_SIZES[0];
  let minDiff = Math.abs(roundedWidth - closest);
  
  for (const size of COMMON_THUMBNAIL_SIZES) {
    const diff = Math.abs(roundedWidth - size);
    if (diff < minDiff) {
      minDiff = diff;
      closest = size;
    }
  }
  
  return closest;
}

/**
 * Get an optimized thumbnail URL for Wikipedia images based on desired width
 * Modifies existing thumbnail URLs to request a different size
 * 
 * @param originalUrl - The original image URL (can be thumbnail or full-size)
 * @param width - Desired width in pixels (will be rounded to nearest common size)
 * @returns Modified URL with the requested width, or original URL if not a Wikimedia image
 */
export function getOptimizedThumbnailUrl(originalUrl: string, width: number): string {
  if (!originalUrl || !originalUrl.includes('upload.wikimedia.org')) {
    return originalUrl;
  }

  try {
    // Round to nearest common thumbnail size
    const roundedWidth = roundToCommonThumbnailSize(width);
    
    const url = new URL(originalUrl);
    const pathParts = url.pathname.split('/').filter(Boolean); // Remove empty strings
    
    // Find the thumb directory index
    const thumbIndex = pathParts.findIndex(part => part === 'thumb');
    
    if (thumbIndex !== -1 && thumbIndex < pathParts.length - 1) {
      // Already a thumbnail URL - just replace the width part
      // Wikipedia thumbnail structure: /wikipedia/commons/thumb/{hash}/{filename}/{width}px-{filename}
      
      // Find the width-prefixed part (e.g., "400px-filename.png")
      let widthPrefixedIndex = -1;
      for (let i = thumbIndex + 1; i < pathParts.length; i++) {
        if (pathParts[i] && pathParts[i].match(/^\d+px-/)) {
          widthPrefixedIndex = i;
          break;
        }
      }
      
      if (widthPrefixedIndex !== -1) {
        // Extract the actual filename from the width-prefixed part
        const widthPrefixedPart = pathParts[widthPrefixedIndex];
        const actualFilename = widthPrefixedPart.replace(/^\d+px-/, '');
        
        // Reconstruct URL with new width
        const partsBeforeWidth = pathParts.slice(0, widthPrefixedIndex);
        const partsAfterWidth = pathParts.slice(widthPrefixedIndex + 1);
        
        // Remove trailing filename if it matches the actual filename (duplicate)
        const filteredAfterWidth = partsAfterWidth.filter(
          (part, idx) => !(idx === 0 && part === actualFilename)
        );
        
        // Build the path: everything before width + new width-prefixed filename + everything after (excluding duplicate filename)
        const newPathParts = [
          ...partsBeforeWidth,
          `${roundedWidth}px-${actualFilename}`,
          ...filteredAfterWidth,
        ];
        
        return `https://upload.wikimedia.org/${newPathParts.join('/')}`;
      }
      
      // If we can't find a width-prefixed part, try to extract filename and reconstruct
      // Find the first filename-looking part (has extension, doesn't start with digits)
      let filename: string | null = null;
      let filenameIndex = -1;
      for (let i = thumbIndex + 1; i < pathParts.length; i++) {
        const part = pathParts[i];
        if (part && part.includes('.') && !part.match(/^\d+px-/)) {
          filename = part;
          filenameIndex = i;
          break;
        }
      }
      
      if (filename && filenameIndex !== -1) {
        // Hash path is everything between thumb and filename
        const hashPath = pathParts.slice(thumbIndex + 1, filenameIndex).join('/');
        const basePath = pathParts.slice(0, 2).join('/'); // wikipedia/commons or wikipedia/{lang}
        // Wikipedia thumbnail format: /thumb/{hash}/{filename}/{width}px-{filename}
        return `https://upload.wikimedia.org/${basePath}/thumb/${hashPath}/${filename}/${roundedWidth}px-${filename}`;
      }
    }

    // If it's a full-size image, construct a thumbnail URL
    // Format: /path/to/image/thumb/{filename}/{width}px-{filename}
    const filename = pathParts[pathParts.length - 1];
    
    // Ensure we have a valid filename (not empty, not a path segment)
    if (!filename || filename.length === 0 || filename.includes('/')) {
      return originalUrl;
    }
    
    // Check if filename is width-prefixed (malformed URL)
    let actualFilename = filename;
    if (filename.match(/^\d+px-/)) {
      actualFilename = filename.replace(/^\d+px-/, '');
    }
    
    const basePath = pathParts.slice(0, -1).join('/');
    
    // Wikipedia thumbnail format: /thumb/{hash}/{filename}/{width}px-{filename}
    return `https://upload.wikimedia.org/${basePath}/thumb/${actualFilename}/${roundedWidth}px-${actualFilename}`;
  } catch (error) {
    // If URL parsing fails, return original
    return originalUrl;
  }
}

