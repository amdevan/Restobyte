import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import PublicHeader from '@/components/public/PublicHeader';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import CartDrawer from '@/components/public/CartDrawer';
import { FiUser, FiShoppingBag, FiCalendar, FiSettings, FiLogOut, FiHome, FiCoffee } from 'react-icons/fi';

const CustomerLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { websiteSettings, getSingleActiveOutlet, outlets } = useRestaurantData();
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, isCartOpen, setIsCartOpen, toggleCart, cartTotal, cartCount } = useCart();
  const { user, logout } = useAuth();
  
  const outlet = getSingleActiveOutlet();
  const baseUrl = '/public/restaurant';

  const navLinks = [
    { id: 'home', text: 'Home', url: `${baseUrl}` },
    { id: 'menu', text: 'Menu', url: `${baseUrl}/menu` },
  ];

  const handleLogout = () => {
    logout();
    navigate('/public/login');
  };

  const menuItems = [
    { icon: FiHome, label: 'Dashboard', path: '/customer/dashboard' },
    { icon: FiCoffee, label: 'Order Food', path: `${baseUrl}/menu` },
    { icon: FiUser, label: 'Profile', path: '/customer/profile' },
    { icon: FiShoppingBag, label: 'Orders', path: '/customer/orders' },
    { icon: FiCalendar, label: 'Reservations', path: '/customer/reservations' },
    { icon: FiSettings, label: 'Settings', path: '/customer/settings' },
  ];

  return (
    <div className="bg-gray-50 font-sans text-gray-800 flex flex-col min-h-screen">
      <PublicHeader 
        brandName={outlet?.restaurantName || websiteSettings.whiteLabel?.appName}
        logoUrl={websiteSettings.whiteLabel?.logoUrl}
        primaryColor={websiteSettings.whiteLabel?.primaryColor}
        onLoginClick={() => navigate('/public/login')}
        onRegisterClick={() => navigate('/public/register')}
        navLinks={navLinks}
        cartCount={cartCount}
        onCartClick={toggleCart}
        user={user}
        onLogout={handleLogout}
      />

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cart={cart}
        removeFromCart={removeFromCart}
        updateQuantity={updateQuantity}
        cartTotal={cartTotal}
      />

      <div className="flex-grow container mx-auto px-4 py-8 mt-20">
        <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <aside className="w-full md:w-64 flex-shrink-0">
                <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-xl font-bold">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{user?.username}</h3>
                            <p className="text-xs text-gray-500">Customer</p>
                        </div>
                    </div>
                    
                    <nav className="space-y-2">
                        {menuItems.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                    location.pathname === item.path 
                                    ? 'bg-orange-50 text-orange-600 font-medium' 
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <item.icon size={18} />
                                {item.label}
                            </button>
                        ))}
                        
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 transition-colors mt-4"
                        >
                            <FiLogOut size={18} />
                            Logout
                        </button>
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-grow bg-white rounded-xl shadow-sm p-6 min-h-[500px]">
                <Outlet />
            </main>
        </div>
      </div>
    </div>
  );
};

export default CustomerLayout;