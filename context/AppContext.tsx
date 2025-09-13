import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import { auth, db, firebase, storage } from '../firebase';
// With Firebase v8, the `firebase/firestore` side-effect import in `firebase.ts` is
// sufficient to attach the `firestore` namespace (including `FieldValue`) to the `firebase` object.


import type { InventoryItem, Product, Order, OrderStatus, User, AuditLogEntry } from '../types';
import { InventoryService } from '../services/inventoryService';

// Offline persistence is now handled in firebase.ts with modern cache settings


type LoginResult = {
  success: boolean;
  reason?: 'WRONG_PASSWORD' | 'NOT_VERIFIED' | 'USER_NOT_FOUND' | 'UNKNOWN_ERROR';
  userEmail?: string;
}


type RegisterResult = {
  success: boolean;
  user?: User;
  reason?: 'EMAIL_EXISTS' | 'UNKNOWN_ERROR';
}


interface AppContextType {
  // App Data
  inventory: InventoryItem[];
  products: Product[];
  orders: Order[];
  users: User[];
  auditLogs: AuditLogEntry[];
  
  // Auth State
  currentUser: User | null;
  isLoading: boolean;
  isOffline: boolean;


  // Auth Actions
  login: (email: string, password: string) => Promise<LoginResult>;
  socialLogin: (provider: 'google' | 'apple' | 'facebook') => Promise<LoginResult>;
  logout: () => Promise<void>;
  // FIX: Added password to register function parameter type to resolve type error
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


export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);


  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);


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


  // --- Firebase Listeners ---
  useEffect(() => {
    let unsubscribeUserDoc: () => void = () => {};


    // fix: Use Firebase v8 `auth.onAuthStateChanged` syntax.
    const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser) => {
      unsubscribeUserDoc(); // Unsubscribe from any previous user's document listener


      if (firebaseUser) {
        setIsLoading(true);
        // fix: Use Firebase v8 `db.collection.doc` syntax.
        const userDocRef = db.collection('users').doc(firebaseUser.uid);
        
        // Use onSnapshot for a more robust offline-first user fetch.
        // It reads from the cache first and doesn't fail on offline, unlike a simple getDoc.
        // fix: Use Firebase v8 `doc.onSnapshot` syntax.
        unsubscribeUserDoc = userDocRef.onSnapshot(
          (docSnap) => {
            if (docSnap.exists) {
              const userData = { id: docSnap.id, ...docSnap.data(), isEmailVerified: firebaseUser.emailVerified } as User;
              setCurrentUser(userData);
            } else {
              console.warn(`User ${firebaseUser.uid} authenticated but not found in Firestore. Logging out.`);
              // fix: Use Firebase v8 `auth.signOut` syntax.
              auth.signOut();
              setCurrentUser(null);
            }
            setIsLoading(false);
          },
          (error) => {
            console.error(`Error fetching user document: ${error.code} - ${error.message}`);
            // Handle network errors gracefully
            if (error.code === 'unavailable' || error.code === 'failed-precondition') {
              console.warn('Firestore temporarily unavailable, using cached data');
              setIsOffline(true);
            } else {
              // fix: Use Firebase v8 `auth.signOut` syntax.
              auth.signOut();
              setCurrentUser(null);
            }
            setIsLoading(false);
          }
        );


      } else {
        setCurrentUser(null);
        setIsLoading(false);
      }
    });


    return () => {
      unsubscribeAuth();
      unsubscribeUserDoc();
    };
  }, []);
  
  // Listen to all users (needed for buyer product display and admin functions)
  useEffect(() => {
    if (!currentUser) {
      setUsers([]);
      return;
    };
    
    console.log('Setting up users listener for role:', currentUser.role);
    
    // fix: Use Firebase v8 `db.collection` syntax.
    const q = db.collection('users');
    // fix: Use Firebase v8 `query.onSnapshot` syntax.
    const unsubscribe = q.onSnapshot((snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      console.log('Users snapshot received, count:', usersData.length);
      setUsers(usersData);
    }, (error) => {
        if (error.code === 'unavailable' || error.code === 'failed-precondition') {
            console.warn('Firestore temporarily unavailable for users, using cached data');
            setIsOffline(true);
        } else {
            console.error(`Error listening to users: ${error.code} - ${error.message}`);
        }
    });
    return () => unsubscribe();
  }, [currentUser]);


  // Listen to inventory based on user role
  useEffect(() => {
     // Only listen to inventory if user is authenticated
     if (!currentUser) {
       setInventory([]);
       return;
     }
     
     console.log('Setting up inventory listener for role:', currentUser.role);
     
     let q;
     if (currentUser.role === 'msme') {
       // MSME users see only their own inventory
       console.log('MSME user, filtering by msmeId:', currentUser.id);
       
       // Temporarily use simpler query to debug the issue
       console.log('Using simplified MSME query (no orderBy for now)');
       q = db.collection('inventory')
         .where('msmeId', '==', currentUser.id);
     } else if (currentUser.role === 'buyer') {
       // Buyers see inventory from all approved MSMEs
       console.log('Buyer user, viewing all active inventory');
       
       // Temporarily use simpler query to debug the issue
       console.log('Using simplified buyer query (no orderBy for now)');
       q = db.collection('inventory')
         .where('status', '==', 'active');
     } else if (currentUser.role === 'admin') {
       // Admins see all inventory
       console.log('Admin user, viewing all inventory');
       q = db.collection('inventory')
         .orderBy('createdAt', 'desc');
     } else {
       console.log('Unknown user role, clearing inventory');
       setInventory([]);
       return;
     }
     
     // fix: Use Firebase v8 `query.onSnapshot` syntax.
     const unsubscribe = q.onSnapshot((snapshot) => {
        console.log('Inventory snapshot received, count:', snapshot.size);
        console.log('Query used:', q.toString ? q.toString() : 'Query object');
        
        if (snapshot.size === 0) {
          console.log('⚠️ No inventory items returned by query');
          console.log('Query details:', {
            role: currentUser.role,
            hasStatusFilter: currentUser.role === 'buyer',
            hasMsmeIdFilter: currentUser.role === 'msme',
            hasOrderBy: currentUser.role !== 'buyer' && currentUser.role !== 'msme', // We removed orderBy for buyers and MSMEs
            msmeId: currentUser.role === 'msme' ? currentUser.id : 'N/A'
          });
          
          if (currentUser.role === 'msme') {
            console.log('💡 MSME user might not have any inventory items yet');
            console.log('💡 Or the msmeId field might not match the user ID');
          }
        }
        
        const inventoryData = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Processing inventory item:', {
            id: doc.id,
            name: data.name,
            status: data.status,
            msmeId: data.msmeId
          });
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || null,
            updatedAt: data.updatedAt?.toDate?.() || null
          } as InventoryItem;
        });
        console.log('Updating inventory state with items:', inventoryData.length);
        setInventory(inventoryData);
     }, (error) => {
        console.error('❌ Inventory listener error:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          role: currentUser.role
        });
        
        if (error.code === 'unavailable' || error.code === 'failed-precondition') {
            console.warn('Firestore temporarily unavailable for inventory, using cached data');
            setIsOffline(true);
        } else {
            console.error(`Error listening to inventory: ${error.code} - ${error.message}`);
        }
    });
     return () => unsubscribe();
  }, [currentUser]);

  // Listen to products collection
  useEffect(() => {
    if (!currentUser) {
      setProducts([]);
      return;
    }
    
    console.log('Setting up products listener for role:', currentUser.role);
    
    // fix: Use Firebase v8 `db.collection` syntax.
    const q = db.collection('products');
    // fix: Use Firebase v8 `query.onSnapshot` syntax.
    const unsubscribe = q.onSnapshot((snapshot) => {
      const productsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || null,
          updatedAt: data.updatedAt?.toDate?.() || null
        } as Product;
      });
      console.log('Products snapshot received, count:', productsData.length);
      setProducts(productsData);
    }, (error) => {
        if (error.code === 'unavailable' || error.code === 'failed-precondition') {
            console.warn('Firestore temporarily unavailable for products, using cached data');
            setIsOffline(true);
        } else {
            console.error(`Error listening to products: ${error.code} - ${error.message}`);
        }
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Listen to orders
  useEffect(() => {
    if (!currentUser) {
        setOrders([]);
        return;
    }
    let q;
    if (currentUser.role === 'msme') {
        // MSME sees all orders for their products. This is complex and would require querying subcollections or duplicating data.
        // For simplicity, we'll fetch all orders and filter client-side. This is NOT scalable for a real app.
        // fix: Use Firebase v8 `db.collection` syntax.
        q = db.collection('orders');
    } else if (currentUser.role === 'buyer') {
        // fix: Use Firebase v8 `db.collection.where` syntax.
        q = db.collection('orders').where('buyerId', '==', currentUser.id);
    } else { // Admin
        // fix: Use Firebase v8 `db.collection` syntax.
        q = db.collection('orders');
    }
    
    // fix: Use Firebase v8 `query.onSnapshot` syntax.
    const unsubscribe = q.onSnapshot((snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(ordersData);
    }, (error) => {
        if (error.code === 'unavailable' || error.code === 'failed-precondition') {
            console.warn('Firestore temporarily unavailable for orders, using cached data');
            setIsOffline(true);
        } else {
            console.error(`Error listening to orders: ${error.code} - ${error.message}`);
        }
    });
    return () => unsubscribe();
  }, [currentUser]);


  // Listen to audit logs (for Admin)
  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      setAuditLogs([]);
      return;
    }
    // fix: Use Firebase v8 `db.collection` syntax.
    const q = db.collection('auditLogs');
    // fix: Use Firebase v8 `query.onSnapshot` syntax.
    const unsubscribe = q.onSnapshot((snapshot) => {
      const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLogEntry));
      setAuditLogs(logsData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    }, (error) => {
        if (error.code === 'unavailable' || error.code === 'failed-precondition') {
            console.warn('Firestore temporarily unavailable for audit logs, using cached data');
            setIsOffline(true);
        } else {
            console.error(`Error listening to audit logs: ${error.code} - ${error.message}`);
        }
    });
    return () => unsubscribe();
  }, [currentUser]);



  // --- Auth Actions ---
  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      // fix: Use Firebase v8 `auth.signInWithEmailAndPassword` syntax.
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      if (!userCredential.user?.emailVerified) {
        // fix: Use Firebase v8 `user.sendEmailVerification` syntax.
        await userCredential.user?.sendEmailVerification();
        // fix: Use Firebase v8 `auth.signOut` syntax.
        await auth.signOut(); // Log them out so they have to verify
        return { success: false, reason: 'NOT_VERIFIED', userEmail: email };
      }
      return { success: true };
    } catch (error: any) {
      console.error(`Login failed: ${error.code} - ${error.message}`);
      // In modern Firebase SDKs, 'auth/invalid-credential' is used for both wrong password and user not found
      // to prevent email enumeration attacks. We'll group all credential-related errors.
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        return { success: false, reason: 'WRONG_PASSWORD' }; // Re-using WRONG_PASSWORD to mean any credential failure
      }
      return { success: false, reason: 'UNKNOWN_ERROR' };
    }
  };


  const socialLogin = async (providerName: 'google' | 'apple' | 'facebook'): Promise<LoginResult> => {
    let provider;
    // fix: Use Firebase v8 `firebase.auth.*` provider syntax.
    // FIX: Corrected firebase provider syntax to resolve TypeScript error.
    // FIX: Use firebase.auth namespace to create providers to resolve TypeScript error.
    if (providerName === 'google') provider = new firebase.auth.GoogleAuthProvider();
    else if (providerName === 'facebook') provider = new firebase.auth.FacebookAuthProvider();
    else provider = new firebase.auth.OAuthProvider('apple.com'); // Apple

    try {
      // Use redirect instead of popup to avoid Cross-Origin-Opener-Policy issues
      await auth.signInWithRedirect(provider);
      return { success: true };
    } catch (error: any) {
      console.error(`Social login error: ${error.code} - ${error.message}`);
      return { success: false, reason: 'UNKNOWN_ERROR' };
    }
  };


  const logout = async () => {
    // fix: Use Firebase v8 `auth.signOut` syntax.
    await auth.signOut();
  };

  const register = async (userData: Omit<User, 'id' | 'isApproved' | 'isEmailVerified'> & { password?: string }): Promise<RegisterResult> => {
    try {
      if (!userData.password) {
        console.error("Registration attempt without a password.");
        return { success: false, reason: 'UNKNOWN_ERROR' };
      }
      
      const userCredential = await auth.createUserWithEmailAndPassword(userData.email, userData.password);
      const { password, ...userDataWithoutPassword } = userData;
      
      const newUser: Omit<User, 'id'> = {
        ...userDataWithoutPassword,
        displayName: userDataWithoutPassword.username,
        isApproved: userData.role === 'admin',
        isEmailVerified: false,
      };

      // Create a cleaned version of the user data that removes any 'undefined' fields.
      // Firestore does not allow 'undefined' as a field value, which caused registration to fail for buyers.
      const cleanedNewUser = Object.fromEntries(
        Object.entries(newUser).filter(([, v]) => v !== undefined)
      );

      await db.collection("users").doc(userCredential.user.uid).set(cleanedNewUser);
      await userCredential.user.sendEmailVerification();

      if (userData.role === 'admin' && currentUser?.role === 'admin') {
         await logAction('Admin Creation', `Created new admin: ${userData.username} (${userData.email})`);
      }

      await auth.signOut(); // Log them out immediately to force verification
      return { success: true, user: { ...newUser, id: userCredential.user.uid } };
    } catch (error: any) {
      console.error(`Registration failed: ${error.code} - ${error.message}`);
      if (error.code === 'auth/email-already-in-use') {
        return { success: false, reason: 'EMAIL_EXISTS' };
      }
      return { success: false, reason: 'UNKNOWN_ERROR' };
    }
  };

