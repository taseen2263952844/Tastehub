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
  getDocFromServer,
  writeBatch,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  FirebaseStorage,
} from 'firebase/storage';
import {
  Product,
  Category,
  Banner,
  StoreSettings,
  Order,
  OrderStatus,
  PaymentStatus,
  FirebaseConnectionStatus,
  UserProfile,
  CartItem,
  WebsiteSection,
  WebsiteSnapshot,
  NavigationMenu,
  CmsPage,
  CmsPost,
  Promotion,
  MediaAsset,
  NewsletterSubscriber,
} from '../types';
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
let storage: FirebaseStorage | null = null;

const firebaseConfig = {
  apiKey: rawConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: rawConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: rawConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: rawConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: rawConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: rawConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID || '',
  firestoreDatabaseId: rawConfig.firestoreDatabaseId || import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)',
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
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);
    if (firebaseConfig.storageBucket) {
      storage = getStorage(app);
    }
  } catch (error) {
    console.warn('Firebase initialization error:', error);
    app = null;
    db = null;
    auth = null;
    storage = null;
  }
}

async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export const firebaseStatus: FirebaseConnectionStatus = {
  isConfigured: Boolean(db && auth),
  projectId: firebaseConfig.projectId || undefined,
  storageBucket: firebaseConfig.storageBucket || undefined,
  mode: Boolean(db && auth) ? 'real' : 'unconfigured',
  message: Boolean(db && auth)
    ? `Connected to Firebase Project "${firebaseConfig.projectId}"`
    : 'Firebase is not yet configured.',
};

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function formatFirebaseError(err: unknown): string {
  if (!err) return 'An unexpected error occurred.';
  const raw = err instanceof Error ? err.message : String(err);
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.error === 'string') {
      if (parsed.error.toLowerCase().includes('permission')) {
        return `Permission denied on "${parsed.path || 'database'}". Sign in with your verified administrator account.`;
      }
      return parsed.error;
    }
  } catch {
    // not JSON
  }
  if (raw.toLowerCase().includes('storage/unauthorized')) {
    return 'Firebase Storage permission denied. Check your Storage Security Rules.';
  }
  if (raw.toLowerCase().includes('network') || raw.toLowerCase().includes('offline')) {
    return 'Network error while contacting Firebase. Check your internet connection and retry.';
  }
  return raw;
}

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};
  Object.keys(obj).forEach((k) => {
    const val = obj[k];
    if (val !== undefined) {
      if (Array.isArray(val)) {
        out[k] = val.map((item) =>
          item && typeof item === 'object' && !(item instanceof Date)
            ? stripUndefined(item)
            : item
        );
      } else if (val && typeof val === 'object' && !(val instanceof Date) && !('isEqual' in val)) {
        out[k] = stripUndefined(val);
      } else {
        out[k] = val;
      }
    }
  });
  return out as T;
}

// ---------------- FIREBASE STORAGE ----------------

export async function uploadProductImageToStorage(
  file: File,
  folder = 'products'
): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized.');
  }
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${folder}/${Date.now()}_${cleanName}`;
  const fileRef = storageRef(storage, filePath);
  const snapshot = await uploadBytes(fileRef, file);
  return getDownloadURL(snapshot.ref);
}

export async function uploadAssetWithPath(
  file: File,
  folder = 'general'
): Promise<{ url: string; storagePath: string }> {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized.');
  }
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${folder}/${Date.now()}_${cleanName}`;
  const fileRef = storageRef(storage, storagePath);
  const snapshot = await uploadBytes(fileRef, file);
  const url = await getDownloadURL(snapshot.ref);
  return { url, storagePath };
}

export function isFirebaseStorageUrl(url: string): boolean {
  if (!url) return false;
  return (
    url.startsWith('gs://') ||
    url.includes('firebasestorage.googleapis.com') ||
    (Boolean(firebaseConfig.storageBucket) && url.includes(firebaseConfig.storageBucket))
  );
}

