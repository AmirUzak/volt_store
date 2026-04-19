'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useRouter } from 'next/navigation';
import {
  getProducts,
  getAllOrders,
  createProduct,
  updateProduct,
  deleteProduct,
  updateOrderStatus,
  type ApiProduct,
  type ApiOrder,
} from '@/lib/api';
import { formatPrice } from '@/lib/config';
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';

const STATUS_LABELS: Record<string, string> = {
  pending: 'В обработке',
  completed: 'Завершён',
  cancelled: 'Отменён',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

interface ProductForm {
  name: string;
  description: string;
  price: string;
  stock: string;
  image: string;
  imageFile: File | null;
  imagesText: string;
  specsText: string;
  category: string;
}

const emptyForm: ProductForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
  image: '',
  imageFile: null,
  imagesText: '',
  specsText: '',
  category: '',
};

const parseLineList = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const parseSpecsText = (value: string) =>
  parseLineList(value)
    .map((line) => {
      const separatorIndex = line.indexOf(':');
      if (separatorIndex === -1) return null;

      const label = line.slice(0, separatorIndex).trim();
      const specValue = line.slice(separatorIndex + 1).trim();
      if (!label || !specValue) return null;

      return { label, value: specValue };
    })
    .filter((spec): spec is { label: string; value: string } => spec !== null);

