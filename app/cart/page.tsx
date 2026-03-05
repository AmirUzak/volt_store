import { CartContent } from './CartContent';

export const metadata = {
  title: 'Корзина | VOLT',
  description: 'Корзина покупок VOLT.',
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Корзина</h1>
      <CartContent />
    </div>
  );
}
