A fully functional multi-actors e-commerce web application built entirely with HTML, CSS, and JavaScript, with no backend or database.
All data (products, cart, users, and orders) is stored and managed in the browser’s localStorage, making it lightweight and easy to run locally.

Key Features

Multi-role simulation:

Admin: Manage products, categories, and orders.

Vendor: Add, edit, and delete their products.

Customer: Browse products, add to cart, and checkout.

Fully responsive UI.

Dynamic product slider (Swiper.js).

Product quick view modal.

Persistent cart using localStorage (cart remains after reload).

Checkout page with:

Billing details form.

Promo code validation.

Delivery & payment method selection.

Order confirmation screen.

Order tracking in customer dashboard.

SweetAlert integration for stylish alerts.

How It Works (LocalStorage Usage)

Products are loaded from a JSON file or hardcoded array.

Cart items are saved in localStorage and restored on reload.

Orders are stored in localStorage for each customer.

User sessions are simulated with localStorage values.

Vendor & Admin changes update localStorage instantly without a database.

Tech Stack

Frontend: HTML, CSS, JavaScript.

Libraries: Swiper.js, SweetAlert , chart.js.

Storage: Browser LocalStorage API.
