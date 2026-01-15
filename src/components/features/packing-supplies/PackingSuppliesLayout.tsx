/**
 * @fileoverview Main orchestrator component for packing supplies page
 * @source boombox-10.0/src/app/components/packing-supplies/packingsupplieslayout.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Main layout component that orchestrates the entire packing supplies ordering flow:
 * - Product browsing with ProductGrid
 * - Cart management with MyCart (handles both desktop and mobile views)
 * - Checkout flow with PlaceOrder
 * - Order confirmation with OrderConfirmation
 * - Pre-built packing kits with PackingKits
 * - User data initialization for logged-in users
 * - API integration for product fetching
 * 
 * API ROUTES UPDATED:
 * - Old: /api/packing-supplies/products → New: /api/orders/packing-supplies/products
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced gray-500 with text-secondary for loading states
 * - Applied proper semantic color tokens throughout
 * - Maintained consistent spacing and layout patterns
 * 
 * BUSINESS LOGIC EXTRACTED:
 * - formatPhoneNumber utility → Using formatPhoneNumberForDisplay from phoneUtils
 * - Cart calculation logic preserved in component (specific to this feature)
 * 
 * @refactor Migrated with design system compliance, extracted duplicate formatPhoneNumber
 * utility, enhanced type safety, preserved all business logic
 */

'use client';

import { useState, useEffect } from 'react';
import { MyCart } from './MyCart';
import { ProductGrid } from './ProductGrid';
import { PackingKits } from './PackingKits';
import { PlaceOrder } from './PlaceOrder';
import { OrderConfirmation } from './OrderConfirmation';
import { formatPhoneNumberForDisplay } from '@/lib/utils/phoneUtils';
import type { Product } from '@/types/product.types';

interface CartItem {
  name: string;
  quantity: number;
  price: number; // Unit price of the item
}

interface SavedCard {
  id: number;
  stripePaymentMethodId: string;
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

interface UserData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  savedCards: SavedCard[];
}

interface PackingSuppliesLayoutProps {
  userData?: UserData | null;
}

