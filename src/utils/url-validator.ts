/**
 * Whitelist of allowed domains for user-provided images
 */
const ALLOWED_DOMAINS = [
  'api.dicebear.com',
  'images.unsplash.com',
  'plus.unsplash.com',
  'github.com',
  'avatars.githubusercontent.com',
  'res.cloudinary.com'
];

/**
 * Validates if a URL is safe to render as an image
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    return ALLOWED_DOMAINS.some(domain => parsed.hostname === domain || parsed.hostname.endsWith('.' + domain));
  } catch {
    return false;
  }
};

/**
 * Returns a safe fallback if the URL is invalid
 */
export const getSafeImageUrl = (url: string, fallback: string): string => {
  return isValidImageUrl(url) ? url : fallback;
};