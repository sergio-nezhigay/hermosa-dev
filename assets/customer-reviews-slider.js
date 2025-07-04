class TestimonialsSlider extends HTMLElement {
  constructor() {
    super();
    
    // Add properties for smooth scrolling
    this.dragSpeed = 0;
    this.lastDragTime = 0;
    this.lastDragPosition = 0;
    this.momentum = 0.95; // Momentum factor (0-1)
    this.animationFrame = null;
    
    // Wait for DOM to be ready
    this.init();
  }

  init() {
    // Initialize elements
    this.slider = this.querySelector('[id^="Slider-"]');
    this.sliderItems = this.querySelectorAll('.testimonials-list__item');
    this.prevButton = this.querySelector('button[name="previous"]');
    this.nextButton = this.querySelector('button[name="next"]');
    this.counterCurrent = this.querySelector('.slider-counter--current');
    
    if (!this.slider || this.sliderItems.length === 0) {
      console.warn('Required elements not found');
      return;
    }

    this.currentSlide = 1;
    this.totalSlides = this.sliderItems.length;

    // Mouse drag properties
    this.isDragging = false;
    this.startPos = null;
    this.currentTranslate = 0;
    this.prevTranslate = 0;
    this.lastX = 0;
    this.dragThreshold = 5; // Minimum pixels to consider as drag

    // Initialize slider
    this.initializeSlider();
    this.setupEventListeners();
    this.updateButtonStates();
    this.updateCounter();

    this.paginationContainer = this.querySelector('.slider-pagination-reviews');
    
    if (this.paginationContainer) {
      this.createPaginationDots();
    }
  }

  initializeSlider() {
    // Calculate number of visible slides based on viewport
    let slideWidth;
    if (window.innerWidth >= 1200) {
      slideWidth = 25; // Desktop: 3 slides
    } else if (window.innerWidth >= 990) {
      slideWidth = 33.333; // Desktop: 3 slides
    } else if (window.innerWidth >= 750) {
      slideWidth = 50; // Tablet: 2 slides
    } else {
      slideWidth = 100; // Mobile: 1 slide
    }

    this.sliderItems.forEach(item => {
      item.style.flex = `0 0 ${slideWidth}%`;
      item.style.minWidth = `${slideWidth}%`;
    });

    // Reset scroll position and current slide
    this.slider.scrollLeft = 0;
    this.currentSlide = 1;
    this.updateCounter();

    // Add smooth scrolling behavior to the slider
    this.slider.style.scrollBehavior = 'smooth';
    this.slider.classList.add('is-initialized');
  }

  setupEventListeners() {
    if (this.prevButton) {
      this.prevButton.addEventListener('click', () => this.onPrevButtonClick());
    }
    if (this.nextButton) {
      this.nextButton.addEventListener('click', () => this.onNextButtonClick());
    }

    // Mouse events
    this.slider.addEventListener('mousedown', this.startDragging.bind(this));
    document.addEventListener('mousemove', this.drag.bind(this));
    document.addEventListener('mouseup', this.stopDragging.bind(this));
    document.addEventListener('mouseleave', this.stopDragging.bind(this));

    // Prevent default behaviors
    this.slider.addEventListener('dragstart', e => e.preventDefault());
    this.slider.addEventListener('selectstart', e => e.preventDefault());

    // Touch events for mobile
    this.slider.addEventListener('touchstart', (e) => this.startDragging(e.touches[0]));
    document.addEventListener('touchmove', (e) => this.drag(e.touches[0]));
    document.addEventListener('touchend', () => this.stopDragging());
    document.addEventListener('touchcancel', () => this.stopDragging());

    // Add resize handler with debounce
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => this.initializeSlider(), 250);
    });
  }

  startDragging(e) {
    this.isDragging = true;
    this.startPos = e.clientX || e.pageX;
    this.lastX = this.slider.scrollLeft;
    this.lastDragPosition = this.startPos;
    this.lastDragTime = Date.now();
    this.dragSpeed = 0;
    
    // Cancel any ongoing momentum scrolling
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    this.slider.classList.add('is-dragging');
    this.slider.style.scrollBehavior = 'auto';
  }

  drag(e) {
    if (!this.isDragging) return;

    e.preventDefault?.();
    const currentPosition = e.clientX || e.pageX;
    const currentTime = Date.now();
    const timeDelta = currentTime - this.lastDragTime;
    const dragDelta = this.lastDragPosition - currentPosition;
    
    // Calculate drag speed with smoothing
    if (timeDelta > 0) {
      const newSpeed = dragDelta / timeDelta;
      this.dragSpeed = this.dragSpeed * 0.7 + newSpeed * 0.3;
    }
    
    const sensitivity = 1.5; // Increased sensitivity
    this.slider.scrollLeft = this.lastX + (this.startPos - currentPosition) * sensitivity;

    this.lastDragPosition = currentPosition;
    this.lastDragTime = currentTime;

    // Update current slide based on scroll position
    const slideWidth = this.sliderItems[0].offsetWidth;
    this.currentSlide = Math.round(this.slider.scrollLeft / slideWidth) + 1;
    
    requestAnimationFrame(() => {
      this.updateButtonStates();
      this.updateCounter();
      this.updatePagination();
    });
  }

  stopDragging() {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.slider.classList.remove('is-dragging');

    // Apply momentum scrolling
    const initialSpeed = this.dragSpeed * 100; // Amplify the speed
    let currentSpeed = initialSpeed;

    const animateMomentum = () => {
      if (Math.abs(currentSpeed) > 0.5) {
        this.slider.scrollLeft += currentSpeed;
        currentSpeed *= this.momentum;
        this.animationFrame = requestAnimationFrame(animateMomentum);
        
        // Update current slide and UI during momentum scrolling
        const slideWidth = this.sliderItems[0].offsetWidth;
        this.currentSlide = Math.round(this.slider.scrollLeft / slideWidth) + 1;
        this.updateButtonStates();
        this.updateCounter();
        this.updatePagination();
      } else {
        // Snap to closest slide when momentum ends
        const slideWidth = this.sliderItems[0].offsetWidth;
        const targetSlide = Math.round(this.slider.scrollLeft / slideWidth) + 1;
        
        this.slider.style.scrollBehavior = 'smooth';
        this.goToSlide(targetSlide);
      }
    };

    animateMomentum();
  }

  createPaginationDots() {
    // Clear existing dots
    this.paginationContainer.innerHTML = '';
    
    // Create a dot for each slide
    for (let i = 0; i < this.totalSlides; i++) {
      const dot = document.createElement('span');
      dot.classList.add('pagination-dot');
      if (i === 0) dot.classList.add('active');
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      
      // Add click event listener
      dot.addEventListener('click', () => {
        this.goToSlide(i + 1);
      });
      
      this.paginationContainer.appendChild(dot);
    }
  }

  goToSlide(slideNumber) {
    const slideWidth = this.sliderItems[0].offsetWidth;
    this.currentSlide = Math.min(Math.max(1, slideNumber), this.totalSlides);
    
    this.slider.style.scrollBehavior = 'smooth';
    this.slider.scrollTo({
      left: (this.currentSlide - 1) * slideWidth,
      behavior: 'smooth'
    });
    
    requestAnimationFrame(() => {
      this.updatePagination();
      this.updateButtonStates();
      this.updateCounter();
    });
  }

  updatePagination() {
    if (!this.paginationContainer) return;
    
    const dots = this.paginationContainer.querySelectorAll('.pagination-dot');
    dots.forEach((dot, index) => {
      if (index === this.currentSlide - 1) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  onPrevButtonClick() {
    if (this.currentSlide === 1) return;
    
    const slideWidth = this.sliderItems[0].offsetWidth;
    this.currentSlide = Math.max(1, this.currentSlide - 1);
    
    const scrollPosition = (this.currentSlide - 1) * slideWidth;
    this.slider.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    });
    
    this.updatePagination();
    this.updateButtonStates();
  }

  onNextButtonClick() {
    if (this.currentSlide === this.totalSlides) return;
    
    const slideWidth = this.sliderItems[0].offsetWidth;
    this.currentSlide = Math.min(this.totalSlides, this.currentSlide + 1);
    
    const scrollPosition = (this.currentSlide - 1) * slideWidth;
    this.slider.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    });
    
    this.updatePagination();
    this.updateButtonStates();
  }

  updateCounter() {
    if (this.counterCurrent) {
      this.counterCurrent.textContent = this.currentSlide;
    }
  }

  updateButtonStates() {
    if (this.prevButton) {
      // Disable prev button if we're at the first slide
      if (this.currentSlide === 1) {
        this.prevButton.setAttribute('disabled', 'disabled');
        this.prevButton.style.opacity = '0.5';
        this.prevButton.style.cursor = 'not-allowed';
      } else {
        this.prevButton.removeAttribute('disabled');
        this.prevButton.style.opacity = '1';
        this.prevButton.style.cursor = 'pointer';
      }
    }

    if (this.nextButton) {
      // Disable next button if we're at the last slide
      if (this.currentSlide === this.totalSlides) {
        this.nextButton.setAttribute('disabled', 'disabled');
        this.nextButton.style.opacity = '0.5';
        this.nextButton.style.cursor = 'not-allowed';
      } else {
        this.nextButton.removeAttribute('disabled');
        this.nextButton.style.opacity = '1';
        this.nextButton.style.cursor = 'pointer';
      }
    }
  }
}

// Wait for DOM to be fully loaded
if (customElements.get('testimonials-slider') === undefined) {
  customElements.define('testimonials-slider', TestimonialsSlider);
}