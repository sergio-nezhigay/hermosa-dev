// Use a class to manage wishlist functionality
class WishlistManager {
  constructor() {
    this.wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    
    // Remove existing listeners before adding new ones
    this.removeEventListeners();
    this.addEventListeners();
    this.initializeWishlistState();
    
    this.initialized = true;
  }

  addEventListeners() {
    document.querySelectorAll('.wishlist-toggle').forEach(button => {
      button.addEventListener('click', (event) => {
        try {
          const productData = JSON.parse(button.getAttribute('data-product'));
          this.toggleWishlist(event, productData);
        } catch (error) {
          console.error('Error parsing product data:', error);
        }
      });
    });

    // Event delegation for remove buttons
    document.addEventListener('click', (event) => {
      const removeButton = event.target.closest('.wishlist-item__remove');
      if (removeButton) {
        const productId = removeButton.closest('.wishlist-item').dataset.productId;
        this.removeFromWishlist(productId);
      }
    });
  }

  removeEventListeners() {
    document.querySelectorAll('.wishlist-toggle').forEach(button => {
      button.replaceWith(button.cloneNode(true));
    });
  }

  toggleWishlist(event, product) {
    if (!product || !product.id) {
      console.error('Invalid product data:', product);
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const button = event.currentTarget;
    const icon = button.querySelector('.icon-heart path');
    this.wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const index = this.wishlist.findIndex(item => item.id === product.id);
    if (index === -1) {
      this.wishlist.push({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.featured_image,
        url: product.handle
      });
      icon.setAttribute('fill', '#FF0000');
    } else {
      this.wishlist.splice(index, 1);
      icon.setAttribute('fill', '#7D7D7D');
    }

    localStorage.setItem('wishlist', JSON.stringify(this.wishlist));
    this.updateWishlistSidebar();
    this.updateWishlistIndicator();
  }

  initializeWishlistState() {
    document.querySelectorAll('.wishlist-toggle').forEach(button => {
      try {
        const productData = JSON.parse(button.getAttribute('data-product'));
        const heartIcon = button.querySelector('.icon-heart path');
        
        if (this.wishlist.some(item => item.id === productData.id)) {
          heartIcon.setAttribute('fill', '#FF0000');
        } else {
          heartIcon.setAttribute('fill', '#7D7D7D');
        }
      } catch (error) {
        console.error('Error initializing wishlist state:', error);
      }
    });
    
    this.updateWishlistSidebar();
    this.updateWishlistIndicator();
  }

  updateWishlistSidebar() {
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const sidebarContent = document.querySelector('.wishlist-sidebar-content');
    
    if (wishlist.length === 0) {
      sidebarContent.innerHTML = '<p>Your wishlist is empty</p>';
      return;
    }
    
    const wishlistHTML = wishlist.map(product => `
      <div class="wishlist-item" data-product-id="${product.id}">
        <a href="/products/${product.url}" class="wishlist-item__link">
          <div class="wishlist-item__image">
            ${product.image ? `<img src="${product.image}" alt="${product.title}">` : ''}
          </div>
          <div class="wishlist-item__info">
            <h3>${product.title}</h3>
            <span>${(product.price / 100).toFixed(2)}</span>
          </div>
        </a>
        <button 
          class="wishlist-item__remove"
          aria-label="Remove from wishlist"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    `).join('');
    
    sidebarContent.innerHTML = wishlistHTML;
  }

  updateWishlistIndicator() {
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const existWishlistElements = document.querySelectorAll('.exist_wishlist');
    
    existWishlistElements.forEach(element => {
      if (wishlist.length > 0) {
        element.style.display = 'block';
      } else {
        element.style.display = 'none';
      }
    });
  }

  removeFromWishlist(productId) {
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const newWishlist = wishlist.filter(item => item.id.toString() !== productId.toString());
    
    // Update heart icon color for the removed product
    document.querySelectorAll('.wishlist-toggle').forEach(button => {
      try {
        const productData = JSON.parse(button.getAttribute('data-product'));
        if (productData.id.toString() === productId.toString()) {
          const heartIcon = button.querySelector('.icon-heart path');
          heartIcon.setAttribute('fill', '#7D7D7D');
        }
      } catch (error) {
        console.error('Error updating heart icon:', error);
      }
    });

    localStorage.setItem('wishlist', JSON.stringify(newWishlist));
    this.updateWishlistSidebar();
    this.updateWishlistIndicator();
  }
}

// Create a single global instance
window.wishlistManager = window.wishlistManager || new WishlistManager();