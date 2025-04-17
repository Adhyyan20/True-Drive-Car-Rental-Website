// TOGGLE SIDEBAR
const menuBtn = document.querySelector(".menu-btn");
const sidebar = document.querySelector(".sidebar");

menuBtn.addEventListener("click", function () {
  sidebar.classList.toggle("hide");
});

// SWITCH MODE
const switchMode = document.getElementById("switch-mode");

switchMode.addEventListener("change", function () {
  if (this.checked) {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
});

// Function to format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN');
}

// Function to fetch and display bookings data
async function loadBookings() {
  try {
    const response = await fetch('/bookings');
    const bookings = await response.json();
    
    // Sort bookings by timestamp (newest first)
    bookings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Get the bookings table body
    const bookingsTable = document.querySelector('.order table tbody');
    bookingsTable.innerHTML = ''; // Clear existing rows
    
    // Display up to 5 most recent bookings
    const recentBookings = bookings.slice(0, 5);
    
    if (recentBookings.length === 0) {
      // If no bookings, show a message
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `
        <td colspan="5" style="text-align: center;">No bookings found</td>
      `;
      bookingsTable.appendChild(emptyRow);
    } else {
      // Populate table with bookings data
      recentBookings.forEach(booking => {
        const bookingDate = new Date(booking.timestamp);
        
        // For each car in the booking
        booking.cars.forEach(car => {
          const row = document.createElement('tr');
          
          // Create unique customer ID from booking ID
          const customerId = booking.bookingId.substring(2, 6);
          
          row.innerHTML = `
            <td>
              <img src="./images/profile.png" alt="Customer" />
              <p>Customer ${customerId}</p>
            </td>
            <td>${car.carName}</td>
            <td>${formatDate(booking.timestamp)}</td>
            <td>${formatDate(new Date(bookingDate.getTime() + 3*24*60*60*1000))}</td>
            <td>
              <span class="status ${booking.status === 'confirmed' ? 'active' : (booking.status === 'completed' ? 'completed' : 'pending')}">
                ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </td>
          `;
          bookingsTable.appendChild(row);
        });
      });
    }
    
    // Update booking count in info box
    const activeBookingsCount = bookings.filter(booking => booking.status === 'confirmed').length;
    document.querySelector('.box-info li:first-child .text h3').textContent = activeBookingsCount;
    
    // Update customer count (unique booking IDs as a simple metric)
    const uniqueCustomers = new Set(bookings.map(booking => booking.bookingId.substring(2, 6))).size;
    document.querySelector('.box-info li:nth-child(2) .text h3').textContent = uniqueCustomers + 587; // Base + new customers
    
    // Update revenue (sum of all booking amounts)
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.amount, 0);
    document.querySelector('.box-info li:last-child .text h3').textContent = '₹' + totalRevenue.toLocaleString('en-IN');
    
  } catch (error) {
    console.error('Error loading bookings:', error);
  }
}

