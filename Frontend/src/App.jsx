import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { fetchCurrentUser } from './features/auth/authSlice'

import SignIn from './pages/signin'
import SignUp from './pages/signup'
import ForgotPassword from './pages/forgot-password'
import ResetPassword from './pages/reset-password'
import Home from './pages/home'
import OwnerDashboard from './pages/owner-dashboard'
import UserDashboard from './pages/user-dashboard'
import CartPage from './pages/cart'
import CheckoutPage from './pages/checkout'
import MyOrdersPage from './pages/my-orders'
import OwnerOrdersPage from './pages/owner-orders'
import DeliveryOrdersPage from './pages/delivery-orders'
import OrderTrackingPage from './pages/order-tracking'
import CreateEditPage from './pages/create-edit'
import AddFoodPage from './pages/add-food'
import CreateShop from './pages/create-shop'
import Restaurant from './pages/restaurant'
import Nav from './components/Nav'
import SearchPage from './pages/search'
import AuthLanding from './pages/auth-landing'

function AppContent() {
  const { user, status } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, status]);

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined text-5xl text-primary animate-spin select-none">local_dining</span>
        <p className="text-sm font-bold text-on-surface-variant font-sans">Loading BlitzBite…</p>
      </div>
    );
  }

  const isAuthenticated = !!user;

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/signin" element={<AuthLanding mode="signin" />} />
        <Route path="/signup" element={<AuthLanding mode="signup" />} />
        <Route path="/" element={<AuthLanding mode="signin" />} />
        {/* Fallback to signin landing for any other routes if not logged in */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Authenticated application experience
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={user?.userType === 'restaurant' ? <OwnerDashboard /> : <Home />} />
        <Route path="/owner-dashboard" element={<Navigate to="/" replace />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/orders" element={<MyOrdersPage />} />
        <Route path="/orders/:id/track" element={<OrderTrackingPage />} />
        <Route path="/owner-orders" element={<OwnerOrdersPage />} />
        <Route path="/delivery-orders" element={<DeliveryOrdersPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/shop/create" element={<CreateEditPage />} />
        <Route path="/shop/:id/edit" element={<CreateEditPage />} />
        <Route path="/shop/:shopId/add-food" element={<AddFoodPage />} />
        <Route path="/shop/:shopId/food/:itemId/edit" element={<AddFoodPage />} />
        <Route path="/create-shop" element={<CreateShop />} />
        <Route path="/restaurant/:id" element={<Restaurant />} />
        <Route path="/search" element={<SearchPage />} />
        {/* If user is already authenticated, redirect auth routes to home */}
        <Route path="/signin" element={<Navigate to="/" replace />} />
        <Route path="/signup" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App

