import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';
import toast from 'react-hot-toast';

// ── AUTH STORE ────────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:         null,
      accessToken:  null,
      refreshToken: null,
      isLoading:    false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          const { user, accessToken, refreshToken } = data.data;
          localStorage.setItem('accessToken',  accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          set({ user, accessToken, refreshToken, isLoading: false });
          toast.success(`Welcome back, ${user.firstName}!`);
          return { success: true, user };
        } catch (err) {
          set({ isLoading: false });
          toast.error(err.response?.data?.message || 'Login failed.');
          return { success: false };
        }
      },

      register: async (formData) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/register', formData);
          const { user, accessToken, refreshToken } = data.data;
          localStorage.setItem('accessToken',  accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          set({ user, accessToken, refreshToken, isLoading: false });
          toast.success('Account created successfully!');
          return { success: true, user };
        } catch (err) {
          set({ isLoading: false });
          toast.error(err.response?.data?.message || 'Registration failed.');
          return { success: false };
        }
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null });
        toast.success('Logged out successfully.');
      },

      updateUser: (user) => set({ user }),
      isAdmin:    () => ['ADMIN','SUPER_ADMIN'].includes(get().user?.role),
      isLoggedIn: () => !!get().user,
    }),
    { name: 'auth-store', partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken }) }
  )
);

// ── CART STORE ────────────────────────────────────────────────
export const useCartStore = create(
  persist(
    (set, get) => ({
      items:      [],
      totalItems: 0,
      subtotal:   0,
      isOpen:     false,
      isLoading:  false,

      openCart:  () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      // Sync with backend
      fetchCart: async () => {
        const { data } = await api.get('/cart');
        const cart = data.data.cart;
        set({ items: cart.items, totalItems: cart.totalItems, subtotal: cart.subtotal });
      },

      addToCart: async (productId, variantId = null, quantity = 1, productData = null) => {
        const { user } = useAuthStore.getState();

        if (!user) {
          // Guest cart — store locally
          set((state) => {
            const existing = state.items.find(i => i.productId === productId && i.variantId === variantId);
            let items;
            if (existing) {
              items = state.items.map(i =>
                i.productId === productId && i.variantId === variantId
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              );
            } else {
              items = [...state.items, { productId, variantId, quantity, product: productData, id: Date.now().toString() }];
            }
            const subtotal   = items.reduce((s, i) => s + parseFloat(i.product?.price || 0) * i.quantity, 0);
            const totalItems = items.reduce((s, i) => s + i.quantity, 0);
            return { items, subtotal, totalItems };
          });
          toast.success('Added to cart!');
          return;
        }

        try {
          const { data } = await api.post('/cart/add', { productId, variantId, quantity });
          const cart = data.data.cart;
          set({ items: cart.items, totalItems: cart.totalItems, subtotal: cart.subtotal, isOpen: true });
          toast.success('Added to cart!');
        } catch (err) {
          toast.error(err.response?.data?.message || 'Could not add to cart.');
        }
      },

      updateItem: async (itemId, quantity) => {
        try {
          const { data } = await api.put(`/cart/items/${itemId}`, { quantity });
          const cart = data.data.cart;
          set({ items: cart.items, totalItems: cart.totalItems, subtotal: cart.subtotal });
        } catch (err) {
          toast.error(err.response?.data?.message || 'Could not update cart.');
        }
      },

      removeItem: async (itemId) => {
        try {
          const { data } = await api.delete(`/cart/items/${itemId}`);
          const cart = data.data.cart;
          set({ items: cart.items, totalItems: cart.totalItems, subtotal: cart.subtotal });
          toast.success('Item removed.');
        } catch (err) {
          toast.error('Could not remove item.');
        }
      },

      clearCart: async () => {
        try {
          await api.delete('/cart');
          set({ items: [], totalItems: 0, subtotal: 0 });
        } catch { set({ items: [], totalItems: 0, subtotal: 0 }); }
      },
    }),
    {
      name: 'cart-store',
      partialize: (s) => ({ items: s.items, totalItems: s.totalItems, subtotal: s.subtotal }),
    }
  )
);

// ── WISHLIST STORE ────────────────────────────────────────────
export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],

      toggle: async (productId) => {
        const { user } = useAuthStore.getState();
        if (!user) { toast.error('Please log in to save to wishlist.'); return; }
        try {
          const { data } = await api.post('/wishlist/toggle', { productId });
          if (data.data.inWishlist) {
            toast.success('Added to wishlist ♥');
          } else {
            toast.success('Removed from wishlist');
          }
          // Refresh
          const res = await api.get('/wishlist');
          set({ items: res.data.data.items });
        } catch { toast.error('Could not update wishlist.'); }
      },

      fetch: async () => {
        const { user } = useAuthStore.getState();
        if (!user) return;
        try {
          const { data } = await api.get('/wishlist');
          set({ items: data.data.items });
        } catch {}
      },

      isInWishlist: (productId) => get().items.some(i => i.productId === productId),
    }),
    { name: 'wishlist-store', partialize: (s) => ({ items: s.items }) }
  )
);
