import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';

const CUISINES = [
  { name: 'Pizza', icon: 'local_pizza' },
  { name: 'Burger', icon: 'lunch_dining' },
  { name: 'Biryani', icon: 'ramen_dining' },
  { name: 'Chinese', icon: 'takeout_dining' },
  { name: 'South Indian', icon: 'rice_bowl' },
  { name: 'Desserts', icon: 'icecream' },
  { name: 'Beverages', icon: 'local_cafe' }
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [shops, setShops] = useState([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchShops = async () => {
      setLoadingShops(true);
      try {
        const params = new URLSearchParams();
        if (activeCategory !== 'All') params.set('category', activeCategory);
        const res = await fetch(`/api/shops?${params.toString()}`);
        const data = await res.json();
        setShops(data.shops || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingShops(false);
      }
    };
    fetchShops();
  }, [activeCategory]);

  const handleCategorySearch = (cat) => {
    if (cat === 'All') {
      setActiveCategory('All');
    } else {
      navigate(`/search?q=${encodeURIComponent(cat)}`);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen pt-24 pb-16">
      <main className="max-w-7xl mx-auto w-full px-4 md:px-margin-desktop space-y-stack-xl">
        
        {/* User Greetings */}
        <section className="space-y-stack-xs">
          <h1 className="font-sans text-3xl md:text-4xl font-extrabold text-on-background tracking-tight">
            Good morning, {user ? user.firstName : 'Craver'}
          </h1>
          <p className="text-body-md text-on-surface-variant font-medium">
            Hungry? Let's get you something fast.
          </p>
        </section>

        {/* Hero search bar / Promo Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Deal Card (Large) */}
          <div className="md:col-span-2 rounded-[24px] overflow-hidden relative group cursor-pointer shadow-md hover:shadow-lg transition-all duration-300 min-h-[300px] flex flex-col justify-end p-6 bg-inverse-surface">
            <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/90 via-inverse-surface/40 to-transparent z-10"></div>
            <img
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 opacity-60"
              alt="Artisan Pizza Offer"
              src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=1000"
            />
            <div className="relative z-20 space-y-3">
              <div className="flex items-center gap-2">
                <span className="bg-primary-container text-on-primary font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                  Flash Deal
                </span>
                <span className="bg-surface/90 backdrop-blur-sm text-primary font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  ⏱️ 15m left
                </span>
              </div>
              <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">
                50% Off<br />Artisan Pizzas
              </h2>
              <p className="text-sm text-outline-variant max-w-sm">
                From top rated woodfired pizzerias near you. Valid on orders over ₹250.
              </p>
              <button
                onClick={() => navigate('/search?q=pizza')}
                className="bg-primary-container hover:bg-primary text-white font-bold text-sm px-6 py-2.5 rounded-full shadow-md transition-all flex items-center gap-2 cursor-pointer w-fit"
              >
                Claim Offer
                <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Small Bento Card (Smash Burger) */}
          <div className="rounded-[24px] overflow-hidden relative group cursor-pointer shadow-md hover:shadow-lg transition-all duration-300 bg-surface-container-high border border-outline-variant/30 flex flex-col justify-between min-h-[300px]">
            <div className="h-1/2 overflow-hidden relative">
              <img
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                alt="Cheeseburger Offer"
                src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600"
              />
            </div>
            <div className="p-5 flex flex-col justify-center flex-1 bg-surface-container">
              <span className="text-primary font-bold text-xs uppercase tracking-wide mb-1">
                Free Delivery
              </span>
              <h3 className="text-lg font-bold text-on-surface leading-tight">
                Smash Burger Combo
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Get free delivery from Burger joints today.
              </p>
            </div>
          </div>
        </section>

        {/* Cuisines Grid */}
        <section className="space-y-stack-md">
          <h2 className="text-xl font-extrabold text-on-background">Cuisines</h2>
          <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-2">
            <button
              onClick={() => setActiveCategory('All')}
              className={`flex flex-col items-center gap-2 min-w-[80px] group cursor-pointer`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 ${activeCategory === 'All' ? 'bg-primary-container text-white scale-110' : 'bg-surface-container-high text-on-surface-variant hover:bg-primary-fixed group-hover:scale-105'}`}>
                <span className="material-symbols-outlined text-[32px]">restaurant</span>
              </div>
              <span className={`text-xs font-semibold ${activeCategory === 'All' ? 'text-primary' : 'text-on-surface-variant'}`}>All</span>
            </button>

            {CUISINES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => handleCategorySearch(cat.name)}
                className="flex flex-col items-center gap-2 min-w-[80px] group cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center shadow-sm group-hover:bg-primary-fixed transition-all group-hover:scale-110 duration-200 text-on-surface-variant group-hover:text-primary">
                  <span className="material-symbols-outlined text-[32px]">{cat.icon}</span>
                </div>
                <span className="text-xs font-semibold text-on-surface-variant group-hover:text-primary">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Order It Again Section */}
        <section className="space-y-stack-md">
          <div className="flex justify-between items-end">
            <h2 className="text-xl font-extrabold text-on-background">Order it again</h2>
            <button
              onClick={() => navigate('/orders')}
              className="text-primary font-semibold text-sm hover:text-primary-container transition-colors cursor-pointer"
            >
              View all
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Mock Item 1 */}
            <div className="bg-surface rounded-2xl p-4 border border-outline-variant/50 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] flex items-center gap-4 cursor-pointer">
              <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                <img
                  className="w-full h-full object-cover"
                  alt="Salad Bowl"
                  src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=200"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-on-surface truncate">Green Salad Bowl</h3>
                <p className="text-xs text-on-surface-variant truncate">Grilled Chicken Salad • ₹280.00</p>
                <p className="text-[10px] text-tertiary mt-1">Delivered yesterday</p>
              </div>
              <button
                onClick={() => navigate('/search?q=salad')}
                className="bg-secondary-container hover:bg-primary-fixed text-on-surface-variant hover:text-primary w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>

            {/* Mock Item 2 */}
            <div className="bg-surface rounded-2xl p-4 border border-outline-variant/50 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] flex items-center gap-4 cursor-pointer">
              <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                <img
                  className="w-full h-full object-cover"
                  alt="Iced Latte"
                  src="https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=200"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-on-surface truncate">Coffee Morning Roast</h3>
                <p className="text-xs text-on-surface-variant truncate">Large Iced Latte • ₹180.00</p>
                <p className="text-[10px] text-tertiary mt-1">Delivered Monday</p>
              </div>
              <button
                onClick={() => navigate('/search?q=coffee')}
                className="bg-secondary-container hover:bg-primary-fixed text-on-surface-variant hover:text-primary w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>
          </div>
        </section>

        {/* Restaurant Grid */}
        {user?.userType !== 'restaurant' && (
          <section className="space-y-stack-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-extrabold text-on-background">
                {activeCategory === 'All' ? 'Restaurants Near You' : `${activeCategory} Restaurants`}
              </h2>
              {!loadingShops && shops.length > 0 && (
                <span className="text-xs text-on-surface-variant font-medium bg-surface-container-high px-3 py-1 rounded-full">
                  {shops.length} found
                </span>
              )}
            </div>

            {loadingShops && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-72 rounded-[24px] bg-surface-container-high animate-pulse" />
                ))}
              </div>
            )}

            {!loadingShops && shops.length === 0 && (
              <div className="text-center py-12 text-on-surface-variant border border-outline-variant/35 rounded-[24px] bg-surface-container-low">
                <span className="material-symbols-outlined text-5xl opacity-40">restaurant_menu</span>
                <p className="text-base font-bold mt-2">No restaurants found</p>
                <p className="text-xs mt-1">Try selecting a different cuisine filter.</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {shops.map((shop) => (
                <Link
                  key={shop._id}
                  to={`/restaurant/${shop._id}`}
                  className="bg-surface-container-lowest rounded-[24px] border border-outline-variant/50 overflow-hidden shadow-sm transition-all duration-300 bento-hover hover:border-primary/30 flex flex-col"
                >
                  <div className="relative h-48 overflow-hidden bg-surface-container-high shrink-0">
                    {shop.featuredImage ? (
                      <img
                        src={shop.featuredImage}
                        alt={shop.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl bg-surface-container-high">
                        🍴
                      </div>
                    )}
                    {/* Status badge */}
                    <span className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider backdrop-blur-md border ${shop.isOpen ? 'bg-emerald-600/90 text-white border-emerald-500/30' : 'bg-rose-600/90 text-white border-rose-500/30'}`}>
                      {shop.isOpen ? '● Open' : '● Closed'}
                    </span>
                    {/* Rating badge */}
                    {shop.rating > 0 && (
                      <span className="absolute top-3 right-3 bg-inverse-surface/90 text-amber-400 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 backdrop-blur-md border border-outline/25">
                        ⭐ {shop.rating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-1 justify-between">
                    <div className="space-y-1.5">
                      <h3 className="font-sans text-lg font-bold text-on-surface leading-snug line-clamp-1">
                        {shop.name}
                      </h3>
                      <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                        {shop.description || 'Delicious food curated for high-velocity speed.'}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-outline-variant/30">
                      <span className="bg-primary-container/10 text-primary font-bold text-xs px-2.5 py-1 rounded-md">
                        {shop.category || 'Restaurant'}
                      </span>
                      <span className="text-xs text-on-surface-variant font-medium flex items-center gap-1">
                        📍 {shop.location?.city || 'Nearby'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}