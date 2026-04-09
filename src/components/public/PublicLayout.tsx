import React from 'react';
import { Outlet, useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import PublicHeader from './PublicHeader';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import CartDrawer from './CartDrawer';
import { FiFacebook, FiTwitter, FiInstagram, FiShoppingBag, FiMapPin, FiPhone, FiMail } from 'react-icons/fi';

const PublicLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { websiteSettings, getSingleActiveOutlet, outlets } = useRestaurantData();
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, isCartOpen, setIsCartOpen, toggleCart, cartTotal, cartCount } = useCart();
  const { user, logout } = useAuth();
  
  // Extract outletId from URL if present (e.g. /website/:outletId/...)
  // Or use single active outlet
  const outletIdMatch = location.pathname.match(/\/website\/([^/]+)/);
  const outletId = outletIdMatch ? outletIdMatch[1] : undefined;
  
  const outlet = outletId ? outlets.find(o => o.id === outletId) || getSingleActiveOutlet() : getSingleActiveOutlet();

  const handleLoginClick = () => navigate('/public/login');
  const handleRegisterClick = () => navigate('/public/register');

  const baseUrl = outletId ? `/website/${outletId}` : '/public/restaurant';

  const navLinks = [
    { id: 'home', text: 'Home', url: `${baseUrl}` },
    { id: 'menu', text: 'Menu', url: `${baseUrl}/menu` },
    { id: 'about', text: 'About', url: `${baseUrl}/about` },
    { id: 'contact', text: 'Contact', url: `${baseUrl}/contact` },
  ];

  return (
    <div className="bg-white font-sans text-gray-800 flex flex-col min-h-screen">
      <PublicHeader 
        brandName={outlet?.restaurantName || websiteSettings.whiteLabel?.appName}
        logoUrl={websiteSettings.whiteLabel?.logoUrl}
        primaryColor={websiteSettings.whiteLabel?.primaryColor}
        onLoginClick={handleLoginClick}
        onRegisterClick={handleRegisterClick}
        navLinks={navLinks}
        cartCount={cartCount}
        onCartClick={toggleCart}
        user={user}
        onLogout={logout}
      />

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cart={cart}
        removeFromCart={removeFromCart}
        updateQuantity={updateQuantity}
        cartTotal={cartTotal}
      />

      <main className="flex-grow">
        <Outlet context={{ outlet, baseUrl, addToCart }} />
      </main>

      {/* Custom Footer */}
      <footer className="bg-gray-900 text-white pt-32 pb-10 px-4">
        <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 border-b border-gray-800 pb-12">
                <div className="md:col-span-1">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="bg-orange-500 p-2 rounded-lg">
                             <FiShoppingBag size={24} className="text-white" />
                        </div>
                        <span className="text-2xl font-bold">Restaurant<span className="text-orange-500">App</span></span>
                    </div>
                    <h3 className="text-3xl font-serif font-bold mb-4">Ready to Explore us? <br /> Place Your Order Now!</h3>
                    <p className="text-gray-400 text-sm">Subscribe for updates and exclusive offers.</p>
                </div>
                <div>
                    <h4 className="font-bold text-lg mb-6">Resources</h4>
                    <ul className="space-y-3 text-gray-400">
                        <li><button onClick={() => navigate(baseUrl)} className="hover:text-orange-500 transition-colors">Home</button></li>
                        <li><button onClick={() => navigate(`${baseUrl}/about`)} className="hover:text-orange-500 transition-colors">About Us</button></li>
                        <li><button onClick={() => navigate(`${baseUrl}/menu`)} className="hover:text-orange-500 transition-colors">Menu</button></li>
                        <li><a href="#" className="hover:text-orange-500 transition-colors">Terms & Conditions</a></li>
                        <li><a href="#" className="hover:text-orange-500 transition-colors">Privacy Policy</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-lg mb-6">Contact Us</h4>
                    <ul className="space-y-4 text-gray-400">
                        <li className="flex items-start gap-3">
                            <FiMapPin className="text-orange-500 mt-1 flex-shrink-0" />
                            <span>{websiteSettings.contactUsContent?.address || '123 Food Street, Flavor Town, FT 12345'}</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <FiPhone className="text-orange-500 flex-shrink-0" />
                            <span>{websiteSettings.contactUsContent?.phone || '+1 234 567 890'}</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <FiMail className="text-orange-500 flex-shrink-0" />
                            <span>{websiteSettings.contactUsContent?.email || 'contact@restaurantapp.com'}</span>
                        </li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-lg mb-6">Follow Us</h4>
                    <div className="flex gap-4">
                        <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all"><FiFacebook /></a>
                        <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all"><FiTwitter /></a>
                        <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all"><FiInstagram /></a>
                    </div>
                </div>
            </div>
            <div className="text-center text-gray-500 text-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <p>&copy; {new Date().getFullYear()} {outlet?.restaurantName || 'Restaurant App'}. All rights reserved.</p>
                <div className="flex gap-6">
                    <a href="#" className="hover:text-white">Privacy</a>
                    <a href="#" className="hover:text-white">Security</a>
                    <a href="#" className="hover:text-white">Terms</a>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;