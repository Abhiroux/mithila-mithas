import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const CART_STORAGE_KEY = 'mithila_mithas_cart';

const useCartStore = create(
  persist(
    (set, get) => ({
      cartItems: [],
      
      // Calculate derived values
      getTotals: () => {
        const { cartItems } = get();
        const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const deliveryFee = subtotal >= 500 ? 0 : 49;
        const gst = Math.round(subtotal * 0.05 * 100) / 100;
        const total = subtotal + deliveryFee + gst;
        
        return { cartCount, subtotal, deliveryFee, gst, total };
      },

      setCart: (items) => set({ cartItems: items }),

      addToCart: async (item) => {
        const { cartItems } = get();
        const existingIndex = cartItems.findIndex(i => i.name === item.name);
        
        const productId = item.product || item._id || item.id;
        
        if (existingIndex >= 0) {
          const updatedItems = [...cartItems];
          updatedItems[existingIndex].quantity += 1;
          set({ cartItems: updatedItems });
        } else {
          set({ cartItems: [...cartItems, { ...item, quantity: 1, product: productId }] });
        }
      },

      removeFromCart: (productIdOrName) => {
        // Find by name first or by ID as fallback
        const { cartItems } = get();
        set({
          cartItems: cartItems.filter(item => 
            item.name !== productIdOrName && 
            item.product !== productIdOrName && 
            item._id !== productIdOrName && 
            item.id !== productIdOrName
          )
        });
      },

      updateQuantity: (productIdOrName, quantity) => {
        const { cartItems } = get();
        if (quantity <= 0) {
          get().removeFromCart(productIdOrName);
          return;
        }
        
        set({
          cartItems: cartItems.map(item => 
            (item.name === productIdOrName || item.product === productIdOrName || item._id === productIdOrName || item.id === productIdOrName)
              ? { ...item, quantity } 
              : item
          )
        });
      },

      clearCart: () => set({ cartItems: [] }),

      // Sync backend cart with local storage on login
      syncWithBackend: async () => {
        try {
          // You would call this after successful login.
          const { cartItems } = get();
          
          const localCartItems = cartItems.map(item => ({
             product: item.product || item._id || item.id,
             name: item.name,
             quantity: item.quantity
          }));

          const response = await axios.post('/api/cart/merge', { localCartItems }, { withCredentials: true });
          
          if (response.data && response.data.items) {
             const mergedItems = response.data.items.map(item => ({
                ...item.product,
                quantity: item.quantity,
                product: item.product._id,
                name: item.product.name
             }));
             set({ cartItems: mergedItems });
          }
        } catch (error) {
          console.error("Failed to sync cart with backend", error);
        }
      },
      
      fetchCart: async () => {
        try {
           const response = await axios.get('/api/cart', { withCredentials: true });
           if (response.data && response.data.items) {
             const dbItems = response.data.items.map(item => ({
                ...item.product,
                quantity: item.quantity,
                product: item.product._id,
                name: item.product.name // ensuring name is available
             }));
             set({ cartItems: dbItems });
           }
        } catch (error) {
           console.error("Failed to fetch cart from backend", error);
        }
      }
    }),
    {
      name: CART_STORAGE_KEY,
    }
  )
);

export default useCartStore;
