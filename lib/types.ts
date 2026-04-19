export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
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
}

export interface CartItem {
  product: Product;
  quantity: number;
}
