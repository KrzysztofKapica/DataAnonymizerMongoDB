/**
 * Compute the scale between the rendered <img> size and its natural size.
 * @param {HTMLImageElement|null} image
 * @returns {{ scaleX: number, scaleY: number }}
 */

export function countScale(image) {
    if (!image || !image.naturalWidth || !image.naturalHeight) {
      // Fallback if image isn't loaded yet
      return { scaleX: 1, scaleY: 1 };
    }
    const scaleX = image.clientWidth / image.naturalWidth;
    const scaleY = image.clientHeight / image.naturalHeight;
    return { scaleX, scaleY };
  }
  