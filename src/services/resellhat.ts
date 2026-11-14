import { Category, Product, SupplierMarkupType } from '../types';
import { getCurrentUserIdToken } from './firebase';

export interface ResellHatProductItem {
  supplierProductId: string;
  name: string;
  description: string;
  shortDescription: string;
  supplierPrice: number;
  compareAtPrice?: number;
  category: string;
  images: string[];
  stock: number | null;
  availability: string;
  sku: string;
}

export interface ResellHatTestResponse {
  success: boolean;
  ok?: boolean;
  connected?: boolean;
  status: number;
  upstreamStatus?: number;
  supplier?: string;
  latencyMs?: number;
  totalProducts?: number;
  lastPage?: number;
  testedBy?: string;
  testedAt?: string;
  code?: string;
  message: string;
  data?: {
    data: ResellHatProductItem[];
    meta: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
    categories?: string[];
  } | null;
}

export interface ResellHatProductsResponse {
  success?: boolean;
  ok: boolean;
  status?: number;
  upstreamStatus?: number;
  supplier?: string;
  data: ResellHatProductItem[];
  categories: string[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  latencyMs?: number;
  code?: string;
  message?: string;
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getCurrentUserIdToken();
  if (!token) {
    throw new Error('Sign in with your verified administrator account to access supplier tools.');
  }
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };
}

async function parseProxyJsonResponse<T>(
  res: Response,
  endpointLabel: string
): Promise<T> {
  const rawText = await res.text();
  const contentType = (res.headers.get('content-type') || '').toLowerCase();

  let parsed: unknown = null;
  try {
    parsed = rawText ? JSON.parse(rawText) : null;
  } catch {
    parsed = null;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    const trimmed = rawText.trimStart();
    if (res.status === 405) {
      throw new Error(
        `Server proxy rejected the request method (HTTP 405) at ${endpointLabel}. Ensure Cloudflare Pages Functions are deployed.`
      );
    }
    if (trimmed.startsWith('<') || contentType.includes('text/html')) {
      throw new Error(
        `Proxy route ${endpointLabel} returned HTML instead of JSON (HTTP ${res.status}). The server Function is not active on this host or deployment (SPA index.html fallback was served).`
      );
    }
    throw new Error(
      `Invalid non-JSON response from server proxy (HTTP ${res.status}): ${
        trimmed.slice(0, 120) || 'empty response body'
      }`
    );
  }

  return parsed as T;
}

export async function testResellHatConnection(): Promise<ResellHatTestResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/suppliers/resellhat/test', {
    method: 'GET',
    headers,
  });

  const json = await parseProxyJsonResponse<ResellHatTestResponse>(
    res,
    '/api/suppliers/resellhat/test'
  );

  const upstreamStatus = typeof json.status === 'number' ? json.status : json.upstreamStatus;
  const isExplicitSuccess =
    json.success === true && json.ok !== false && json.connected !== false;
  const supplierData = json.data;
  const hasValidSupplierData =
    supplierData !== null &&
    supplierData !== undefined &&
    typeof supplierData === 'object' &&
    Array.isArray(supplierData.data) &&
    typeof supplierData.meta?.last_page === 'number';

  if (!res.ok || !isExplicitSuccess || !hasValidSupplierData) {
    const reportedStatus = upstreamStatus ?? res.status;
    const statusHint =
      reportedStatus && !String(json.message || '').includes(String(reportedStatus))
        ? ` (HTTP ${reportedStatus})`
        : '';
    const fallbackMessage =
      res.ok && isExplicitSuccess && !hasValidSupplierData
        ? 'Proxy returned HTTP 200, but did not confirm a valid ResellHat data array and meta.last_page field.'
        : `Connection test failed (HTTP ${reportedStatus}).`;

    const err = new Error(`${json.message || fallbackMessage}${statusHint}`);
    (err as Error & { code?: string; upstreamStatus?: number }).code = json.code;
    (err as Error & { code?: string; upstreamStatus?: number }).upstreamStatus = reportedStatus;
    throw err;
  }

  return json;
}

