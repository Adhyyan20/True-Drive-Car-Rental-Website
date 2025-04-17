const sr = ScrollReveal({
    distance: '60px',
    duration: 2500,
    delay: 400,
    reset: true
});

sr.reveal('.home .info', { delay: 100, origin: 'bottom' });
sr.reveal('.info .booking-form', { delay: 100, origin: 'right' });
sr.reveal('.about-container .image', { delay: 100, origin: 'left' });
sr.reveal('.about-container .content', { delay: 100, origin: 'right' });
sr.reveal('.services .title', { delay: 100, origin: 'top' });
sr.reveal('.services .container', { delay: 100, origin: 'bottom' });
sr.reveal('.cars-container', { delay: 100, origin: 'left' });
sr.reveal('.contact-aside', { delay: 100, origin: 'bottom' });

document.addEventListener("DOMContentLoaded", function() {
    let couponApplied = false;
    let originalTotal = 0;
    let currentTotal = 0;
    const VALID_COUPON = "CART10"; // Valid coupon code
    
    // Fetch and display cart items
    function fetchCart() {
        fetch('/cart')
            .then(response => response.json())
            .then(cart => {
                const cartList = document.getElementById('cart-list');
                cartList.innerHTML = '';
                originalTotal = 0;
                
                cart.forEach((item, index) => {
                    let li = document.createElement('li');
                    li.textContent = `${item.carName} - Rs.${item.price}/day`;
                    
                    // Add remove button for each item
                    const removeBtn = document.createElement('button');
                    removeBtn.textContent = 'Remove';
                    removeBtn.className = 'remove-btn';
                    removeBtn.onclick = function() {
                        removeFromCart(index);
                    };
                    li.appendChild(removeBtn);
                    
                    cartList.appendChild(li);
                    originalTotal += item.price;
                });
                
                // Update the displayed total
                updateTotal();
            })
            .catch(error => {
                console.error('Error fetching cart:', error);
            });
    }
    
    // Remove item from cart
    function removeFromCart(index) {
        fetch(`/cart/${index}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            fetchCart(); // Refresh cart after removal
        })
        .catch(error => {
            console.error('Error removing from cart:', error);
        });
    }
    
    // Update total amount display
    function updateTotal() {
        const totalElement = document.getElementById('total-amount');
        if (couponApplied) {
            currentTotal = Math.round(originalTotal * 0.9); // 10% discount
            totalElement.textContent = `Total: Rs.${currentTotal} (10% discount applied)`;
        } else {
            currentTotal = originalTotal;
            totalElement.textContent = `Total: Rs.${currentTotal}`;
        }
    }
    
    // Show coupon message
    function showCouponMessage(message, isSuccess) {
        const messageElement = document.getElementById('coupon-message');
        messageElement.textContent = message;
        messageElement.className = isSuccess ? 'success-message' : 'error-message';
        messageElement.style.display = 'block';
    }

    // Check if car already exists in cart
    function isCarInCart(carName) {
        return new Promise((resolve, reject) => {
            fetch('/cart')
                .then(response => response.json())
                .then(cart => {
                    const exists = cart.some(item => item.carName === carName);
                    resolve(exists);
                })
                .catch(error => {
                    console.error('Error checking cart:', error);
                    reject(error);
                });
        });
    }

    // Add to cart when "Add to Cart" button is clicked
    document.querySelectorAll('.cart-btn').forEach(button => {
        button.addEventListener('click', () => {
            const carName = button.dataset.name;
            // Extract price from the tag element
            const priceText = button.closest('.info').querySelector('.tag p').textContent;
            const price = parseInt(priceText.replace(/[^\d]/g, '')); // Extract numeric value
            
            // Check if car already exists in cart before adding
            isCarInCart(carName)
                .then(exists => {
                    if (exists) {
                        alert(`${carName} is already in your cart`);
                    } else {
                        // Add car to cart if it doesn't exist
                        fetch('/cart', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                carName: carName,
                                price: price
                            })
                        })
                        .then(response => response.json())
                        .then(data => {
                            alert(`${carName} added to cart`);
                            fetchCart(); // Refresh cart
                        })
                        .catch(error => {
                            console.error('Error adding to cart:', error);
                        });
                    }
                })
                .catch(error => {
                    console.error('Error checking cart:', error);
                });
        });
    });
    
    // Coupon code functionality
    const couponBtn = document.getElementById('coupon-btn');
    if (couponBtn) {
        couponBtn.addEventListener('click', function() {
            const couponInput = document.getElementById('coupon-input');
            const couponCode = couponInput.value.trim().toUpperCase();
            
            if (couponApplied) {
                showCouponMessage("Coupon already applied", false);
                return;
            }
            
            if (!couponCode) {
                showCouponMessage("Please enter a coupon code", false);
                return;
            }
            
            if (couponCode === VALID_COUPON) {
                couponApplied = true;
                showCouponMessage("Coupon applied! 10% discount", true);
                updateTotal();
                couponInput.disabled = true;
            } else {
                showCouponMessage("Invalid coupon code", false);
            }
        });
    }

    // Checkout functionality
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            // Store the coupon status and total in localStorage for the payment page
            localStorage.setItem('couponApplied', couponApplied);
            localStorage.setItem('orderTotal', currentTotal);
            localStorage.setItem('originalTotal', originalTotal); // Store original total too
            
            // Redirect to payment page
            window.location.href = 'payment.html';
        });
    }

    // Initial cart load
    fetchCart();
});


