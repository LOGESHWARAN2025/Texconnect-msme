export type View = 'dashboard' | 'inventory' | 'orders' | 'profile' | 'products' | 'inventory-dashboard';
export type UserRole = 'msme' | 'buyer' | 'admin';
export type MSMEDomain = 'Spinning Mills' | 'Knitting and Weaving' | 'Dyeing and Finishing' | 'Apparel Manufacturing';

export interface User {
  id: string; // Firebase Auth UID
  email: string;
  username: string;
  firstname: string;
  phone: string;
  address: string;
  role: UserRole;
  gstNumber: string;
  gstCertificateUrl?: string;
  profilePictureUrl?: string;
  companyName?: string;
  isApproved: boolean;
  isEmailVerified: boolean;
  adminId?: string;
  domain?: MSMEDomain;
  pendingChanges?: Partial<Omit<User, 'id' | 'email' | 'role'>>;
  createdAt?: any; // Firebase Timestamp
}

export type Language = 'en' | 'ta';

export interface InventoryItem {
  id: string; // Firestore Document ID
  msmeId: string; // User UID
  name: string;
  category: string;
  description?: string;
  stock: number;
  price: number;
  unitOfMeasure: string;
  minStockLevel: number;
  status?: 'active' | 'inactive';
  createdAt?: Date | null; // Date object
  updatedAt?: Date | null; // Date object
}

export interface Product {
  id: string; // Firestore Document ID
  msmeId: string; // User UID
  name: string;
  description: string;
  price: number;
  stock: number; // Current stock
  initialStock: number; // Initial stock when product was created
  createdAt?: Date | null; // Date object
  updatedAt?: Date | null; // Date object
}

export type OrderStatus = 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string; // Firestore Document ID
  buyerId: string;
  buyerName: string;
  buyerGst: string;
  date: string;
  status: OrderStatus;
  total: number;
  items: {
    productId: string;
    quantity: number;
  }[];
}

export interface SalesData {
  month: string;
  sales: number;
}

export interface StockData {
    date: string;
    stockLevel: number;
}

export interface AuditLogEntry {
  id: string; // Firestore Document ID
  timestamp: string;
  adminUsername: string;
  action: string;
  details: string;
}