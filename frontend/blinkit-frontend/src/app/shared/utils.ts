const CATEGORY_FALLBACK: Record<string, string> = {
  'fruits-vegetables': 'https://picsum.photos/seed/fruits/200/200',
  'dairy-eggs':        'https://picsum.photos/seed/dairy/200/200',
  'dairy-breakfast':   'https://picsum.photos/seed/dairy/200/200',
  'snacks':            'https://picsum.photos/seed/snacks/200/200',
  'beverages':         'https://picsum.photos/seed/drinks/200/200',
  'bakery':            'https://picsum.photos/seed/bread/200/200',
  'meat-fish':         'https://picsum.photos/seed/meat/200/200',
  'meat-seafood':      'https://picsum.photos/seed/meat/200/200',
  'personal-care':     'https://picsum.photos/seed/soap/200/200',
  'household':         'https://picsum.photos/seed/clean/200/200',
  'cleaning':          'https://picsum.photos/seed/clean/200/200',
  'baby-care':         'https://picsum.photos/seed/baby/200/200',
  'pet-care':          'https://picsum.photos/seed/pet/200/200',
  'pharma':            'https://picsum.photos/seed/medicine/200/200',
  'beauty':            'https://picsum.photos/seed/beauty/200/200',
  'frozen-foods':      'https://picsum.photos/seed/frozen/200/200',
  'instant-food':      'https://picsum.photos/seed/frozen/200/200',
  'breakfast-cereals': 'https://picsum.photos/seed/cereal/200/200',
  'staples':           'https://picsum.photos/seed/cereal/200/200',
  'electronics':       'https://picsum.photos/seed/gadget/200/200',
  'ice-cream':         'https://picsum.photos/seed/icecream/200/200',
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
  return CATEGORY_FALLBACK[category] ?? 'https://picsum.photos/seed/food/200/200';
}