export const PackingSuppliesLayout: React.FC<PackingSuppliesLayoutProps> = ({
  userData,
}) => {
  // View state
  const [isCheckout, setIsCheckout] = useState(false);
  const [isOrderConfirmed, setIsOrderConfirmed] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);

  // Form fields
  const [address, setAddress] = useState<string>('');
  const [addressError, setAddressError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string>('');
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string>('');
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Payment method state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(
    null
  );

  // Product and cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize user data if available
  useEffect(() => {
    if (userData) {
      setFirstName(userData.firstName || '');
      setLastName(userData.lastName || '');
      setEmail(userData.email || '');
      setPhoneNumber(formatPhoneNumberForDisplay(userData.phoneNumber || ''));
    }
  }, [userData]);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/orders/packing-supplies/products');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success && Array.isArray(data.products)) {
          // Map API products to match Product interface
          const mappedProducts = data.products.map((product: any) => ({
            productid: product.id,
            price: product.price,
            title: product.title,
            description: product.description,
            detailedDescription: product.detailedDescription,
            imageSrc: product.imageSrc,
            imageAlt: product.imageAlt,
            category: product.category,
            quantity: 0,
            stockCount: product.stockCount,
            isOutOfStock: product.isOutOfStock,
            hasLowStock: product.hasLowStock,
          }));
          setAllProducts(mappedProducts);
          setError(null);
        } else {
          console.error('Invalid response format:', data);
          setError('Failed to load products. Please try again later.');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load products. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddressChange = (
    newAddress: string,
    newZipCode: string,
    newCoordinates: google.maps.LatLngLiteral
  ) => {
    setAddress(newAddress);
  };

  const handleAddToCart = (product: Product, quantity: number) => {
    setCartItems((prevCartItems) => {
      const existingItemIndex = prevCartItems.findIndex(
        (item) => item.name === product.title
      );

      if (existingItemIndex > -1) {
        if (quantity === 0) {
          return prevCartItems.filter((item) => item.name !== product.title);
        }

        const updatedCartItems = [...prevCartItems];
        updatedCartItems[existingItemIndex] = {
          ...updatedCartItems[existingItemIndex],
          quantity,
          price: product.price, // Keep unit price, don't multiply by quantity
        };
        return updatedCartItems;
      }

      if (quantity > 0) {
        return [
          ...prevCartItems,
          {
            name: product.title,
            quantity,
            price: product.price, // Store unit price, not total price
          },
        ];
      }

      return prevCartItems;
    });

    setAllProducts((prevProducts) =>
      prevProducts.map((p) =>
        p.productid === product.productid ? { ...p, quantity } : p
      )
    );
  };

  const handleAddPackingKitToCart = (items: CartItem[]) => {
    setCartItems((prevCartItems) => {
      const updatedCartItems = [...prevCartItems];
      items.forEach((item) => {
        const existingItemIndex = updatedCartItems.findIndex(
          (cartItem) => cartItem.name === item.name
        );
        if (existingItemIndex > -1) {
          // Update quantity and keep the unit price
          updatedCartItems[existingItemIndex].quantity += item.quantity;
          updatedCartItems[existingItemIndex].price = item.price; // Keep unit price
        } else {
          updatedCartItems.push({ ...item });
        }
      });
      return updatedCartItems;
    });

    setAllProducts((prevProducts) =>
      prevProducts.map((product) => {
        const kitItem = items.find((item) => item.name === product.title);
        if (kitItem) {
          return {
            ...product,
            quantity: (product.quantity || 0) + kitItem.quantity,
          };
        }
        return product;
      })
    );
  };

  const removeItem = (name: string) => {
    setCartItems((prevCartItems) =>
      prevCartItems.filter((item) => item.name !== name)
    );

    setAllProducts((prevProducts) =>
      prevProducts.map((p) => (p.title === name ? { ...p, quantity: 0 } : p))
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const handleCheckout = () => {
    setIsCheckout(true);
    window.scrollTo(0, 0);
  };

  const handleBackToGrid = () => {
    setIsCheckout(false);
  };

  const handleOrderSuccess = (orderResult: any) => {
    setOrderData(orderResult);
    setIsOrderConfirmed(true);
    clearCart();
    window.scrollTo(0, 0);
  };

  const calculateTotalPrice = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  return (
    <div className="flex flex-col mt-12 sm:mt-24">
      {/* Order confirmation view */}
      {isOrderConfirmed && (
        <OrderConfirmation
          email={email}
          orderData={orderData}
          isLoggedIn={!!userData}
          userId={userData?.id?.toString()}
        />
      )}

      {/* Packing kits section (only show when not in checkout/confirmation) */}
      {!isCheckout && !isOrderConfirmed && (
        <PackingKits onAddToCart={handleAddPackingKitToCart} />
      )}

      {/* Main content area with product grid and cart */}
      <div className="md:flex gap-x-8 lg:gap-x-16 lg:px-16 px-6 justify-center mb-64 items-start">
        {/* Left column: Product grid or checkout form */}
        <div className={`${isCheckout ? 'md:basis-1/2' : 'md:basis-7/12'}`}>
          {!isCheckout && !isOrderConfirmed && (
            <>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-text-secondary">Loading products...</div>
                </div>
              ) : error ? (
                <div className="flex flex-col justify-center items-center py-12 px-4">
                  <div className="text-status-error mb-4 text-center">{error}</div>
                  <button
                    onClick={() => window.location.reload()}
                    className="btn-primary"
                  >
                    Retry
                  </button>
                </div>
              ) : allProducts.length === 0 ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-text-secondary">No products available at this time.</div>
                </div>
              ) : (
                <ProductGrid
                  products={allProducts}
                  cartItems={cartItems}
                  onAddToCart={handleAddToCart}
                />
              )}
            </>
          )}
          {isCheckout && !isOrderConfirmed && (
            <PlaceOrder
              onBack={handleBackToGrid}
              address={address}
              setAddress={setAddress}
              addressError={addressError}
              setAddressError={setAddressError}
              onAddressChange={handleAddressChange}
              clearAddressError={() => setAddressError(null)}
              firstName={firstName}
              setFirstName={setFirstName}
              firstNameError={firstNameError}
              setFirstNameError={setFirstNameError}
              lastName={lastName}
              setLastName={setLastName}
              lastNameError={lastNameError}
              setLastNameError={setLastNameError}
              email={email}
              setEmail={setEmail}
              emailError={emailError}
              setEmailError={setEmailError}
              phoneNumber={phoneNumber}
              setPhoneNumber={setPhoneNumber}
              phoneError={phoneError}
              setPhoneError={setPhoneError}
              cartItems={cartItems}
              totalPrice={calculateTotalPrice()}
              savedCards={userData?.savedCards || []}
              selectedPaymentMethod={selectedPaymentMethod}
              onPaymentMethodChange={setSelectedPaymentMethod}
            />
          )}
        </div>

        {/* Right column: Cart (desktop with sticky positioning and mobile) */}
        <div className="hidden md:flex basis-1/2 md:mr-auto sticky top-5 max-w-md h-fit">
          {!isOrderConfirmed && (
            <MyCart
              cartItems={cartItems}
              removeItem={removeItem}
              clearCart={clearCart}
              onCheckout={handleCheckout}
              isCheckout={isCheckout}
              address={address}
              firstName={firstName}
              lastName={lastName}
              email={email}
              phoneNumber={phoneNumber}
              addressError={addressError}
              firstNameError={firstNameError}
              lastNameError={lastNameError}
              emailError={emailError}
              phoneError={phoneError}
              setAddressError={setAddressError}
              setFirstNameError={setFirstNameError}
              setLastNameError={setLastNameError}
              setEmailError={setEmailError}
              setPhoneError={setPhoneError}
              onOrderSuccess={handleOrderSuccess}
              savedCards={userData?.savedCards || []}
              selectedPaymentMethod={selectedPaymentMethod}
              userId={userData?.id}
            />
          )}
        </div>
        
        {/* Mobile cart - rendered separately at bottom of viewport */}
        <div className="md:hidden">
          {!isOrderConfirmed && (
            <MyCart
              cartItems={cartItems}
              removeItem={removeItem}
              clearCart={clearCart}
              onCheckout={handleCheckout}
              isCheckout={isCheckout}
              address={address}
              firstName={firstName}
              lastName={lastName}
              email={email}
              phoneNumber={phoneNumber}
              addressError={addressError}
              firstNameError={firstNameError}
              lastNameError={lastNameError}
              emailError={emailError}
              phoneError={phoneError}
              setAddressError={setAddressError}
              setFirstNameError={setFirstNameError}
              setLastNameError={setLastNameError}
              setEmailError={setEmailError}
              setPhoneError={setPhoneError}
              onOrderSuccess={handleOrderSuccess}
              savedCards={userData?.savedCards || []}
              selectedPaymentMethod={selectedPaymentMethod}
              userId={userData?.id}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PackingSuppliesLayout;

