export type OrderStatus = 'Placed' | 'Packed' | 'OutForDelivery' | 'Delivered' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export interface IProductAttribute {
  key: string;
  value: string;
}

export interface IProductVariant {
  id: string;
  productId: string;
  unit: string;
  price: number;
  discountPrice: number | null;
  stockQty: number;
  imageUrl: string;
  displayOrder: number;
}

export interface IProduct {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice: number | null;
  stockQty: number;
  unit: string;
  imageUrl: string;
  images: string[];
  isActive: boolean;
  variants: IProductVariant[];
  attributes: IProductAttribute[];
  relatedTags: string[];
}

export interface ICategory {
  id: string;
  name: string;
  slug: string;
  iconUrl: string;
  displayOrder: number;
  isActive: boolean;
}

export interface ICartItem {
  id: string;
  productId: string;
  product: IProduct;
  variantId: string;
  variant: IProductVariant;
  quantity: number;
  unitPrice: number;
}

export interface ICart {
  id: string;
  userId: string;
  items: ICartItem[];
  updatedAt: string;
}

export interface IOrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: IProduct;
  variantId: string;
  variant: IProductVariant;
  quantity: number;
  unitPrice: number;
}

export interface IOrder {
  id: string;
  userId: string;
  addressId: string;
  status: OrderStatus;
  subTotal: number;
  deliveryFee: number;
  couponCode: string | null;
  couponDiscount: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: string;
  items: IOrderItem[];
}

export interface IAddress {
  id: string;
  userId: string;
  label: string;
  street: string;
  city: string;
  pincode: string;
  lat: number | null;
  lng: number | null;
  isDefault: boolean;
}

export interface IDeliverySlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  maxOrders: number;
  isActive: boolean;
}

export interface IPaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: 'User' | 'Admin';
}

export interface ICoupon {
  id: string;
  code: string;
  discountType: 'Percent' | 'Flat';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  validFor: string;
  isActive: boolean;
}

export interface ICouponValidation {
  isValid: boolean;
  discountAmount: number;
  message: string;
}

export interface IBrandStore {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  description: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  deliveredOrders: number;
  topProducts: {
    productId: string;
    name: string;
    imageUrl: string;
    soldCount: number;
  }[];
}