// Function to fetch and analyze vehicle inventory from bookings
async function loadVehicleStatus() {
  try {
    const response = await fetch('/bookings');
    const bookings = await response.json();
    
    // Get vehicle status list
    const vehicleList = document.querySelector('.vehicle-list');
    vehicleList.innerHTML = ''; // Clear existing items
    
    // Extract all cars from bookings
    const bookingCars = [];
    bookings.forEach(booking => {
      booking.cars.forEach(car => {
        bookingCars.push(car.carName);
      });
    });
    
    // Count occurrences of each car
    const carCounts = {};
    bookingCars.forEach(car => {
      carCounts[car] = (carCounts[car] || 0) + 1;
    });
    
    // List of all available cars with 3 units each
    const allCars = [
      { name: 'Toyota GR86', totalUnits: 3 },
      { name: 'Mahindra Thar', totalUnits: 3 },
      { name: 'Mercedes AMG S63', totalUnits: 3 },
      { name: 'Audi A3', totalUnits: 3 },
      { name: 'Range Rover', totalUnits: 3 },
      { name: 'BMW X5', totalUnits: 3 },
      { name: 'Mercedes-Benz G350', totalUnits: 3 },
      { name: 'Mercedes-Benz C63', totalUnits: 3 },
      { name: 'Chevrolet C8 ZR1', totalUnits: 3 }
    ];
    
    // Create vehicle status items
    allCars.forEach(car => {
      const booked = carCounts[car.name] || 0;
      const available = car.totalUnits - booked;
      
      let statusClass = 'available';
      if (available === 0) statusClass = 'unavailable';
      else if (available === 1) statusClass = 'low-stock';
      
      const li = document.createElement('li');
      li.className = statusClass;
      li.setAttribute('data-car', car.name);
      li.setAttribute('data-total', car.totalUnits);
      li.setAttribute('data-available', available);
      
      li.innerHTML = `
        <p>${car.name} (${available} units available)</p>
        <div class="vehicle-actions">
          <i class="fas fa-edit"></i>
          <i class="fas fa-ellipsis-vertical"></i>
        </div>
      `;
      
      vehicleList.appendChild(li);
    });
    
    // Add event listener for the edit icon
    document.querySelectorAll('.vehicle-list li .fa-edit').forEach(editBtn => {
      editBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const li = this.closest('li');
        const carName = li.getAttribute('data-car');
        const totalUnits = li.getAttribute('data-total');
        const availableUnits = li.getAttribute('data-available');
        
        showEditVehicleModal(carName, totalUnits, availableUnits);
      });
    });
    
    // Add event listener for the ellipsis icon (options menu)
    document.querySelectorAll('.vehicle-list li .fa-ellipsis-vertical').forEach(menuBtn => {
      menuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const li = this.closest('li');
        const carName = li.getAttribute('data-car');
        
        showVehicleOptionsMenu(this, carName);
      });
    });
    
  } catch (error) {
    console.error('Error loading vehicle status:', error);
  }
}

// Function to show vehicle edit modal
function showEditVehicleModal(carName, totalUnits, availableUnits) {
  // Create modal container
  const modal = document.createElement('div');
  modal.className = 'edit-vehicle-modal';
  
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-btn">&times;</span>
      <h2>Edit Vehicle</h2>
      <form id="edit-vehicle-form">
        <div class="form-group">
          <label for="car-name">Vehicle Name:</label>
          <input type="text" id="car-name" value="${carName}" readonly>
        </div>
        <div class="form-group">
          <label for="total-units">Total Units:</label>
          <input type="number" id="total-units" value="${totalUnits}" min="1">
        </div>
        <div class="form-group">
          <label for="available-units">Available Units:</label>
          <input type="number" id="available-units" value="${availableUnits}" min="0" max="${totalUnits}">
        </div>
        <div class="form-group">
          <label for="maintenance-status">Maintenance Status:</label>
          <select id="maintenance-status">
            <option value="available">Available</option>
            <option value="maintenance">Under Maintenance</option>
          </select>
        </div>
        <div class="form-group">
          <button type="submit" class="save-btn">Save Changes</button>
          <button type="button" class="cancel-btn">Cancel</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add event listeners
  modal.querySelector('.close-btn').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  modal.querySelector('.cancel-btn').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  modal.querySelector('#edit-vehicle-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const newTotalUnits = document.getElementById('total-units').value;
    const newAvailableUnits = document.getElementById('available-units').value;
    const maintenanceStatus = document.getElementById('maintenance-status').value;
    
    // In a real application, this would send data to the server
    // For now, we'll just update the UI
    const vehicleItem = document.querySelector(`.vehicle-list li[data-car="${carName}"]`);
    
    if (vehicleItem) {
      vehicleItem.setAttribute('data-total', newTotalUnits);
      vehicleItem.setAttribute('data-available', newAvailableUnits);
      
      let statusClass = 'available';
      if (maintenanceStatus === 'maintenance') {
        statusClass = 'maintenance';
      } else if (newAvailableUnits == 0) {
        statusClass = 'unavailable';
      } else if (newAvailableUnits == 1) {
        statusClass = 'low-stock';
      }
      
      vehicleItem.className = statusClass;
      vehicleItem.querySelector('p').textContent = `${carName} (${newAvailableUnits} units available)`;
    }
    
    // Close modal
    document.body.removeChild(modal);
    
    // Show success message
    showNotification(`Vehicle ${carName} updated successfully`);
  });
}

