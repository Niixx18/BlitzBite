import { BrowserRouter, Routes, Route } from 'react-router-dom'
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

function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/owner-dashboard" element={<OwnerDashboard />} />
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
        <Route path="/create-shop" element={<CreateShop />} />
        <Route path="/restaurant/:id" element={<Restaurant />} />
        <Route path="/search" element={<SearchPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
