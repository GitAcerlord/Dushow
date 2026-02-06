/**
 * Whitelist of allowed domains for user-provided images
 */
const ALLOWED_DOMAINS = [
  'api.dicebear.com',
  'images.unsplash.com',
  'plus.unsplash.com',
  'github.com',
  'avatars.githubusercontent.com',
  'res.cloudinary.com',
  'fvboifpvudvdufvgfnjb.supabase.co', // Domínio do projeto Supabase
  'images.pexels.com',
  'i.pravatar.cc'
];

/**
 * Validates if a URL is safe to render as an image
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  // Se for uma URL de dados (base64), permitimos para uploads locais simulados
  if (url.startsWith('data:image/')) return true;
  
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
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