export async function deleteStorageAsset(pathOrUrl: string): Promise<void> {
  if (!storage || !pathOrUrl) return;
  try {
    await deleteObject(storageRef(storage, pathOrUrl));
  } catch (err: any) {
    const code = err?.code || '';
    if (code === 'storage/object-not-found' || String(err?.message || '').includes('object-not-found')) {
      return;
    }
    throw err;
  }
}

// ---------------- PRODUCTS ----------------

export function subscribeToProductsFirestore(
  onProducts: (products: Product[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) return () => {};
  const collectionPath = 'products';
  return onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      const list: Product[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          ...d,
          id: docSnap.id,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
          updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : d.updatedAt,
        } as Product);
      });
      onProducts(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export async function saveProductToFirestore(product: Product): Promise<void> {
  if (!db) return;
  const docPath = `products/${product.id}`;
  try {
    const payload: Record<string, any> = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      categoryId: product.categoryId,
      categoryName: product.categoryName,
      price: Number(product.price),
      shortDescription: product.shortDescription || '',
      description: product.description,
      images: product.images || [],
      stock: Number(product.stock),
      sku: product.sku || '',
      variations: product.variations || [],
      isFeatured: Boolean(product.isFeatured),
      isNewArrival: Boolean(product.isNewArrival),
      isBestSeller: Boolean(product.isBestSeller),
      popularityScore: Number(product.popularityScore || 50),
      isActive: Boolean(product.isActive),
      tags: product.tags || [],
      seoTitle: product.seoTitle || '',
      seoDescription: product.seoDescription || '',
      updatedAt: serverTimestamp(),
    };
    if (product.compareAtPrice && product.compareAtPrice > 0) {
      payload.compareAtPrice = Number(product.compareAtPrice);
    }
    if (!product.createdAt) {
      payload.createdAt = serverTimestamp();
    }
    await setDoc(doc(db, 'products', product.id), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  if (!db) throw new Error('Firebase Firestore is not configured.');
  const docPath = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

// ---------------- CATEGORIES ----------------

export function subscribeToCategoriesFirestore(
  onCategories: (categories: Category[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) return () => {};
  const collectionPath = 'categories';
  return onSnapshot(
    query(collection(db, collectionPath), orderBy('displayOrder', 'asc')),
    (snapshot) => {
      const list: Category[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Category);
      });
      onCategories(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export async function saveCategoryToFirestore(category: Category): Promise<void> {
  if (!db) return;
  const docPath = `categories/${category.id}`;
  try {
    await setDoc(
      doc(db, 'categories', category.id),
      {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        imageUrl: category.imageUrl || '',
        displayOrder: Number(category.displayOrder || 1),
        isActive: Boolean(category.isActive),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteCategoryFromFirestore(categoryId: string): Promise<void> {
  if (!db) throw new Error('Firebase Firestore is not configured.');
  const docPath = `categories/${categoryId}`;
  try {
    await deleteDoc(doc(db, 'categories', categoryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

// ---------------- BANNERS ----------------

export function subscribeToBannersFirestore(
  onBanners: (banners: Banner[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) return () => {};
  const collectionPath = 'banners';
  return onSnapshot(
    query(collection(db, collectionPath), orderBy('displayOrder', 'asc')),
    (snapshot) => {
      const list: Banner[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Banner);
      });
      onBanners(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export async function saveBannerToFirestore(banner: Banner): Promise<void> {
  if (!db) return;
  const docPath = `banners/${banner.id}`;
  try {
    await setDoc(
      doc(db, 'banners', banner.id),
      {
        id: banner.id,
        title: banner.title,
        subtitle: banner.subtitle || '',
        ctaText: banner.ctaText || 'Explore',
        targetCategory: banner.targetCategory || 'all',
        imageUrl: banner.imageUrl || '',
        isActive: Boolean(banner.isActive),
        displayOrder: Number(banner.displayOrder || 1),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteBannerFromFirestore(bannerId: string): Promise<void> {
  if (!db) throw new Error('Firebase Firestore is not configured.');
  const docPath = `banners/${bannerId}`;
  try {
    await deleteDoc(doc(db, 'banners', bannerId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

// ---------------- STORE SETTINGS ----------------

export function subscribeToStoreSettingsFirestore(
  onSettings: (settings: StoreSettings | null) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) return () => {};
  const docPath = 'storeSettings/default';
  return onSnapshot(
    doc(db, 'storeSettings', 'default'),
    (docSnap) => {
      if (docSnap.exists()) {
        onSettings({ id: docSnap.id, ...docSnap.data() } as StoreSettings);
      } else {
        onSettings(null);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, docPath);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export async function saveStoreSettingsToFirestore(settings: StoreSettings): Promise<void> {
  if (!db) return;
  const docPath = 'storeSettings/default';
  try {
    const clean = stripUndefined({
      ...settings,
      id: 'default',
      insideDhakaDeliveryFee: Number(settings.insideDhakaDeliveryFee),
      outsideDhakaDeliveryFee: Number(settings.outsideDhakaDeliveryFee),
      freeDeliveryThreshold: Number(settings.freeDeliveryThreshold),
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'storeSettings', 'default'), clean, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

// ---------------- WEBSITE SECTIONS & DRAFT/PUBLISH VERSIONS ----------------

export function subscribeToWebsiteSectionsFirestore(
  onSections: (sections: WebsiteSection[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) return () => {};
  const collectionPath = 'websiteSections';
  return onSnapshot(
    query(collection(db, collectionPath), orderBy('displayOrder', 'asc')),
    (snapshot) => {
      const list: WebsiteSection[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          ...d,
          id: docSnap.id,
          updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : d.updatedAt,
        } as WebsiteSection);
      });
      onSections(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export async function saveWebsiteSectionToFirestore(section: WebsiteSection): Promise<void> {
  if (!db) return;
  const docPath = `websiteSections/${section.id}`;
  try {
    const payload = stripUndefined({
      ...section,
      displayOrder: Number(section.displayOrder),
      productCount: Number(section.productCount || 0),
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'websiteSections', section.id), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteWebsiteSectionFromFirestore(sectionId: string): Promise<void> {
  if (!db) throw new Error('Firebase Firestore is not configured.');
  const docPath = `websiteSections/${sectionId}`;
  try {
    await deleteDoc(doc(db, 'websiteSections', sectionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export function subscribeToPublishedSnapshotFirestore(
  onSnapshotData: (snapshot: WebsiteSnapshot | null) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) return () => {};
  const docPath = 'websiteVersions/published';
  return onSnapshot(
    doc(db, 'websiteVersions', 'published'),
    (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        onSnapshotData({
          ...d,
          id: docSnap.id,
          publishedAt: d.publishedAt?.toDate ? d.publishedAt.toDate().toISOString() : d.publishedAt,
          updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : d.updatedAt,
        } as WebsiteSnapshot);
      } else {
        onSnapshotData(null);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, docPath);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export function subscribeToAdminWebsiteVersionsFirestore(
  onVersions: (versions: WebsiteSnapshot[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) return () => {};
  const collectionPath = 'websiteVersions';
  return onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      const list: WebsiteSnapshot[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          ...d,
          id: docSnap.id,
          publishedAt: d.publishedAt?.toDate ? d.publishedAt.toDate().toISOString() : d.publishedAt,
          updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : d.updatedAt,
        } as WebsiteSnapshot);
      });
      onVersions(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export async function saveWebsiteSnapshotToFirestore(
  snapshot: WebsiteSnapshot
): Promise<void> {
  if (!db) return;
  const docPath = `websiteVersions/${snapshot.id}`;
  try {
    const clean = stripUndefined({
      id: snapshot.id,
      versionLabel: snapshot.versionLabel,
      settings: snapshot.settings,
      sections: snapshot.sections,
      menus: snapshot.menus,
      publishedBy: snapshot.publishedBy || '',
      publishedAt: snapshot.publishedAt || new Date().toISOString(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'websiteVersions', snapshot.id), clean, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

// ---------------- NAVIGATION MENUS ----------------

export function subscribeToNavigationMenusFirestore(
  onMenus: (menus: NavigationMenu[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) return () => {};
  const collectionPath = 'navigationMenus';
  return onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      const list: NavigationMenu[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          ...d,
          id: docSnap.id,
          updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : d.updatedAt,
        } as NavigationMenu);
      });
      onMenus(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export async function saveNavigationMenuToFirestore(menu: NavigationMenu): Promise<void> {
  if (!db) return;
  const docPath = `navigationMenus/${menu.id}`;
  try {
    const clean = stripUndefined({
      id: menu.id,
      name: menu.name,
      location: menu.location,
      items: menu.items || [],
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'navigationMenus', menu.id), clean, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteNavigationMenuFromFirestore(menuId: string): Promise<void> {
  if (!db) throw new Error('Firebase Firestore is not configured.');
  const docPath = `navigationMenus/${menuId}`;
  try {
    await deleteDoc(doc(db, 'navigationMenus', menuId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

// ---------------- CMS PAGES ----------------

export function subscribeToCmsPagesFirestore(
  isAdminView: boolean,
  onPages: (pages: CmsPage[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) return () => {};
  const collectionPath = 'pages';
  const q = isAdminView
    ? collection(db, collectionPath)
    : query(collection(db, collectionPath), where('status', '==', 'published'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: CmsPage[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          ...d,
          id: docSnap.id,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
          updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : d.updatedAt,
        } as CmsPage);
      });
      onPages(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export async function saveCmsPageToFirestore(page: CmsPage): Promise<void> {
  if (!db) return;
  const docPath = `pages/${page.id}`;
  try {
    const clean = stripUndefined({
      id: page.id,
      title: page.title,
      slug: page.slug,
      featuredImage: page.featuredImage || '',
      content: page.content,
      seoTitle: page.seoTitle || '',
      seoDescription: page.seoDescription || '',
      status: page.status,
      createdAt: page.createdAt ? page.createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'pages', page.id), clean, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteCmsPageFromFirestore(pageId: string): Promise<void> {
  if (!db) throw new Error('Firebase Firestore is not configured.');
  const docPath = `pages/${pageId}`;
  try {
    await deleteDoc(doc(db, 'pages', pageId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

// ---------------- CMS POSTS / BLOG ----------------

export function subscribeToCmsPostsFirestore(
  isAdminView: boolean,
  onPosts: (posts: CmsPost[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) return () => {};
  const collectionPath = 'posts';
  const q = isAdminView
    ? collection(db, collectionPath)
    : query(collection(db, collectionPath), where('status', '==', 'published'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: CmsPost[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          ...d,
          id: docSnap.id,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
          updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : d.updatedAt,
        } as CmsPost);
      });
      list.sort((a, b) => (b.publishDate || '').localeCompare(a.publishDate || ''));
      onPosts(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export async function saveCmsPostToFirestore(post: CmsPost): Promise<void> {
  if (!db) return;
  const docPath = `posts/${post.id}`;
  try {
    const clean = stripUndefined({
      id: post.id,
      title: post.title,
      slug: post.slug,
      postType: post.postType,
      excerpt: post.excerpt || '',
      content: post.content,
      featuredImage: post.featuredImage || '',
      galleryImages: post.galleryImages || [],
      categories: post.categories || [],
      tags: post.tags || [],
      seoTitle: post.seoTitle || '',
      seoDescription: post.seoDescription || '',
      status: post.status,
      publishDate: post.publishDate || new Date().toISOString(),
      authorName: post.authorName || 'VEYRA Editorial',
      createdAt: post.createdAt ? post.createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'posts', post.id), clean, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteCmsPostFromFirestore(postId: string): Promise<void> {
  if (!db) throw new Error('Firebase Firestore is not configured.');
  const docPath = `posts/${postId}`;
  try {
    await deleteDoc(doc(db, 'posts', postId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

// ---------------- PROMOTIONS ----------------

export function subscribeToPromotionsFirestore(
  isAdminView: boolean,
  onPromos: (promos: Promotion[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) return () => {};
  const collectionPath = 'promotions';
  const q = isAdminView
    ? collection(db, collectionPath)
    : query(collection(db, collectionPath), where('isActive', '==', true));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Promotion[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          ...d,
          id: docSnap.id,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
          updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : d.updatedAt,
        } as Promotion);
      });
      onPromos(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export async function savePromotionToFirestore(promo: Promotion): Promise<void> {
  if (!db) return;
  const docPath = `promotions/${promo.id}`;
  try {
    const clean = stripUndefined({
      id: promo.id,
      code: promo.code.trim().toUpperCase(),
      title: promo.title,
      description: promo.description || '',
      discountType: promo.discountType,
      discountValue: Number(promo.discountValue || 0),
      minOrderAmount: Number(promo.minOrderAmount || 0),
      saleLabel: promo.saleLabel || '',
      startDate: promo.startDate || '',
      endDate: promo.endDate || '',
      isActive: Boolean(promo.isActive),
      createdAt: promo.createdAt ? promo.createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'promotions', promo.id), clean, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deletePromotionFromFirestore(promoId: string): Promise<void> {
  if (!db) throw new Error('Firebase Firestore is not configured.');
  const docPath = `promotions/${promoId}`;
  try {
    await deleteDoc(doc(db, 'promotions', promoId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

// ---------------- MEDIA LIBRARY ----------------

export function subscribeToMediaLibraryFirestore(
  onAssets: (assets: MediaAsset[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) return () => {};
  const collectionPath = 'media';
  return onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      const list: MediaAsset[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          ...d,
          id: docSnap.id,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
        } as MediaAsset);
      });
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      onAssets(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export async function saveMediaAssetToFirestore(asset: MediaAsset): Promise<void> {
  if (!db) return;
  const docPath = `media/${asset.id}`;
  try {
    const clean = stripUndefined({
      id: asset.id,
      name: asset.name,
      url: asset.url,
      folder: asset.folder,
      mimeType: asset.mimeType || 'image/jpeg',
      sizeBytes: Number(asset.sizeBytes || 0),
      storagePath: asset.storagePath || '',
      uploadedBy: asset.uploadedBy || '',
      createdAt: asset.createdAt ? asset.createdAt : serverTimestamp(),
    });
    await setDoc(doc(db, 'media', asset.id), clean, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteMediaAssetFromFirestore(
  assetId: string,
  storagePathOrUrl?: string
): Promise<void> {
  if (!db) throw new Error('Firebase Firestore is not configured.');
  const docPath = `media/${assetId}`;
  try {
    if (storagePathOrUrl && (storagePathOrUrl.includes('/') || isFirebaseStorageUrl(storagePathOrUrl))) {
      await deleteStorageAsset(storagePathOrUrl);
    }
    await deleteDoc(doc(db, 'media', assetId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

// ---------------- NEWSLETTER SUBSCRIBERS ----------------

export async function subscribeNewsletterInFirestore(
  email: string,
  source: 'footer' | 'section' = 'footer'
): Promise<void> {
  if (!db) throw new Error('Firebase is not configured.');
  const cleanEmail = email.trim().toLowerCase();
  const safeId = cleanEmail.replace(/[^a-zA-Z0-9._@-]/g, '_');
  const docPath = `newsletterSubscribers/${safeId}`;
  try {
    await setDoc(doc(db, 'newsletterSubscribers', safeId), {
      id: safeId,
      email: cleanEmail,
      source,
      status: 'subscribed',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export function subscribeToNewsletterSubscribersFirestore(
  onList: (subs: NewsletterSubscriber[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) return () => {};
  const collectionPath = 'newsletterSubscribers';
  return onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      const list: NewsletterSubscriber[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          ...d,
          id: docSnap.id,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
        } as NewsletterSubscriber);
      });
      onList(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export async function deleteNewsletterSubscriberFromFirestore(id: string): Promise<void> {
  if (!db) throw new Error('Firebase Firestore is not configured.');
  const docPath = `newsletterSubscribers/${id}`;
  try {
    await deleteDoc(doc(db, 'newsletterSubscribers', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

// ---------------- ORDERS OPERATIONS ----------------

export async function createOrderInFirestore(order: Order): Promise<void> {
  if (!db) return;
  const docPath = `orders/${order.id}`;
  try {
    const sanitizedOrder: Record<string, any> = {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      city: order.city,
      area: order.area,
      deliveryAddress: order.deliveryAddress,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      items: JSON.stringify(order.items),
      itemCount: order.itemCount,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (order.userId) sanitizedOrder.userId = order.userId;
    if (order.customerEmail) sanitizedOrder.customerEmail = order.customerEmail;
    if (order.deliveryInstructions) sanitizedOrder.deliveryInstructions = order.deliveryInstructions;
    if (order.paymentReference) sanitizedOrder.paymentReference = order.paymentReference;
    if (order.discountAmount !== undefined && order.discountAmount > 0) {
      sanitizedOrder.discountAmount = order.discountAmount;
    }
    if (order.promoCode) sanitizedOrder.promoCode = order.promoCode;

    await setDoc(doc(db, 'orders', order.id), sanitizedOrder);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export async function updateOrderInFirestore(
  orderId: string,
  updates: { status?: OrderStatus; paymentStatus?: PaymentStatus; adminNotes?: string }
): Promise<void> {
  if (!db) return;
  const docPath = `orders/${orderId}`;
  try {
    const payload: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };
    if (updates.status) payload.status = updates.status;
    if (updates.paymentStatus) payload.paymentStatus = updates.paymentStatus;
    if (updates.adminNotes !== undefined) payload.adminNotes = updates.adminNotes;

    await updateDoc(doc(db, 'orders', orderId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

const KNOWN_ORDER_SUBCOLLECTIONS = [
  'items',
  'orderItems',
  'statusHistory',
  'logs',
  'events',
  'notes',
  'payments',
];

async function deleteOrderSubcollections(orderId: string): Promise<void> {
  if (!db) return;
  for (const subcol of KNOWN_ORDER_SUBCOLLECTIONS) {
    try {
      const subSnap = await getDocs(collection(db, 'orders', orderId, subcol));
      if (!subSnap.empty) {
        const batch = writeBatch(db);
        subSnap.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }
    } catch (err) {
      // Ignore empty/non-existent subcollection reads while logging permission errors
      console.warn(`Order subcollection cleanup notice (${orderId}/${subcol}):`, err);
    }
  }
}

export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  if (!db) throw new Error('Firebase Firestore is not configured.');
  const docPath = `orders/${orderId}`;
  try {
    await deleteOrderSubcollections(orderId);
    await deleteDoc(doc(db, 'orders', orderId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function deleteOrdersBulkFromFirestore(orderIds: string[]): Promise<void> {
  if (!db) throw new Error('Firebase Firestore is not configured.');
  if (orderIds.length === 0) return;
  for (const orderId of orderIds) {
    await deleteOrderSubcollections(orderId);
  }
  const chunkSize = 400;
  for (let i = 0; i < orderIds.length; i += chunkSize) {
    const chunk = orderIds.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((id) => {
      batch.delete(doc(db!, 'orders', id));
    });
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `orders/${chunk.join(',')}`);
    }
  }
}

export function subscribeToOrdersFirestore(
  onOrders: (orders: Order[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) return () => {};
  const collectionPath = 'orders';
  const q = query(collection(db, collectionPath), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        let parsedItems = [];
        try {
          parsedItems = typeof data.items === 'string' ? JSON.parse(data.items) : data.items || [];
        } catch {
          parsedItems = [];
        }
        orders.push({
          ...data,
          id: docSnapshot.id,
          orderNumber: data.orderNumber || docSnapshot.id,
          items: parsedItems,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate().toISOString()
            : data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate
            ? data.updatedAt.toDate().toISOString()
            : data.updatedAt || new Date().toISOString(),
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
}

export function subscribeToCustomerOrdersFirestore(
  userId: string,
  onOrders: (orders: Order[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db || !userId) return () => {};
  const collectionPath = 'orders';
  const q = query(
    collection(db, collectionPath),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        let parsedItems = [];
        try {
          parsedItems = typeof data.items === 'string' ? JSON.parse(data.items) : data.items || [];
        } catch {
          parsedItems = [];
        }
        orders.push({
          ...data,
          id: docSnapshot.id,
          orderNumber: data.orderNumber || docSnapshot.id,
          items: parsedItems,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate().toISOString()
            : data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate
            ? data.updatedAt.toDate().toISOString()
            : data.updatedAt || new Date().toISOString(),
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
}

// ---------------- USER PROFILE & CUSTOMERS COLLECTION ----------------

export function subscribeToAllUsersAdminFirestore(
  onUsers: (users: UserProfile[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) return () => {};
  const collectionPath = 'users';
  return onSnapshot(
    collection(db, collectionPath),
    (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        let savedAddresses = [];
        try {
          savedAddresses =
            typeof d.savedAddresses === 'string'
              ? JSON.parse(d.savedAddresses)
              : d.savedAddresses || [];
        } catch {
          savedAddresses = [];
        }
        list.push({
          uid: docSnap.id,
          displayName: d.displayName || '',
          email: d.email || '',
          phone: d.phone || '',
          savedAddresses,
          updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : d.updatedAt,
        });
      });
      onUsers(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  if (!db || !userId) return null;
  const docPath = `users/${userId}`;
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const d = userDoc.data();
      let savedAddresses = [];
      try {
        savedAddresses =
          typeof d.savedAddresses === 'string'
            ? JSON.parse(d.savedAddresses)
            : d.savedAddresses || [];
      } catch {
        savedAddresses = [];
      }
      return {
        uid: userDoc.id,
        displayName: d.displayName || '',
        email: d.email || '',
        phone: d.phone || '',
        savedAddresses,
        updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : d.updatedAt,
      };
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
    const dataToSave: Record<string, any> = {
      uid: profile.uid,
      email: profile.email,
      updatedAt: serverTimestamp(),
    };
    if (profile.displayName !== undefined) dataToSave.displayName = profile.displayName;
    if (profile.phone !== undefined) dataToSave.phone = profile.phone;
    if (profile.savedAddresses !== undefined) {
      dataToSave.savedAddresses = JSON.stringify(profile.savedAddresses);
    }
    await setDoc(doc(db, 'users', profile.uid), dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function fetchUserCartFromFirestore(userId: string): Promise<CartItem[] | null> {
  if (!db || !userId) return null;
  const docPath = `carts/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'carts', userId));
    if (snap.exists()) {
      const data = snap.data();
      if (typeof data.items === 'string') {
        return JSON.parse(data.items) as CartItem[];
      }
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }
}

export async function saveUserCartToFirestore(userId: string, cart: CartItem[]): Promise<void> {
  if (!db || !userId) return;
  const docPath = `carts/${userId}`;
  try {
    await setDoc(
      doc(db, 'carts', userId),
      {
        uid: userId,
        items: JSON.stringify(cart),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

// ---------------- AUTHENTICATION OPERATIONS ----------------

export async function checkIsAdminInFirestore(
  uid: string,
  email?: string | null,
  emailVerified?: boolean
): Promise<boolean> {
  if (email?.toLowerCase() === 'bdtaseengaming@gmail.com' && emailVerified) {
    return true;
  }
  if (!db || !uid) return false;
  try {
    const snap = await getDoc(doc(db, 'admins', uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function signInWithGoogle(): Promise<User | null> {
  if (!auth) {
    throw new Error('Firebase Auth is not configured.');
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User | null> {
  if (!auth) {
    throw new Error('Firebase Auth is not configured.');
  }
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function registerWithEmail(
  name: string,
  email: string,
  password: string
): Promise<User | null> {
  if (!auth) {
    throw new Error('Firebase Auth is not configured.');
  }
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (cred.user && name.trim()) {
    await updateProfile(cred.user, { displayName: name.trim() });
  }
  return cred.user;
}

export async function signOutUser(): Promise<void> {
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

export async function checkProductsCountInFirestore(): Promise<number> {
  if (!db) return 0;
  try {
    const snap = await getDocs(collection(db, 'products'));
    return snap.size;
  } catch {
    return 0;
  }
}

export { db, auth, storage };
