const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');
const API_BASE = `${BACKEND_BASE}/api/v1`;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = options.body instanceof FormData
    ? (options.headers ?? {})
    : { 'Content-Type': 'application/json', ...options.headers };

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers,
    ...options,
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

// --- Products ---

export interface ApiProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image: string | null;
  category: string | null;
  rating: number;
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
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  category: string;
  createdAt: string;
  updatedAt: string;
};

const mapProduct = (p: BackendProduct): ApiProduct => ({
  id: p.id,
  name: p.name,
  description: p.description ?? null,
  price: p.price,
  stock: p.stock,
  image: p.imageUrl ?? null,
  category: p.category ?? null,
  rating: 0,
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
  category?: string;
}): Promise<ApiProduct> {
  const payload = {
    name: data.name,
    description: data.description ?? '',
    price: data.price,
    stock: data.stock,
    imageUrl: data.image,
    category: data.category ?? '',
  };

  const created = await request<BackendProduct>('/products', {
    method: 'POST',
    body: JSON.stringify(payload),
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
    category: string;
  }>,
): Promise<ApiProduct> {
  const payload = {
    ...data,
    ...(data.image !== undefined ? { imageUrl: data.image } : {}),
  };

  const updated = await request<BackendProduct>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
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
  user?: { id: string; username: string };
  product?: { id: string; name: string; image: string | null };
}

export async function getReviews(productId: string): Promise<ApiReview[]> {
  try {
    const data = await request<{ reviews: ApiReview[] }>(`/reviews/product/${productId}`);
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
