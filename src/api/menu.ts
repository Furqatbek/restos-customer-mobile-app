import api from './client';

export interface Restaurant {
  id: number;
  name: string;
  description?: string;
  phone?: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  deliveryFee: number;
  minimumOrderAmount: number;
  estimatedDeliveryTime: number;
  active: boolean;
  acceptingOrders: boolean;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  displayOrder: number;
  active: boolean;
  products?: Product[];
}

export interface AddOn {
  id: number;
  name: string;
  price: number;
  available: boolean;
  displayOrder: number;
}

export interface AddOnGroup {
  id: number;
  name: string;
  required: boolean;
  multiSelect: boolean;
  minSelections: number;
  maxSelections: number;
  addOns: AddOn[];
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  available: boolean;
  featured: boolean;
  images?: string[];
  preparationTime?: number;
  categoryId: number;
  addonGroups?: AddOnGroup[];
  allergens?: string[];
  calories?: number;
}

export interface PublicMenu {
  restaurant: Restaurant;
  categories: Category[];
}

export const getActiveRestaurants = () =>
  api.get<Restaurant[]>('/restaurants/active');

export const getRestaurant = (id: number) =>
  api.get<Restaurant>(`/restaurants/${id}`);

export const getPublicMenu = (restaurantId: number) =>
  api.get<PublicMenu>(`/menu/public/${restaurantId}`);