export async function fetchResellHatProductsPage(params: {
  page?: number;
  perPage?: number;
  category?: string;
}): Promise<ResellHatProductsResponse> {
  const headers = await getAuthHeaders();
  const qs = new URLSearchParams();
  qs.set('page', String(Math.max(1, params.page || 1)));
  qs.set('per_page', String(Math.min(500, Math.max(1, params.perPage || 50))));
  if (params.category && params.category !== 'all') {
    qs.set('category', params.category);
  }

  const res = await fetch(`/api/suppliers/resellhat/products?${qs.toString()}`, {
    method: 'GET',
    headers,
  });

  const json = await parseProxyJsonResponse<ResellHatProductsResponse>(
    res,
    '/api/suppliers/resellhat/products'
  );

  const reportedStatus = typeof json.status === 'number' ? json.status : json.upstreamStatus;
  const isSuccess = json.success !== false && json.ok !== false && Array.isArray(json.data);

  if (!res.ok || !isSuccess) {
    const statusHint =
      reportedStatus && !String(json.message || '').includes(String(reportedStatus))
        ? ` (Supplier HTTP ${reportedStatus})`
        : '';
    const err = new Error(
      `${json.message || `Failed to load ResellHat products (HTTP ${reportedStatus ?? res.status}).`}${statusHint}`
    );
    (err as Error & { code?: string; upstreamStatus?: number }).code = json.code;
    (err as Error & { code?: string; upstreamStatus?: number }).upstreamStatus = reportedStatus;
    throw err;
  }
  return json;
}

export function calculateSellingPrice(
  supplierPrice: number,
  markupType: SupplierMarkupType,
  markupValue: number,
  customSellingPrice?: number
): number {
  const base = Math.max(0, Number(supplierPrice) || 0);
  if (markupType === 'custom' && customSellingPrice !== undefined) {
    return Math.min(1000000, Math.max(0, Math.round(Number(customSellingPrice) || 0)));
  }
  if (markupType === 'fixed') {
    return Math.min(1000000, Math.max(0, Math.round(base + (Number(markupValue) || 0))));
  }
  // percentage markup
  const pct = Math.max(0, Number(markupValue) || 0);
  return Math.min(1000000, Math.max(0, Math.round(base * (1 + pct / 100))));
}

export function calculateProfitSummary(supplierPrice: number, sellingPrice: number) {
  const cost = Math.max(0, Number(supplierPrice) || 0);
  const price = Math.max(0, Number(sellingPrice) || 0);
  const profitAmount = Math.round(price - cost);
  const markupPct = cost > 0 ? Math.round(((price - cost) / cost) * 1000) / 10 : 0;
  const marginPct = price > 0 ? Math.round(((price - cost) / price) * 1000) / 10 : 0;
  return { profitAmount, markupPct, marginPct };
}

export function generateSafeSupplierDocId(supplierProductId: string): string {
  const cleaned = supplierProductId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `rh-${cleaned}`.slice(0, 110);
}

export function mapResellHatCategoryToVeyra(
  supplierCategory: string,
  categories: Category[],
  fallbackCategoryId: string
): Category {
  const clean = (supplierCategory || '').toLowerCase();
  const fallback =
    categories.find((c) => c.slug === fallbackCategoryId || c.id === fallbackCategoryId) ||
    categories[0] || {
      id: 'electronics-gadgets',
      name: 'Electronics & Gadgets',
      slug: 'electronics-gadgets',
      description: '',
      displayOrder: 1,
      isActive: true,
    };

  if (!clean) return fallback;

  const exact = categories.find(
    (c) => c.name.toLowerCase() === clean || c.slug.toLowerCase() === clean
  );
  if (exact) return exact;

  // Smart keyword matching against VEYRA storefront categories
  const keywordMap: { keywords: string[]; slugs: string[] }[] = [
    {
      keywords: ['watch', 'bag', 'wallet', 'sunglass', 'belt', 'jewelry', 'jewellery', 'accessor', 'hat', 'cap'],
      slugs: ['accessories'],
    },
    {
      keywords: ['phone', 'gadget', 'earbud', 'headphone', 'speaker', 'charger', 'power', 'electronic', 'smart', 'usb', 'cable', 'lamp', 'tech'],
      slugs: ['electronics-gadgets'],
    },
    {
      keywords: ['shirt', 'dress', 'panjabi', 'kurti', 'hoodie', 'jacket', 'pant', 'shoe', 'sneaker', 'fashion', 'apparel', 'cloth', 't-shirt', 'saree'],
      slugs: ['fashion'],
    },
    {
      keywords: ['home', 'kitchen', 'decor', 'bed', 'bottle', 'mug', 'organizer', 'cushion', 'living', 'storage'],
      slugs: ['home-living'],
    },
    {
      keywords: ['beauty', 'skin', 'cosmetic', 'perfume', 'hair', 'serum', 'cream', 'lifestyle', 'grooming', 'makeup'],
      slugs: ['beauty-lifestyle'],
    },
  ];

  for (const entry of keywordMap) {
    if (entry.keywords.some((kw) => clean.includes(kw))) {
      const matched = categories.find((c) => entry.slugs.includes(c.slug));
      if (matched) return matched;
    }
  }

  return fallback;
}

