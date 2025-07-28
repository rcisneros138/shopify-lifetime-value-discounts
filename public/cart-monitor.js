/**
 * Cart Monitor Script - Event-Driven Architecture
 * Monitors cart changes and applies lifetime value discounts
 */

(function() {
  'use strict';
  
  // Configuration
  const API_ENDPOINT = '/apps/lifetime-discounts/api/calculate';
  const DEBOUNCE_DELAY = 500; // Debounce cart changes by 500ms
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const STORAGE_KEY = 'lifetime_discount_cache';
  const NOTIFICATION_DURATION = 5000; // 5 seconds
  
  // State management
  let lastCartState = null;
  let currentDiscountCode = null;
  let debounceTimer = null;
  let lastActivity = Date.now();
  let isProcessing = false;
  
  // Generate session ID if not exists
  function getSessionId() {
    let sessionId = sessionStorage.getItem('discount_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('discount_session_id', sessionId);
    }
    return sessionId;
  }
  
  // Get cached discount data
  function getCachedDiscount() {
    try {
      const cached = sessionStorage.getItem(STORAGE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < 5 * 60 * 1000) { // 5 minute cache
          return data;
        }
      }
    } catch (e) {
      console.error('Cache read error:', e);
    }
    return null;
  }
  
  // Save discount data to cache
  function setCachedDiscount(data) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...data,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error('Cache write error:', e);
    }
  }
  
  // Show notification to user
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `lifetime-discount-notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close" aria-label="Close">&times;</button>
      </div>
    `;
    
    // Add styles if not already added
    if (!document.getElementById('lifetime-discount-styles')) {
      const styles = document.createElement('style');
      styles.id = 'lifetime-discount-styles';
      styles.textContent = `
        .lifetime-discount-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #333;
          color: white;
          padding: 16px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 9999;
          max-width: 400px;
          animation: slideIn 0.3s ease-out;
        }
        
        .lifetime-discount-notification.success { background: #10b981; }
        .lifetime-discount-notification.error { background: #ef4444; }
        .lifetime-discount-notification.warning { background: #f59e0b; }
        
        .notification-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        
        .notification-close {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          font-size: 20px;
          line-height: 1;
          padding: 0;
          opacity: 0.8;
        }
        
        .notification-close:hover { opacity: 1; }
        
        .discount-progress {
          margin-top: 10px;
          font-size: 14px;
          opacity: 0.9;
        }
        
        .progress-bar {
          width: 100%;
          height: 4px;
          background: rgba(255,255,255,0.3);
          border-radius: 2px;
          margin-top: 6px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: white;
          transition: width 0.3s ease;
        }
        
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Close button handler
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.remove();
    });
    
    // Auto-remove after duration
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
      }
    }, NOTIFICATION_DURATION);
  }
  
  // Show discount progress
  function showDiscountProgress(currentTotal, nextTier) {
    if (!nextTier) return;
    
    const progress = (currentTotal / nextTier.min) * 100;
    const amountNeeded = nextTier.amountNeeded;
    
    showNotification(`
      <div>
        <strong>You're $${amountNeeded.toFixed(2)} away from ${nextTier.percent}% off!</strong>
        <div class="discount-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
          </div>
        </div>
      </div>
    `, 'info');
  }
  
  // Get current cart using Shopify Cart API
  async function getCart() {
    try {
      const response = await fetch('/cart.js', {
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch cart');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching cart:', error);
      return null;
    }
  }
  
  // Calculate discount eligibility with retry logic
  async function calculateDiscount(cart, retries = 3) {
    try {
      const customerId = window.ShopifyAnalytics?.meta?.page?.customerId || 
                        window.meta?.page?.customerId || 
                        null;
      
      const requestBody = {
        cartTotal: cart.total_price / 100, // Convert from cents
        customerId: customerId ? String(customerId) : null,
        sessionId: getSessionId()
      };
      
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        if (response.status === 429 && retries > 0) {
          // Rate limited, wait and retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          return calculateDiscount(cart, retries - 1);
        }
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the result
      if (!data.error) {
        setCachedDiscount(data);
      }
      
      return data;
    } catch (error) {
      console.error('Error calculating discount:', error);
      
      // Try to use cached data on error
      const cached = getCachedDiscount();
      if (cached) {
        return cached;
      }
      
      return { discountPercent: 0, discountCode: null, error: error.message };
    }
  }
  
  // Apply discount code using Shopify Cart API
  async function applyDiscountCode(code) {
    if (!code || code === currentDiscountCode) return;
    
    try {
      const formData = new FormData();
      formData.append('updates[]', '');
      formData.append('discount', code);
      
      const response = await fetch('/cart/update.js', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Failed to apply discount');
      
      currentDiscountCode = code;
      showNotification(`${code.replace('LIFETIME_', '')}% discount applied!`, 'success');
      
      // Update cart display without page reload
      updateCartDisplay();
      
    } catch (error) {
      console.error('Error applying discount:', error);
      showNotification('Failed to apply discount. Please try again.', 'error');
    }
  }
  
  // Remove discount code
  async function removeDiscountCode() {
    if (!currentDiscountCode) return;
    
    try {
      const formData = new FormData();
      formData.append('updates[]', '');
      formData.append('discount', '');
      
      await fetch('/cart/update.js', {
        method: 'POST',
        body: formData
      });
      
      currentDiscountCode = null;
      updateCartDisplay();
      
    } catch (error) {
      console.error('Error removing discount:', error);
    }
  }
  
  // Update cart display without page reload
  async function updateCartDisplay() {
    try {
      // Fetch updated cart
      const cart = await getCart();
      if (!cart) return;
      
      // Trigger Shopify theme cart update events
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart } }));
      
      // Update cart drawer if it exists
      if (window.theme?.updateCart) {
        window.theme.updateCart(cart);
      }
      
      // Update cart count badges
      document.querySelectorAll('[data-cart-count]').forEach(el => {
        el.textContent = cart.item_count;
      });
      
      // Update cart total displays
      document.querySelectorAll('[data-cart-total]').forEach(el => {
        el.textContent = window.theme?.Currency?.formatMoney?.(cart.total_price) || 
                        `$${(cart.total_price / 100).toFixed(2)}`;
      });
      
    } catch (error) {
      console.error('Error updating cart display:', error);
    }
  }
  
  // Main cart monitoring function
  async function checkCart() {
    if (isProcessing) return;
    
    isProcessing = true;
    lastActivity = Date.now();
    
    try {
      const cart = await getCart();
      if (!cart) return;
      
      // Check if cart has changed
      const cartState = JSON.stringify({
        items: cart.items.map(item => ({ id: item.id, quantity: item.quantity })),
        total: cart.total_price
      });
      
      if (cartState === lastCartState) return;
      
      lastCartState = cartState;
      
      // Cart has changed, calculate discount
      const discountData = await calculateDiscount(cart);
      
      if (discountData.error) {
        console.error('Discount calculation error:', discountData.error);
        return;
      }
      
      // Handle discount application
      if (discountData.discountCode) {
        await applyDiscountCode(discountData.discountCode);
      } else if (currentDiscountCode) {
        await removeDiscountCode();
      }
      
      // Show progress to next tier if applicable
      if (discountData.nextTier && !discountData.discountCode) {
        showDiscountProgress(discountData.totalValue, discountData.nextTier);
      }
      
    } catch (error) {
      console.error('Cart check error:', error);
    } finally {
      isProcessing = false;
    }
  }
  
  // Debounced cart check
  function debouncedCheckCart() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(checkCart, DEBOUNCE_DELAY);
  }
  
  // Session timeout check
  function checkSessionTimeout() {
    if (Date.now() - lastActivity > SESSION_TIMEOUT) {
      // Session expired, clear discount
      if (currentDiscountCode) {
        removeDiscountCode();
      }
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem('discount_session_id');
    }
  }
  
  // Set up cart change monitoring
  function setupCartMonitoring() {
    // Monitor Shopify cart events
    const cartEvents = [
      'cart:add',
      'cart:remove', 
      'cart:update',
      'cart:change',
      'ajaxCart:added',
      'ajaxCart:removed',
      'ajaxCart:updated'
    ];
    
    cartEvents.forEach(event => {
      document.addEventListener(event, debouncedCheckCart);
    });
    
    // Monitor AJAX cart API calls
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const [url] = args;
      
      return originalFetch.apply(this, args).then(response => {
        if (typeof url === 'string' && 
            (url.includes('/cart/add') || 
             url.includes('/cart/update') || 
             url.includes('/cart/change'))) {
          setTimeout(debouncedCheckCart, 100);
        }
        return response;
      });
    };
    
    // Monitor form submissions
    document.addEventListener('submit', function(e) {
      const form = e.target;
      if (form.action && form.action.includes('/cart/add')) {
        setTimeout(debouncedCheckCart, 500);
      }
    }, true);
    
    // Use MutationObserver for cart drawer changes
    const cartDrawer = document.querySelector('[data-cart-drawer], .cart-drawer, #CartDrawer');
    if (cartDrawer) {
      const observer = new MutationObserver(debouncedCheckCart);
      observer.observe(cartDrawer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-cart-count', 'data-cart-total']
      });
    }
    
    // Check periodically for session timeout
    setInterval(checkSessionTimeout, 60 * 1000); // Every minute
  }
  
  // Initialize
  function init() {
    // Initial cart check
    checkCart();
    
    // Set up monitoring
    setupCartMonitoring();
    
    // Listen for customer login/logout
    document.addEventListener('customer:login', checkCart);
    document.addEventListener('customer:logout', () => {
      currentDiscountCode = null;
      sessionStorage.removeItem(STORAGE_KEY);
      checkCart();
    });
  }
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();