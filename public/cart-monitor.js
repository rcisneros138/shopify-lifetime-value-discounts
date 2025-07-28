/**
 * Cart Monitor Script
 * Monitors cart changes and applies lifetime value discounts
 */

(function() {
  'use strict';
  
  // Configuration
  const POLL_INTERVAL = 1000; // Check cart every second
  const API_ENDPOINT = '/apps/lifetime-discounts/api/calculate';
  const DISCOUNT_CODES = {
    10: 'LIFETIME_10',
    12: 'LIFETIME_12',
    15: 'LIFETIME_15',
    20: 'LIFETIME_20'
  };
  
  let lastCartState = null;
  let currentDiscountCode = null;
  
  // Get current cart
  async function getCart() {
    try {
      const response = await fetch('/cart.js');
      return await response.json();
    } catch (error) {
      console.error('Error fetching cart:', error);
      return null;
    }
  }
  
  // Calculate discount eligibility
  async function calculateDiscount(cart) {
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartTotal: cart.total_price / 100, // Convert from cents
          customerId: window.ShopifyAnalytics?.meta?.page?.customerId || null
        })
      });
      
      if (!response.ok) throw new Error('API request failed');
      
      return await response.json();
    } catch (error) {
      console.error('Error calculating discount:', error);
      return { discountPercent: 0, discountCode: null };
    }
  }
  
  // Apply or remove discount code
  async function updateDiscountCode(newCode) {
    if (newCode === currentDiscountCode) return; // No change needed
    
    try {
      // First, clear any existing discount
      if (currentDiscountCode) {
        await fetch('/discount/clear', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Then apply new discount if applicable
      if (newCode) {
        const formData = new FormData();
        formData.append('discount', newCode);
        
        await fetch('/discount/' + newCode, {
          method: 'POST',
          body: formData
        });
      }
      
      currentDiscountCode = newCode;
      
      // Refresh cart to show updated discount
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error('Error updating discount code:', error);
    }
  }
  
  // Main monitoring function
  async function monitorCart() {
    const cart = await getCart();
    if (!cart) return;
    
    // Check if cart has changed
    const cartState = JSON.stringify({
      items: cart.items.map(item => ({ id: item.id, quantity: item.quantity })),
      total: cart.total_price
    });
    
    if (cartState !== lastCartState) {
      lastCartState = cartState;
      
      // Cart has changed, recalculate discount
      const { discountPercent, discountCode } = await calculateDiscount(cart);
      
      // Apply appropriate discount code
      await updateDiscountCode(discountCode);
    }
  }
  
  // Start monitoring
  function init() {
    // Initial check
    monitorCart();
    
    // Set up polling
    setInterval(monitorCart, POLL_INTERVAL);
    
    // Also monitor for add to cart events
    document.addEventListener('cart:add', monitorCart);
    document.addEventListener('cart:remove', monitorCart);
    document.addEventListener('cart:update', monitorCart);
  }
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();