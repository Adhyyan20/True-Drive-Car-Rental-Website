// Registration Functionality
if (document.getElementById('registration-form')) {
    document.getElementById('registration-form').addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent form from submitting

        let name = document.querySelectorAll('.login__input')[0].value;
        let lastName = document.querySelectorAll('.login__input')[1].value;
        let email = document.querySelectorAll('.login__input')[2].value;
        let password = document.querySelectorAll('.login__input')[3].value;
        let confirmPassword = document.querySelectorAll('.login__input')[4].value;

        // Check if passwords match
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        // Get existing users from localStorage or initialize empty array
        let users = JSON.parse(localStorage.getItem('users')) || [];

        // Check if user with the same email already exists
        let userExists = users.some(user => user.email === email);
        if (userExists) {
            alert("User with this email already exists!");
            return;
        }

        // Store new user data in localStorage
        users.push({
            name: name,
            lastName: lastName,
            email: email,
            password: password
        });
        localStorage.setItem('users', JSON.stringify(users));

        alert("Registration successful!");
        // Reset the form
        document.querySelector('.login__form').reset();
    });
}

// Login Functionality
if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent form from submitting

        let email = document.querySelectorAll('.login__input')[0].value;
        let password = document.querySelectorAll('.login__input')[1].value;

        // Retrieve stored users from localStorage
        let users = JSON.parse(localStorage.getItem('users')) || [];

        // Check if user exists and credentials match
        let user = users.find(user => user.email === email && user.password === password);
        if (user) {
            alert("Login successful!");
        } else {
            alert("Incorrect email or password.");
        }
    });
}

