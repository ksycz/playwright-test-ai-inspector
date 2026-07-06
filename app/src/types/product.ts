export interface Product {
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  image: string;
  featured?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
