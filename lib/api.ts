import type { ProductSpec } from './types';

const trimTrailingSlash = (value: string) => value.replace(/\/$/, '');

const resolveApiBase = () => {
  const isServer = typeof window === 'undefined';

  if (isServer) {
    const serverBase = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://backend:4000';
    return `${trimTrailingSlash(serverBase)}/api/v1`;
  }

  const publicBase = process.env.NEXT_PUBLIC_API_URL;
  if (publicBase && publicBase.trim()) {
    return `${trimTrailingSlash(publicBase)}/api/v1`;
  }

  return '/api/v1';
};

const API_BASE = resolveApiBase();

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { headers: requestHeaders, cache: customCache, ...restOptions } = options;
  const headers: HeadersInit = options.body instanceof FormData
    ? (requestHeaders ?? {})
    : { 'Content-Type': 'application/json', ...requestHeaders };

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    cache: customCache ?? 'no-store',
    headers,
    ...restOptions,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message || body.error || 'Request failed');
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// --- Auth ---

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: 'USER' | 'ADMIN';
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  preferredPaymentMethod?: string | null;
}

export async function authLogin(email: string, password: string): Promise<AuthUser> {
  const data = await request<{ user: AuthUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return data.user;
}

export async function authRegister(
  email: string,
  username: string,
  password: string,
): Promise<AuthUser> {
  const data = await request<{ user: AuthUser }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, username, password }),
  });
  return data.user;
}

export async function authLogout(): Promise<void> {
  await request('/auth/logout', { method: 'POST' });
}

export async function getMe(): Promise<AuthUser | null> {
  try {
    return await request<AuthUser>('/auth/me');
  } catch {
    return null;
  }
}

export async function updateProfile(payload: {
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  preferredPaymentMethod?: string;
}): Promise<AuthUser> {
  return request<AuthUser>('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// --- Products ---

export interface ApiProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  inStock: boolean;
  stock: number;
  image: string;
  images: string[];
  description: string;
  specs: ProductSpec[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  products: ApiProduct[];
  total: number;
  page: number;
  limit: number;
}

type BackendProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  category: string;
  rating: number;
  images: string[];
  specs: ProductSpec[];
  createdAt: string;
  updatedAt: string;
};

const mapProduct = (p: BackendProduct): ApiProduct => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  description: p.description ?? '',
  price: p.price,
  stock: p.stock,
  image: p.imageUrl ?? '',
  images: (p.images ?? []).map((image) => String(image)).filter(Boolean),
  category: p.category ?? '',
  rating: p.rating ?? 0,
  inStock: p.stock > 0,
  specs: (p.specs ?? [])
    .map((spec) => ({
      label: String(spec.label ?? '').trim(),
      value: String(spec.value ?? '').trim(),
    }))
    .filter((spec) => spec.label.length > 0 && spec.value.length > 0),
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

export async function getProducts(params?: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest';
}): Promise<ProductsResponse> {
  const q = new URLSearchParams();
  if (params?.category) q.set('category', params.category);
  if (params?.search) q.set('search', params.search);
  if (params?.sort) q.set('sort', params.sort);

  const list = await request<BackendProduct[]>(`/products${q.toString() ? `?${q.toString()}` : ''}`);
  const products = list.map(mapProduct);
  return {
    products,
    total: products.length,
    page: params?.page ?? 1,
    limit: params?.limit ?? products.length,
  };
}

export async function getProduct(id: string): Promise<ApiProduct> {
  const data = await request<BackendProduct>(`/products/${id}`);
  return mapProduct(data);
}

export async function getCategories(): Promise<string[]> {
  const list = await request<BackendProduct[]>('/products');
  return Array.from(new Set(list.map((p) => p.category).filter(Boolean))).sort();
}

export async function createProduct(data: {
  name: string;
  description?: string;
  price: number;
  stock: number;
  image?: string;
  imageFile?: File | null;
  category?: string;
  slug?: string;
  rating?: number;
  images?: string[];
  specs?: ProductSpec[];
}): Promise<ApiProduct> {
  const payload = new FormData();
  payload.append('name', data.name);
  payload.append('description', data.description ?? '');
  payload.append('price', String(data.price));
  payload.append('stock', String(data.stock));
  payload.append('category', data.category ?? '');

  if (data.slug) payload.append('slug', data.slug);
  if (data.rating !== undefined) payload.append('rating', String(data.rating));
  if (data.imageFile) {
    payload.append('image', data.imageFile);
  } else if (data.image) {
    payload.append('imageUrl', data.image);
  }
  if (data.images) payload.append('images', JSON.stringify(data.images));
  if (data.specs) payload.append('specs', JSON.stringify(data.specs));

  const created = await request<BackendProduct>('/products', {
    method: 'POST',
    body: payload,
  });

  return mapProduct(created);
}

export async function updateProduct(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    price: number;
    stock: number;
    image: string;
    imageFile: File | null;
    category: string;
    slug: string;
    rating: number;
    images: string[];
    specs: ProductSpec[];
  }>,
): Promise<ApiProduct> {
  const payload = new FormData();
  if (data.name !== undefined) payload.append('name', data.name);
  if (data.description !== undefined) payload.append('description', data.description);
  if (data.price !== undefined) payload.append('price', String(data.price));
  if (data.stock !== undefined) payload.append('stock', String(data.stock));
  if (data.category !== undefined) payload.append('category', data.category);
  if (data.slug !== undefined) payload.append('slug', data.slug);
  if (data.rating !== undefined) payload.append('rating', String(data.rating));
  if (data.imageFile) {
    payload.append('image', data.imageFile);
  } else if (data.image !== undefined) {
    payload.append('imageUrl', data.image);
  }
  if (data.images !== undefined) payload.append('images', JSON.stringify(data.images));
  if (data.specs !== undefined) payload.append('specs', JSON.stringify(data.specs));

  const updated = await request<BackendProduct>(`/products/${id}`, {
    method: 'PUT',
    body: payload,
  });

  return mapProduct(updated);
}

