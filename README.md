# 🍔 BlitzBite

BlitzBite is a full-stack food delivery platform built to connect customers, restaurant owners, and delivery partners in a single ecosystem.

Users can browse restaurants, place orders, make online payments, and track deliveries in real time, while restaurant owners can manage menus and orders through a dedicated dashboard.

---

## 🚀 Features

### 👤 Customer Features

* User Authentication (JWT)
* Browse Restaurants
* Search Food & Restaurants
* Add to Cart
* Checkout & Payments
* Order History
* Real-Time Order Tracking
* Profile Management

### 🍽 Restaurant Owner Features

* Create Restaurant
* Manage Menu Items
* Add/Edit/Delete Food Items
* View Customer Orders
* Update Order Status
* Restaurant Dashboard

### 🚚 Delivery Features

* Delivery Order Management
* Order Status Updates
* Real-Time Tracking

### ⚡ Real-Time Updates

* Socket.IO Integration
* Live Order Status Updates
* Instant Notifications

### 💳 Payment Integration

* Razorpay Payment Gateway

### ☁️ Media Uploads

* Cloudinary Image Storage

---

## 🛠 Tech Stack

### Frontend

* React
* Vite
* Redux Toolkit
* React Router DOM
* Tailwind CSS
* Socket.IO Client

### Backend

* Node.js
* Express.js
* MongoDB Atlas
* Mongoose
* JWT Authentication
* Socket.IO
* Cloudinary
* Razorpay
* Twilio
* Nodemailer

---

## 📂 Project Structure

```text
BlitzBite/
│
├── Frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── Backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   └── package.json
│
├── DEPLOYMENT.md
└── README.md
```

---

## ⚙️ Environment Variables

### Backend (.env)

```env
PORT=8000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

EMAIL_USER=
EMAIL_PASS=

FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SOCKET_URL=http://localhost:8000
```

---

## 💻 Local Installation

### Clone Repository

```bash
git clone https://github.com/Niixx18/BlitzBite.git
cd BlitzBite
```

### Backend Setup

```bash
cd Backend
npm install
npm start
```

Backend runs on:

```text
http://localhost:8000
```

### Frontend Setup

```bash
cd Frontend
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

## 🌐 Deployment

### Frontend

* Vercel

### Backend

* Render

### Database

* MongoDB Atlas

---

## 📸 Screenshots

Add screenshots after deployment:

* Home Page
* Restaurant Page
* Cart Page
* Checkout Page
* Owner Dashboard
* Order Tracking Page

---

## 🔮 Future Improvements

* Ratings & Reviews
* Push Notifications
* Restaurant Analytics
* Delivery Partner Mobile App
* Saved Addresses
* AI-Based Food Recommendations

---

## 👨‍💻 Author

**Adarsh**

GitHub: https://github.com/Niixx18

---

## 📜 License

This project is built for learning, portfolio, and demonstration purposes.
