import { CheckoutForm } from './CheckoutForm';

export const metadata = {
  title: 'Оформление заказа | VOLT',
  description: 'Оформление заказа в магазине VOLT.',
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Оформление заказа</h1>
      <CheckoutForm />
    </div>
  );
}