export function buildImportedProductFromSupplier(opts: {
  item: ResellHatProductItem;
  title?: string;
  shortDescription?: string;
  description?: string;
  category: Category;
  sellingPrice: number;
  markupType: SupplierMarkupType;
  markupValue: number;
  isFeatured?: boolean;
  isActive?: boolean;
  images?: string[];
  existingProduct?: Product;
}): Product {
  const nowIso = new Date().toISOString();
  const baseName = (opts.title ?? opts.item.name).trim().slice(0, 140) || 'Imported Product';
  const safeName = baseName.length >= 2 ? baseName : `${baseName} Item`;
  const slugBase = safeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const docId = opts.existingProduct?.id || generateSafeSupplierDocId(opts.item.supplierProductId);
  const imagesList = (opts.images ?? opts.item.images).filter(Boolean).slice(0, 12);

  return {
    id: docId,
    name: safeName,
    slug: opts.existingProduct?.slug || `${slugBase}-${opts.item.supplierProductId}`.slice(0, 140),
    categoryId: opts.category.slug,
    categoryName: opts.category.name,
    price: Math.min(1000000, Math.max(0, Math.round(opts.sellingPrice))),
    compareAtPrice:
      opts.item.compareAtPrice && opts.item.compareAtPrice > opts.sellingPrice
        ? Math.round(opts.item.compareAtPrice)
        : opts.existingProduct?.compareAtPrice,
    shortDescription: (opts.shortDescription ?? opts.item.shortDescription ?? '')
      .trim()
      .slice(0, 350),
    description: (opts.description ?? opts.item.description ?? safeName).trim().slice(0, 4000) || safeName,
    images: imagesList,
    stock: opts.item.stock !== null ? opts.item.stock : opts.existingProduct?.stock ?? 20,
    sku: opts.existingProduct?.sku || opts.item.sku || `RH-${opts.item.supplierProductId}`,
    variations: opts.existingProduct?.variations || [],
    isFeatured: opts.isFeatured ?? opts.existingProduct?.isFeatured ?? false,
    isNewArrival: opts.existingProduct?.isNewArrival ?? true,
    isBestSeller: opts.existingProduct?.isBestSeller ?? false,
    popularityScore: opts.existingProduct?.popularityScore ?? 65,
    isActive: opts.isActive ?? opts.existingProduct?.isActive ?? false, // Default to Draft!
    tags: opts.existingProduct?.tags || ['resellhat-imported'],
    seoTitle: opts.existingProduct?.seoTitle || '',
    seoDescription: opts.existingProduct?.seoDescription || '',
    supplierName: 'ResellHat',
    supplierProductId: opts.item.supplierProductId,
    supplierPrice: Math.round(opts.item.supplierPrice),
    supplierStock: opts.item.stock !== null ? opts.item.stock : undefined,
    supplierLastSyncedAt: nowIso,
    supplierCategory: opts.item.category,
    supplierMarkupType: opts.markupType,
    supplierMarkupValue: opts.markupValue,
    createdAt: opts.existingProduct?.createdAt,
    updatedAt: nowIso,
  };
}

export function buildSyncedProductUpdate(
  existing: Product,
  upstream: ResellHatProductItem,
  options: {
    recalculateSellingPrice: boolean;
    fallbackMarkupType: SupplierMarkupType;
    fallbackMarkupValue: number;
  }
): Product {
  const nowIso = new Date().toISOString();
  const markupType = existing.supplierMarkupType || options.fallbackMarkupType;
  const markupValue =
    existing.supplierMarkupValue !== undefined
      ? existing.supplierMarkupValue
      : options.fallbackMarkupValue;

  const shouldRecalculate = options.recalculateSellingPrice && markupType !== 'custom';
  const nextPrice = shouldRecalculate
    ? calculateSellingPrice(upstream.supplierPrice, markupType, markupValue)
    : existing.price;

  return {
    ...existing,
    price: nextPrice,
    stock: upstream.stock !== null ? upstream.stock : existing.stock,
    supplierPrice: Math.round(upstream.supplierPrice),
    supplierStock: upstream.stock !== null ? upstream.stock : existing.supplierStock,
    supplierCategory: upstream.category || existing.supplierCategory,
    supplierLastSyncedAt: nowIso,
    updatedAt: nowIso,
  };
}
