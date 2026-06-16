const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { initSocket } = require('./config/socket');
initSocket(server);

const mongoose = require('mongoose');
require('dotenv').config();

console.log("MongoDB URI configured:", !!process.env.MONGODB_URI);

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. server-to-server, Postman)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: origin ${origin} not allowed`));
        }
    },
    credentials: true
}));

app.use(express.json());

// Prevent API caching globally for all API routes
app.use('/api', (req, res, next) => {
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    next();
});

// Test route
app.post('/test', (req, res) => {
    res.json({ message: 'test working' });
});

// Auth routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Shop & Item routes
const shopRoutes = require('./routes/shops');
const itemRoutes = require('./routes/items');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const searchRoutes = require('./routes/search');
const paymentRoutes = require('./routes/payment');
app.use('/api/shops', shopRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/payment', paymentRoutes);

const PORT = process.env.PORT || 3000;

// Serve static files from the React frontend app in production
const frontendDistPath = path.join(__dirname, '../Frontend/dist');
if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));
    app.get('/*splat', (req, res, next) => {
        if (req.path.startsWith('/api')) {
            return next();
        }
        res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('Server is working');
    });
}

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
    console.log("MongoDB Connected Successfully");
    try {
        const db = mongoose.connection.db;
        const result = await db.admin().ping();
        console.log("MongoDB Ping Response:", result);
    } catch (err) {
        console.log("Ping failed:", err);
    }

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
})
.catch((err) => {
    console.error('Failed to connect to MongoDB', err);
});
