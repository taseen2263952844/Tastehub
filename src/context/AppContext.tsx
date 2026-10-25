import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  MenuItem, 
  CartItem, 
  Order, 
  OrderStatus, 
  MenuCategoryId, 
  FirebaseConnectionStatus,
  OrderType,
  PaymentMethod
} from '../types';
import { INITIAL_MENU_ITEMS, INITIAL_ORDERS } from '../data/sampleMenu';
import { 
  firebaseStatus, 
  createOrderInFirestore, 
  updateOrderStatusInFirestore, 
  saveMenuItemToFirestore, 
  deleteMenuItemFromFirestore,
  signInAdminWithGoogle,
  signOutAdmin,
  subscribeToAuthState,
  fetchMenuItemsFromFirestore,
  subscribeToOrdersFirestore
} from '../services/firebase';

interface CustomerCheckoutPayload {
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  deliveryAddress?: string;
  orderNotes?: string;
  paymentMethod: PaymentMethod;
}

interface AppContextType {
  menuItems: MenuItem[];
  orders: Order[];
  cart: CartItem[];
  activeCategory: MenuCategoryId;
  searchQuery: string;
  activeView: 'menu' | 'admin' | 'tracking';
  selectedDish: MenuItem | null;
  lastOrder: Order | null;
  trackedOrder: Order | null;
  adminUser: { email: string; name?: string; isAuthorized: boolean } | null;
  firebaseStatus: FirebaseConnectionStatus;
  isCartOpen: boolean;
  toastMessage: string | null;

  // Actions
  setActiveCategory: (cat: MenuCategoryId) => void;
  setSearchQuery: (q: string) => void;
  setActiveView: (view: 'menu' | 'admin' | 'tracking') => void;
  setSelectedDish: (dish: MenuItem | null) => void;
  setIsCartOpen: (open: boolean) => void;
  showToast: (msg: string) => void;
  
