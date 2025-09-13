/* cSpell:ignore MSME firestore */
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { auth, db, firebase, storage } from '../firebase';
import type { InventoryItem, Order, OrderStatus, User, AuditLogEntry } from '../types';

interface FirebaseError extends Error {
  code: string;
  message: string;
}

type UserType = 'msme' | 'buyer' | 'admin';

type ErrorHandler = (error: FirebaseError | string | null) => void;

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

type AppState = {
  currentUser: User | null;
  isLoading: boolean;
  isOffline: boolean;
  error: FirebaseError | string | null;
  users: User[];
  inventory: InventoryItem[];
  orders: Order[];
  auditLogs: AuditLogEntry[];
};

interface AppContextType extends AppState {
  // Auth Methods
  login: (email: string, password: string) => Promise<LoginResult>;
  socialLogin: (provider: 'google' | 'facebook') => Promise<LoginResult>;
  logout: () => Promise<void>;
  register: (userData: Omit<User, 'id' | 'isApproved' | 'isEmailVerified'> & { password: string }) => Promise<RegisterResult>;
  sendVerificationEmail: () => Promise<void>;

  // Error Handling
  setError: ErrorHandler;
  clearError: () => void;

  // MSME Methods
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => Promise<InventoryItem>;
  updateInventoryItem: (item: InventoryItem) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  requestProfileUpdate: (userId: string, updatedData: Partial<User>, gstFile?: File | null) => Promise<void>;

  // Buyer Methods
  placeOrder: (item: InventoryItem, quantity: number) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;

  // Admin Methods
  approveUser: (userId: string) => Promise<boolean>;
  approveProfileChanges: (userId: string) => Promise<void>;
  rejectProfileChanges: (userId: string) => Promise<void>;
  logAction: (action: string, details: string) => Promise<void>;
  clearLogs: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === null) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

