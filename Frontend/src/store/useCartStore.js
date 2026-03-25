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

        try {
          await axios.post('http://localhost:5000/api/cart/add', { productId, name: item.name, quantity: 1 }, { withCredentials: true });
        } catch (error) {
          // ignore error if not logged in
        }
      },

      removeFromCart: async (productIdOrName) => {
        // Find by name first or by ID as fallback
        const { cartItems } = get();
        const item = cartItems.find(i => 
            i.name === productIdOrName || 
            i.product === productIdOrName || 
            i._id === productIdOrName || 
            i.id === productIdOrName
        );
        const productIdToDelete = item ? (item.product || item._id || item.id) : productIdOrName;
        // In the URL payload we must dynamically encode the param to allow names or IDs
        const paramId = item ? (item.name || productIdToDelete) : productIdToDelete;

        set({
           cartItems: cartItems.filter(i => 
             i.name !== productIdOrName && 
             i.product !== productIdOrName && 
             i._id !== productIdOrName && 
             i.id !== productIdOrName
           )
        });

        try {
          await axios.delete(`http://localhost:5000/api/cart/remove/${encodeURIComponent(paramId)}`, { withCredentials: true });
        } catch (error) {
          // ignore error if not logged in
        }
      },

      updateQuantity: async (productIdOrName, quantity) => {
        const { cartItems } = get();
        if (quantity <= 0) {
          get().removeFromCart(productIdOrName);
          return;
        }
        
        const item = cartItems.find(i => 
            i.name === productIdOrName || 
            i.product === productIdOrName || 
            i._id === productIdOrName || 
            i.id === productIdOrName
        );
        const productIdToUpdate = item ? (item.product || item._id || item.id) : productIdOrName;

        set({
          cartItems: cartItems.map(i => 
            (i.name === productIdOrName || i.product === productIdOrName || i._id === productIdOrName || i.id === productIdOrName)
              ? { ...i, quantity } 
              : i
          )
        });

        try {
          await axios.put('http://localhost:5000/api/cart/update', { productId: productIdToUpdate, name: item?.name, quantity }, { withCredentials: true });
        } catch (error) {
          // ignore error if not logged in
        }
      },

      clearCart: () => set({ cartItems: [] }),

      // Sync backend cart with local storage on login
      syncWithBackend: async () => {
        try {
          const { cartItems } = get();
          
          const localCartItems = cartItems.map(item => ({
             product: item.product || item._id || item.id,
             name: item.name,
             quantity: item.quantity
          }));

          const response = await axios.post('http://localhost:5000/api/cart/merge', { localCartItems }, { withCredentials: true });
          
          if (response.data && response.data.items) {
             const mergedItems = response.data.items.map(item => ({
                ...item.product,
                quantity: item.quantity,
                product: item.product?._id || item.product,
                name: item.product?.name || item.name
             }));
             set({ cartItems: mergedItems });
          }
        } catch (error) {
          console.error("Failed to sync cart with backend", error);
        }
      },
      
      fetchCart: async () => {
        try {
           const response = await axios.get('http://localhost:5000/api/cart', { withCredentials: true });
           if (response.data && response.data.items) {
             const dbItems = response.data.items.map(item => ({
                ...item.product,
                quantity: item.quantity,
                product: item.product?._id || item.product,
                name: item.product?.name || 'Item'
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