export default function AdminPage() {
  const { user, isLoggedIn, isLoading } = useAuthStore();
  const router = useRouter();

  const [tab, setTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [statusError, setStatusError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || user?.role !== 'ADMIN') {
        router.push('/');
      }
    }
  }, [isLoading, isLoggedIn, user, router]);

  useEffect(() => {
    if (!isLoggedIn || user?.role !== 'ADMIN') return;
    setDataLoading(true);
    Promise.all([
      getProducts({ limit: 100 }),
      getAllOrders(),
    ])
      .then(([p, o]) => { setProducts(p.products); setOrders(o); })
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, [isLoggedIn, user]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      imageFile: e.target.files?.[0] ?? null,
    }));
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (product: ApiProduct) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description ?? '',
      price: String(product.price),
      stock: String(product.stock),
      image: product.image ?? '',
      imageFile: null,
      imagesText: product.images.slice(1).join('\n'),
      specsText: product.specs.map(({ label, value }) => `${label}: ${value}`).join('\n'),
      category: product.category ?? '',
    });
    setFormError('');
    setShowForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.name || !form.price || !form.stock) {
      setFormError('Заполните обязательные поля');
      return;
    }
    setFormLoading(true);
    try {
      const images = parseLineList(form.imagesText);
      const specs = parseSpecsText(form.specsText);
      const data = {
        name: form.name,
        description: form.description || undefined,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        image: form.image || undefined,
        imageFile: form.imageFile,
        category: form.category || undefined,
        images,
        specs,
      };
      if (editingId !== null) {
        const updated = await updateProduct(editingId, data);
        setProducts((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
      } else {
        const created = await createProduct(data);
        setProducts((prev) => [created, ...prev]);
      }
      setShowForm(false);
    } catch (err: any) {
      setFormError(err.message || 'Ошибка');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteError('');
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirm(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Ошибка удаления');
    }
  };

  const handleStatusChange = async (orderId: string, status: string) => {
    setStatusError('');
    try {
      const updated = await updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (err: any) {
      setStatusError(err.message || 'Ошибка изменения статуса');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Админ-панель</h1>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        {(['products', 'orders'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={clsx(
              'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              tab === t
                ? 'bg-sky-500 text-white'
                : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
            )}
          >
            {t === 'products' ? 'Товары' : 'Заказы'}
          </button>
        ))}
      </div>

      {deleteError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {deleteError}
        </div>
      )}

      {statusError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {statusError}
        </div>
      )}

      {dataLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Products tab */}
          {tab === 'products' && (
            <div>
              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  onClick={openAdd}
                  className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Добавить товар
                </button>
              </div>

              {/* Product form */}
              {showForm && (
                <form
                  onSubmit={handleFormSubmit}
                  className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/50"
                >
                  <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">
                    {editingId !== null ? 'Редактировать товар' : 'Новый товар'}
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Название *
                      </label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleFormChange}
                        required
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Цена *
                      </label>
                      <input
                        name="price"
                        type="number"
                        step="0.01"
                        value={form.price}
                        onChange={handleFormChange}
                        required
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Остаток *
                      </label>
                      <input
                        name="stock"
                        type="number"
                        value={form.stock}
                        onChange={handleFormChange}
                        required
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Категория
                      </label>
                      <input
                        name="category"
                        value={form.category}
                        onChange={handleFormChange}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Изображение (URL)
                      </label>
                      <input
                        name="image"
                        value={form.image}
                        onChange={handleFormChange}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Можно оставить URL или загрузить файл ниже.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Загрузить фото
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="mt-1 block w-full text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-sky-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-sky-600 dark:text-slate-300"
                      />
                      {form.imageFile && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Выбран файл: {form.imageFile.name}
                        </p>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Дополнительные фото
                      </label>
                      <textarea
                        name="imagesText"
                        rows={3}
                        value={form.imagesText}
                        onChange={handleFormChange}
                        placeholder="По одному URL в строке"
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Описание
                      </label>
                      <textarea
                        name="description"
                        rows={3}
                        value={form.description}
                        onChange={handleFormChange}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Характеристики
                      </label>
                      <textarea
                        name="specsText"
                        rows={5}
                        value={form.specsText}
                        onChange={handleFormChange}
                        placeholder="Тип: Беспроводные наушники\nАкцент: ANC"
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                  {formError && (
                    <p className="mt-3 text-sm text-red-600 dark:text-red-400">{formError}</p>
                  )}
                  <div className="mt-4 flex gap-3">
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-60 transition-colors"
                    >
                      <Check className="h-4 w-4" />
                      {formLoading ? 'Сохранение...' : 'Сохранить'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      Отмена
                    </button>
                  </div>
                </form>
              )}

              {products.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-800/50">
                  <p className="text-slate-500 dark:text-slate-400">Товаров нет</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">ID</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Название</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Категория</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">Цена</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">Остаток</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
                      {products.map((product) => (
                        <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{product.id}</td>
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{product.name}</td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{product.category ?? '—'}</td>
                          <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{formatPrice(product.price)}</td>
                          <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{product.stock}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEdit(product)}
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-sky-600 dark:hover:bg-slate-700 dark:hover:text-sky-400 transition-colors"
                                aria-label="Редактировать"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              {deleteConfirm === product.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(product.id)}
                                    className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    aria-label="Подтвердить"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirm(null)}
                                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    aria-label="Отмена"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirm(product.id)}
                                  className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                                  aria-label="Удалить"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Orders tab */}
          {tab === 'orders' && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-800/50">
                  <p className="text-slate-500 dark:text-slate-400">Заказов нет</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/50 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <div className="flex flex-wrap items-center gap-4">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            Заказ #{order.id}
                            {order.user && (
                              <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                                {order.user.username} ({order.user.email})
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                              year: 'numeric', month: 'long', day: 'numeric',
                            })}
                          </p>
                        </div>
                        <span className={clsx('rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_COLORS[order.status] ?? 'bg-slate-100 text-slate-600')}>
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formatPrice(order.total)}
                        </span>
                        {expandedOrder === order.id ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    </button>
                    {expandedOrder === order.id && (
                      <div className="border-t border-slate-200 p-4 dark:border-slate-700">
                        <ul className="mb-4 space-y-2">
                          {order.items.map((item) => (
                            <li key={item.id} className="flex items-center justify-between text-sm">
                              <span className="text-slate-700 dark:text-slate-300">
                                {item.product?.name ?? `Товар #${item.productId}`}
                                <span className="ml-2 text-slate-400">× {item.quantity}</span>
                              </span>
                              <span className="font-medium text-slate-900 dark:text-white">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Изменить статус:
                          </span>
                          {(['pending', 'completed', 'cancelled'] as const).map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => handleStatusChange(order.id, s)}
                              disabled={order.status === s}
                              className={clsx(
                                'rounded-lg px-3 py-1 text-xs font-medium transition-colors',
                                order.status === s
                                  ? `${STATUS_COLORS[s]} opacity-80 cursor-default`
                                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700'
                              )}
                            >
                              {STATUS_LABELS[s]}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