function useAppState() {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    isLoading: true,
    isOffline: !navigator.onLine,
    error: null,
    users: [],
    inventory: [],
    orders: [],
    auditLogs: []
  });

  const setError = useCallback((error: FirebaseError | string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const updateState = useCallback(<K extends keyof AppState>(key: K, value: AppState[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  return { state, setError, clearError, updateState };
}

export const AppProvider = ({ children }: AppProviderProps): JSX.Element => {
  const { state, setError, clearError, updateState } = useAppState();

  const handleError = useCallback((error: unknown) => {
    if (error instanceof Error) {
      if ('code' in error) {
        setError(error as FirebaseError);
      } else {
        setError(error.message);
      }
    } else if (typeof error === 'string') {
      setError(error);
    } else {
      setError('An unknown error occurred');
    }
  }, [setError]);

  // Listen for browser online/offline events
  useEffect(() => {
    const handleOnline = () => updateState('isOffline', false);
    const handleOffline = () => updateState('isOffline', true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateState]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: any) => {
      if (firebaseUser) {
        updateState('isLoading', true);
        try {
          const docSnap = await db.collection('users').doc(firebaseUser.uid).get();
          if (docSnap.exists) {
            const userData = { 
              id: docSnap.id, 
              ...docSnap.data(), 
              isEmailVerified: firebaseUser.emailVerified 
            } as User;
            updateState('currentUser', userData);
          } else {
            console.warn('User authenticated but not found in Firestore');
            await auth.signOut();
            updateState('currentUser', null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          handleError(error);
        } finally {
          updateState('isLoading', false);
        }
      } else {
        updateState('currentUser', null);
        updateState('isLoading', false);
      }
    });

    return () => unsubscribe();
  }, [updateState, handleError]);

  // Listen to inventory based on user role
  useEffect(() => {
    if (!state.currentUser) {
      console.log('No user logged in, clearing inventory');
      updateState('inventory', []);
      return;
    }

    console.log('Setting up inventory listener for role:', state.currentUser.role);

    let query;
    if (state.currentUser.role === 'msme') {
      // MSME users see only their own inventory
      console.log('MSME user, filtering by msmeId:', state.currentUser.id);
      query = db.collection('inventory')
        .where('msmeId', '==', state.currentUser.id)
        .orderBy('createdAt', 'desc');
    } else if (state.currentUser.role === 'buyer') {
      // Buyers see inventory from all approved MSMEs
      console.log('Buyer user, viewing all active inventory');
      query = db.collection('inventory')
        .where('status', '==', 'active')
        .orderBy('createdAt', 'desc');
    } else if (state.currentUser.role === 'admin') {
      // Admins see all inventory
      console.log('Admin user, viewing all inventory');
      query = db.collection('inventory')
        .orderBy('createdAt', 'desc');
    } else {
      console.log('Unknown user role, clearing inventory');
      updateState('inventory', []);
      return;
    }

    const unsubscribe = query.onSnapshot(
      (snapshot: any) => {
        console.log('Inventory snapshot received, count:', snapshot.size);
        const inventoryData = snapshot.docs.map((doc: any) => {
          const data = doc.data();
          console.log('Processing inventory item:', doc.id, data);
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || null,
            updatedAt: data.updatedAt?.toDate?.() || null
          } as InventoryItem;
        });
        console.log('Updating inventory state with items:', inventoryData.length);
        updateState('inventory', inventoryData);
      },
      (error: any) => {
        console.error('Error fetching inventory:', error);
        handleError(error);
      }
    );

    return () => unsubscribe();
  }, [state.currentUser, updateState, handleError]);

  // Listen to users data (needed for buyer product display)
  useEffect(() => {
    if (!state.currentUser) {
      updateState('users', []);
      return;
    }

    console.log('Setting up users listener for role:', state.currentUser.role);

    const query = db.collection('users');
    const unsubscribe = query.onSnapshot(
      (snapshot: any) => {
        console.log('Users snapshot received, count:', snapshot.size);
        const usersData = snapshot.docs.map((doc: any) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || null,
            updatedAt: data.updatedAt?.toDate?.() || null
          } as User;
        });
        console.log('Updating users state with items:', usersData.length);
        updateState('users', usersData);
      },
      (error: any) => {
        console.error('Error fetching users:', error);
        handleError(error);
      }
    );

    return () => unsubscribe();
  }, [state.currentUser, updateState, handleError]);

  // --- Auth Actions ---
  const login = async (email: string, password: string): Promise<LoginResult> => {
    clearError();
    try {
      const userCred = await auth.signInWithEmailAndPassword(email, password);
      
      if (!userCred.user) throw new Error('No user data received');
      if (!userCred.user.emailVerified) {
        await userCred.user.sendEmailVerification();
        await auth.signOut();
        return { success: false, reason: 'NOT_VERIFIED', userEmail: email };
      }

      const userDoc = await db.collection('users').doc(userCred.user.uid).get();
      if (!userDoc.exists) {
        await auth.signOut();
        return { success: false, reason: 'USER_NOT_FOUND' };
      }

      const userData = userDoc.data() as User;
      if (!userData.isApproved && userData.role !== 'admin') {
        await auth.signOut();
        return { success: false, reason: 'NOT_VERIFIED', userEmail: email };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Login error details:', error);
      handleError(error);
      
      if (error.code === 'auth/user-not-found') {
        return { success: false, reason: 'WRONG_PASSWORD' };
      } else if (error.code === 'auth/wrong-password') {
        return { success: false, reason: 'WRONG_PASSWORD' };
      } else if (error.code === 'auth/invalid-credential') {
        return { success: false, reason: 'WRONG_PASSWORD' };
      } else if (error.code === 'auth/invalid-email') {
        return { success: false, reason: 'WRONG_PASSWORD' };
      } else if (error.code === 'auth/user-disabled') {
        return { success: false, reason: 'UNKNOWN_ERROR' };
      } else if (error.code === 'auth/too-many-requests') {
        return { success: false, reason: 'UNKNOWN_ERROR' };
      }
      
      return { success: false, reason: 'UNKNOWN_ERROR' };
    }
  };

  const socialLogin = async (providerName: 'google' | 'facebook'): Promise<LoginResult> => {
    clearError();
    try {
      const provider = providerName === 'google' 
        ? new firebase.auth.GoogleAuthProvider()
        : new firebase.auth.FacebookAuthProvider();

      const result = await auth.signInWithPopup(provider);
      if (!result.user) throw new Error('No user data received');

      const userDoc = await db.collection('users').doc(result.user.uid).get();
      return userDoc.exists ? { success: true } : { success: false, reason: 'USER_NOT_FOUND' };
    } catch (error) {
      handleError(error);
      return { success: false, reason: 'UNKNOWN_ERROR' };
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      handleError(error);
    }
  };

  const register = async (userData: Omit<User, 'id' | 'isApproved' | 'isEmailVerified'> & { password: string }): Promise<RegisterResult> => {
    clearError();
    try {
      const emailCheck = await auth.fetchSignInMethodsForEmail(userData.email);
      if (emailCheck.length > 0) {
        return { success: false, reason: 'EMAIL_EXISTS' };
      }

      const userCred = await auth.createUserWithEmailAndPassword(userData.email, userData.password);
      if (!userCred.user) throw new Error('No user data received');

      const { password, ...userDataWithoutPassword } = userData;
      const newUser: Omit<User, 'id'> = {
        ...userDataWithoutPassword,
        isApproved: false,
        isEmailVerified: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection('users').doc(userCred.user.uid).set(newUser);

      if (userData.role !== 'admin') {
        await userCred.user.sendEmailVerification();
        await auth.signOut();
      }

      return { 
        success: true, 
        user: { ...newUser, id: userCred.user.uid } as User 
      };
    } catch (error) {
      handleError(error);
      return { success: false, reason: 'UNKNOWN_ERROR' };
    }
  };

  const sendVerificationEmail = async () => {
    try {
      if (auth.currentUser) {
        await auth.currentUser.sendEmailVerification();
      }
    } catch (error) {
      handleError(error);
    }
  };

  // --- MSME Methods ---
  const addInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
    try {
      const currentUser = state.currentUser;
      if (!currentUser || currentUser.role !== 'msme') {
        console.error('Invalid user role or not logged in', currentUser?.role);
        throw new Error('Only MSME users can add inventory items');
      }

      console.log('Adding inventory item:', { ...item, msmeId: currentUser.id });

      // Add MSME information to the item
      const itemWithMsmeInfo = {
        ...item,
        msmeId: currentUser.id,
        msmeName: currentUser.username,
        msmeEmail: currentUser.email,
        status: 'active',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      // Validate required fields
      if (!itemWithMsmeInfo.name || !itemWithMsmeInfo.price || !itemWithMsmeInfo.stock) {
        throw new Error('Missing required fields: name, price, and stock are required');
      }

      // Ensure numeric fields are numbers
      itemWithMsmeInfo.price = Number(itemWithMsmeInfo.price);
      itemWithMsmeInfo.stock = Number(itemWithMsmeInfo.stock);

      const docRef = await db.collection('inventory').add(itemWithMsmeInfo);
      console.log('Item added successfully');
      
      // Get the newly created document to confirm it was saved
      const newDoc = await docRef.get();
      if (!newDoc.exists) {
        throw new Error('Failed to verify item creation');
      }

      const newDocData = newDoc.data();
      const newItem: InventoryItem = {
        id: docRef.id,
        ...newDocData as Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>,
        createdAt: newDocData?.createdAt?.toDate?.() || null,
        updatedAt: newDocData?.updatedAt?.toDate?.() || null,
      };

      // Update local state
      updateState('inventory', [
        ...state.inventory,
        newItem
      ]);

      console.log('Local state updated with new item');
      return newItem;
    } catch (error) {
      console.error('Error adding inventory item:', error);
      handleError(error);
      throw error;
    }
  };

  const updateInventoryItem = async (item: InventoryItem) => {
    try {
      const { id, ...data } = item;
      await db.collection('inventory').doc(id).update(data);
    } catch (error) {
      handleError(error);
    }
  };

  const deleteInventoryItem = async (itemId: string) => {
    try {
      await db.collection('inventory').doc(itemId).delete();
    } catch (error) {
      handleError(error);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await db.collection('orders').doc(orderId).update({ status });
    } catch (error) {
      handleError(error);
    }
  };

  // --- Buyer Methods ---
  const placeOrder = async (item: InventoryItem, quantity: number) => {
    try {
      if (!state.currentUser || item.stock < quantity) {
        throw new Error('Invalid order request');
      }

      const batch = db.batch();
      const newOrderRef = db.collection('orders').doc();
      const newOrder: Omit<Order, 'id'> = {
        buyerId: state.currentUser.id,
        buyerName: state.currentUser.username,
        buyerGst: state.currentUser.gstNumber,
        date: new Date().toISOString(),
        status: 'Pending',
        total: item.price * quantity,
        items: [{ productId: item.id, quantity }],
      };

      batch.set(newOrderRef, newOrder);
      batch.update(db.collection('inventory').doc(item.id), { 
        stock: item.stock - quantity 
      });

      await batch.commit();
    } catch (error) {
      handleError(error);
    }
  };

  // --- Admin Methods ---
  const approveUser = async (userId: string): Promise<boolean> => {
    try {
      const currentUser = state.currentUser;
      if (!currentUser || currentUser.role !== 'admin') return false;

      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) return false;

      const userData = userDoc.data() as User;
      if (userData.isApproved) return true;

      await userDoc.ref.update({
        isApproved: true,
        approvedBy: currentUser.id,
        approvedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await logAction(
        'User Approval',
        `Approved ${userData.role}: ${userData.username} (${userData.email})`
      );

      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  const requestProfileUpdate = async (userId: string, updates: Partial<User>, gstFile?: File | null, profilePicture?: File | null) => {
    try {
      const changes = { ...updates };
      console.log('Starting profile update for user:', userId);

      // Handle GST certificate upload
      if (gstFile) {
        // Validate file type and size
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(gstFile.type)) {
          throw new Error('Invalid file type. Only PDF, JPEG, and PNG files are allowed.');
        }
        if (gstFile.size > 5 * 1024 * 1024) { // 5MB limit
          throw new Error('File size too large. Maximum size is 5MB.');
        }
        
        const fileExtension = gstFile.type.split('/')[1] || 'bin';
        const sanitizedFileName = `gst-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
        console.log('Uploading GST certificate');
        
        // Sanitize userId to prevent path traversal
        const sanitizedUserId = userId.replace(/[^a-zA-Z0-9-_]/g, '');
        const gstFileRef = storage.ref()
          .child(`gst-certificates/${sanitizedUserId}/${sanitizedFileName}`);
        const gstSnapshot = await gstFileRef.put(gstFile);
        changes.gstCertificateUrl = await gstSnapshot.ref.getDownloadURL();
        console.log('GST certificate uploaded successfully');
      }

      // Handle profile picture upload
      if (profilePicture) {
        // Validate file type and size
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedImageTypes.includes(profilePicture.type)) {
          throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
        }
        if (profilePicture.size > 2 * 1024 * 1024) { // 2MB limit for images
          throw new Error('File size too large. Maximum size is 2MB.');
        }
        
        const fileExtension = profilePicture.type.split('/')[1] || 'bin';
        const sanitizedFileName = `profile-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
        console.log('Uploading profile picture');
        
        // Sanitize userId to prevent path traversal
        const sanitizedUserId = userId.replace(/[^a-zA-Z0-9-_]/g, '');
        const profilePicRef = storage.ref()
          .child(`profile-pictures/${sanitizedUserId}/${sanitizedFileName}`);
        const profilePicSnapshot = await profilePicRef.put(profilePicture);
        changes.profilePictureUrl = await profilePicSnapshot.ref.getDownloadURL();
        console.log('Profile picture uploaded successfully');
      }

      console.log('Getting current user document');
      const userDoc = await db.collection('users').doc(userId).get();
      const existingChanges = userDoc.data()?.pendingChanges || {};
      
      const updatedChanges = { ...existingChanges, ...changes };
      console.log('Updating user document with changes:', updatedChanges);
      
      await userDoc.ref.update({ 
        pendingChanges: updatedChanges 
      });

      console.log('Profile update request completed');
    } catch (error: any) {
      const sanitizedMessage = String(error.message || 'unknown error').replace(/[\r\n]/g, '');
      console.error(`Error in profile update: ${sanitizedMessage}`);
      handleError(error);
      throw error;
    }
  };

  const approveProfileChanges = async (userId: string) => {
    try {
      const userToUpdate = state.users.find(u => u.id === userId);
      if (!userToUpdate?.pendingChanges) return;

      await db.collection('users').doc(userId).update({
        ...userToUpdate.pendingChanges,
        pendingChanges: firebase.firestore.FieldValue.delete()
      });

      await logAction(
        'Profile Update Approved',
        `Approved changes for ${userToUpdate.username}`
      );
    } catch (error) {
      handleError(error);
    }
  };

  const rejectProfileChanges = async (userId: string) => {
    try {
      const userToUpdate = state.users.find(u => u.id === userId);
      if (!userToUpdate) return;

      await db.collection('users').doc(userId).update({
        pendingChanges: firebase.firestore.FieldValue.delete()
      });

      await logAction(
        'Profile Update Rejected',
        `Rejected changes for ${userToUpdate.username}`
      );
    } catch (error) {
      handleError(error);
    }
  };

  const logAction = async (action: string, details: string) => {
    try {
      if (state.currentUser?.role !== 'admin') return;

      await db.collection('auditLogs').add({
        timestamp: new Date().toISOString(),
        adminUsername: state.currentUser.username,
        action,
        details,
      });
    } catch (error) {
      handleError(error);
    }
  };

  const clearLogs = async () => {
    try {
      const snapshot = await db.collection('auditLogs').get();
      const batch = db.batch();
      snapshot.docs.forEach((doc: any) => batch.delete(doc.ref));
      await batch.commit();
    } catch (error) {
      handleError(error);
    }
  };

  const providerValue: AppContextType = {
    ...state,
    setError,
    clearError,
    login,
    socialLogin,
    logout,
    register,
    sendVerificationEmail,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    updateOrderStatus,
    placeOrder,
    approveUser,
    requestProfileUpdate,
    approveProfileChanges,
    rejectProfileChanges,
    logAction,
    clearLogs,
  };

  return (
    <AppContext.Provider value={providerValue}>
      {children}
    </AppContext.Provider>
  );
};

export { useAppContext };