  // Cart Actions
  addToCart: (dish: MenuItem, quantity?: number, instructions?: string) => void;
  updateCartQuantity: (dishId: string, quantity: number) => void;
  removeFromCart: (dishId: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartItemCount: number;

  // Order Actions
  placeOrder: (payload: CustomerCheckoutPayload) => Promise<Order>;
  trackOrder: (orderId: string) => Order | null;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => Promise<void>;

  // Menu Management
  addMenuItem: (dish: Omit<MenuItem, 'id'>) => Promise<void>;
  updateMenuItem: (dish: MenuItem) => Promise<void>;
  toggleDishAvailability: (dishId: string) => Promise<void>;
  deleteMenuItem: (dishId: string) => Promise<void>;
  resetToDefaultMenu: () => void;

  // Admin Auth
  loginAsAdmin: (passcode?: string) => Promise<boolean>;
  loginWithGoogleAdmin: () => Promise<boolean>;
  logoutAdmin: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Authoritative authorized admin email
export const AUTHORIZED_ADMIN_EMAIL = 'bdtaseengaming@gmail.com';
export const ADMIN_DEMO_PIN = '7890'; // Local management passcode when Firebase is unconfigured

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('tastehub_menu');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_MENU_ITEMS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('tastehub_orders');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_ORDERS;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('tastehub_cart');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return [];
  });

  const [activeCategory, setActiveCategory] = useState<MenuCategoryId>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeView, setActiveView] = useState<'menu' | 'admin' | 'tracking'>('menu');
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [adminUser, setAdminUser] = useState<{ email: string; name?: string; isAuthorized: boolean } | null>(() => {
    const saved = sessionStorage.getItem('tastehub_admin_session');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return null;
  });

  // Sync to local memory storage for persistent demo experience
  useEffect(() => {
    localStorage.setItem('tastehub_menu', JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem('tastehub_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('tastehub_cart', JSON.stringify(cart));
  }, [cart]);

  // Real Firebase listeners when configured
  useEffect(() => {
    if (!firebaseStatus.isConfigured) return;

    // Load menu from Firestore
    fetchMenuItemsFromFirestore().then((items) => {
      if (items && items.length > 0) {
        setMenuItems(items);
      }
    });

    // Realtime orders listener
    const unsubscribeOrders = subscribeToOrdersFirestore((liveOrders) => {
      if (liveOrders && liveOrders.length > 0) {
        setOrders(liveOrders);
      }
    });

    // Realtime auth listener
    const unsubscribeAuth = subscribeToAuthState((user) => {
      if (user) {
        const isAuth = user.email?.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
        const adminObj = {
          email: user.email || '',
          name: user.displayName || 'Authorized Admin',
          isAuthorized: isAuth
        };
        setAdminUser(adminObj);
        sessionStorage.setItem('tastehub_admin_session', JSON.stringify(adminObj));
      } else if (!sessionStorage.getItem('tastehub_admin_session')) {
        setAdminUser(null);
      }
    });

    return () => {
      unsubscribeOrders();
      unsubscribeAuth();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Cart operations
  const addToCart = (dish: MenuItem, quantity = 1, instructions?: string) => {
    if (!dish.isAvailable) {
      showToast('Sorry, this dish is currently sold out!');
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.menuItem.id === dish.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
          specialInstructions: instructions || updated[existingIndex].specialInstructions
        };
        return updated;
      }
      return [...prev, { menuItem: dish, quantity, specialInstructions: instructions }];
    });

    showToast(`Added ${dish.name} to cart (৳${dish.price})`);
  };

  const updateCartQuantity = (dishId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(dishId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.menuItem.id === dishId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (dishId: string) => {
    setCart((prev) => prev.filter((item) => item.menuItem.id !== dishId));
    showToast('Item removed from cart');
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartSubtotal = cart.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Authoritative Order Placement
  const placeOrder = async (payload: CustomerCheckoutPayload): Promise<Order> => {
    if (cart.length === 0) {
      throw new Error('Your cart is empty');
    }

    // Security Re-validation: recalculate prices from authoritative menu item prices
    let calculatedSubtotal = 0;
    const validatedItems = cart.map((cartItem) => {
      const catalogItem = menuItems.find((m) => m.id === cartItem.menuItem.id);
      const actualPrice = catalogItem ? catalogItem.price : cartItem.menuItem.price;
      calculatedSubtotal += actualPrice * cartItem.quantity;
      return {
        id: cartItem.menuItem.id,
        name: catalogItem ? catalogItem.name : cartItem.menuItem.name,
        price: actualPrice,
        quantity: cartItem.quantity,
        specialInstructions: cartItem.specialInstructions
      };
    });

    const deliveryFee = payload.orderType === 'delivery' ? 60 : 0;
    const totalAmount = calculatedSubtotal + deliveryFee;

    // Generate unique order number (e.g. TH-892401)
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const orderId = `TH-${randomSuffix}`;

    const newOrder: Order = {
      id: orderId,
      customerName: payload.customerName.trim(),
      customerPhone: payload.customerPhone.trim(),
      orderType: payload.orderType,
      deliveryAddress: payload.deliveryAddress?.trim(),
      orderNotes: payload.orderNotes?.trim(),
      paymentMethod: payload.paymentMethod,
      items: validatedItems,
      itemCount: validatedItems.reduce((acc, curr) => acc + curr.quantity, 0),
      subtotal: calculatedSubtotal,
      deliveryFee,
      totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedTimeMinutes: payload.orderType === 'delivery' ? 40 : 25
    };

    // If Firebase is configured, persist to Cloud Firestore
    if (firebaseStatus.isConfigured) {
      try {
        await createOrderInFirestore(newOrder);
      } catch (err) {
        console.error('Failed to save order to Firestore:', err);
      }
    }

    // Update local state
    setOrders((prev) => [newOrder, ...prev]);
    setLastOrder(newOrder);
    setTrackedOrder(newOrder);
    clearCart();
    setIsCartOpen(false);

    return newOrder;
  };

  const trackOrder = (orderId: string): Order | null => {
    const cleanId = orderId.trim().toUpperCase();
    const cleanPhone = orderId.trim();
    const found = orders.find(
      (o) => o.id.toUpperCase() === cleanId || o.customerPhone === cleanPhone
    );
    if (found) {
      setTrackedOrder(found);
      return found;
    }
    return null;
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!adminUser || !adminUser.isAuthorized) {
      showToast('Unauthorized: Only restaurant administrators can change order status.');
      return;
    }

    if (firebaseStatus.isConfigured) {
      try {
        await updateOrderStatusInFirestore(orderId, newStatus);
      } catch (err) {
        console.error('Failed to update order status in Firestore:', err);
      }
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: newStatus, updatedAt: new Date().toISOString() }
          : o
      )
    );

    if (trackedOrder && trackedOrder.id === orderId) {
      setTrackedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    showToast(`Order #${orderId} status updated to: ${newStatus.replace('_', ' ').toUpperCase()}`);
  };

  // Menu Management
  const addMenuItem = async (dishData: Omit<MenuItem, 'id'>) => {
    const newId = `th-dish-${Date.now().toString().slice(-6)}`;
    const newDish: MenuItem = {
      ...dishData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (firebaseStatus.isConfigured) {
      try {
        await saveMenuItemToFirestore(newDish);
      } catch (err) {
        console.error('Failed to add dish to Firestore:', err);
      }
    }

    setMenuItems((prev) => [newDish, ...prev]);
    showToast(`Added "${newDish.name}" to menu`);
  };

  const updateMenuItem = async (dish: MenuItem) => {
    const updated = { ...dish, updatedAt: new Date().toISOString() };

    if (firebaseStatus.isConfigured) {
      try {
        await saveMenuItemToFirestore(updated);
      } catch (err) {
        console.error('Failed to update dish in Firestore:', err);
      }
    }

    setMenuItems((prev) => prev.map((item) => (item.id === dish.id ? updated : item)));
    showToast(`Updated "${dish.name}"`);
  };

  const toggleDishAvailability = async (dishId: string) => {
    const dish = menuItems.find((d) => d.id === dishId);
    if (!dish) return;

    const updated = { ...dish, isAvailable: !dish.isAvailable };
    await updateMenuItem(updated);
    showToast(`Dish is now marked as ${updated.isAvailable ? 'Available' : 'Hidden / Sold Out'}`);
  };

  const deleteMenuItem = async (dishId: string) => {
    if (firebaseStatus.isConfigured) {
      try {
        await deleteMenuItemFromFirestore(dishId);
      } catch (err) {
        console.error('Failed to delete dish from Firestore:', err);
      }
    }

    setMenuItems((prev) => prev.filter((d) => d.id !== dishId));
    showToast('Menu item removed');
  };

  const resetToDefaultMenu = () => {
    setMenuItems(INITIAL_MENU_ITEMS);
    localStorage.removeItem('tastehub_menu');
    showToast('Menu reset to authentic Bangladeshi sample items');
  };

  // Admin Auth Handlers
  const loginAsAdmin = async (passcode?: string): Promise<boolean> => {
    if (passcode === ADMIN_DEMO_PIN) {
      const adminObj = {
        email: AUTHORIZED_ADMIN_EMAIL,
        name: 'Authorized TasteHub Admin',
        isAuthorized: true
      };
      setAdminUser(adminObj);
      sessionStorage.setItem('tastehub_admin_session', JSON.stringify(adminObj));
      showToast('Admin logged in successfully!');
      return true;
    }
    showToast('Invalid management passcode');
    return false;
  };

  const loginWithGoogleAdmin = async (): Promise<boolean> => {
    try {
      const user = await signInAdminWithGoogle();
      if (!user) return false;

      const isAuth = user.email?.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
      const adminObj = {
        email: user.email || '',
        name: user.displayName || 'Authorized Admin',
        isAuthorized: isAuth
      };
      setAdminUser(adminObj);
      sessionStorage.setItem('tastehub_admin_session', JSON.stringify(adminObj));

      if (isAuth) {
        showToast(`Welcome authorized admin, ${user.displayName || user.email}!`);
      } else {
        showToast(`Notice: ${user.email} is signed in, but not in authorized admin list.`);
      }
      return isAuth;
    } catch (err) {
      console.error('Google Sign-In failed:', err);
      showToast('Google Sign-in failed. Please check Firebase configuration.');
      return false;
    }
  };

  const logoutAdmin = () => {
    signOutAdmin().catch(() => {});
    setAdminUser(null);
    sessionStorage.removeItem('tastehub_admin_session');
    showToast('Logged out from Admin Dashboard');
  };

  return (
    <AppContext.Provider
      value={{
        menuItems,
        orders,
        cart,
        activeCategory,
        searchQuery,
        activeView,
        selectedDish,
        lastOrder,
        trackedOrder,
        adminUser,
        firebaseStatus,
        isCartOpen,
        toastMessage,

        setActiveCategory,
        setSearchQuery,
        setActiveView,
        setSelectedDish,
        setIsCartOpen,
        showToast,

        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartItemCount,

        placeOrder,
        trackOrder,
        updateOrderStatus,

        addMenuItem,
        updateMenuItem,
        toggleDishAvailability,
        deleteMenuItem,
        resetToDefaultMenu,

        loginAsAdmin,
        loginWithGoogleAdmin,
        logoutAdmin
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
