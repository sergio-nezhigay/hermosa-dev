class CartRemoveButton extends HTMLElement {
  constructor() {
    super();
    
    // Find the anchor element inside the cart-remove-button
    const removeLink = this.querySelector('a');
    if (removeLink) {
      removeLink.addEventListener('click', this.onRemoveClick.bind(this));
    } else {
      // Fallback to the cart-remove-button itself
      this.addEventListener('click', this.onRemoveClick.bind(this));
    }
  }

  onRemoveClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Get the cart item key from the ID or data attribute
    const cartItemKey = this.dataset.cartItemKey || this.getAttribute('id').replace('Remove-', '');
    
    // Handle both desktop and mobile cart item elements
    const cartItemElement = document.querySelector(`#CartItem-${cartItemKey}`);
    const mobileCartItemElement = document.querySelector(`.mobile_cart #CartItem-${cartItemKey}`);
    const targetElement = cartItemElement || mobileCartItemElement;
    
    if (targetElement) {
      targetElement.classList.add('cart-item--loading');
      
      // Find the variant ID from the quantity input
      const quantityInput = targetElement.querySelector('[data-quantity-input]');
      const variantId = quantityInput ? quantityInput.dataset.quantityVariantId : this.dataset.variantId;
      
      if (variantId) {
        // Make AJAX request to remove item (set quantity to 0)
        fetch('/cart/change.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            id: variantId,
            quantity: 0
          })
        })
        .then(response => response.json())
        .then(cart => {
          // Update cart counts and totals
          this.updateCartTotals(cart);
          
          // Remove the item from both desktop and mobile DOM
          if (cartItemElement) cartItemElement.remove();
          if (mobileCartItemElement) mobileCartItemElement.remove();
          
          // If cart is empty, show empty cart message
          if (cart.item_count === 0) {
            const warningsElement = document.querySelector('.cart__warnings');
            const contentsElement = document.querySelector('.cart__contents');
            
            if (warningsElement) warningsElement.classList.remove('hidden');
            if (contentsElement) contentsElement.classList.add('is-empty');
          }
        })
        .catch(error => {
          console.error('Error removing item from cart:', error);
          if (cartItemElement) cartItemElement.classList.remove('cart-item--loading');
          if (mobileCartItemElement) mobileCartItemElement.classList.remove('cart-item--loading');
        });
      }
    }
    
    return false;
  }

  updateCartTotals(cart) {
    // Update cart count
    if (cart.item_count === 0) {
      window.location.reload();
      return;
    }
    
    const cartCountElements = document.querySelectorAll('.cart-count-bubble');
    if (cartCountElements.length > 0) {
      cartCountElements.forEach(element => {
        element.textContent = cart.item_count;
      });
    }

    // Calculate total including custom prices
    let cartTotal = 0;
    cart.items.forEach(item => {
      if (item.properties?._custom_price) {
        cartTotal += parseFloat(item.properties._custom_price) * item.quantity;
      } else {
        cartTotal += item.original_price * item.quantity;
      }
    });

    // Update cart total
    const cartTotalElements = document.querySelectorAll('.totals__total-value');
    if (cartTotalElements.length > 0) {
      cartTotalElements.forEach(element => {
        element.innerHTML = this.formatMoney(cartTotal);
      });
    }

    // If cart is empty, show empty state
    if (cart.item_count === 0) {
      const cartContents = document.querySelector('.cart__contents');
      const cartWarnings = document.querySelector('.cart__warnings');
      
      if (cartContents) cartContents.classList.add('is-empty');
      if (cartWarnings) cartWarnings.classList.remove('hidden');
      
      // Update total to zero
      cartTotalElements.forEach(element => {
        element.innerHTML = this.formatMoney(0);
      });
    }
  }

  formatMoney(cents) {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    });
    return formatter.format(cents / 100);
  }
}

customElements.define('cart-remove-button', CartRemoveButton); 