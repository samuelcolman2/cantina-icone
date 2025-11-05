
export type ProductCategory = string;
export type UserRole = 'admin' | 'seller';

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  sold: number;
  image: string | null;
  category: ProductCategory;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  role: UserRole;
}
