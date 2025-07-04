// Combined Product Scripts - Optimized for Performance
(function() {
  'use strict';

  // Global configuration
  window.productConfig = window.productConfig || {};
  
  // Cache DOM elements
  const DOM = {
    productImage: null,
    variantSelect: null,
    frameOptions: null,
    priceElement: null,
    addToCartButton: null,
    init() {
      this.productImage = document.querySelector('.product__image') || document.getElementById('product-main-image');
      this.variantSelect = document.getElementById('product-select');
      this.frameOptions = document.querySelectorAll('#group-2 .option');
      this.priceElement = document.getElementById('product_price');
      this.addToCartButton = document.getElementById('add_to_cart');
    }
  };

  // Utility functions
  const Utils = {
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    throttle(func, limit) {
      let inThrottle;
      return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },

    preloadImage(src) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    }
  };

  // Tab functionality
  const TabManager = {
    init() {
      const tabs = document.querySelectorAll('.tablinks');
      tabs.forEach(tab => {
        tab.addEventListener('click', this.handleTabClick.bind(this));
      });
      
      // Set first tab as active by default
      if (tabs.length > 0 && !document.querySelector('.tablinks.active')) {
        tabs[0].click();
      }
    },

    handleTabClick(evt) {
      const cityName = evt.target.getAttribute('onclick')?.match(/openCity\(event, '(.+)'\)/)?.[1];
      if (cityName) {
        this.openCity(evt, cityName);
      }
    },

    openCity(evt, cityName) {
      // Hide all tab content
      const tabContent = document.getElementsByClassName('tabcontent');
      for (let i = 0; i < tabContent.length; i++) {
        tabContent[i].classList.remove('active');
      }

      // Remove active class from all tabs
      const tabLinks = document.getElementsByClassName('tablinks');
      for (let i = 0; i < tabLinks.length; i++) {
        tabLinks[i].classList.remove('active');
      }

      // Show selected tab content and add active class
      const targetTab = document.getElementById(cityName);
      if (targetTab) {
        targetTab.classList.add('active');
      }
      if (evt.currentTarget) {
        evt.currentTarget.classList.add('active');
      }

      // Initialize FAQ if FAQ tab is selected
      if (cityName === 'FAQ') {
        setTimeout(() => FAQManager.init(), 100);
      }
    }
  };

  // FAQ functionality
  const FAQManager = {
    init() {
      const faqQuestions = document.querySelectorAll('.faq-question');
      faqQuestions.forEach(question => {
        // Remove existing listeners to prevent duplicates
        const newQuestion = question.cloneNode(true);
        question.parentNode.replaceChild(newQuestion, question);
        
        newQuestion.addEventListener('click', this.handleFAQClick.bind(this));
      });
    },

    handleFAQClick(event) {
      const question = event.currentTarget;
      const answer = question.nextElementSibling;
      const isExpanded = answer.style.display === 'block';

      if (isExpanded) {
        question.classList.remove('active');
        answer.style.display = 'none';
      } else {
        // Close all other questions
        document.querySelectorAll('.faq-question').forEach(q => {
          q.classList.remove('active');
          if (q.nextElementSibling) {
            q.nextElementSibling.style.display = 'none';
          }
        });

        // Open current question
        question.classList.add('active');
        answer.style.display = 'block';
      }
    }
  };

  // Product configuration manager
  const ProductManager = {
    frameConfig: {
      frameType: 1,
      dimensions: 2,
      borderType: 3,
      width: 0,
      height: 0
    },

    init() {
      this.setupEventListeners();
      this.initializeDefaults();
    },

    setupEventListeners() {
      // Frame selection
      document.querySelectorAll('#group-2 .option').forEach(option => {
        option.addEventListener('click', Utils.debounce(this.handleFrameChange.bind(this), 250));
      });

      // Border selection
      document.querySelectorAll('#group-1 .option').forEach(option => {
        option.addEventListener('click', Utils.debounce(this.handleBorderChange.bind(this), 250));
      });

      // Dimension selection
      document.querySelectorAll('#group-0 .option').forEach(option => {
        option.addEventListener('click', Utils.debounce(this.handleDimensionChange.bind(this), 250));
      });
    },

    initializeDefaults() {
      // Set default frame if none selected
      const activeFrame = document.querySelector('#group-2 .option.active');
      if (!activeFrame) {
        const defaultFrame = document.querySelector('#group-2 .option_2-1');
        if (defaultFrame) {
          defaultFrame.click();
        }
      }
    },

    handleFrameChange(event) {
      const option = event.currentTarget;
      this.setActiveOption(option, '#group-2');
      this.updateImageConfiguration();
      this.syncConfiguratorToVariant();
    },

    handleBorderChange(event) {
      const option = event.currentTarget;
      this.setActiveOption(option, '#group-1');
      this.updateImageConfiguration();
    },

    handleDimensionChange(event) {
      const option = event.currentTarget;
      this.setActiveOption(option, '#group-0');
      this.updateImageConfiguration();
      this.updatePriceDisplay(option);
    },

    setActiveOption(option, groupSelector) {
      const group = document.querySelector(groupSelector);
      if (group) {
        group.querySelectorAll('.option').forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
      }
    },

    updateImageConfiguration() {
      const activeFrame = document.querySelector('#group-2 .option.active');
      const activeBorder = document.querySelector('#group-1 .option.active');
      const activeDimension = document.querySelector('#group-0 .option.active');

      if (!activeFrame || !activeBorder || !activeDimension) return;

      const frameType = activeFrame.getAttribute('data-value');
      const borderWidth = activeBorder.getAttribute('data-value');
      const imageScale = activeDimension.getAttribute('data-scale');
      const imageWidth = activeDimension.getAttribute('data-width');
      const imageHeight = activeDimension.getAttribute('data-height');

      this.changeFrameImageConfig(imageScale, imageWidth, imageHeight, borderWidth, frameType);
    },

    changeFrameImageConfig(imageScale, imageWidth, imageHeight, imageBorderWidth, frameType) {
      const frameTypes = ['noframe', 'black', 'maple', 'white'];
      const newFrameType = frameTypes[frameType] || 'black';
      
      let imageType = "landscape";
      if (Number(imageWidth) > Number(imageHeight)) {
        imageType = "landscape";
      } else if (Number(imageWidth) < Number(imageHeight)) {
        imageType = "portrait";
      } else {
        imageType = "square";
      }

      const imageNameSpace = `${imageScale}-${newFrameType}-${imageBorderWidth}`;
      
      if (!window.productConfig.productImages) return;

      let imageUrl = window.productConfig.productImages.find(img => {
        const imgStr = typeof img === 'string' ? img : (img && img.src ? img.src : '');
        return imgStr.includes(imageNameSpace) || 
               (imgStr.includes(imageType) && imgStr.includes(`${newFrameType}-${imageBorderWidth}`));
      });

      if (imageUrl && typeof imageUrl === 'object' && imageUrl.src) {
        imageUrl = imageUrl.src;
      }

      if (imageUrl && DOM.productImage) {
        // Preload image for smooth transition
        Utils.preloadImage(imageUrl).then(() => {
          DOM.productImage.style.opacity = '0.5';
          DOM.productImage.src = imageUrl;
          DOM.productImage.onload = () => {
            DOM.productImage.style.opacity = '1';
          };
        }).catch(() => {
          console.warn('Failed to preload image:', imageUrl);
          DOM.productImage.src = imageUrl;
        });
      }
    },

    updatePriceDisplay(option) {
      const priceElement = option.querySelector('.component_price');
      if (priceElement && DOM.priceElement) {
        const priceDisplay = DOM.priceElement.querySelector('.product_sub_title');
        if (priceDisplay) {
          priceDisplay.textContent = priceElement.textContent;
        }
      }
    },

    syncConfiguratorToVariant() {
      const activeOption = document.querySelector('#group-2 .option.active');
      if (!activeOption || !DOM.variantSelect) return;

      const frameType = activeOption.querySelector('.component_title').textContent.trim().toLowerCase();
      
      let variantName = 'original';
      if (frameType === 'black mat') variantName = 'black';
      else if (frameType === 'maple natural') variantName = 'maple';
      else if (frameType === 'white') variantName = 'white';

      const matchingOption = Array.from(DOM.variantSelect.options).find(
        option => option.getAttribute('data-variant-name') === variantName
      );

      if (matchingOption) {
        DOM.variantSelect.value = matchingOption.value;
        
        const variantInput = document.getElementById('variant-id');
        if (variantInput) {
          variantInput.value = matchingOption.value;
        }

        DOM.variantSelect.dispatchEvent(new Event('change', { bubbles: true }));

        // Update price
        const price = parseFloat(matchingOption.getAttribute('data-price'));
        if (price && DOM.priceElement) {
          const formattedPrice = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(price / 100);

          const priceSpan = DOM.priceElement.querySelector('.price__sale') || 
                          DOM.priceElement.querySelector('.price__regular');
          if (priceSpan) {
            const priceAmount = priceSpan.querySelector('.price-item');
            if (priceAmount) {
              priceAmount.textContent = formattedPrice;
            }
          }
        }
      }
    }
  };

  // Modal functionality
  const ModalManager = {
    isZoomed: false,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    currentTranslateX: 0,
    currentTranslateY: 0,
    dragDistance: 0,

    init() {
      this.setupEventListeners();
    },

    setupEventListeners() {
      document.addEventListener('mousedown', this.handleMouseDown.bind(this));
      document.addEventListener('mousemove', Utils.throttle(this.handleMouseMove.bind(this), 16));
      document.addEventListener('mouseup', this.handleMouseUp.bind(this));
      document.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
      document.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
    },

    openModal() {
      const productImage = DOM.productImage;
      const modal = document.getElementById('imagePreviewModal');

      if (productImage && modal) {
        const imgUrl = productImage.src;
        const modalContent = modal.querySelector('.modal-content');
        
        modalContent.innerHTML = `
          <span class="close-modal" onclick="ModalManager.closeModal()">&times;</span>
          <img src="${imgUrl}" alt="${productImage.alt || 'Product image'}" 
               class="modal-image" loading="lazy" decoding="async"/>
        `;

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
      }
    },

    closeModal() {
      const modal = document.getElementById('imagePreviewModal');
      if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        this.resetZoomState();
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
      }
    },

    resetZoomState() {
      this.isZoomed = false;
      this.isDragging = false;
      this.currentTranslateX = 0;
      this.currentTranslateY = 0;
      this.dragStartX = 0;
      this.dragStartY = 0;
      this.dragDistance = 0;
    },

    handleMouseDown(event) {
      if (event.target.classList.contains('modal-image')) {
        this.dragStartX = event.clientX;
        this.dragStartY = event.clientY;
        this.dragDistance = 0;

        if (this.isZoomed) {
          this.isDragging = true;
          event.target.style.cursor = 'grabbing';
          event.preventDefault();
        }
      }
    },

    handleMouseMove(event) {
      const image = document.querySelector('.modal-image');
      if (!image) return;

      if (this.dragStartX !== 0 || this.dragStartY !== 0) {
        const dx = event.clientX - this.dragStartX;
        const dy = event.clientY - this.dragStartY;
        this.dragDistance = Math.sqrt(dx * dx + dy * dy);
      }

      if (this.isDragging && this.isZoomed) {
        const deltaX = event.clientX - this.dragStartX;
        const deltaY = event.clientY - this.dragStartY;

        const newTranslateX = this.currentTranslateX + deltaX;
        const newTranslateY = this.currentTranslateY + deltaY;

        image.style.transform = `scale(1.5) translate(${newTranslateX / 1.5}px, ${newTranslateY / 1.5}px)`;

        this.dragStartX = event.clientX;
        this.dragStartY = event.clientY;
        this.currentTranslateX = newTranslateX;
        this.currentTranslateY = newTranslateY;
      }
    },

    handleMouseUp(event) {
      const image = document.querySelector('.modal-image');
      if (!image) return;

      if (this.dragDistance < 5) {
        this.isZoomed = !this.isZoomed;

        if (this.isZoomed) {
          image.classList.add('zoomed');
          image.style.transform = 'scale(1.5)';
          image.style.cursor = 'move';
        } else {
          image.classList.remove('zoomed');
          image.style.transform = 'scale(1)';
          image.style.cursor = 'zoom-in';
          this.currentTranslateX = 0;
          this.currentTranslateY = 0;
        }
      }

      this.isDragging = false;
      this.dragStartX = 0;
      this.dragStartY = 0;
      this.dragDistance = 0;

      if (this.isZoomed) {
        image.style.cursor = 'move';
      }
    },

    handleMouseLeave() {
      this.isDragging = false;
      this.dragStartX = 0;
      this.dragStartY = 0;

      const image = document.querySelector('.modal-image');
      if (image && this.isZoomed) {
        image.style.cursor = 'move';
      }
    },

    handleWheel(event) {
      const modalImage = document.querySelector('.modal-image');
      if (modalImage && event.target.closest('.modal-content')) {
        event.preventDefault();

        if (event.deltaY < 0 && !this.isZoomed) {
          this.isZoomed = true;
          modalImage.classList.add('zoomed');
          modalImage.style.transform = 'scale(1.5)';
          modalImage.style.cursor = 'move';
        } else if (event.deltaY > 0 && this.isZoomed) {
          this.isZoomed = false;
          modalImage.classList.remove('zoomed');
          modalImage.style.transform = 'scale(1)';
          modalImage.style.cursor = 'zoom-in';
          this.currentTranslateX = 0;
          this.currentTranslateY = 0;
        }
      }
    },

    handleKeyDown(event) {
      if (event.key === 'Escape') {
        this.closeModal();
      }
    }
  };

  // Add to cart functionality
  const CartManager = {
    init() {
      if (DOM.addToCartButton) {
        DOM.addToCartButton.addEventListener('click', this.handleAddToCart.bind(this));
      }
    },

    handleAddToCart(event) {
      event.preventDefault();
      
      ProductManager.syncConfiguratorToVariant();
      
      const form = DOM.addToCartButton.closest('form');
      if (!form) return;

      // Get configuration data
      const activeFrameOption = document.querySelector('#group-2 .option.active');
      const activeDimensionOption = document.querySelector('#group-0 .option.active');
      const activeBorderOption = document.querySelector('#group-1 .option.active');

      const frameType = activeFrameOption ? 
        activeFrameOption.querySelector('.component_title').textContent.trim() : 'No Frame';
      
      const dimensionWidth = activeDimensionOption ? 
        activeDimensionOption.getAttribute('data-width') : '';
      const dimensionHeight = activeDimensionOption ? 
        activeDimensionOption.getAttribute('data-height') : '';
      const dimensionText = `${dimensionWidth}" x ${dimensionHeight}"`;
      
      const borderType = activeBorderOption ? 
        activeBorderOption.querySelector('.component_title').textContent.trim() : 'no border';

      // Add properties to form
      this.addHiddenInput(form, 'properties[Frame Type]', frameType);
      this.addHiddenInput(form, 'properties[Dimensions]', dimensionText);
      this.addHiddenInput(form, 'properties[Border]', borderType);

      if (DOM.productImage && DOM.productImage.src) {
        this.addHiddenInput(form, 'properties[_variant_image]', DOM.productImage.src);
      }

      // Show loading state
      this.showLoadingState();

      setTimeout(() => {
        form.submit();
      }, 100);
    },

    addHiddenInput(form, name, value) {
      // Remove existing input with same name
      const existing = form.querySelector(`input[name="${name}"]`);
      if (existing) {
        existing.remove();
      }

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      form.appendChild(input);
    },

    showLoadingState() {
      if (DOM.addToCartButton) {
        const originalText = DOM.addToCartButton.innerHTML;
        DOM.addToCartButton.innerHTML = '<span class="spinner"></span> Processing...';
        DOM.addToCartButton.disabled = true;
        DOM.addToCartButton.classList.add('loading');
      }
    }
  };

  // AI Categories functionality
  const AICategories = {
    currentPosition: 0,
    sliding: false,
    touchStartX: 0,
    touchEndX: 0,

    init() {
      this.container = document.getElementById('aiCategories');
      if (!this.container) return;

      this.initializeTouchEvents();
      this.loadCategories();
    },

    initializeTouchEvents() {
      this.container.addEventListener('touchstart', (e) => {
        this.touchStartX = e.touches[0].clientX;
      }, { passive: true });

      this.container.addEventListener('touchmove', (e) => {
        this.touchEndX = e.touches[0].clientX;
      }, { passive: true });

      this.container.addEventListener('touchend', () => {
        const swipeDistance = this.touchStartX - this.touchEndX;
        if (Math.abs(swipeDistance) > 50) {
          if (swipeDistance > 0) {
            this.slide('next');
          } else {
            this.slide('prev');
          }
        }
      });
    },

    async loadCategories() {
      if (!window.productConfig.productTitle) return;

      try {
        const response = await fetch('https://picturefindr.com/api/shopify/ai_collections', {
        // const response = await fetch('http://localhost:5000/api/shopify/ai_collections', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ query: window.productConfig.productTitle }),
        });

        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        if (data.success && data.collections) {
          this.renderCategories(data.collections);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error loading AI categories:', error);
        this.container.innerHTML = '<div class="error-message">Failed to load categories</div>';
      }
    },

    renderCategories(categories) {
      if (!Array.isArray(categories) || categories.length === 0) {
        this.container.innerHTML = '<div class="no-results">No categories found</div>';
        return;
      }

      this.container.innerHTML = `
        <button id="prevButton" class="nav-button prev-button" aria-label="Previous categories">
          <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        </button>
        <div class="categories-slider">
          ${categories.map(category => `
            <div class="category-card" onclick="window.location.href='/search?q=${encodeURIComponent(category)}'">
              <div class="category-title">${category}</div>
            </div>
          `).join('')}
        </div>
        <button id="nextButton" class="nav-button next-button" aria-label="Next categories">
          <svg viewBox="0 0 24 24"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
        </button>
      `;

      this.currentPosition = 0;
      
      document.getElementById('prevButton')?.addEventListener('click', () => this.slide('prev'));
      document.getElementById('nextButton')?.addEventListener('click', () => this.slide('next'));
      
      this.updateNavigationButtons();
      this.observeResize();
    },

    slide(direction) {
      if (this.sliding) return;
      
      const slider = document.querySelector('.categories-slider');
      if (!slider) return;
      
      this.sliding = true;
      const cardWidth = document.querySelector('.category-card')?.offsetWidth + 10;
      const containerWidth = this.container.offsetWidth;
      const sliderWidth = slider.scrollWidth;
      const maxPosition = Math.max(0, Math.ceil((sliderWidth - containerWidth) / cardWidth));
      
      if (direction === 'prev' && this.currentPosition > 0) {
        this.currentPosition--;
      } else if (direction === 'next' && this.currentPosition < maxPosition) {
        this.currentPosition++;
      }

      const offset = -this.currentPosition * cardWidth;
      slider.style.transform = `translateX(${offset}px)`;
      
      this.updateNavigationButtons();
      
      setTimeout(() => {
        this.sliding = false;
      }, 300);
    },

    updateNavigationButtons() {
      const prevButton = document.getElementById('prevButton');
      const nextButton = document.getElementById('nextButton');
      const slider = document.querySelector('.categories-slider');
      
      if (!slider || !prevButton || !nextButton) return;
      
      const containerWidth = this.container.offsetWidth;
      const sliderWidth = slider.scrollWidth;
      const cardWidth = document.querySelector('.category-card')?.offsetWidth + 10;
      const maxPosition = Math.max(0, Math.ceil((sliderWidth - containerWidth) / cardWidth));

      prevButton.disabled = this.currentPosition <= 0;
      nextButton.disabled = this.currentPosition >= maxPosition;
      
      const showNavigation = sliderWidth > containerWidth;
      prevButton.style.display = showNavigation ? 'flex' : 'none';
      nextButton.style.display = showNavigation ? 'flex' : 'none';
    },

    observeResize() {
      const resizeObserver = new ResizeObserver(() => {
        this.updateNavigationButtons();
      });
      resizeObserver.observe(this.container);
    }
  };

  // Main initialization
  function initializeProduct() {
    DOM.init();
    TabManager.init();
    FAQManager.init();
    ProductManager.init();
    ModalManager.init();
    CartManager.init();
    
    // Initialize AI Categories with delay for non-critical loading
    setTimeout(() => {
      AICategories.init();
    }, 1000);
  }

  // Make functions globally available
  window.openCity = TabManager.openCity.bind(TabManager);
  window.openModal = ModalManager.openModal.bind(ModalManager);
  window.closeModal = ModalManager.closeModal.bind(ModalManager);
  window.ModalManager = ModalManager;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeProduct);
  } else {
    initializeProduct();
  }

})(); 