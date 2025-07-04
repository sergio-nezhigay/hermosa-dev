class CategoryFilter extends HTMLElement {
  constructor() {
    super();
    
    // document.addEventListener('click', (e) => {
    //   console.log('Document click detected on:', e.target.tagName, e.target.className);
    // });
    
    this.init();
  }

  init() {
    // Initialize core elements
    this.container = this.querySelector('#aiCategories');
    this.list = this.querySelector('.category-filter__list');
    this.items = this.querySelectorAll('.category-filter__item');
    this.buttons = this.querySelectorAll('.category-filter__button');
    this.prevButton = this.querySelector('.prev-button');
    this.nextButton = this.querySelector('.next-button');

    if (!this.container || !this.list) {
      console.error('Required elements not found');
      return;
    }

    this.initializeSlider();
    this.setupEventListeners();
    this.getHomeCategories();
  }

  initializeSlider() {
    // Add horizontal scrolling styles
    this.list.style.scrollBehavior = 'smooth';
    this.list.style.overflowX = 'auto';
    this.list.style.scrollSnapType = 'x mandatory';
    this.list.style.display = 'flex';
    this.list.style.gap = '1rem';
    this.list.style.padding = '0.5rem';
    
    // Hide scrollbar but keep functionality
    this.list.style.msOverflowStyle = 'none'; // IE and Edge
    this.list.style.scrollbarWidth = 'none'; // Firefox
    this.list.style.webkitOverflowScrolling = 'touch'; // iOS momentum scrolling
    
    // Hide webkit scrollbar
    this.list.style.cssText += `
      &::-webkit-scrollbar {
        display: none;
      }
    `;

    this.list.classList.add('is-initialized');
    
    // Initialize navigation buttons visibility
    this.updateNavigationButtons();
  }

  getHomeCategories() {
    fetch('https://picturefindr.com/api/shopify/ai_collections', {
    // fetch('http://localhost:5000/api/shopify/ai_collections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ query: "home" }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.success && data.collections) {
          console.log("data.collections ============ ", data.collections);
          this.renderCategories(data.collections);
        } else {
          throw new Error('Invalid response format');
        }
      })
      .catch(error => {
        console.error('Error with AI categories:', error);
        this.list.innerHTML = '<div class="error-message">Failed to load categories</div>';
      });
  }

  setupEventListeners() {
    // Click events for category filtering
    this.buttons.forEach(button => {
      button.removeEventListener('click', this.handleCategoryClick);
      button.addEventListener('click', this.handleCategoryClick.bind(this));
    });

    // Add navigation button listeners
    if (this.prevButton && this.nextButton) {
      this.prevButton.addEventListener('click', () => this.navigate('prev'));
      this.nextButton.addEventListener('click', () => this.navigate('next'));
    }

    // Add scroll listener to update button visibility
    this.list.addEventListener('scroll', () => this.updateNavigationButtons());
    
    // Add resize observer to update navigation on window resize
    const resizeObserver = new ResizeObserver(() => {
      this.updateNavigationButtons();
    });
    resizeObserver.observe(this.list);
  }

  renderCategories(categories) {
    if (!Array.isArray(categories) || categories.length === 0) {
      this.list.innerHTML = '<div class="no-results">No categories found</div>';
      return;
    }

    const categoryCards = categories.map(category => `
      <div class="category-filter__item" data-category="${category}">
        <span class="category-filter__button" data-category="${category}">
          <span class="category-filter__text">${category}</span>
        </span>
      </div>
    `).join('');

    this.list.innerHTML = categoryCards;
    
    // Reinitialize buttons after rendering
    this.buttons = this.querySelectorAll('.category-filter__button');
    this.setupEventListeners();
    this.updateNavigationButtons();
  }

  navigate(direction) {
    const scrollAmount = this.list.offsetWidth * 0.8; // Scroll 80% of the visible width
    const currentScroll = this.list.scrollLeft;
    
    const newPosition = direction === 'next' 
      ? currentScroll + scrollAmount 
      : currentScroll - scrollAmount;
    
    this.list.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });
  }

  updateNavigationButtons() {
    if (!this.prevButton || !this.nextButton) return;

    const isAtStart = this.list.scrollLeft <= 0;
    const isAtEnd = Math.abs(
      this.list.scrollLeft + this.list.offsetWidth - this.list.scrollWidth
    ) < 1;

    // Update previous button state
    this.prevButton.disabled = isAtStart;
    this.prevButton.classList.toggle('disabled', isAtStart);
    
    // Update next button state
    this.nextButton.disabled = isAtEnd;
    this.nextButton.classList.toggle('disabled', isAtEnd);
  }

  filterCategory(category) {
    // Remove active class from all buttons
    this.buttons.forEach(btn => btn.classList.remove('is-active'));
    
    // Add active class to clicked button
    const activeButton = Array.from(this.buttons).find(btn => 
      btn.getAttribute('data-category') === category
    );
    if (activeButton) {
      activeButton.classList.add('is-active');
    }
    
    try {
      // Perform search with the category as keyword
      if (category === 'all') {
        window.location.href = '/search';
      } else {
        const searchUrl = '/search?q=' + encodeURIComponent(category);
        window.location.href = searchUrl;
      }
    } catch (error) {
      console.error("Error during category filtering:", error);
    }
  }

  handleCategoryClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const category = event.currentTarget.getAttribute('data-category');
    this.filterCategory(category);
  }
}

if (!customElements.get('category-filter')) {
  customElements.define('category-filter', CategoryFilter);
} else {
  console.log("category-filter already defined");
} 