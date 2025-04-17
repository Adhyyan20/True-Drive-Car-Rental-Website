

document.addEventListener("DOMContentLoaded", function() {
    // Get order details from localStorage or fetch from server
    fetchOrderDetails();
    
    // Payment method selection
    const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
    const paymentForms = document.querySelectorAll('.payment-details');
    
    paymentMethods.forEach(method => {
        method.addEventListener('change', function() {
            // Hide all payment forms
            paymentForms.forEach(form => {
                form.style.display = 'none';
            });
            
            // Show selected payment form
            const selectedForm = document.getElementById(`${this.value}-form`);
            if (selectedForm) {
                selectedForm.style.display = 'block';
            }
        });
    });
    
    // Card number formatting (add spaces)
    const cardNumberInputs = document.querySelectorAll('#card-number, #debit-card-number');
    cardNumberInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            // Remove non-digit characters
            let value = this.value.replace(/\D/g, '');
            
            // Add space after every 4 digits
            let formattedValue = '';
            for (let i = 0; i < value.length; i++) {
                if (i > 0 && i % 4 === 0) {
                    formattedValue += ' ';
                }
                formattedValue += value[i];
            }
            
            this.value = formattedValue;
        });
    });
    
    // Expiry date formatting
    const expiryDateInputs = document.querySelectorAll('#expiry-date, #debit-expiry-date');
    expiryDateInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            // Remove non-digit characters
            let value = this.value.replace(/\D/g, '');
            
            // Format as MM/YY
            if (value.length > 2) {
                this.value = value.substring(0, 2) + '/' + value.substring(2, 4);
            } else {
                this.value = value;
            }
        });
    });
    
    // Form submissions
    const paymentForm = document.getElementById('payment-form');
    const debitPaymentForm = document.getElementById('debit-payment-form');
    const upiPaymentForm = document.getElementById('upi-payment-form');
    const netBankingForm = document.getElementById('net-banking-form');
    
    [paymentForm, debitPaymentForm, upiPaymentForm, netBankingForm].forEach(form => {
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Show loading state
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Processing...';
                submitBtn.disabled = true;
                
                // Simulate payment processing
                setTimeout(() => {
                    processPayment();
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }, 2000);
            });
        }
    });
    
    // Close modal
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            const modal = document.getElementById('payment-success-modal');
            modal.style.display = 'none';
        });
    }
    
    // Back to home button
    const backToHomeBtn = document.getElementById('back-to-home');
    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', function() {
            window.location.href = 'mainindex.html';
        });
    }
    
    // When clicked outside modal
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('payment-success-modal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Add coupon handling for additional discounts
    const couponForm = document.getElementById('coupon-form');
    if (couponForm) {
        couponForm.addEventListener('submit', function(e) {
            e.preventDefault();
            applyCoupon();
        });
    }
});

// Apply coupon function
function applyCoupon() {
    const couponInput = document.getElementById('coupon-code');
    const couponFeedback = document.getElementById('coupon-feedback');
    
    if (!couponInput || !couponFeedback) return;
    
    const couponCode = couponInput.value.trim();
    
    // Example coupon code: DISCOUNT10 for 10% off
    if (couponCode === 'DISCOUNT10') {
        // Get current amount which might already be discounted from the cart page
        const currentTotal = parseFloat(localStorage.getItem('orderTotal')) || 0;
        const isAlreadyDiscounted = localStorage.getItem('couponApplied') === 'true';
        
        // If already discounted from cart page, don't apply another discount
        if (isAlreadyDiscounted) {
            couponFeedback.textContent = 'A discount has already been applied from the cart page.';
            couponFeedback.style.color = 'orange';
            return;
        }

        const discountedAmount = Math.round(currentTotal * 0.9); // 10% discount
        
        // Store both original and discounted amount
        localStorage.setItem('originalTotal', currentTotal); // This might overwrite the cart original total
        localStorage.setItem('orderTotal', discountedAmount);
        localStorage.setItem('discountApplied', 'true');
        
        // Update UI
        updateOrderSummary(currentTotal, discountedAmount);
        
        couponFeedback.textContent = 'Coupon applied successfully! 10% discount applied.';
        couponFeedback.style.color = 'green';
    } else {
        couponFeedback.textContent = 'Invalid coupon code.';
        couponFeedback.style.color = 'red';
    }
}

// Update order summary with discount information
function updateOrderSummary(originalAmount, discountedAmount) {
    const orderTotalAmount = document.getElementById('order-total-amount');
    const discountInfoContainer = document.getElementById('discount-info');
    
    if (!orderTotalAmount) return;
    
    // Display discounted amount
    orderTotalAmount.textContent = `Rs.${discountedAmount}`;
    
    // Show discount information
    if (discountInfoContainer) {
        const discountAmount = originalAmount - discountedAmount;
        discountInfoContainer.innerHTML = `
            <div class="discount-info">
                <div class="original-price">Original Price: Rs.${originalAmount}</div>
                <div class="discount-amount">Discount: Rs.${discountAmount}</div>
            </div>
        `;
        discountInfoContainer.style.display = 'block';
    }
}

