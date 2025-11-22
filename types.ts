export type View = 'dashboard' | 'inventory' | 'orders' | 'profile' | 'products' | 'inventory-dashboard' | 'issues' | 'resolved';
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
  profilePicture?: string; // For Base64 encoded images
  companyName?: string;
  isApproved: boolean;
  isEmailVerified: boolean;
  adminId?: string;
  isMainAdmin?: boolean; // True for main admin, false/undefined for sub-admins
  domain?: MSMEDomain;
  pendingChanges?: Partial<Omit<User, 'id' | 'email' | 'role'>>;
  createdAt?: any; // Firebase Timestamp
}

export type Language = 'en' | 'ta';

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  timestamp: any;
  details?: string;
}

export type FeedbackCategory = 'product_quality' | 'delivery' | 'service' | 'platform' | 'other';
export type FeedbackStatus = 'pending' | 'reviewed' | 'resolved';

export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  orderId?: string;
  rating: number; // 1-5
  comment?: string;
  category?: FeedbackCategory;
  status: FeedbackStatus;
  adminResponse?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InventoryItem {
  id: string; // Firestore Document ID
  msmeId: string; // User UID
  name: string;
  category: string;
  description?: string;
  stock: number; // Total stock
  reserved?: number; // Stock reserved for pending orders
  bought?: number; // Stock bought/purchased
  price: number;
  unitOfMeasure: string;
  minStockLevel: number;
  status?: 'active' | 'inactive';
  createdAt?: Date | null; // Date object
  updatedAt?: Date | null; // Date object
}

export interface ProductRecipeItem {
  inventoryId: string;
  quantity: number;
}

export interface Product {
  id: string; // Firestore Document ID
  msmeId: string; // User UID
  name: string;
  description: string;
  price: number;
  stock: number; // Current stock
  initialStock: number; // Initial stock when product was created
  recipe?: ProductRecipeItem[]; // Links to inventory items needed to make this product
  averageRating?: number; // Average rating (0-5)
  totalRatings?: number; // Total number of ratings
  createdAt?: Date | null; // Date object
  updatedAt?: Date | null; // Date object
}

export type OrderStatus = 'Pending' | 'Accepted' | 'Shipped' | 'Delivered' | 'Cancelled';

// Updated to match new database schema with camelCase columns
export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  itemName: string;
  buyerGst?: string;
  buyerPhone?: string;
  date?: string; // Legacy field
  createdAt?: string;
  updatedAt?: string;
  status: OrderStatus;
  total?: number; // Legacy field
  totalAmount: number;
  items: {
    productId: string;
    productName?: string;
    quantity: number;
    price?: number;
  }[];
  shippingAddress?: Address;
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

// Feedback System (defined above with FeedbackCategory and FeedbackStatus types)

// Issue Management
export type IssueCategory = 'order' | 'payment' | 'quality' | 'delivery' | 'technical' | 'other';
export type IssuePriority = 'low' | 'medium' | 'high' | 'urgent';
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Issue {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterRole: UserRole;
  orderId?: string;
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  status: IssueStatus;
  assignedTo?: string;
  adminResponse?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResolvedIssue {
  id: string;
  originalId?: string; // Original issue ID
  reporterId?: string;
  reporterUsername: string;
  reporterEmail: string;
  reporterRole: 'msme' | 'buyer';
  title: string;
  description: string;
  category: IssueCategory;
  priority?: IssuePriority;
  relatedUserId?: string;
  relatedUsername?: string;
  orderId?: string;
  resolvedBy?: string; // Admin ID
  resolvedByUsername: string;
  resolutionNotes: string;
  resolutionDate: string;
  reportedAt: string;
  resolvedAt: string;
}