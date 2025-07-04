document.addEventListener('DOMContentLoaded', function() {
  // Function to display framed images from localStorage
  function displayFramedImages() {
    // Find all cart items
    const cartItems = document.querySelectorAll('.cart-item'); // Adjust selector based on your theme
    cartItems.forEach(item => {
      // Get the product ID from the cart item
      // This might need adjustment based on how your cart items are structured
      const productId = item.getAttribute('data-product-id');
      if (!productId) return;
      
      // Look for framed image in localStorage
      const framedImageKey = `framed_image_${productId}`;
      const framedImageData = localStorage.getItem(framedImageKey);
      
      // if (framedImageData) {
      //   // Find the image container in this cart item
      //   const imageContainer = item.querySelector('.cart-item__image-container'); // Adjust selector
        
      //   if (imageContainer) {
      //     // Create an image element with the base64 data
      //     const img = document.createElement('img');
      //     img.src = framedImageData;
      //     img.classList.add('cart-item__image');
      //     img.style.maxWidth = '100%';
          
      //     // Replace the existing image or append to container
      //     imageContainer.innerHTML = ''; // Clear existing content
      //     imageContainer.appendChild(img);
      //   }
      // }
    });
  }
  
  // Call the function when the page loads
  displayFramedImages();
  
  // Also call it when the cart updates (if your theme has such events)
  document.addEventListener('cart:updated', displayFramedImages);
}); 