// Fetch order details from server
function fetchOrderDetails() {
    // Check if we have discount information from cart page
    const couponAppliedFromCart = localStorage.getItem('couponApplied') === 'true';
    const originalTotalFromCart = parseFloat(localStorage.getItem('originalTotal')) || 0;
    const discountedTotalFromCart = parseFloat(localStorage.getItem('orderTotal')) || 0;
    
    fetch('/cart')
        .then(response => response.json())
        .then(cart => {
            displayOrderItems(cart, couponAppliedFromCart, originalTotalFromCart, discountedTotalFromCart);
        })
        .catch(error => {
            console.error('Error fetching cart:', error);
            // Fallback to sample data if fetch fails
            const sampleCart = [
                { carName: "Toyota GR86", price: 5000 },
                { carName: "Mahindra Thar", price: 5000 }
            ];
            displayOrderItems(sampleCart, couponAppliedFromCart, originalTotalFromCart, discountedTotalFromCart);
        });
}

// Display order items in the summary
function displayOrderItems(items, couponApplied, originalTotal, discountedTotal) {
    const orderItemsContainer = document.getElementById('order-items');
    const orderTotalAmount = document.getElementById('order-total-amount');
    const discountInfoContainer = document.getElementById('discount-info');
    
    if (!orderItemsContainer || !orderTotalAmount) return;
    
    orderItemsContainer.innerHTML = '';
    let calculatedTotal = 0;
    
    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'order-item';
        itemElement.innerHTML = `
            <div class="item-name">${item.carName}</div>
            <div class="item-price">Rs.${item.price}/day</div>
        `;
        orderItemsContainer.appendChild(itemElement);
        calculatedTotal += item.price;
    });
    
    // Use discount information from cart if available
    if (couponApplied && discountedTotal > 0) {
        // Use the values passed from the cart page
        orderTotalAmount.textContent = `Rs.${discountedTotal}`;
        
        if (discountInfoContainer) {
            const discountAmount = originalTotal - discountedTotal;
            discountInfoContainer.innerHTML = `
                <div class="discount-info">
                    <div class="original-price">Original Price: Rs.${originalTotal}</div>
                    <div class="discount-amount">Discount: Rs.${discountAmount}</div>
                </div>
            `;
            discountInfoContainer.style.display = 'block';
        }
    } else {
        // No discount applied yet, use calculated total
        orderTotalAmount.textContent = `Rs.${calculatedTotal}`;
        localStorage.setItem('orderTotal', calculatedTotal);
        localStorage.setItem('originalTotal', calculatedTotal);
        localStorage.setItem('couponApplied', 'false');
        
        // Clear discount info if exists
        if (discountInfoContainer) {
            discountInfoContainer.innerHTML = '';
            discountInfoContainer.style.display = 'none';
        }
    }
}

// Process payment
function processPayment() {
    const totalAmount = parseInt(localStorage.getItem('orderTotal')) || 0;
    const discountApplied = localStorage.getItem('couponApplied') === 'true';
    const originalTotal = parseInt(localStorage.getItem('originalTotal')) || totalAmount;
    
    // Send payment data to server
    fetch('/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            total: totalAmount,
            discountApplied: discountApplied,
            paymentMethod: getSelectedPaymentMethod(),
            originalTotal: originalTotal
        })
    })
    .then(response => response.json())
    .then(data => {
        showPaymentSuccessModal(totalAmount, discountApplied, originalTotal);
    })
    .catch(error => {
        console.error('Error processing payment:', error);
        // Show success modal anyway for demo purposes
        showPaymentSuccessModal(totalAmount, discountApplied, originalTotal);
    });
}

// Get selected payment method
function getSelectedPaymentMethod() {
    const selectedMethod = document.querySelector('input[name="payment-method"]:checked');
    return selectedMethod ? selectedMethod.value : 'credit-card';
}

// Show payment success modal
function showPaymentSuccessModal(amount, discountApplied, originalAmount) {
    const modal = document.getElementById('payment-success-modal');
    const bookingIdElement = document.getElementById('booking-id');
    const amountPaidElement = document.getElementById('amount-paid');
    const discountInfoElement = document.getElementById('receipt-discount-info');
    
    // Generate a random booking ID
    const bookingId = 'TD' + Math.floor(100000 + Math.random() * 900000);
    
    bookingIdElement.textContent = bookingId;
    amountPaidElement.textContent = `Rs.${amount}`;
    
    // Add discount information to receipt if applicable
    if (discountApplied && discountInfoElement) {
        const discountAmount = originalAmount - amount;
        
        discountInfoElement.innerHTML = `
            <div class="discount-details">
                <p>Original Amount: Rs.${originalAmount}</p>
                <p>Discount Applied: Rs.${discountAmount}</p>
            </div>
        `;
        discountInfoElement.style.display = 'block';
    } else if (discountInfoElement) {
        discountInfoElement.innerHTML = '';
        discountInfoElement.style.display = 'none';
    }
    
    modal.style.display = 'block';
    
    // Clear localStorage
    localStorage.removeItem('orderTotal');
    localStorage.removeItem('couponApplied');
    localStorage.removeItem('originalTotal');
    localStorage.removeItem('discountApplied');
}