const CDN = 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/images/products/full_img/';

const CATEGORY_FALLBACK: Record<string, string> = {
  'fruits-vegetables': `${CDN}154.jpg`,
  'dairy-breakfast':   `${CDN}329.jpg`,
  'bakery':            `${CDN}1055.jpg`,
  'snacks':            `${CDN}1072.jpg`,
  'beverages':         `${CDN}1178.jpg`,
  'instant-food':      `${CDN}1228.jpg`,
  'cleaning':          `${CDN}1421.jpg`,
  'personal-care':     `${CDN}1511.jpg`,
  'baby-care':         `${CDN}1654.jpg`,
  'pet-care':          `${CDN}1821.jpg`,
  'staples':           `${CDN}2012.jpg`,
  'meat-seafood':      `${CDN}2111.jpg`,
  'ice-cream':         `${CDN}2213.jpg`,
  'pharma':            `${CDN}2315.jpg`,
  'electronics':       `${CDN}2412.jpg`,
};

export function formatPrice(n: number): string {
  return '₹' + n.toLocaleString('en-IN');
}

export function formatDiscount(original: number, discounted: number): string {
  const pct = Math.round(((original - discounted) / original) * 100);
  return `${pct}% off`;
}

export function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export function pincodeValid(p: string): boolean {
  return /^\d{6}$/.test(p);
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function getCategoryFallback(category: string): string {
  return CATEGORY_FALLBACK[category] ?? `${CDN}154.jpg`;
}
