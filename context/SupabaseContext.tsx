import React, { createContext, useState, ReactNode, useContext, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../src/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { InventoryItem, Product, Order, OrderStatus, User, AuditLogEntry, Issue } from '../types';

type LoginResult = {
  success: boolean;
  reason?: 'WRONG_PASSWORD' | 'NOT_VERIFIED' | 'USER_NOT_FOUND' | 'UNKNOWN_ERROR';
  userEmail?: string;
}

type RegisterResult = {
  success: boolean;
  user?: User;
  reason?: 'EMAIL_EXISTS' | 'UNKNOWN_ERROR' | 'DATABASE_ERROR';
  message?: string;
}

interface AppContextType {
  // App Data
  inventory: InventoryItem[];
  products: Product[];
  orders: Order[];
  users: User[];
  auditLogs: AuditLogEntry[];
  issues: Issue[];
  
  // Auth State
  currentUser: User | null;
  isLoading: boolean;
  isOffline: boolean;

  // Auth Actions
  login: (email: string, password: string) => Promise<LoginResult>;
  socialLogin: (provider: 'google' | 'apple' | 'facebook') => Promise<LoginResult>;
  logout: () => Promise<void>;
  register: (userData: Omit<User, 'id' | 'isApproved' | 'isEmailVerified'> & { password?: string }) => Promise<RegisterResult>;
  sendVerificationEmail: () => Promise<void>;

  // MSME Actions
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateInventoryItem: (item: InventoryItem) => Promise<void>;
  deleteInventoryItem: (itemId: string) => Promise<void>;
  addProduct: (item: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (item: Product) => Promise<void>;
  deleteProduct: (itemId: string) => Promise<void>;
  
  // Inventory Management
  restockProduct: (productId: string, additionalStock: number) => Promise<boolean>;
  checkStockAvailability: (productId: string, quantity: number) => Promise<boolean>;
  approveBuyer: (buyerId: string) => Promise<boolean>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;

  // Buyer Actions
  placeOrder: (item: InventoryItem | Product, quantity: number) => Promise<void>;

  // Admin Actions
  approveUser: (userId: string) => Promise<void>;
  deleteUser: (userId: string, feedback: string) => Promise<void>;
  requestProfileUpdate: (userId: string, updatedData: Partial<User>, gstFile?: File | null) => Promise<void>;
  approveProfileChanges: (userId: string) => Promise<void>;
  rejectProfileChanges: (userId: string) => Promise<void>;
  logAction: (action: string, details: string) => Promise<void>;
  clearLogs: () => Promise<void>;
  
  // Utility Actions
  cleanupOrphanedUser: (email: string) => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

// Helper function to map database columns (lowercase) to TypeScript User type (camelCase)
const mapDatabaseUserToType = (dbUser: any): User => {
  return {
    id: dbUser.id,
    email: dbUser.email,
    username: dbUser.username,
    firstname: dbUser.firstname,
    phone: dbUser.phone,
    address: dbUser.address,
    role: dbUser.role,
    gstNumber: dbUser.gstnumber || dbUser.gstNumber || '',
    gstCertificateUrl: dbUser.gstcertificateurl || dbUser.gstCertificateUrl,
    profilePictureUrl: dbUser.profilepictureurl || dbUser.profilePictureUrl,
    profilePicture: dbUser.profilepicture || dbUser.profilePicture,
    companyName: dbUser.companyname || dbUser.companyName,
    isApproved: dbUser.isApproved ?? dbUser.isapproved ?? false,
    isEmailVerified: dbUser.isEmailVerified ?? dbUser.isemailverified ?? false,
    adminId: dbUser.adminId || dbUser.adminid,
    isMainAdmin: dbUser.isMainAdmin ?? dbUser.ismainadmin ?? false,
    domain: dbUser.domain,
    pendingChanges: dbUser.pendingchanges || dbUser.pendingChanges,
    createdAt: dbUser.createdat || dbUser.createdAt,
  };
};

// Helper function to map database Product to TypeScript Product type
const mapDatabaseProductToType = (dbProduct: any): Product => {
  return {
    id: dbProduct.id,
    msmeId: dbProduct.msmeid || dbProduct.msmeId,
    name: dbProduct.name,
    description: dbProduct.description || '',
    price: dbProduct.price || 0,
    stock: dbProduct.stock || 0,
    initialStock: dbProduct.initialstock || dbProduct.initialStock || dbProduct.stock || 0,
    recipe: dbProduct.recipe || [],
    averageRating: dbProduct.averageRating || dbProduct.averagerating || 0,
    totalRatings: dbProduct.totalRatings || dbProduct.totalratings || 0,
    createdAt: dbProduct.createdat || dbProduct.createdAt || null,
    updatedAt: dbProduct.updatedat || dbProduct.updatedAt || null,
  };
};

// Helper function to map database InventoryItem to TypeScript InventoryItem type
const mapDatabaseInventoryToType = (dbItem: any): InventoryItem => {
  return {
    id: dbItem.id,
    msmeId: dbItem.msmeid || dbItem.msmeId,
    name: dbItem.name,
    category: dbItem.category || '',
    description: dbItem.description || '',
    stock: dbItem.stock || 0,
    reserved: dbItem.reserved || 0,
    bought: dbItem.bought || 0,
    price: dbItem.price || 0,
    unitOfMeasure: dbItem.unitofmeasure || dbItem.unitOfMeasure || 'unit',
    minStockLevel: dbItem.minstocklevel || dbItem.minStockLevel || 0,
    status: dbItem.status || 'active',
    createdAt: dbItem.createdat || dbItem.createdAt || null,
    updatedAt: dbItem.updatedat || dbItem.updatedAt || null,
  };
};

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  console.log('SupabaseContext: AppProvider initializing');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const initializedRef = useRef(false);
  const channelsRef = useRef<any[]>([]);

  // Listen for browser online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auth state listener
  useEffect(() => {
    console.log('SupabaseContext: Setting up auth listener');
    
    let mounted = true;
    
    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('SupabaseContext: Initial session:', session, 'error:', sessionError);
        
        if (sessionError) {
          console.error('SupabaseContext: Session error:', sessionError);
          if (mounted) {
            setIsLoading(false);
            initializedRef.current = true;
          }
          return;
        }

        if (session?.user) {
          // Fetch user data from users table
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          console.log('SupabaseContext: User data:', userData, 'error:', error);

          if (userData && !error && mounted) {
            const mappedUser = mapDatabaseUserToType(userData);
            const isVerified = session.user.email_confirmed_at !== null;
            
            // Sync verification status to database if it changed
            if (isVerified && !mappedUser.isEmailVerified) {
              console.log('🔄 Syncing email verification to database for user:', session.user.email);
              const { error: updateError } = await supabase
                .from('users')
                .update({ isemailverified: true })
                .eq('id', session.user.id);
              
              if (updateError) {
                console.error('❌ Failed to update email verification:', updateError);
              } else {
                console.log('✅ Email verification synced to database');
              }
            }
            
            setCurrentUser({
              ...mappedUser,
              isEmailVerified: isVerified
            });
          } else if (mounted) {
            setCurrentUser(null);
          }
        } else if (mounted) {
          setCurrentUser(null);
        }
        
        if (mounted) {
          setIsLoading(false);
          initializedRef.current = true;
        }
      } catch (error) {
        console.error('SupabaseContext: Auth init error:', error);
        if (mounted) {
          setCurrentUser(null);
          setIsLoading(false);
          initializedRef.current = true;
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('SupabaseContext: Auth state changed:', event, session, 'initialized:', initializedRef.current);
      
      // Skip the initial SIGNED_IN event if we're still initializing
      if (!initializedRef.current && event === 'SIGNED_IN') {
        console.log('SupabaseContext: Skipping initial SIGNED_IN event during initialization');
        return;
      }
      
      if (session?.user && mounted) {
        console.log('SupabaseContext: Fetching user data for:', session.user.id);
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        console.log('SupabaseContext: User data fetched:', userData, 'error:', error);

        if (userData && !error) {
          console.log('SupabaseContext: Setting current user and isLoading=false');
          const mappedUser = mapDatabaseUserToType(userData);
          const isVerified = session.user.email_confirmed_at !== null;
          
          // Sync verification status to database if it changed
          if (isVerified && !mappedUser.isEmailVerified) {
            console.log('🔄 Syncing email verification to database (auth change) for user:', session.user.email);
            const { error: updateError } = await supabase
              .from('users')
              .update({ isemailverified: true })
              .eq('id', session.user.id);
            
            if (updateError) {
              console.error('❌ Failed to update email verification:', updateError);
            } else {
              console.log('✅ Email verification synced to database');
            }
          }
          
          setCurrentUser({
            ...mappedUser,
            isEmailVerified: isVerified
          });
        } else {
          console.log('SupabaseContext: No user data, setting currentUser=null');
          setCurrentUser(null);
        }
        console.log('SupabaseContext: Setting isLoading to false');
        setIsLoading(false);
      } else if (mounted) {
        console.log('SupabaseContext: No session, setting currentUser=null and isLoading=false');
        setCurrentUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Listen to users
  useEffect(() => {
    if (!currentUser) {
      setUsers([]);
      return;
    }

    const channel = supabase
      .channel('users-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        fetchUsers();
      })
      .subscribe();

    channelsRef.current.push(channel);
    fetchUsers();

    return () => {
      supabase.removeChannel(channel);
      channelsRef.current = channelsRef.current.filter(c => c !== channel);
    };
  }, [currentUser]);

  const fetchUsers = async () => {
    console.log('🔄 Fetching users...');
    const { data, error } = await supabase.from('users').select('*');
    if (data && !error) {
      console.log('✅ Raw users data from DB:', data.length, 'users');
      // Map database fields to TypeScript types
      const mappedUsers = data.map(mapDatabaseUserToType);
      console.log('✅ Mapped users:', mappedUsers.map(u => ({ 
        email: u.email, 
        role: u.role, 
        isEmailVerified: u.isEmailVerified,
        isMainAdmin: u.isMainAdmin 
      })));
      setUsers(mappedUsers);
    } else if (error) {
      console.error('❌ Error fetching users:', error);
    }
  };

  // Listen to inventory
  useEffect(() => {
    if (!currentUser) {
      setInventory([]);
      return;
    }

    const channel = supabase
      .channel('inventory-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, (payload) => {
        fetchInventory();
      })
      .subscribe();

    channelsRef.current.push(channel);
    fetchInventory();

    return () => {
      supabase.removeChannel(channel);
      channelsRef.current = channelsRef.current.filter(c => c !== channel);
    };
  }, [currentUser]);

  const fetchInventory = async () => {
    if (!currentUser) {
      console.log('❌ fetchInventory: No current user');
      return;
    }

    console.log('🔄 Fetching inventory for user:', {
      id: currentUser.id,
      role: currentUser.role,
      username: currentUser.username
    });

    let query = supabase.from('inventory').select('*');

    if (currentUser.role === 'msme') {
      console.log('📦 Filtering inventory by msmeId:', currentUser.id);
      query = query.eq('msmeId', currentUser.id);
    } else if (currentUser.role === 'buyer') {
      console.log('📦 Filtering inventory by status: active');
      query = query.eq('status', 'active');
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching inventory:', error);
      return;
    }
    
    if (data) {
      console.log('✅ Inventory fetched:', data.length, 'items');
      console.log('📦 Raw inventory data:', data.map(i => ({
        id: i.id,
        name: i.name,
        msmeid: i.msmeid,
        stock: i.stock,
        reserved: i.reserved
      })));
      const mappedInventory = data.map(mapDatabaseInventoryToType);
      console.log('📦 Mapped inventory:', mappedInventory.map(i => ({
        id: i.id,
        name: i.name,
        msmeId: i.msmeId,
        stock: i.stock,
        reserved: i.reserved
      })));
      setInventory(mappedInventory);
    } else {
      console.log('⚠️ No inventory data returned');
      setInventory([]);
    }
  };

  // Listen to products
  useEffect(() => {
    if (!currentUser) {
      setProducts([]);
      return;
    }

    const channel = supabase
      .channel('products-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        fetchProducts();
      })
      .subscribe();

    channelsRef.current.push(channel);
    fetchProducts();

    return () => {
      supabase.removeChannel(channel);
      channelsRef.current = channelsRef.current.filter(c => c !== channel);
    };
  }, [currentUser]);

  const fetchProducts = async () => {
    console.log('🔄 Fetching products...');
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      console.error('❌ Error fetching products:', error);
      return;
    }
    if (data) {
      console.log('✅ Products fetched:', data.length, 'products');
      console.log('📦 Raw products from database:', data.map(p => ({ 
        id: p.id, 
        name: p.name, 
        msmeid: p.msmeid,
        msmeId: p.msmeId 
      })));
      const mappedProducts = data.map(mapDatabaseProductToType);
      console.log('📦 Mapped products:', mappedProducts.map(p => ({ 
        id: p.id, 
        name: p.name, 
        msmeId: p.msmeId 
      })));
      setProducts(mappedProducts);
    }
  };

  // Listen to orders
  useEffect(() => {
    if (!currentUser) {
      setOrders([]);
      return;
    }

    const channel = supabase
      .channel('orders-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        console.log('🔔 Orders real-time event:', payload.eventType, payload);
        if (payload.eventType === 'DELETE') {
          console.log('🗑️ Order deleted:', payload.old);
        } else if (payload.eventType === 'INSERT') {
          console.log('➕ New order:', payload.new);
        } else if (payload.eventType === 'UPDATE') {
          console.log('✏️ Order updated:', payload.new);
        }
        fetchOrders();
      })
      .subscribe();

    channelsRef.current.push(channel);
    fetchOrders();

    return () => {
      supabase.removeChannel(channel);
      channelsRef.current = channelsRef.current.filter(c => c !== channel);
    };
  }, [currentUser]);

  const fetchOrders = async () => {
    if (!currentUser) {
      console.log('❌ fetchOrders: No current user');
      return;
    }

    console.log('🔄 Fetching orders for user:', {
      id: currentUser.id,
      role: currentUser.role,
      username: currentUser.username
    });

    let query = supabase.from('orders').select('*');

    if (currentUser.role === 'buyer') {
      console.log('📦 Filtering orders by buyerId:', currentUser.id);
      query = query.eq('buyerId', currentUser.id);
    } else if (currentUser.role === 'msme') {
      console.log('📦 Fetching all orders (will filter by product ownership in component)');
    }
    // For MSME users, fetch all orders (filtering will be done in the component based on product ownership)
    // For admin, fetch all orders

    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching orders:', error);
      return;
    }
    
    if (data) {
      console.log('✅ Orders fetched:', data.length, 'orders for role:', currentUser.role);
      console.log('📦 Orders data:', data.map(o => ({
        id: o.id,
        buyerId: o.buyerId,
        buyerName: o.buyerName,
        status: o.status,
        items: o.items
      })));
      setOrders(data as Order[]);
    } else {
      console.log('⚠️ No orders data returned');
      setOrders([]);
    }
  };

  // Listen to audit logs
  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      setAuditLogs([]);
      return;
    }

    const channel = supabase
      .channel('audit-logs-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auditlogs' }, (payload) => {
        fetchAuditLogs();
      })
      .subscribe();

    channelsRef.current.push(channel);
    fetchAuditLogs();

    return () => {
      supabase.removeChannel(channel);
      channelsRef.current = channelsRef.current.filter(c => c !== channel);
    };
  }, [currentUser]);

  // Listen to issues
  useEffect(() => {
    if (!currentUser) {
      setIssues([]);
      return;
    }

    const channel = supabase
      .channel('issues-channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'issues' 
      }, (payload) => {
        console.log('🔄 Issues changed:', payload.eventType);
        fetchIssues();
      })
      .subscribe();

    channelsRef.current.push(channel);
    fetchIssues();

    return () => {
      supabase.removeChannel(channel);
      channelsRef.current = channelsRef.current.filter(c => c !== channel);
    };
  }, [currentUser]);

  const fetchAuditLogs = async () => {
    if (!currentUser) return;
    
    console.log('🔄 Fetching audit logs for:', currentUser.username, '| Is Main Admin:', currentUser.isMainAdmin);
    
    let query = supabase.from('auditlogs').select('*');
    
    // Main Admin sees ALL logs
    // Sub Admin sees only their own actions (logs where username = their username)
    if (!currentUser.isMainAdmin) {
      console.log('📋 Sub-admin filter: Only showing logs by', currentUser.username);
      query = query.eq('username', currentUser.username);
    } else {
      console.log('📋 Main admin: Showing ALL logs');
    }
    
    const { data, error } = await query.order('timestamp', { ascending: false });
    
    if (data && !error) {
      console.log('✅ Raw audit logs from DB:', data.length, 'entries');
      // Map database fields to TypeScript interface
      const mappedLogs = data.map((log: any) => ({
        id: log.id,
        timestamp: log.timestamp,
        adminUsername: log.username || 'System', // Map 'username' to 'adminUsername'
        action: log.action,
        details: log.details
      }));
      console.log('✅ Mapped audit logs:', mappedLogs);
      setAuditLogs(mappedLogs as AuditLogEntry[]);
    } else if (error) {
      console.error('❌ Error fetching audit logs:', error);
    }
  };

  const fetchIssues = async () => {
    if (!currentUser) return;

    console.log('🔄 Fetching issues for:', currentUser.username, 'Role:', currentUser.role);
    
    try {
      let query = supabase.from('issues').select('*');

      if (currentUser.role === 'buyer' || currentUser.role === 'msme') {
        console.log('📋 Filtering issues for user:', currentUser.id);
        query = query.eq('reporterid', currentUser.id);
      } else {
        console.log('📋 Admin: Fetching all issues');
      }

      const { data, error } = await query.order('createdat', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching issues:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        // Set empty array on error
        setIssues([]);
        return;
      }
      
      if (data) {
        console.log('✅ Issues fetched:', data.length, 'issues');
        if (data.length > 0) {
          console.log('Sample issue:', data[0]);
        }
        const mappedIssues: Issue[] = data.map((item: any) => ({
          id: item.id,
          reporterId: item.reporterid,
          reporterName: item.reportername,
          reporterRole: item.reporterrole,
          orderId: item.orderid,
          title: item.title,
          description: item.description,
          category: item.category,
          priority: item.priority,
          status: item.status,
          assignedTo: item.assignedto,
          adminResponse: item.adminresponse,
          resolvedAt: item.resolvedat,
          resolvedBy: item.resolvedby,
          createdAt: item.createdat,
          updatedAt: item.updatedat
        }));
        setIssues(mappedIssues);
      } else {
        console.log('✅ No issues found');
        setIssues([]);
      }
    } catch (error) {
      console.error('❌ Exception fetching issues:', error);
      setIssues([]);
    }
  };

  // Auth Actions
  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          return { success: false, reason: 'NOT_VERIFIED', userEmail: email };
        }
        return { success: false, reason: 'WRONG_PASSWORD' };
      }

      // Allow all users to login - role-based access control will be handled by App.tsx routing
      if (data.user) {
        console.log('✅ User logged in successfully:', data.user.email);
      }

      // Sync email verification status to database
      if (data.user && data.user.email_confirmed_at) {
        console.log('🔄 Syncing email verification on login for user:', data.user.email);
        const { error: updateError } = await supabase
          .from('users')
          .update({ isemailverified: true })
          .eq('id', data.user.id);
        
        if (updateError) {
          console.error('❌ Failed to update email verification on login:', updateError);
        } else {
          console.log('✅ Email verification synced on login');
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Login failed:', error);
      return { success: false, reason: 'UNKNOWN_ERROR' };
    }
  };

  const socialLogin = async (providerName: 'google' | 'apple' | 'facebook'): Promise<LoginResult> => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: providerName as any,
      });

      if (error) {
        return { success: false, reason: 'UNKNOWN_ERROR' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Social login error:', error);
      return { success: false, reason: 'UNKNOWN_ERROR' };
    }
  };

  const logout = async () => {
    try {
      console.log('🔄 Starting logout cleanup...');
      
      // 1. Unsubscribe from all real-time channels immediately
      console.log('🔌 Unsubscribing from', channelsRef.current.length, 'channels');
      for (const channel of channelsRef.current) {
        try {
          await supabase.removeChannel(channel);
        } catch (e) {
          console.error('Error removing channel:', e);
        }
      }
      channelsRef.current = [];
      
      // 2. Clear all state data immediately (non-blocking)
      setCurrentUser(null);
      setInventory([]);
      setProducts([]);
      setOrders([]);
      setUsers([]);
      setAuditLogs([]);
      setIssues([]);
      
      // 3. Sign out from Supabase (async but doesn't block UI)
      console.log('🔐 Signing out from Supabase');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Logout error:', error);
      } else {
        console.log('✅ Logout completed successfully');
      }
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Ensure state is cleared even if logout fails
      setCurrentUser(null);
      setInventory([]);
      setProducts([]);
      setOrders([]);
      setUsers([]);
      setAuditLogs([]);
      setIssues([]);
    }
  };

  const register = async (userData: Omit<User, 'id' | 'isApproved' | 'isEmailVerified'> & { password?: string }): Promise<RegisterResult> => {
    try {
      if (!userData.password) {
        return { success: false, reason: 'UNKNOWN_ERROR' };
      }

      // Sign up with user metadata - trigger will create profile automatically
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            username: userData.username,
            role: userData.role,
            phone: userData.phone || '',
            address: userData.address || '',
            domain: userData.domain || '',
            gstnumber: userData.gstNumber || '',
            firstname: userData.firstname || userData.username,
          },
          emailRedirectTo: window.location.origin,
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          return { success: false, reason: 'EMAIL_EXISTS' };
        }
        console.error('Auth signup error:', authError);
        return { success: false, reason: 'UNKNOWN_ERROR', message: authError.message };
      }

      if (!authData.user) {
        return { success: false, reason: 'UNKNOWN_ERROR' };
      }

      console.log('User created successfully via trigger:', authData.user.id);
      
      // Wait for trigger to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify user record was created by trigger
      const { data: userRecord, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      if (fetchError || !userRecord) {
        console.error('User record not found after trigger:', fetchError);
        // Don't fail - the trigger might still be processing
      } else {
        console.log('User record verified:', userRecord);
      }

      // Log registration to audit log for admins to see
      if (userData.role === 'admin' && currentUser?.role === 'admin') {
        await logAction('Admin Creation', `Created new admin: ${userData.username} (${userData.email})`);
      } else if (userData.role === 'msme') {
        // Log MSME registration
        const logEntry = {
          action: 'New MSME Registration',
          details: `New MSME user registered: ${userData.username} (${userData.email}) - Domain: ${userData.domain || 'Not specified'}`,
          userid: authData.user.id,
          username: 'System',
          timestamp: new Date().toISOString()
        };
        const { error: logError } = await supabase.from('auditlogs').insert([logEntry]);
        if (logError) console.error('Failed to log MSME registration:', logError);
      } else if (userData.role === 'buyer') {
        // Log Buyer registration
        const logEntry = {
          action: 'New Buyer Registration',
          details: `New Buyer user registered: ${userData.username} (${userData.email})`,
          userid: authData.user.id,
          username: 'System',
          timestamp: new Date().toISOString()
        };
        const { error: logError } = await supabase.from('auditlogs').insert([logEntry]);
        if (logError) console.error('Failed to log Buyer registration:', logError);
      }

      await supabase.auth.signOut();
      return { 
        success: true, 
        user: userRecord as User || { 
          id: authData.user.id, 
          email: userData.email,
          username: userData.username,
          role: userData.role,
          isApproved: userData.role === 'admin',
          isEmailVerified: false
        } as User
      };
    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        status: error?.status,
        fullError: error
      });
      return { 
        success: false, 
        reason: 'UNKNOWN_ERROR',
        message: error?.message || 'An unexpected error occurred during registration'
      };
    }
  };

  const sendVerificationEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.auth.resend({
        type: 'signup',
        email: user.email!,
      });
    }
  };

  // MSME Actions
  const addInventoryItem = async (itemData: Omit<InventoryItem, 'id'>) => {
    if (!currentUser || currentUser.role !== 'msme' || !currentUser.isApproved) {
      throw new Error('Unauthorized');
    }

    // Map camelCase to lowercase for database
    const itemWithMetadata = {
      name: itemData.name,
      category: itemData.category,
      description: itemData.description || '',
      stock: itemData.stock,
      bought: itemData.bought || 0,
      price: itemData.price,
      unitofmeasure: itemData.unitOfMeasure,
      minstocklevel: itemData.minStockLevel,
      status: itemData.status || 'active',
      msmeid: currentUser.id,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    };

    const { error } = await supabase.from('inventory').insert([itemWithMetadata]);
    if (error) {
      console.error('❌ Error inserting inventory item:', error);
      throw error;
    }
    console.log('✅ Inventory item added successfully');
  };

  const updateInventoryItem = async (updatedItem: InventoryItem) => {
    if (!currentUser || currentUser.role !== 'msme' || !currentUser.isApproved) {
      throw new Error('Unauthorized');
    }

    const { id, msmeId, createdAt, updatedAt, ...data } = updatedItem as any;
    
    // Map camelCase to lowercase for Supabase
    const updateData: any = {
      name: data.name,
      category: data.category,
      description: data.description || '',
      stock: data.stock,
      bought: data.bought || 0,
      price: data.price,
      unitofmeasure: data.unitOfMeasure,
      minstocklevel: data.minStockLevel,
      status: data.status || 'active',
      updatedat: new Date().toISOString()
    };
    
    // Remove undefined/null values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const { error } = await supabase
      .from('inventory')
      .update(updateData)
      .eq('id', id)
      .eq('msmeId', currentUser.id);

    if (error) {
      console.error('❌ Error updating inventory item:', error);
      throw error;
    }
    
    console.log('✅ Inventory item updated successfully');
  };

  const deleteInventoryItem = async (itemId: string) => {
    if (!currentUser || currentUser.role !== 'msme' || !currentUser.isApproved) {
      throw new Error('Unauthorized');
    }

    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', itemId)
      .eq('msmeId', currentUser.id);

    if (error) throw error;
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    if (!currentUser || currentUser.role !== 'msme' || !currentUser.isApproved) {
      throw new Error('Unauthorized');
    }

    // Remove msmeId and initialStock (camelCase) and use lowercase versions for Supabase
    const { msmeId, initialStock, ...productData } = product as any;
    
    const productWithMetadata = {
      ...productData,
      msmeid: currentUser.id,
      initialstock: initialStock || product.stock,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    };

    const { error } = await supabase.from('products').insert([productWithMetadata]);
    if (error) {
      console.error('❌ Error inserting product:', error);
      throw error;
    }
    
    console.log('✅ Product added successfully');
    // Refresh products list
    await fetchProducts();
  };

  const updateProduct = async (updatedProduct: Product) => {
    if (!currentUser || currentUser.role !== 'msme' || !currentUser.isApproved) {
      throw new Error('Unauthorized');
    }

    const { id, msmeId, initialStock, ...data } = updatedProduct as any;
    
    // Map camelCase to lowercase for Supabase
    const updateData: any = {
      ...data,
      initialstock: initialStock,
      updatedat: new Date().toISOString()
    };
    
    // Remove undefined/null values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .eq('msmeId', currentUser.id);

    if (error) {
      console.error('❌ Error updating product:', error);
      throw error;
    }
    
    console.log('✅ Product updated successfully');
    // Refresh products list
    await fetchProducts();
  };

  const deleteProduct = async (productId: string) => {
    if (!currentUser || currentUser.role !== 'msme' || !currentUser.isApproved) {
      throw new Error('Unauthorized');
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('msmeId', currentUser.id);

    if (error) {
      console.error('❌ Error deleting product:', error);
      throw error;
    }
    
    console.log('✅ Product deleted successfully');
    // Refresh products list
    await fetchProducts();
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    console.log('🔄 Updating order status:', orderId, 'to', status);
    
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status,
        updatedAt: new Date().toISOString() // Explicitly update timestamp
      })
      .eq('id', orderId)
      .select();

    if (error) {
      console.error('❌ Error updating order status:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    
    console.log('✅ Order status updated successfully');
    console.log('Updated order:', data);
    await fetchOrders(); // Refresh orders list
  };

  const placeOrder = async (item: InventoryItem | Product, quantity: number) => {
    if (!currentUser) throw new Error('User not authenticated');
    if (item.stock < quantity) throw new Error('Insufficient stock');

    const orderData = {
      buyerId: currentUser.id,
      buyerName: currentUser.username,
      itemName: item.name,
      items: [{
        productId: item.id,
        productName: item.name,
        quantity: quantity,
        price: item.price
      }],
      totalAmount: item.price * quantity,
      status: 'Pending' as OrderStatus,
      createdAt: new Date().toISOString()
    };

    console.log('📦 Placing order with data:', orderData);

    const { data, error } = await supabase.from('orders').insert([orderData]).select();
    
    if (error) {
      console.error('❌ Order placement error:', error);
      throw error;
    }

    console.log('✅ Order placed successfully:', data);
    console.log('ℹ️ Stock deducted by database trigger');
    
    // Refresh products to show updated stock
    await fetchProducts();
    console.log('✅ Products refreshed after order placement');
  };

  const restockProduct = async (productId: string, additionalStock: number): Promise<boolean> => {
    const { data, error } = await supabase
      .from('products')
      .select('stock')
      .eq('id', productId)
      .single();

    if (error || !data) return false;

    const newStock = data.stock + additionalStock;
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId);

    return !updateError;
  };

  const checkStockAvailability = async (productId: string, quantity: number): Promise<boolean> => {
    const { data, error } = await supabase
      .from('products')
      .select('stock')
      .eq('id', productId)
      .single();

    if (error || !data) return false;
    return data.stock >= quantity;
  };

  const approveBuyer = async (buyerId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('users')
      .update({ isApproved: true })
      .eq('id', buyerId);

    return !error;
  };

  const approveUser = async (userId: string) => {
    const { error } = await supabase
      .from('users')
      .update({ isApproved: true })
      .eq('id', userId);

    if (error) throw error;
    await logAction('User Approval', `Approved user: ${userId}`);
  };

  const deleteUser = async (userId: string, feedback: string) => {
    // Get user details before deletion for logging
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    // Delete user from database
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    // Log the deletion with feedback
    const userInfo = userData ? `${userData.username} (${userData.email})` : userId;
    await logAction('User Deletion', `Deleted user: ${userInfo}. Reason: ${feedback}`);
  };

  const requestProfileUpdate = async (userId: string, updatedData: Partial<User>, gstFile?: File | null) => {
    // Convert camelCase to lowercase for database columns
    const dbData: any = {};
    for (const [key, value] of Object.entries(updatedData)) {
      const dbKey = key.toLowerCase();
      dbData[dbKey] = value;
    }
    dbData.updatedat = new Date().toISOString();

    const { error } = await supabase
      .from('users')
      .update(dbData)
      .eq('id', userId);

    if (error) throw error;

    // Refresh current user data if updating own profile
    if (currentUser && userId === currentUser.id) {
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userData && !fetchError) {
        const mappedUser = mapDatabaseUserToType(userData);
        setCurrentUser({
          ...mappedUser,
          isEmailVerified: currentUser.isEmailVerified
        });
      }
    }
  };

  const approveProfileChanges = async (userId: string) => {
    await logAction('Profile Update Approved', `Approved profile changes for user: ${userId}`);
  };

  const rejectProfileChanges = async (userId: string) => {
    await logAction('Profile Update Rejected', `Rejected profile changes for user: ${userId}`);
  };

  const logAction = async (action: string, details: string) => {
    if (!currentUser) return;

    const adminType = currentUser.isMainAdmin ? 'Main Admin' : 'Sub Admin';
    console.log(`📝 Logging action by ${adminType} (${currentUser.username}):`, action);

    const logEntry = {
      action,
      details,
      userid: currentUser.id,
      username: currentUser.username,
      timestamp: new Date().toISOString()
    };

    const { error } = await supabase.from('auditlogs').insert([logEntry]);
    if (error) {
      console.error('❌ Failed to log action:', error);
    } else {
      console.log('✅ Action logged successfully');
    }
  };

  const clearLogs = async () => {
    const { error } = await supabase.from('auditlogs').delete().neq('id', '');
    if (error) throw error;
  };

  const cleanupOrphanedUser = async (email: string) => {
    // This would require admin API access
    console.log('Cleanup orphaned user:', email);
  };

  const value = useMemo(() => ({
    inventory,
    products,
    orders,
    users,
    auditLogs,
    issues,
    currentUser,
    isLoading,
    isOffline,
    login,
    socialLogin,
    logout,
    register,
    sendVerificationEmail,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    addProduct,
    updateProduct,
    deleteProduct,
    restockProduct,
    checkStockAvailability,
    approveBuyer,
    updateOrderStatus,
    placeOrder,
    approveUser,
    deleteUser,
    requestProfileUpdate,
    approveProfileChanges,
    rejectProfileChanges,
    logAction,
    clearLogs,
    cleanupOrphanedUser
  }), [
    inventory,
    products,
    orders,
    users,
    auditLogs,
    currentUser,
    isLoading,
    isOffline
  ]);

  console.log('SupabaseContext: Rendering provider, isLoading=', isLoading);
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
