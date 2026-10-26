import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  orderBy, 
  Firestore,
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
import { MenuItem, Order, OrderStatus, FirebaseConnectionStatus, UserProfile, CartItem } from '../types';
import rawConfig from '../../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

// Determine if Firebase is configured
const firebaseConfig = {
  apiKey: rawConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: rawConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: rawConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: rawConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: rawConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: rawConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID || '',
  firestoreDatabaseId: rawConfig.firestoreDatabaseId || import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)'
};

const hasValidConfig = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.projectId !== 'remixed-project-id'
);

if (hasValidConfig) {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    // CRITICAL: The app will break without this line
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);
  } catch (error) {
    console.warn('Firebase initialization error:', error);
    app = null;
    db = null;
    auth = null;
  }
}

// Validate Connection to Firestore per Skill guidelines
async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export const firebaseStatus: FirebaseConnectionStatus = {
  isConfigured: Boolean(db && auth),
  projectId: firebaseConfig.projectId || undefined,
  mode: Boolean(db && auth) ? 'real' : 'unconfigured',
  message: Boolean(db && auth) 
    ? `Connected to Firebase Cloud Firestore Project: "${firebaseConfig.projectId}"`
    : 'Firebase is not yet configured.'
};

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ---------------- MENU OPERATIONS ----------------

export async function fetchMenuItemsFromFirestore(): Promise<MenuItem[]> {
  if (!db) {
    return [];
  }
  const collectionPath = 'menu_items';
  try {
    const querySnapshot = await getDocs(collection(db, collectionPath));
    const items: MenuItem[] = [];
    querySnapshot.forEach((docSnapshot) => {
      items.push({ id: docSnapshot.id, ...docSnapshot.data() } as MenuItem);
    });
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionPath);
  }
}

export async function saveMenuItemToFirestore(item: MenuItem): Promise<void> {
  if (!db) {
    return;
  }
  const docPath = `menu_items/${item.id}`;
  try {
    const itemRef = doc(db, 'menu_items', item.id);
    await setDoc(itemRef, {
      ...item,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteMenuItemFromFirestore(itemId: string): Promise<void> {
  if (!db) {
    return;
  }
  const docPath = `menu_items/${itemId}`;
  try {
    await deleteDoc(doc(db, 'menu_items', itemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

// ---------------- ORDER OPERATIONS ----------------

export async function createOrderInFirestore(order: Order): Promise<void> {
  if (!db) {
    return;
  }
  const docPath = `orders/${order.id}`;
  try {
    const orderRef = doc(db, 'orders', order.id);
    const sanitizedOrder: Record<string, any> = {
      id: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      orderType: order.orderType,
      paymentMethod: order.paymentMethod,
      items: JSON.stringify(order.items), // Native stringified payload adhering to schema
      itemCount: order.itemCount,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (order.userId) {
      sanitizedOrder.userId = order.userId;
    }
    if (order.deliveryAddress) {
      sanitizedOrder.deliveryAddress = order.deliveryAddress;
    }
    if (order.orderNotes) {
      sanitizedOrder.orderNotes = order.orderNotes;
    }
    if (order.estimatedTimeMinutes !== undefined) {
      sanitizedOrder.estimatedTimeMinutes = order.estimatedTimeMinutes;
    }

    await setDoc(orderRef, sanitizedOrder);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export async function updateOrderStatusInFirestore(orderId: string, status: OrderStatus): Promise<void> {
  if (!db) {
    return;
  }
  const docPath = `orders/${orderId}`;
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

// Subscribe to all orders (Admin only)
export function subscribeToOrdersFirestore(
  onOrders: (orders: Order[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) {
    return () => {};
  }
  const collectionPath = 'orders';
  const q = query(collection(db, collectionPath), orderBy('createdAt', 'desc'));
  
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        let parsedItems = [];
        try {
          parsedItems = typeof data.items === 'string' ? JSON.parse(data.items) : data.items;
        } catch {
          parsedItems = [];
        }
        orders.push({
          ...data,
          id: docSnapshot.id,
          items: parsedItems,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as Order);
      });
      onOrders(orders);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );

  return unsubscribe;
}

// Subscribe to a specific customer's private orders
export function subscribeToCustomerOrdersFirestore(
  userId: string,
  onOrders: (orders: Order[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db || !userId) {
    return () => {};
  }
  const collectionPath = 'orders';
  // Query strictly where userId == userId to comply with security rules
  const q = query(
    collection(db, collectionPath), 
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        let parsedItems = [];
        try {
          parsedItems = typeof data.items === 'string' ? JSON.parse(data.items) : data.items;
        } catch {
          parsedItems = [];
        }
        orders.push({
          ...data,
          id: docSnapshot.id,
          items: parsedItems,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as Order);
      });
      onOrders(orders);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );

  return unsubscribe;
}

// ---------------- USER PROFILE & SAVED CART OPERATIONS ----------------

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  if (!db || !userId) return null;
  const docPath = `users/${userId}`;
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { uid: userDoc.id, ...userDoc.data() } as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }
}

export async function saveUserProfile(
  profile: Partial<UserProfile> & { uid: string; email: string }
): Promise<void> {
  if (!db || !profile.uid) return;
  const docPath = `users/${profile.uid}`;
  try {
    const userRef = doc(db, 'users', profile.uid);
    const dataToSave: Record<string, any> = {
      uid: profile.uid,
      email: profile.email,
      updatedAt: serverTimestamp()
    };
    if (profile.displayName !== undefined) dataToSave.displayName = profile.displayName;
    if (profile.phone !== undefined) dataToSave.phone = profile.phone;
    if (profile.deliveryAddress !== undefined) dataToSave.deliveryAddress = profile.deliveryAddress;
    if (profile.savedCart !== undefined) dataToSave.savedCart = profile.savedCart;

    await setDoc(userRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function saveUserCartToFirestore(userId: string, cart: CartItem[]): Promise<void> {
  if (!db || !userId) return;
  const docPath = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    const simplifiedCart = cart.map(item => ({
      menuItemId: item.menuItem.id,
      quantity: item.quantity,
      specialInstructions: item.specialInstructions || ''
    }));
    await setDoc(userRef, {
      savedCart: JSON.stringify(simplifiedCart),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

// ---------------- AUTHENTICATION OPERATIONS ----------------

// General Google Sign-In for Customers and Staff
export async function signInWithGoogle(): Promise<User | null> {
  if (!auth) {
    throw new Error('Firebase Auth is not configured. Please add Firebase configuration.');
  }
  const provider = new GoogleAuthProvider();
  // Prompt account selection
  provider.setCustomParameters({ prompt: 'select_account' });
  const userCredential = await signInWithPopup(auth, provider);
  return userCredential.user;
}

export const signInAdminWithGoogle = signInWithGoogle;

export async function signOutUser(): Promise<void> {
  if (!auth) return;
  await firebaseSignOut(auth);
}

export const signOutAdmin = signOutUser;

export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export { db, auth };