// Function to show vehicle options menu
function showVehicleOptionsMenu(element, carName) {
  // Remove any existing options menu
  const existingMenu = document.querySelector('.vehicle-options-menu');
  if (existingMenu) {
    document.body.removeChild(existingMenu);
  }
  
  // Create options menu
  const optionsMenu = document.createElement('div');
  optionsMenu.className = 'vehicle-options-menu';
  
  // Get position of the element
  const rect = element.getBoundingClientRect();
  
  optionsMenu.style.top = `${rect.bottom + window.scrollY}px`;
  optionsMenu.style.left = `${rect.left + window.scrollX}px`;
  
  optionsMenu.innerHTML = `
    <ul>
      <li data-action="edit">Edit Vehicle</li>
      <li data-action="delete">Remove Vehicle</li>
      <li data-action="maintenance">Mark as Maintenance</li>
      <li data-action="available">Mark as Available</li>
    </ul>
  `;
  
  document.body.appendChild(optionsMenu);
  
  // Add event listeners for menu items
  optionsMenu.querySelector('[data-action="edit"]').addEventListener('click', () => {
    const li = element.closest('li');
    const totalUnits = li.getAttribute('data-total');
    const availableUnits = li.getAttribute('data-available');
    
    showEditVehicleModal(carName, totalUnits, availableUnits);
    document.body.removeChild(optionsMenu);
  });
  
  optionsMenu.querySelector('[data-action="delete"]').addEventListener('click', () => {
    if (confirm(`Are you sure you want to remove ${carName} from the inventory?`)) {
      // In a real application, this would send a request to the server
      // For now, just remove from UI
      const vehicleItem = element.closest('li');
      vehicleItem.remove();
      showNotification(`Vehicle ${carName} removed from inventory`);
    }
    document.body.removeChild(optionsMenu);
  });
  
  optionsMenu.querySelector('[data-action="maintenance"]').addEventListener('click', () => {
    const vehicleItem = element.closest('li');
    vehicleItem.className = 'maintenance';
    vehicleItem.querySelector('p').textContent = `${carName} (Under maintenance)`;
    showNotification(`${carName} marked as under maintenance`);
    document.body.removeChild(optionsMenu);
  });
  
  optionsMenu.querySelector('[data-action="available"]').addEventListener('click', () => {
    const vehicleItem = element.closest('li');
    const availableUnits = vehicleItem.getAttribute('data-available');
    
    let statusClass = 'available';
    if (availableUnits == 0) statusClass = 'unavailable';
    else if (availableUnits == 1) statusClass = 'low-stock';
    
    vehicleItem.className = statusClass;
    vehicleItem.querySelector('p').textContent = `${carName} (${availableUnits} units available)`;
    showNotification(`${carName} marked as available`);
    document.body.removeChild(optionsMenu);
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', function closeMenu(e) {
    if (!optionsMenu.contains(e.target) && e.target !== element) {
      if (document.body.contains(optionsMenu)) {
        document.body.removeChild(optionsMenu);
      }
      document.removeEventListener('click', closeMenu);
    }
  });
}

// Function to add a new vehicle
function showAddVehicleModal() {
  // Create modal container
  const modal = document.createElement('div');
  modal.className = 'edit-vehicle-modal';
  
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-btn">&times;</span>
      <h2>Add New Vehicle</h2>
      <form id="add-vehicle-form">
        <div class="form-group">
          <label for="car-name">Vehicle Name:</label>
          <input type="text" id="car-name" required>
        </div>
        <div class="form-group">
          <label for="total-units">Total Units:</label>
          <input type="number" id="total-units" value="3" min="1" required>
        </div>
        <div class="form-group">
          <label for="price-per-day">Price Per Day (₹):</label>
          <input type="number" id="price-per-day" value="5000" min="1000" required>
        </div>
        <div class="form-group">
          <label for="transmission">Transmission:</label>
          <select id="transmission" required>
            <option value="Manual">Manual</option>
            <option value="Automatic">Automatic</option>
          </select>
        </div>
        <div class="form-group">
          <label for="year">Year:</label>
          <input type="number" id="year" value="2024" min="2000" max="2025" required>
        </div>
        <div class="form-group">
          <button type="submit" class="save-btn">Add Vehicle</button>
          <button type="button" class="cancel-btn">Cancel</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add event listeners
  modal.querySelector('.close-btn').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  modal.querySelector('.cancel-btn').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  modal.querySelector('#add-vehicle-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const carName = document.getElementById('car-name').value;
    const totalUnits = document.getElementById('total-units').value;
    const pricePerDay = document.getElementById('price-per-day').value;
    const transmission = document.getElementById('transmission').value;
    const year = document.getElementById('year').value;
    
    // In a real application, this would send data to the server
    // For now, we'll just update the UI
    const vehicleList = document.querySelector('.vehicle-list');
    
    const li = document.createElement('li');
    li.className = 'available';
    li.setAttribute('data-car', carName);
    li.setAttribute('data-total', totalUnits);
    li.setAttribute('data-available', totalUnits);
    
    li.innerHTML = `
      <p>${carName} (${totalUnits} units available)</p>
      <div class="vehicle-actions">
        <i class="fas fa-edit"></i>
        <i class="fas fa-ellipsis-vertical"></i>
      </div>
    `;
    
    vehicleList.appendChild(li);
    
    // Add event listeners to new vehicle
    li.querySelector('.fa-edit').addEventListener('click', function(e) {
      e.stopPropagation();
      showEditVehicleModal(carName, totalUnits, totalUnits);
    });
    
    li.querySelector('.fa-ellipsis-vertical').addEventListener('click', function(e) {
      e.stopPropagation();
      showVehicleOptionsMenu(this, carName);
    });
    
    // Close modal
    document.body.removeChild(modal);
    
    // Show success message
    showNotification(`New vehicle ${carName} added to inventory`);
  });
}

