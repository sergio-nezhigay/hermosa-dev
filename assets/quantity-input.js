class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input');
    
    // Only proceed if we have the required input element
    if (!this.input) {
      console.warn('QuantityInput: No input element found');
      return;
    }
    
    this.changeEvent = new Event('change', { bubbles: true });

    // Add event listeners to buttons
    this.querySelectorAll('button').forEach(
      (button) => button.addEventListener('click', this.onButtonClick.bind(this))
    );
    
    // Prevent form submission when quantity changes
    const form = this.closest('form');
    if (form) {
      form.addEventListener('submit', (event) => {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.classList.contains('quantity__button')) {
          event.preventDefault();
        }
      });
    }
    
    // Add event listener to input to catch manual changes
    this.input.addEventListener('change', this.onInputChange.bind(this));
  }

  onInputChange(event) {
    const input = event.target;
    if (!input) return;
    
    const variantId = input.dataset.quantityVariantId;
    const newValue = Number(input.value);
    
    // Get custom price for both desktop and mobile layouts
    const cartItem = this.closest('tr') || this.closest('.cart_item');
    const customPrice = cartItem?.querySelector('.cart_price')?.textContent?.trim();
    const numericPrice = customPrice ? parseFloat(customPrice.replace(/[^0-9.]/g, '')) : null;
    
    // Update cart via AJAX
    if (variantId) {
      event.preventDefault();
      this.updateCartQuantity(variantId, newValue, numericPrice);
    }
  }

  onButtonClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.currentTarget;
    if (!button) return false;
    
    const input = button.parentNode.querySelector('[data-quantity-input]');
    if (!input) return false;
    
    const value = Number(input.value);
    const step = Number(input.step || 1);
    const variantId = input.dataset.quantityVariantId;
    let newValue = value;

    // Get custom price for both desktop and mobile layouts
    const cartItem = this.closest('tr') || this.closest('.cart_item');
    const customPrice = cartItem?.querySelector('.cart_price')?.textContent?.trim();
    const numericPrice = customPrice ? parseFloat(customPrice.replace(/[^0-9.]/g, '')) : null;

    if (button.dataset.action === 'decrease-quantity') {
      const min = Number(input.min) || 0;
      if (value > min) {
        newValue = value - step;
        input.value = newValue;
      }
    } else if (button.dataset.action === 'increase-quantity') {
      const max = Number(input.max) || null;
      if (!max || value < max) {
        newValue = value + step;
        input.value = newValue;
      }
    }

    // Only proceed if the value actually changed
    if (newValue !== value) {
      input.dispatchEvent(this.changeEvent);
      this.updateCartQuantity(variantId, newValue, numericPrice);
    }
    
    return false;
  }

  updateCartQuantity(variantId, quantity, customPrice) {
    // Show loading state for both desktop and mobile
    const cartItemElement = this.closest('tr') || this.closest('.cart_item');
    if (cartItemElement) {
      cartItemElement.classList.add('cart-item--loading');
    }

    // First get the current cart to preserve existing properties
    fetch('/cart.js')
    .then(response => response.json())
    .then(currentCart => {
      const currentItem = currentCart.items.find(item => item.variant_id.toString() === variantId.toString());
      
      // Build properties object to preserve all existing properties
      const properties = {};
      
      // Preserve all existing properties
      if (currentItem && currentItem.properties) {
        Object.assign(properties, currentItem.properties);
        console.log('Preserving existing properties:', currentItem.properties);
      }
      
      // Update or add the custom price
      if (customPrice) {
        properties['_custom_price'] = customPrice;
      }
      
      console.log('Final properties being sent:', properties);

      return fetch('/cart/change.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          id: variantId,
          quantity: quantity,
          properties: properties
        })
      });
    })
    .then(response => response.json())
    .then(cart => {
      this.updateCartTotals(cart);
      
      if (cartItemElement) {
        cartItemElement.classList.remove('cart-item--loading');
      }
      
      this.updateLineItemPrice(cart, variantId);
    })
    .catch(error => {
      console.error('Error updating cart:', error);
      if (cartItemElement) {
        cartItemElement.classList.remove('cart-item--loading');
      }
    });
  }

  updateCartTotals(cart) {
    // Update cart count
    if (cart.item_count === 0) {
      window.location.reload();
      return;
    }
    
    const cartCountElements = document.querySelectorAll('.cart-count-bubble');
    cartCountElements.forEach(element => {
      element.textContent = cart.item_count;
    });

    // Calculate total including custom prices
    let cartTotal = 0;
    cart.items.forEach(item => {
      const itemPrice = item.properties?._custom_price 
        ? parseFloat(item.properties._custom_price) * 100 // Convert to cents
        : item.original_price; // Already in cents
      cartTotal += itemPrice * item.quantity;
    });

    console.log('Cart total calculation:', cartTotal, 'formatted:', this.formatMoney(cartTotal));

    // Update all total elements (using the correct selector)
    const totalElements = document.querySelectorAll('.totals__total-value');
    console.log('Found total elements:', totalElements.length);
    totalElements.forEach(element => {
      element.innerHTML = this.formatMoney(cartTotal);
    });
  }

  updateLineItemPrice(cart, variantId) {
    const lineItem = cart.items.find(item => item.variant_id.toString() === variantId.toString());
    if (!lineItem) return;

    // Calculate the correct line total
    const customPrice = lineItem.properties?._custom_price;
    const lineTotal = customPrice 
      ? parseFloat(customPrice) * lineItem.quantity * 100 // Convert to cents 
      : lineItem.final_line_price; // Already in cents

    // Find the cart item index from the current DOM element
    const currentCartItem = this.closest('tr') || this.closest('.cart_item');
    if (currentCartItem) {
      const itemId = currentCartItem.id; // e.g., "CartItem-1"
      
      // Update desktop table row total
      const desktopItem = document.querySelector(`tr#${itemId}`);
      if (desktopItem) {
        const totalCell = desktopItem.querySelector('.cart-item__totals .cart_price');
        if (totalCell) {
          totalCell.innerHTML = this.formatMoney(lineTotal);
        }
      }

      // Update mobile cart item total
      const mobileItem = document.querySelector(`.mobile_cart .cart_item#${itemId}`);
      if (mobileItem) {
        const totalElement = mobileItem.querySelector('.cart_price');
        if (totalElement) {
          totalElement.innerHTML = this.formatMoney(lineTotal);
        }
      }
    }

    // Update cart total (this is the main total)
    this.updateCartTotals(cart);
  }

  formatMoney(cents) {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    });
    return formatter.format(cents / 100);
  }
}

customElements.define('quantity-input', QuantityInput); 