export async function deleteProduct(id: string): Promise<void> {
  await request(`/products/${id}`, { method: 'DELETE' });
}

// --- Cart ---

export interface ApiCartItem {
  id: string;
  productId: string;
  quantity: number;
  product: ApiProduct;
}

export interface ApiCart {
  items: ApiCartItem[];
}

type BackendCartItem = {
  id: string;
  productId: string;
  quantity: number;
  product: BackendProduct;
};

export interface CartProductPayload {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string | null;
  slug: string;
  rating: number;
  images: string[];
  specs: ProductSpec[];
}

const mapCartItem = (item: BackendCartItem): ApiCartItem => ({
  id: item.id,
  productId: item.productId,
  quantity: item.quantity,
  product: mapProduct(item.product),
});

export async function getCart(): Promise<ApiCart> {
  const items = await request<BackendCartItem[]>('/cart');
  return { items: items.map(mapCartItem) };
}

export async function addToCart(
  productId: string,
  quantity = 1,
  product?: CartProductPayload,
): Promise<ApiCart> {
  await request('/cart', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity, product }),
  });
  return getCart();
}

export async function removeFromCart(productId: string): Promise<ApiCart> {
  await request(`/cart/${productId}`, { method: 'DELETE' });
  return getCart();
}

export async function updateCartItem(productId: string, quantity: number): Promise<ApiCart> {
  await request(`/cart/${productId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  });
  return getCart();
}

export async function clearCart(): Promise<void> {
  await request('/cart', { method: 'DELETE' });
}

// --- Orders ---

export interface ApiOrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product: ApiProduct;
}

export interface ApiOrder {
  id: string;
  userId: string;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  items: ApiOrderItem[];
  user?: { id: string; email: string; username: string };
}

type BackendOrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

type BackendOrder = {
  id: string;
  userId: string;
  totalAmount: number;
  status: BackendOrderStatus;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    priceAtOrder: number;
    product: BackendProduct;
  }>;
  user?: { id: string; email: string; username: string };
};

const mapOrderStatus = (status: BackendOrderStatus): ApiOrder['status'] => {
  if (status === 'CANCELLED') return 'cancelled';
  if (status === 'DELIVERED') return 'completed';
  return 'pending';
};

const toBackendStatus = (status: string): BackendOrderStatus => {
  if (status === 'completed') return 'DELIVERED';
  if (status === 'cancelled') return 'CANCELLED';
  return 'PENDING';
};

const mapOrder = (order: BackendOrder): ApiOrder => ({
  id: order.id,
  userId: order.userId,
  total: order.totalAmount,
  status: mapOrderStatus(order.status),
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  user: order.user,
  items: order.items.map((item) => ({
    id: item.id,
    orderId: item.orderId,
    productId: item.productId,
    quantity: item.quantity,
    price: item.priceAtOrder,
    product: mapProduct(item.product),
  })),
});

export async function checkout(): Promise<ApiOrder> {
  const order = await request<BackendOrder>('/orders', { method: 'POST' });
  return mapOrder(order);
}

export async function getOrders(): Promise<ApiOrder[]> {
  const orders = await request<BackendOrder[]>('/orders');
  return orders.map(mapOrder);
}

export async function getAllOrders(): Promise<ApiOrder[]> {
  const orders = await request<BackendOrder[]>('/orders/all');
  return orders.map(mapOrder);
}

export async function updateOrderStatus(orderId: string, status: string): Promise<ApiOrder> {
  const order = await request<BackendOrder>(`/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status: toBackendStatus(status) }),
  });
  return mapOrder(order);
}

// --- Reviews ---

export interface ApiReview {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  verifiedPurchase?: boolean;
  user?: { id: string; username: string };
  product?: { id: string; name: string; image: string | null };
}

export async function getReviews(
  productId: string,
  params?: { sort?: 'newest' | 'oldest' | 'rating_desc' | 'rating_asc'; rating?: number },
): Promise<ApiReview[]> {
  try {
    const query = new URLSearchParams();
    if (params?.sort) query.set('sort', params.sort);
    if (params?.rating) query.set('rating', String(params.rating));
    const suffix = query.toString() ? `?${query.toString()}` : '';

    const data = await request<{ reviews: ApiReview[] }>(`/reviews/product/${productId}${suffix}`);
    return data.reviews;
  } catch {
    return [];
  }
}

export async function getMyReviews(): Promise<ApiReview[]> {
  try {
    const data = await request<{ reviews: ApiReview[] }>('/reviews/my');
    return data.reviews;
  } catch {
    return [];
  }
}

export async function addReview(
  productId: string,
  rating: number,
  comment?: string,
): Promise<ApiReview> {
  return request('/reviews', {
    method: 'POST',
    body: JSON.stringify({ productId, rating, comment }),
  });
}

export async function deleteReview(reviewId: string): Promise<void> {
  await request(`/reviews/${reviewId}`, { method: 'DELETE' });
}
