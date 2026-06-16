import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSelector, useDispatch } from 'react-redux';
import { selectCartItems, clearCartState } from '../features/cart/cartSlice';
import { logout } from '../features/auth/authSlice';

export default function Nav() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const [searchValue, setSearchValue] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locLoading, setLocLoading] = useState(false);

  // Popover and Dropdown States
  const [isLocPopoverOpen, setIsLocPopoverOpen] = useState(false);
  const [manualLocationInput, setManualLocationInput] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Handle outside click to close popovers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('#location-popover-container')) {
        setIsLocPopoverOpen(false);
      }
      if (!event.target.closest('#user-menu-container')) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const detectGeoLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.address) {
            const suburb = data.address.suburb || data.address.neighbourhood || data.address.road || '';
            const city = data.address.city || data.address.town || data.address.village || '';
            let name = 'Live Location';
            if (suburb && city) {
              name = `${suburb}, ${city}`;
            } else if (city) {
              name = city;
            } else {
              name = data.display_name.split(',')[0] || 'Live Location';
            }
            setLocationName(name);
            localStorage.setItem('user_location', name);
          }
        } catch (err) {
          console.error('OSM Geocode error:', err);
        } finally {
          setLocLoading(false);
          setIsLocPopoverOpen(false);
        }
      },
      (error) => {
        console.log('Location access error:', error);
        setLocLoading(false);
        setIsLocPopoverOpen(false);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  useEffect(() => {
    if (!user) {
      setLocationName('');
      localStorage.removeItem('user_location');
      return;
    }

    const savedLoc = localStorage.getItem('user_location');
    if (savedLoc) {
      setLocationName(savedLoc);
    } else if (user.address && user.address.street && user.address.city) {
      const addr = `${user.address.street}, ${user.address.city}`;
      setLocationName(addr);
      localStorage.setItem('user_location', addr);
    } else {
      setLocationName('Patna, India');
      detectGeoLocation();
    }
  }, [user]);

  const handleManualLocationSubmit = (e) => {
    e.preventDefault();
    const val = manualLocationInput.trim();
    if (val) {
      setLocationName(val);
      localStorage.setItem('user_location', val);
      setManualLocationInput('');
      setIsLocPopoverOpen(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchValue.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
      setSearchValue('');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCartState());
    localStorage.removeItem('cart');
    sessionStorage.removeItem('cart');
    navigate('/');
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/85 backdrop-blur-md border-b border-outline-variant/30 shadow-sm h-16">
      <div className="flex justify-between items-center w-full px-4 md:px-margin-desktop max-w-7xl mx-auto h-full gap-2 md:gap-4">
        {/* Brand Logo */}
        <Link to="/" className="font-sans text-xl md:text-2xl font-black text-primary hover:text-primary-container tracking-tighter italic shrink-0 transition-colors">
          ⚡ BlitzBite
        </Link>

        {/* Desktop Search Bar & Location */}
        <div className="hidden md:flex items-center flex-1 max-w-lg mx-6 gap-3">
          <form onSubmit={handleSearch} className="flex-1 relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant z-10 select-none">
              search
            </span>
            <input
              id="nav-search-input"
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search restaurants, dishes..."
              className="w-full bg-surface-container-low border border-transparent rounded-full py-2 pl-10 pr-4 font-sans text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all duration-200"
            />
          </form>

          {user && locationName && (
            <div className="relative" id="location-popover-container">
              <button
                onClick={() => setIsLocPopoverOpen(!isLocPopoverOpen)}
                className="flex items-center gap-1 bg-surface-container hover:bg-surface-container-high px-3.5 py-1.5 rounded-full border border-outline-variant/30 text-xs text-on-surface font-semibold max-w-[190px] shrink-0 transition-all select-none cursor-pointer"
                title={locationName}
              >
                <span className="material-symbols-outlined text-sm text-primary fill-current">location_on</span>
                <span className="truncate">
                  {locLoading ? 'Locating...' : locationName}
                </span>
                <span className="material-symbols-outlined text-xs text-on-surface-variant">
                  arrow_drop_down
                </span>
              </button>

              {/* Location Popover */}
              {isLocPopoverOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-surface border border-outline-variant/40 rounded-2xl p-4 shadow-xl z-50 flex flex-col gap-3 animate-fade-in animate-duration-150">
                  <button
                    onClick={detectGeoLocation}
                    disabled={locLoading}
                    className="flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 disabled:bg-surface-container-high text-primary font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">my_location</span>
                    {locLoading ? 'Locating...' : 'Detect Live Location'}
                  </button>

                  <div className="border-t border-outline-variant/20 pt-3 flex flex-col gap-1.5">
                    <span className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">Or enter manually</span>
                    <form onSubmit={handleManualLocationSubmit} className="flex gap-1.5">
                      <input
                        type="text"
                        value={manualLocationInput}
                        onChange={(e) => setManualLocationInput(e.target.value)}
                        placeholder="e.g. Patna, Delhi"
                        className="flex-1 bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-1.5 px-3 text-xs text-on-surface font-semibold outline-none transition-all"
                      />
                      <button
                        type="submit"
                        className="bg-primary text-on-primary font-bold text-xs px-3 rounded-xl hover:bg-primary-container transition-all cursor-pointer"
                      >
                        Set
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Search Icon & Location (for both logged in & guests) */}
        <div className="flex md:hidden items-center gap-1.5 flex-1 max-w-[180px] justify-end">
          <button
            onClick={() => setIsMobileSearchOpen(true)}
            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary-container/10 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-xl select-none">search</span>
          </button>
          
          {user && locationName && (
            <div
              onClick={() => setIsMobileSearchOpen(true)}
              className="flex items-center gap-0.5 bg-surface-container px-2.5 py-1 rounded-full border border-outline-variant/30 text-[10px] text-on-surface font-semibold truncate cursor-pointer max-w-[110px]"
            >
              <span className="material-symbols-outlined text-xs text-primary fill-current">location_on</span>
              <span className="truncate">{locLoading ? '...' : locationName.split(',')[0]}</span>
            </div>
          )}
        </div>

        {/* Right Navigation & User Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">


          {/* Cart Icon (Only for Customers / Guests) */}
          {(!user || user.userType === 'customer') && (
            <Link to="/cart" className="relative p-2 text-on-surface-variant hover:bg-primary-container/10 hover:text-primary rounded-full transition-colors">
              <span className="material-symbols-outlined select-none block">shopping_cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-on-primary font-bold text-[10px] w-4 h-4 flex items-center justify-center rounded-full shadow-sm animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {/* User Account / Sign In */}
          {user ? (
            <div className="relative" id="user-menu-container">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1.5 p-1 rounded-full hover:bg-surface-container-high transition-colors cursor-pointer outline-none animate-fade-in"
              >
                <img
                  alt="Avatar"
                  className="w-8 h-8 rounded-full border-2 border-outline-variant object-cover shadow-sm"
                  src={user.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDY7bz4y7JB3bftfjsqwmgTpO79CfW26LdufMKVp_ZLqzt9UqjPEB7m-VE01p8r_xoqQeKu8VtnSrs1KB108fsI5ElISaj5h-RClyMKD0aiPdq9cTYLq_nV33iTujtj61WEJ7u4iVH1h1CldupYWOzqvDinDPDH2tnhr1-JE2ZFjdPqceeue-UHlGPzbrc8zIHUmM9zCSxX-Y_y2IaodPCB8N1I-i_DJCISi2YB_SwbEitbZiKLPE3FgvubvwDJiF9RRPLNMOOBzsA'}
                />
                <span className="hidden lg:inline-block text-sm font-semibold text-on-surface pr-0.5 select-none">
                  {user.firstName}
                </span>
                <span className="material-symbols-outlined text-sm text-on-surface-variant select-none">
                  keyboard_arrow_down
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-surface border border-outline-variant/40 rounded-2xl shadow-xl py-2 z-50 animate-fade-in flex flex-col">
                  {/* User Info Header */}
                  <div className="px-4 py-2 border-b border-outline-variant/20 flex flex-col">
                    <span className="text-xs font-black text-on-surface">{user.firstName} {user.lastName}</span>
                    <span className="text-[10px] text-on-surface-variant/70 truncate">{user.email}</span>
                  </div>

                  {/* Navigation Links inside dropdown */}
                  <div className="p-1 flex flex-col">


                    {user.userType === 'customer' && (
                      <Link
                        to="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-on-surface hover:bg-primary/5 hover:text-primary rounded-xl transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm select-none">dashboard</span>
                        Dashboard
                      </Link>
                    )}

                    {user.userType === 'restaurant' && (
                      <>
                        <Link
                          to="/"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-on-surface hover:bg-primary/5 hover:text-primary rounded-xl transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm select-none">storefront</span>
                          My Shop
                        </Link>
                        <Link
                          to="/owner-orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-on-surface hover:bg-primary/5 hover:text-primary rounded-xl transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm select-none">receipt_long</span>
                          Orders
                        </Link>
                      </>
                    )}

                    {user.userType === 'delivery' && (
                      <Link
                        to="/delivery-orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-on-surface hover:bg-primary/5 hover:text-primary rounded-xl transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm select-none">local_shipping</span>
                        Deliveries
                      </Link>
                    )}

                    <Link
                      to="/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-on-surface hover:bg-primary/5 hover:text-primary rounded-xl transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm select-none">shopping_bag</span>
                      My Orders
                    </Link>
                  </div>

                  {/* Sign Out Action */}
                  <div className="border-t border-outline-variant/20 p-1 mt-1">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer text-left"
                    >
                      <span className="material-symbols-outlined text-sm select-none">logout</span>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/signin"
                className="font-sans text-sm font-semibold text-on-surface hover:text-primary transition-colors px-3 py-1.5"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="font-sans text-sm font-bold bg-primary text-on-primary hover:bg-primary-container px-4 py-1.5 rounded-full transition-all shadow-sm hover:shadow-md cursor-pointer"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Responsive Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-surface/98 backdrop-blur-md flex flex-col p-4 animate-fade-in">
          {/* Header row */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-2 text-on-surface-variant hover:bg-primary-container/10 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined select-none">arrow_back</span>
            </button>
            <h3 className="font-sans text-base font-black text-on-surface flex-1">Search BlitzBite</h3>
          </div>

          {/* Search bar & Location bar stacked */}
          <div className="space-y-4">
            <form onSubmit={(e) => {
              handleSearch(e);
              setIsMobileSearchOpen(false);
            }} className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant z-10 select-none">
                search
              </span>
              <input
                id="nav-search-input-mobile"
                type="text"
                autoFocus
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search restaurants, dishes..."
                className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary focus:bg-white rounded-full py-2.5 pl-10 pr-4 font-sans text-sm text-on-surface outline-none transition-all"
              />
            </form>

            {user && (
              <div className="flex items-center justify-between bg-surface-container p-3 rounded-2xl border border-outline-variant/30 text-xs">
                <div className="flex items-center gap-1.5 text-on-surface font-semibold truncate">
                  <span className="material-symbols-outlined text-sm text-primary fill-current">location_on</span>
                  <span className="truncate">{locLoading ? 'Locating...' : locationName}</span>
                </div>
                <button
                  onClick={detectGeoLocation}
                  disabled={locLoading}
                  className="bg-primary text-on-primary font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 shrink-0 hover:bg-primary-container disabled:bg-surface-container-high transition-all"
                >
                  <span className="material-symbols-outlined text-xs">my_location</span>
                  <span>GPS</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick links / Cuisines */}
          <div className="mt-8 space-y-4">
            <h4 className="text-xs font-black text-on-surface-variant/60 uppercase tracking-wider">Quick Cuisines</h4>
            <div className="grid grid-cols-3 gap-3">
              {['Pizza', 'Burger', 'Biryani', 'Chinese', 'Desserts', 'Beverages'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    navigate(`/search?q=${encodeURIComponent(cat)}`);
                    setIsMobileSearchOpen(false);
                  }}
                  className="bg-surface-container-low border border-outline-variant/20 hover:border-primary/30 p-3 rounded-2xl flex flex-col items-center gap-1 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <span className="text-xs font-bold text-on-surface">{cat}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
