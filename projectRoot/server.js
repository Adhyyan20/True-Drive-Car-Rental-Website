
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000; 

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data files exist
const CART_FILE = path.join(__dirname, 'cart.json');
const PAYMENT_FILE = path.join(__dirname, 'payments.json');
const BOOKINGS_FILE = path.join(__dirname, 'bookings.json');

if (!fs.existsSync(CART_FILE)) fs.writeFileSync(CART_FILE, JSON.stringify([]));
if (!fs.existsSync(PAYMENT_FILE)) fs.writeFileSync(PAYMENT_FILE, JSON.stringify([]));
if (!fs.existsSync(BOOKINGS_FILE)) fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([]));

// Serve mainindex.html when visiting "/"
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'mainindex.html'));
});

// API Routes
app.get('/cart', (req, res) => {
  const cart = JSON.parse(fs.readFileSync(CART_FILE));
  res.json(cart);
});

app.post('/cart', (req, res) => {
  const cart = JSON.parse(fs.readFileSync(CART_FILE));
  
  // Check if car already exists in cart
  const carExists = cart.some(item => item.carName === req.body.carName);
  
  if (carExists) {
    return res.status(400).json({ message: 'Car already in cart' });
  }
  
  // If car doesn't exist, add it to cart
  cart.push(req.body);
  fs.writeFileSync(CART_FILE, JSON.stringify(cart));
  res.json({ message: 'Car added to cart', cart });
});

// Add route to delete items from cart
app.delete('/cart/:index', (req, res) => {
  const cart = JSON.parse(fs.readFileSync(CART_FILE));
  const index = parseInt(req.params.index);
  
  if (index >= 0 && index < cart.length) {
    cart.splice(index, 1);
    fs.writeFileSync(CART_FILE, JSON.stringify(cart));
    res.json({ message: 'Car removed from cart', cart });
  } else {
    res.status(404).json({ message: 'Item not found in cart' });
  }
});

app.post('/checkout', (req, res) => {
  // Read the current cart
  const cart = JSON.parse(fs.readFileSync(CART_FILE));
  
  // Check if cart is empty
  if (cart.length === 0) {
    return res.status(400).json({ message: 'Cart is empty' });
  }
  
  // Get existing payments and bookings
  let payments = [];
  let bookings = [];
  
  if (fs.existsSync(PAYMENT_FILE)) {
    payments = JSON.parse(fs.readFileSync(PAYMENT_FILE));
  }
  
  if (fs.existsSync(BOOKINGS_FILE)) {
    bookings = JSON.parse(fs.readFileSync(BOOKINGS_FILE));
  }
  
  // Generate a booking ID
  const bookingId = 'TD' + Math.floor(100000 + Math.random() * 900000);
  
  // Get payment details from request
  const discountApplied = req.body.discountApplied || false;
  const paymentMethod = req.body.paymentMethod || 'credit-card';
  
  // IMPORTANT: Use the total amount directly from the request
  // This ensures we use the discounted amount if a coupon was applied
  let totalAmount;
  let originalTotal;
  
  if (req.body.total !== undefined) {
    // If a total is provided in the request, use it as the final amount to charge
    totalAmount = req.body.total;
    
    // Use the provided original total or calculate it
    if (req.body.originalTotal !== undefined) {
      originalTotal = req.body.originalTotal;
    } else if (discountApplied) {
      // If discount applied but no original total provided, estimate it (this is a fallback)
      originalTotal = Math.round(totalAmount / 0.9);
    } else {
      originalTotal = totalAmount;
    }
  } else {
    // If no total provided, calculate from cart items (fallback method)
    originalTotal = 0;
    cart.forEach(carItem => {
      originalTotal += carItem.price || 0;
    });
    
    // Apply discount if needed
    totalAmount = discountApplied ? Math.round(originalTotal * 0.9) : originalTotal;
  }
  
  // Calculate discount amount
  const discountAmount = discountApplied ? (originalTotal - totalAmount) : 0;
  
  // Create payment record with discount information
  const paymentRecord = {
    bookingId,
    amount: totalAmount,
    originalAmount: originalTotal,
    discountApplied,
    discountAmount: discountAmount,
    discountPercentage: discountApplied ? 10 : 0,
    paymentMethod,
    timestamp: new Date().toISOString(),
    status: 'completed'
  };
  
  // Create booking record with discount information
  const bookingRecord = {
    bookingId,
    amount: totalAmount,
    originalAmount: originalTotal,
    discountApplied,
    discountAmount: discountAmount,
    cars: cart,
    timestamp: new Date().toISOString(),
    status: 'confirmed'
  };
  
  // Save records
  payments.push(paymentRecord);
  fs.writeFileSync(PAYMENT_FILE, JSON.stringify(payments));
  
  bookings.push(bookingRecord);
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings));
  
  // Clear cart after payment
  fs.writeFileSync(CART_FILE, JSON.stringify([]));
  
  res.json({ 
    message: 'Payment successful', 
    bookingId,
    amount: totalAmount,
    originalAmount: originalTotal,
    discountApplied,
    discountAmount: discountAmount
  });
});

// Add route to get booking history
app.get('/bookings', (req, res) => {
  const bookings = JSON.parse(fs.readFileSync(BOOKINGS_FILE));
  res.json(bookings);
});

// Add route to get payment history
app.get('/payments', (req, res) => {
  const payments = JSON.parse(fs.readFileSync(PAYMENT_FILE));
  res.json(payments);
});

// Start server

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