// Function to show notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'admin-notification';
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Remove notification after 3 seconds
  setTimeout(() => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  }, 3000);
}

// Add event listener to the "Add Vehicle" button (plus icon)
document.addEventListener('DOMContentLoaded', function() {
  const addVehicleBtn = document.querySelector('.vehicles .head .fa-plus');
  
  // If the button doesn't exist, create it
  if (!addVehicleBtn) {
    const vehiclesHead = document.querySelector('.vehicles .head');
    const addButton = document.createElement('i');
    addButton.className = 'fas fa-plus';
    vehiclesHead.appendChild(addButton);
    
    addButton.addEventListener('click', function() {
      showAddVehicleModal();
    });
  } else {
    addVehicleBtn.addEventListener('click', function() {
      showAddVehicleModal();
    });
  }
  
  // Add event listener for the download report button
  document.getElementById('download-report').addEventListener('click', function(e) {
    e.preventDefault();
    generateReport();
  });
});

// Function to generate and download a report
function generateReport() {
  try {
    const reportDate = new Date().toLocaleDateString('en-IN');
    const activeBookings = document.querySelector('.box-info li:first-child .text h3').textContent;
    const totalCustomers = document.querySelector('.box-info li:nth-child(2) .text h3').textContent;
    const revenue = document.querySelector('.box-info li:last-child .text h3').textContent;
    
    let reportContent = `True Drive Admin Report - ${reportDate}\n\n`;
    reportContent += `Active Bookings: ${activeBookings}\n`;
    reportContent += `Total Customers: ${totalCustomers}\n`;
    reportContent += `Monthly Revenue: ${revenue}\n\n`;
    
    reportContent += "Vehicle Inventory Status:\n";
    const vehicles = document.querySelectorAll('.vehicle-list li');
    vehicles.forEach(vehicle => {
      const name = vehicle.getAttribute('data-car');
      const total = vehicle.getAttribute('data-total');
      const available = vehicle.getAttribute('data-available');
      const status = vehicle.className;
      
      reportContent += `- ${name}: ${available}/${total} units available (${status})\n`;
    });
    
    reportContent += "\nRecent Bookings:\n";
    const bookingRows = document.querySelectorAll('.order table tbody tr');
    if (bookingRows.length > 0 && !bookingRows[0].querySelector('td[colspan="5"]')) {
      bookingRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 5) {
          const customer = cells[0].querySelector('p').textContent;
          const vehicle = cells[1].textContent;
          const pickupDate = cells[2].textContent;
          const returnDate = cells[3].textContent;
          const status = cells[4].querySelector('.status').textContent;
          
          reportContent += `- ${customer} | ${vehicle} | ${pickupDate} to ${returnDate} | ${status}\n`;
        }
      });
    } else {
      reportContent += "- No recent bookings\n";
    }
    
    // Create blob and download
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TrueDrive_Report_${reportDate.replace(/\//g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Report downloaded successfully');
    
  } catch (error) {
    console.error('Error generating report:', error);
    showNotification('Error generating report');
  }
}

// Load data when page loads
window.addEventListener('load', function() {
  loadBookings();
  loadVehicleStatus();
  
  // Refresh data every 30 seconds
  setInterval(() => {
    loadBookings();
    loadVehicleStatus();
  }, 30000);
});