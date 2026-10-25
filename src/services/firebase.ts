import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  Firestore,
  serverTimestamp
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
import { MenuItem, Order, OrderStatus, FirebaseConnectionStatus } from '../types';

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

// Determine if Firebase is configured in the environment
// We check for Vite env variables or standard Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)'
};

const hasValidConfig = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.apiKey !== 'MY_FIREBASE_API_KEY'
);

if (hasValidConfig) {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
    auth = getAuth(app);
  } catch (error) {
    console.warn('Firebase initialization error:', error);
    app = null;
    db = null;
    auth = null;
  }
}

export const firebaseStatus: FirebaseConnectionStatus = {
  isConfigured: Boolean(db && auth),
  projectId: firebaseConfig.projectId || undefined,
  mode: Boolean(db && auth) ? 'real' : 'unconfigured',
  message: Boolean(db && auth) 
    ? `Connected to Firebase Project "${firebaseConfig.projectId}"`
    : 'Firebase is not yet configured. The app is running in Local Preview Mode with full interactive ordering and menu management. No fake connection is assumed.'
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
    await setDoc(orderRef, {
      ...order,
      items: JSON.stringify(order.items), // Native stringified payload adhering to schema
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
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

// ---------------- AUTHENTICATION OPERATIONS ----------------

export async function signInAdminWithGoogle(): Promise<User | null> {
  if (!auth) {
    throw new Error('Firebase Auth is not configured. Please add Firebase configuration.');
  }
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  return userCredential.user;
}

export async function signOutAdmin(): Promise<void> {
  if (!auth) return;
  await firebaseSignOut(auth);
}

export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export { db, auth };
