# BlitzBite Deployment Guide

This guide explains how to deploy the BlitzBite food delivery application. The codebase is configured to support two deployment architectures.

---

## Strategy 1: Unified Deployment (Recommended)

In this architecture, a single service (e.g. Render, Railway, Heroku) hosts the Express backend, which serves both the API routes and the built React frontend statically from the `Frontend/dist` folder.

### Advantages
- **No CORS configuration issues**: Everything runs on the exact same domain.
- **Single Service Billing**: You only need to pay for or maintain one hosting service.
- **Simple Routing**: Websockets and HTTP requests both use relative paths natively.

### Step-by-Step Instructions (e.g. on Render / Railway)

1. **Create a New Web Service** on your hosting provider.
2. **Link Your GitHub Repository**.
3. **Configure Settings**:
   - **Root Directory**: Leave blank (root of the repo).
   - **Build Command**: `npm run install-all && npm run build`
     *(This installs dependencies for both backend and frontend, then builds the production-ready React bundle).*
   - **Start Command**: `npm start`
     *(This runs `npm start --prefix Backend` which runs `node app.js` in the Backend. The backend will automatically detect `Frontend/dist` and serve it statically).*
4. **Environment Variables**:
   Add the following variables in the Environment settings of your Web Service:
   - `MONGODB_URI`: Your MongoDB Connection String.
   - `JWT_SECRET`: A long random secret key for signing tokens.
   - `PORT`: (Render/Railway sets this automatically, but you can set it to `8000` or `10000`).
   - `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name.
   - `CLOUDINARY_API_KEY`: Cloudinary API key.
   - `CLOUDINARY_API_SECRET`: Cloudinary API secret.
   - `TWILIO_ACCOUNT_SID`: Twilio account SID.
   - `TWILIO_AUTH_TOKEN`: Twilio auth token.
   - `TWILIO_PHONE_NUMBER`: Twilio active phone number.
   - `RAZORPAY_KEY_ID`: Razorpay key ID.
   - `RAZORPAY_KEY_SECRET`: Razorpay key secret.
   - `SMTP_HOST`: (Optional) SMTP host.
   - `SMTP_PORT`: (Optional) SMTP port.
   - `SMTP_USER`: (Optional) SMTP user.
   - `SMTP_PASS`: (Optional) SMTP password.
   - `SMTP_FROM`: (Optional) SMTP from email.

---

## Strategy 2: Decoupled Deployment

In this architecture, the React frontend is deployed on a static hosting provider (e.g. Vercel, Netlify) and the Node/Express backend is deployed on an API hosting service (e.g. Render, Railway).

### Advantages
- **Faster Global Load Times**: Static frontend assets are served via CDNs.
- **Independent Scaling**: Scale the backend API separately from frontend visits.

### Step-by-Step Instructions

#### A. Deploy the Backend API
1. **Create a New Web Service** on Render/Railway.
2. **Link Your GitHub Repository**.
3. **Configure Settings**:
   - **Root Directory**: `Backend` (or keep root blank and set build/start commands below).
   - **Build Command**: `npm install` (or `npm run install:backend` from root).
   - **Start Command**: `node app.js` (or `npm start` from root).
4. **Environment Variables**:
   - Add all env variables listed in Strategy 1.
   - Set `FRONTEND_URL` to your production frontend URL (e.g., `https://blitzbite.vercel.app`). This is critical for CORS and Socket.io authorization.

#### B. Deploy the Frontend UI
1. **Create a New Project** on Vercel or Netlify.
2. **Link Your GitHub Repository**.
3. **Configure Settings**:
   - **Root Directory**: `Frontend`
   - **Build Command**: `npm run build` (or `vite build`)
   - **Output Directory**: `dist` (default for Vite)
4. **Proxy Setup (Recommended to avoid CORS & SSL Issues)**:
   Create a `vercel.json` inside the `Frontend` directory to map `/api` requests to your backend:
   ```json
   {
     "rewrites": [
       { "source": "/api/:path*", "destination": "https://your-backend-api.onrender.com/api/:path*" },
       { "source": "/socket.io/:path*", "destination": "https://your-backend-api.onrender.com/socket.io/:path*" },
       { "source": "/:path*", "destination": "/index.html" }
     ]
   }
   ```
   *Replace `https://your-backend-api.onrender.com` with your active backend production URL.*
5. **Alternatively (Direct API Calls)**:
   If you do not set up rewrites/proxies, configure the env variable on the hosting provider:
   - `VITE_API_BASE_URL`: `https://your-backend-api.onrender.com`
   - `VITE_SOCKET_URL`: `https://your-backend-api.onrender.com`
