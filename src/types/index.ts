export type MenuCategoryId = 
  | 'all' 
  | 'biryani-rice' 
  | 'curries' 
  | 'kebabs-bites' 
  | 'appetizers' 
  | 'desserts-drinks';

export interface MenuCategory {
  id: MenuCategoryId;
  label: string;
  bengaliLabel: string;
  iconName: string;
}

export interface MenuItem {
  id: string;
  name: string;
  bengaliName?: string;
  category: Exclude<MenuCategoryId, 'all'>;
  price: number; // in Bangladeshi Taka (BDT ৳)
  description: string;
  imageUrl: string;
  isAvailable: boolean;
  spiceLevel?: 'Mild' | 'Medium' | 'Spicy' | 'Extra Spicy';
  prepTimeMinutes: number;
  isChefSpecial?: boolean;
  portion?: string;
  ingredients?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'preparing' 
  | 'out_for_delivery' 
  | 'ready_for_pickup' 
  | 'completed' 
  | 'cancelled';

export type OrderType = 'delivery' | 'pickup';

export type PaymentMethod = 'cash_on_delivery' | 'pay_at_pickup';

export interface OrderItemSummary {
  id: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  deliveryAddress?: string;
  orderNotes?: string;
  paymentMethod: PaymentMethod;
  items: OrderItemSummary[];
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  estimatedTimeMinutes?: number;
}

export interface FirebaseConnectionStatus {
  isConfigured: boolean;
  projectId?: string;
  mode: 'real' | 'unconfigured';
  message: string;
}