// ... (rest of the code remains the same)

  const sendVerificationEmail = async () => {
    if (auth.currentUser) {
        // fix: Use Firebase v8 `user.sendEmailVerification` syntax.
        await auth.currentUser.sendEmailVerification();
    }
  };


  // --- MSME Actions ---
  const addInventoryItem = async (itemData: Omit<InventoryItem, 'id'>) => {
    console.log('🛍️ Adding inventory item:', itemData);
    console.log('Current user:', currentUser);
    
    if (!currentUser) {
      throw new Error('User not logged in');
    }
    
    if (currentUser.role !== 'msme') {
      throw new Error('Only MSME users can add inventory items');
    }
    
    if (!currentUser.isApproved) {
      throw new Error('MSME user is not approved. Please contact an admin.');
    }
    
    // Add required fields
    const itemWithMetadata = {
      ...itemData,
      msmeId: currentUser.id,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('Item with metadata:', itemWithMetadata);
    
    try {
      // fix: Use Firebase v8 `db.collection.add` syntax.
      const docRef = await db.collection('inventory').add(itemWithMetadata);
      console.log('✅ Inventory item added successfully with ID:', docRef.id);
    } catch (error) {
      console.error('❌ Error adding inventory item:', error);
      throw error;
    }
  };


  const updateInventoryItem = async (updatedItem: InventoryItem) => {
    console.log('✏️ Updating inventory item:', updatedItem);
    console.log('Current user:', currentUser);
    
    if (!currentUser) {
      throw new Error('User not logged in');
    }
    
    if (currentUser.role !== 'msme') {
      throw new Error('Only MSME users can update inventory items');
    }
    
    if (!currentUser.isApproved) {
      throw new Error('MSME user is not approved. Please contact an admin.');
    }
    
    // First, get the existing item to verify ownership
    try {
      const itemDoc = await db.collection('inventory').doc(updatedItem.id).get();
      if (!itemDoc.exists) {
        throw new Error('Inventory item not found');
      }
      
      const itemData = itemDoc.data();
      console.log('Existing item data:', itemData);
      console.log('Item msmeId:', itemData?.msmeId);
      console.log('Current user ID:', currentUser.id);
      console.log('User role:', currentUser.role);
      console.log('User isApproved:', currentUser.isApproved);
      
      if (itemData?.msmeId !== currentUser.id) {
        throw new Error('You can only update your own inventory items');
      }
      
      // Check if user document exists in Firestore
      const userDoc = await db.collection('users').doc(currentUser.id).get();
      console.log('User document exists:', userDoc.exists);
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log('User document data:', userData);
        console.log('User role from Firestore:', userData?.role);
        console.log('User isApproved from Firestore:', userData?.isApproved);
      } else {
        console.error('❌ User document does not exist in Firestore!');
        throw new Error('User document not found in Firestore');
      }
      
      // Additional validation before update
      if (!userDoc.exists) {
        throw new Error('User document not found in Firestore');
      }
      
      const userData = userDoc.data();
      if (userData?.role !== 'msme') {
        throw new Error('User role is not MSME in Firestore');
      }
      
      if (userData?.isApproved !== true) {
        throw new Error('User is not approved in Firestore');
      }
      
      if (itemData?.msmeId !== currentUser.id) {
        throw new Error('Item ownership mismatch');
      }
      
      console.log('✅ All validations passed, proceeding with update...');
      
      const { id, ...data } = updatedItem;
      
      // Add updated timestamp
      const dataWithTimestamp = {
        ...data,
        updatedAt: new Date()
      };
      
      console.log('Updating with data:', dataWithTimestamp);
      
      // fix: Use Firebase v8 `db.collection.doc.update` syntax.
      await db.collection('inventory').doc(id).update(dataWithTimestamp);
      console.log('✅ Inventory item updated successfully');
    } catch (error) {
      console.error('❌ Error updating inventory item:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        itemId: updatedItem.id,
        userId: currentUser.id,
        userRole: currentUser.role,
        isApproved: currentUser.isApproved
      });
      throw error;
    }
  };


  const deleteInventoryItem = async (itemId: string) => {
    console.log('🗑️ Deleting inventory item:', itemId);
    console.log('Current user:', currentUser);
    
    if (!currentUser) {
      throw new Error('User not logged in');
    }
    
    if (currentUser.role !== 'msme') {
      throw new Error('Only MSME users can delete inventory items');
    }
    
    if (!currentUser.isApproved) {
      throw new Error('MSME user is not approved. Please contact an admin.');
    }
    
    // First, get the item to verify ownership
    try {
      const itemDoc = await db.collection('inventory').doc(itemId).get();
      if (!itemDoc.exists) {
        throw new Error('Inventory item not found');
      }
      
      const itemData = itemDoc.data();
      console.log('Item data:', itemData);
      console.log('Item msmeId:', itemData?.msmeId);
      console.log('Current user ID:', currentUser.id);
      console.log('User role:', currentUser.role);
      console.log('User isApproved:', currentUser.isApproved);
      
      if (itemData?.msmeId !== currentUser.id) {
        throw new Error('You can only delete your own inventory items');
      }
      
      // Check if user document exists in Firestore
      const userDoc = await db.collection('users').doc(currentUser.id).get();
      console.log('User document exists:', userDoc.exists);
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log('User document data:', userData);
        console.log('User role from Firestore:', userData?.role);
        console.log('User isApproved from Firestore:', userData?.isApproved);
      } else {
        console.error('❌ User document does not exist in Firestore!');
        throw new Error('User document not found in Firestore');
      }
      
      // Additional validation before delete
      if (!userDoc.exists) {
        throw new Error('User document not found in Firestore');
      }
      
      const userData = userDoc.data();
      if (userData?.role !== 'msme') {
        throw new Error('User role is not MSME in Firestore');
      }
      
      if (userData?.isApproved !== true) {
        throw new Error('User is not approved in Firestore');
      }
      
      if (itemData?.msmeId !== currentUser.id) {
        throw new Error('Item ownership mismatch');
      }
      
      console.log('✅ All validations passed, proceeding with delete...');
      
      // fix: Use Firebase v8 `db.collection.doc.delete` syntax.
      await db.collection('inventory').doc(itemId).delete();
      console.log('✅ Inventory item deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting inventory item:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        itemId: itemId,
        userId: currentUser.id,
        userRole: currentUser.role,
        isApproved: currentUser.isApproved
      });
      throw error;
    }
  };

  // --- Product Management Functions ---
  const addProduct = async (product: Omit<Product, 'id'>) => {
    if (!currentUser) {
      throw new Error('User not logged in');
    }
    
    if (currentUser.role !== 'msme') {
      throw new Error('Only MSME users can add products');
    }
    
    if (!currentUser.isApproved) {
      throw new Error('MSME user is not approved. Please contact an admin.');
    }
    
    const productWithMetadata = {
      ...product,
      msmeId: currentUser.id,
      initialStock: product.stock, // Set initial stock to current stock when creating
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('Adding product:', productWithMetadata);
    
    try {
      // fix: Use Firebase v8 `db.collection.add` syntax.
      const docRef = await db.collection('products').add(productWithMetadata);
      console.log('✅ Product added successfully with ID:', docRef.id);
    } catch (error) {
      console.error('❌ Error adding product:', error);
      throw error;
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    console.log('✏️ Updating product:', updatedProduct);
    console.log('Current user:', currentUser);
    
    if (!currentUser) {
      throw new Error('User not logged in');
    }
    
    if (currentUser.role !== 'msme') {
      throw new Error('Only MSME users can update products');
    }
    
    if (!currentUser.isApproved) {
      throw new Error('MSME user is not approved. Please contact an admin.');
    }
    
    // First, get the existing product to verify ownership
    try {
      const productDoc = await db.collection('products').doc(updatedProduct.id).get();
      if (!productDoc.exists) {
        throw new Error('Product not found');
      }
      
      const productData = productDoc.data();
      console.log('Existing product data:', productData);
      console.log('Product msmeId:', productData?.msmeId);
      console.log('Current user ID:', currentUser.id);
      
      if (productData?.msmeId !== currentUser.id) {
        throw new Error('You can only update your own products');
      }
      
      console.log('✅ All validations passed, proceeding with update...');
      
      const { id, ...data } = updatedProduct;
      
      // Add updated timestamp
      const dataWithTimestamp = {
        ...data,
        updatedAt: new Date()
      };
      
      console.log('Updating with data:', dataWithTimestamp);
      
      // fix: Use Firebase v8 `db.collection.doc.update` syntax.
      await db.collection('products').doc(id).update(dataWithTimestamp);
      console.log('✅ Product updated successfully');
    } catch (error) {
      console.error('❌ Error updating product:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        productId: updatedProduct.id,
        userId: currentUser.id,
        userRole: currentUser.role,
        isApproved: currentUser.isApproved
      });
      throw error;
    }
  };

  const deleteProduct = async (productId: string) => {
    console.log('🗑️ Deleting product:', productId);
    console.log('Current user:', currentUser);
    
    if (!currentUser) {
      throw new Error('User not logged in');
    }
    
    if (currentUser.role !== 'msme') {
      throw new Error('Only MSME users can delete products');
    }
    
    if (!currentUser.isApproved) {
      throw new Error('MSME user is not approved. Please contact an admin.');
    }
    
    // First, get the product to verify ownership
    try {
      const productDoc = await db.collection('products').doc(productId).get();
      if (!productDoc.exists) {
        throw new Error('Product not found');
      }
      
      const productData = productDoc.data();
      console.log('Product data:', productData);
      console.log('Product msmeId:', productData?.msmeId);
      console.log('Current user ID:', currentUser.id);
      
      if (productData?.msmeId !== currentUser.id) {
        throw new Error('You can only delete your own products');
      }
      
      console.log('✅ All validations passed, proceeding with delete...');
      
      // fix: Use Firebase v8 `db.collection.doc.delete` syntax.
      await db.collection('products').doc(productId).delete();
      console.log('✅ Product deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        productId: productId,
        userId: currentUser.id,
        userRole: currentUser.role,
        isApproved: currentUser.isApproved
      });
      throw error;
    }
  };
  
  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    // fix: Use Firebase v8 `db.collection.doc.update` syntax.
    await db.collection('orders').doc(orderId).update({ status });
  };
  
  // --- Buyer Actions ---
  const placeOrder = async (item: InventoryItem | Product, quantity: number) => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    if (item.stock < quantity) {
      throw new Error(`Insufficient stock. Available: ${item.stock}, Requested: ${quantity}`);
    }

    console.log('🛒 Placing order:', {
      itemId: item.id,
      itemName: item.name,
      quantity: quantity,
      buyerId: currentUser.id,
      buyerRole: currentUser.role,
      buyerEmail: currentUser.email,
      buyerApproved: currentUser.isApproved
    });

    try {
      // Use the inventory service for atomic order placement and stock update
      const result = await InventoryService.placeOrderWithStockUpdate(
        item.id,
        quantity,
        currentUser.id,
        currentUser.username,
        currentUser.gstNumber
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to place order');
      }

      console.log('✅ Order placed successfully!');
      
    } catch (error) {
      console.error('❌ Error placing order:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        buyerId: currentUser.id,
        buyerRole: currentUser.role
      });
      throw error; // Re-throw to be handled by the UI
    }
  };


  // --- Admin Actions ---
  const logAction = async (action: string, details: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    const newLog = {
      timestamp: new Date().toISOString(),
      adminUsername: currentUser.username,
      action,
      details,
    };
    // fix: Use Firebase v8 `db.collection.add` syntax.
    await db.collection('auditLogs').add(newLog);
  };


  const clearLogs = async () => {
    const logsCollection = db.collection('auditLogs');
    // fix: Use Firebase v8 `collection.get` syntax.
    const snapshot = await logsCollection.get();
    // fix: Use Firebase v8 `db.batch` syntax.
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();
  };


  const approveUser = async (userId: string) => {
    const userToApprove = users.find(u => u.id === userId);
    if (!userToApprove) return;
    await logAction('User Approval', `Approved ${userToApprove.role}: ${userToApprove.username} (${userToApprove.email})`);
    // fix: Use Firebase v8 `db.collection.doc.update` syntax.
    await db.collection('users').doc(userId).update({ isApproved: true });
  };


  const requestProfileUpdate = async (userId: string, updatedData: Partial<User>, gstFile?: File | null) => {
    const changes = { ...updatedData };


    if (gstFile) {
        const storageRef = storage.ref();
        const fileRef = storageRef.child(`gst-certificates/${userId}/${gstFile.name}`);
        const snapshot = await fileRef.put(gstFile);
        const downloadURL = await snapshot.ref.getDownloadURL();
        changes.gstCertificateUrl = downloadURL;
    }
    
    // Get existing pending changes to merge with new ones
    const userDoc = await db.collection('users').doc(userId).get();
    const existingPendingChanges = userDoc.data()?.pendingChanges || {};


    const mergedChanges = { ...existingPendingChanges, ...changes };


    await db.collection('users').doc(userId).update({ pendingChanges: mergedChanges });
  };
  
  const approveProfileChanges = async (userId: string) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate || !userToUpdate.pendingChanges) return;


    const changes = userToUpdate.pendingChanges;
    await logAction('Profile Update Approved', `Approved changes for ${userToUpdate.username}`);
    
    // Create an update object that includes the changes and removes the pendingChanges field
    // fix: Use Firebase v8 `FieldValue.delete()` syntax.
    // FIX: Corrected syntax for FieldValue.delete().
    // FIX: Corrected syntax for FieldValue.delete() to resolve TypeScript error.
    // FIX: Use firebase.firestore.FieldValue to access FieldValue.delete() to resolve TypeScript error.
    const updatePayload = { ...changes, pendingChanges: firebase.firestore.FieldValue.delete() };
    // fix: Use Firebase v8 `db.collection.doc.update` syntax.
    await db.collection('users').doc(userId).update(updatePayload);
  };
  
  const rejectProfileChanges = async (userId: string) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;
    await logAction('Profile Update Rejected', `Rejected changes for ${userToUpdate.username}`);
    // fix: Use Firebase v8 `FieldValue.delete()` syntax.
    // FIX: Corrected syntax for FieldValue.delete().
    // FIX: Corrected syntax for FieldValue.delete() to resolve TypeScript error.
    // FIX: Use firebase.firestore.FieldValue to access FieldValue.delete() to resolve TypeScript error.
    await db.collection('users').doc(userId).update({ pendingChanges: firebase.firestore.FieldValue.delete() });
  };

  const cleanupOrphanedUser = async (email: string) => {
    // Simplified logging for orphaned users
    console.warn(`Orphaned user detected: ${email}`);
  };

  // --- Inventory Management Functions ---
  const restockProduct = async (productId: string, additionalStock: number): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'msme') {
      throw new Error('Permission denied');
    }

    try {
      const result = await InventoryService.restockProduct(productId, additionalStock, currentUser.id);
      return result.success;
    } catch (error) {
      console.error('Error restocking product:', error);
      return false;
    }
  };

  const checkStockAvailability = async (productId: string, quantity: number): Promise<boolean> => {
    try {
      return await InventoryService.checkStockAvailability(productId, quantity);
    } catch (error) {
      console.error('Error checking stock availability:', error);
      return false;
    }
  };

  const approveBuyer = async (buyerId: string): Promise<boolean> => {
    try {
      return await InventoryService.approveBuyer(buyerId);
    } catch (error) {
      console.error('Error approving buyer:', error);
      return false;
    }
  };

  const contextValue = {
    inventory,
    products,
    orders,
    users,
    auditLogs,
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
    requestProfileUpdate,
    approveProfileChanges,
    rejectProfileChanges,
    logAction,
    clearLogs,
    cleanupOrphanedUser,
  };


  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};


export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
