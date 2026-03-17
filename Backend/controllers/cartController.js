import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      select: 'name price image brand category countInStock', // Get necessary product details
    });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    res.json(cart);
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      // Product exists in the cart, updating the quantity
      let item = cart.items[itemIndex];
      item.quantity += Number(quantity);
      // Optional: Check stock constraint here as well
      if(item.quantity > product.countInStock) {
        res.status(400);
        throw new Error(`Only ${product.countInStock} items in stock`);
      }
      cart.items[itemIndex] = item;
    } else {
      // Product does not exist in cart, add new item
      // Check stock
      if(quantity > product.countInStock) {
        res.status(400);
        throw new Error(`Only ${product.countInStock} items in stock`);
      }
      cart.items.push({ product: productId, quantity: Number(quantity), price: product.price });
    }

    await cart.save();
    
    // Return populated cart
    cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      select: 'name price image brand category countInStock',
    });

    res.status(201).json(cart);
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/update
// @access  Private
export const updateCartItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      res.status(404);
      throw new Error('Cart not found');
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      const product = await Product.findById(productId);
      if(quantity > product.countInStock) {
         res.status(400);
         throw new Error(`Only ${product.countInStock} items in stock`);
      }

      let item = cart.items[itemIndex];
      item.quantity = Number(quantity);
      cart.items[itemIndex] = item;

      await cart.save();

      const updatedCart = await Cart.findOne({ user: req.user._id }).populate({
        path: 'items.product',
        select: 'name price image brand category countInStock',
      });
      res.json(updatedCart);
    } else {
      res.status(404);
      throw new Error('Item not found in cart');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:productId
// @access  Private
export const removeCartItem = async (req, res, next) => {
  try {
    const productId = req.params.productId;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      res.status(404);
      throw new Error('Cart not found');
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    await cart.save();
    
    const updatedCart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      select: 'name price image brand category countInStock',
    });

    res.json(updatedCart);
  } catch (error) {
    next(error);
  }
};

// @desc    Merge localStorage cart with DB cart
// @route   POST /api/cart/merge
// @access  Private
export const mergeCart = async (req, res, next) => {
    try {
        const { localCartItems } = req.body; // Expecting array of { product (id), quantity }

        if (!localCartItems || localCartItems.length === 0) {
            return res.status(200).json({ message: 'No items to merge' });
        }

        let cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            cart = new Cart({ user: req.user._id, items: [] });
        }

        for (const localItem of localCartItems) {
            // First try to find by ID (if it's a valid ObjectId), otherwise fallback to name
            let product;
            if (localItem.name) {
               product = await Product.findOne({ name: localItem.name });
            } else {
               product = await Product.findById(localItem.product).catch(() => null);
            }
            if (!product) continue; // Skip invalid products

            const itemIndex = cart.items.findIndex(
                (item) => item.product.toString() === localItem.product
            );

            if (itemIndex > -1) {
                // If exists, you might want to choose to keep max quantity, or add them. Let's add them but respect stock.
                let item = cart.items[itemIndex];
                const newQty = item.quantity + Number(localItem.quantity);
                item.quantity = Math.min(newQty, product.countInStock);
                cart.items[itemIndex] = item;
            } else {
                const qty = Math.min(Number(localItem.quantity), product.countInStock);
                cart.items.push({ 
                    product: localItem.product, 
                    quantity: qty, 
                    price: product.price 
                });
            }
        }

        await cart.save();

        const mergedCart = await Cart.findOne({ user: req.user._id }).populate({
          path: 'items.product',
          select: 'name price image brand category countInStock',
        });

        res.json(mergedCart);

    } catch (error) {
        next(error);
    }
}
