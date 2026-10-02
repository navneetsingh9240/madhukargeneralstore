"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [pincode, setPincode] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // ============================================================
  // Load Cart From LocalStorage
  // ============================================================

  useEffect(() => {
    const savedCart = localStorage.getItem('mgs_cart');
    const savedPincode = localStorage.getItem('mgs_pincode');
    const savedDelivery = localStorage.getItem('mgs_delivery');

    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);

        // Normalize saved cart numeric values
        const normalizedCart = parsedCart.map((item) => {
          const availableStock = Number(item.availableStock) || 0;

          const savedQuantity =
            Number(item.quantity) || 1;

          // Never allow saved/localStorage quantity
          // to be greater than available stock.
          const safeQuantity =
            availableStock > 0
              ? Math.min(savedQuantity, availableStock)
              : 0;

          return {
            ...item,

            mrp: Number(item.mrp) || 0,

            sellingPrice:
              Number(item.sellingPrice) || 0,

            quantity: safeQuantity,

            availableStock,
          };
        });

        // Remove products that no longer have stock.
        const validCart = normalizedCart.filter(
          (item) => item.quantity > 0
        );

        setCartItems(validCart);

        // Keep localStorage synchronized with corrected quantities.
        localStorage.setItem(
          'mgs_cart',
          JSON.stringify(validCart)
        );

      } catch (e) {
        console.error(
          'Failed to load saved cart:',
          e
        );
      }
    }

    if (savedPincode) {
      setPincode(savedPincode);
    }

    if (savedDelivery) {
      try {
        const parsedDelivery =
          JSON.parse(savedDelivery);

        // Normalize delivery charge if it comes from
        // MySQL/Prisma as a string.
        setDeliveryInfo(
          parsedDelivery
            ? {
                ...parsedDelivery,

                deliveryCharge:
                  Number(
                    parsedDelivery.deliveryCharge
                  ) || 0,

                minimumOrderAmount:
                  Number(
                    parsedDelivery.minimumOrderAmount
                  ) || 0,
              }
            : null
        );

      } catch (e) {
        console.error(
          'Failed to load saved delivery information:',
          e
        );
      }
    }
  }, []);

  // ============================================================
  // Save Cart
  // ============================================================

  const saveCart = (items) => {
    setCartItems(items);

    localStorage.setItem(
      'mgs_cart',
      JSON.stringify(items)
    );
  };

  // ============================================================
  // Add Product To Cart
  // ============================================================

  const addToCart = (product, quantity = 1) => {
    const existingIndex =
      cartItems.findIndex(
        (item) => item.id === product.id
      );

    let updated;

    const numericQuantity =
      Number(quantity) || 1;

    const numericMrp =
      Number(product.mrp) || 0;

    const numericSellingPrice =
      Number(product.sellingPrice) || 0;

    // Get actual product stock.
    const numericStock =
      product.inventory
        ? Number(product.inventory.currentStock) || 0
        : 0;

    // ------------------------------------------------------------
    // Do not add a product that has no stock.
    // ------------------------------------------------------------

    if (numericStock <= 0) {
      return;
    }

    // ------------------------------------------------------------
    // Existing Product
    // ------------------------------------------------------------

    if (existingIndex > -1) {
      updated = [...cartItems];

      const existingItem =
        updated[existingIndex];

      const currentQuantity =
        Number(existingItem.quantity) || 0;

      // Always use the latest product stock when
      // the product object contains inventory.
      const availableStock =
        numericStock;

      // Calculate requested new quantity.
      const requestedQuantity =
        currentQuantity + numericQuantity;

      // Never allow quantity above available stock.
      const safeQuantity =
        Math.min(
          requestedQuantity,
          availableStock
        );

      updated[existingIndex] = {
        ...existingItem,

        quantity: safeQuantity,

        mrp:
          Number(existingItem.mrp) ||
          numericMrp,

        sellingPrice:
          Number(existingItem.sellingPrice) ||
          numericSellingPrice,

        availableStock,
      };

    } else {

      // ----------------------------------------------------------
      // New Product
      // ----------------------------------------------------------

      const safeQuantity =
        Math.min(
          numericQuantity,
          numericStock
        );

      // If for any reason safe quantity becomes 0,
      // don't add the product.
      if (safeQuantity <= 0) {
        return;
      }

      updated = [
        ...cartItems,

        {
          id: product.id,

          name: product.name,

          slug: product.slug,

          unit: product.unit,

          // Always store prices as numbers
          mrp: numericMrp,

          sellingPrice:
            numericSellingPrice,

          image:
            product.images &&
            product.images[0]
              ? product.images[0].url
              : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80',

          quantity: safeQuantity,

          availableStock:
            numericStock,
        },
      ];
    }

    saveCart(updated);
  };

  // ============================================================
  // Update Product Quantity
  // ============================================================

  const updateQuantity = (
    productId,
    newQty
  ) => {
    const numericQty =
      Number(newQty);

    // ------------------------------------------------------------
    // Remove item if quantity is 0 or below.
    // ------------------------------------------------------------

    if (numericQty <= 0) {
      removeFromCart(productId);
      return;
    }

    const updated = cartItems.map(
      (item) => {

        if (item.id !== productId) {
          return item;
        }

        const availableStock =
          Number(item.availableStock) || 0;

        // --------------------------------------------------------
        // Never allow quantity above available stock.
        // --------------------------------------------------------

        if (availableStock <= 0) {
          return {
            ...item,
            quantity: 0,
          };
        }

        const safeQuantity =
          Math.min(
            numericQty,
            availableStock
          );

        return {
          ...item,
          quantity: safeQuantity,
        };
      }
    );

    // Remove any item that now has zero stock.
    const validCart =
      updated.filter(
        (item) =>
          Number(item.quantity) > 0
      );

    saveCart(validCart);
  };

  // ============================================================
  // Remove Product From Cart
  // ============================================================

  const removeFromCart = (
    productId
  ) => {
    const updated =
      cartItems.filter(
        (item) =>
          item.id !== productId
      );

    saveCart(updated);
  };

  // ============================================================
  // Clear Cart
  // ============================================================

  const clearCart = () => {
    setCartItems([]);

    setAppliedCoupon(null);

    localStorage.removeItem(
      'mgs_cart'
    );
  };

  // ============================================================
  // Save Delivery Pincode
  // ============================================================

  const saveDeliveryPincode = (
    pin,
    info
  ) => {
    const normalizedInfo =
      info
        ? {
            ...info,

            deliveryCharge:
              Number(
                info.deliveryCharge
              ) || 0,

            minimumOrderAmount:
              Number(
                info.minimumOrderAmount
              ) || 0,
          }
        : null;

    setPincode(pin);

    setDeliveryInfo(
      normalizedInfo
    );

    localStorage.setItem(
      'mgs_pincode',
      pin
    );

    localStorage.setItem(
      'mgs_delivery',
      JSON.stringify(
        normalizedInfo
      )
    );
  };

  // ============================================================
  // Cart Subtotal
  // ============================================================

  // Always perform arithmetic using numbers.
  const subtotal =
    cartItems.reduce(
      (sum, item) =>
        sum +
        Number(
          item.sellingPrice || 0
        ) *
        Number(
          item.quantity || 0
        ),
      0
    );

  // ============================================================
  // Total MRP
  // ============================================================

  const totalMrp =
    cartItems.reduce(
      (sum, item) =>
        sum +
        Number(
          item.mrp || 0
        ) *
        Number(
          item.quantity || 0
        ),
      0
    );

  // ============================================================
  // Total Discount
  // ============================================================

  const totalDiscount =
    totalMrp - subtotal;

  // ============================================================
  // Context Provider
  // ============================================================

  return (
    <CartContext.Provider
      value={{
        cartItems,

        addToCart,

        updateQuantity,

        removeFromCart,

        clearCart,

        pincode,

        deliveryInfo,

        saveDeliveryPincode,

        appliedCoupon,

        setAppliedCoupon,

        subtotal,

        totalMrp,

        totalDiscount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ============================================================
// useCart Hook
// ============================================================

export function useCart() {
  return useContext(
    CartContext
  );
}