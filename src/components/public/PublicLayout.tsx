import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import PublicHeader from './PublicHeader';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import CartDrawer from './CartDrawer';
import { FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiYoutube, FiShoppingBag, FiMapPin, FiPhone, FiMail } from 'react-icons/fi';
import type { WebsiteSettings } from '@/types';
import { getDefaultCurrency } from '@/utils/currency';

const PublicLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { websiteSettings, getSingleActiveOutlet, outlets, applicationSettings, currencies } = useRestaurantData();
  const { cart, addToCart, removeFromCart, updateQuantity, isCartOpen, setIsCartOpen, toggleCart, cartTotal, cartCount } = useCart();
  const { user, logout } = useAuth();
  
  // Extract outletId from URL if present (e.g. /website/:outletId/...)
  // Or use single active outlet
  const outletIdMatch = location.pathname.match(/\/website\/([^/]+)/);
  const outletId = outletIdMatch ? outletIdMatch[1] : undefined;
  
  const outlet = outletId ? outlets.find(o => o.id === outletId) || getSingleActiveOutlet() : getSingleActiveOutlet();

  const handleLoginClick = () => navigate('/public/login');
  const handleRegisterClick = () => navigate('/public/register');

  const baseUrl = outletId ? `/website/${outletId}` : '/public/restaurant';

  const outletWebsiteSettingsKey = outlet?.id ? `websiteSettings_${outlet.id}` : undefined;
  const [effectiveWebsiteSettings, setEffectiveWebsiteSettings] = useState<WebsiteSettings>(websiteSettings);

  const outletApplicationSettingsKey = outlet?.id ? `applicationSettings_${outlet.id}` : undefined;
  const [effectiveApplicationSettings, setEffectiveApplicationSettings] = useState(applicationSettings);

  useEffect(() => {
    if (!outletWebsiteSettingsKey) {
      setEffectiveWebsiteSettings(websiteSettings);
      return;
    }

    const read = () => {
      try {
        const raw = localStorage.getItem(outletWebsiteSettingsKey);
        if (!raw) return websiteSettings;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? (parsed as WebsiteSettings) : websiteSettings;
      } catch {
        return websiteSettings;
      }
    };

    setEffectiveWebsiteSettings(read());

    const onStorage = (e: StorageEvent) => {
      if (e.key === outletWebsiteSettingsKey) {
        setEffectiveWebsiteSettings(read());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [outletWebsiteSettingsKey, websiteSettings]);

  useEffect(() => {
    if (!outletApplicationSettingsKey) {
      setEffectiveApplicationSettings(applicationSettings);
      return;
    }

    const read = () => {
      try {
        const raw = localStorage.getItem(outletApplicationSettingsKey);
        if (!raw) return applicationSettings;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : applicationSettings;
      } catch {
        return applicationSettings;
      }
    };

    setEffectiveApplicationSettings(read());

    const onStorage = (e: StorageEvent) => {
      if (e.key === outletApplicationSettingsKey) {
        setEffectiveApplicationSettings(read());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [outletApplicationSettingsKey, applicationSettings]);

  const headerBrandName = useMemo(
    () => outlet?.restaurantName || effectiveWebsiteSettings.whiteLabel?.appName,
    [outlet?.restaurantName, effectiveWebsiteSettings.whiteLabel?.appName]
  );

  const accent = useMemo(() => effectiveWebsiteSettings.whiteLabel?.primaryColor || '#f97316', [effectiveWebsiteSettings.whiteLabel?.primaryColor]);

  const defaultCurrency = useMemo(() => getDefaultCurrency(currencies), [currencies]);

  const socialLinks = useMemo(() => {
    const items = effectiveWebsiteSettings.homePageContent?.socialMedia || [];
    return Array.isArray(items) ? items.filter((s: any) => s && typeof s.url === 'string' && s.url.trim()) : [];
  }, [effectiveWebsiteSettings.homePageContent?.socialMedia]);

  const socialIconMap: Record<string, any> = {
    Facebook: FiFacebook,
    Twitter: FiTwitter,
    Instagram: FiInstagram,
    LinkedIn: FiLinkedin,
    YouTube: FiYoutube,
  };

  useEffect(() => {
    const title = headerBrandName || 'Restaurant';
    if (title) document.title = title;

    const faviconUrl = effectiveWebsiteSettings.whiteLabel?.faviconUrl;
    if (!faviconUrl) return;

    const existing =
      (document.querySelector("link[rel='icon']") as HTMLLinkElement | null) ||
      (document.querySelector("link[rel='shortcut icon']") as HTMLLinkElement | null);
    const link = existing || document.createElement('link');
    link.rel = 'icon';
    link.href = faviconUrl;
    if (!existing) document.head.appendChild(link);
  }, [headerBrandName, effectiveWebsiteSettings.whiteLabel?.faviconUrl]);

  const navLinks = [
    { id: 'home', text: 'Home', url: `${baseUrl}` },
    { id: 'menu', text: 'Menu', url: `${baseUrl}/menu` },
    { id: 'about', text: 'About', url: `${baseUrl}/about` },
    { id: 'contact', text: 'Contact', url: `${baseUrl}/contact` },
  ];

  return (
    <div className="bg-white font-sans text-gray-800 flex flex-col min-h-screen">
      <PublicHeader 
        brandName={headerBrandName}
        logoUrl={effectiveWebsiteSettings.whiteLabel?.logoUrl}
        primaryColor={effectiveWebsiteSettings.whiteLabel?.primaryColor}
        onLoginClick={handleLoginClick}
        onRegisterClick={handleRegisterClick}
        navLinks={navLinks}
        cartCount={cartCount}
        onCartClick={toggleCart}
        homeUrl={baseUrl}
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
        currency={defaultCurrency}
        applicationSettings={effectiveApplicationSettings}
      />

      <main className="flex-grow">
        <Outlet context={{ outlet, baseUrl, addToCart, websiteSettings: effectiveWebsiteSettings, applicationSettings: effectiveApplicationSettings }} />
      </main>

      {/* Custom Footer */}
      <footer className="bg-gray-900 text-white pt-32 pb-10 px-4">
        <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 border-b border-gray-800 pb-12">
                <div className="md:col-span-1">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: accent }}>
                             <FiShoppingBag size={24} className="text-white" />
                        </div>
                        <span className="text-2xl font-bold">{headerBrandName || 'Restaurant App'}</span>
                    </div>
                    <h3 className="text-3xl font-serif font-bold mb-4">Ready to Explore? <br /> Place Your Order Now!</h3>
                    <p className="text-gray-400 text-sm">Subscribe for updates and exclusive offers.</p>
                </div>
                <div>
                    <h4 className="font-bold text-lg mb-6">Resources</h4>
                    <ul className="space-y-3 text-gray-400">
                        <li><button onClick={() => navigate(baseUrl)} className="transition-colors" style={{ color: '#9ca3af' }}>Home</button></li>
                        <li><button onClick={() => navigate(`${baseUrl}/about`)} className="transition-colors" style={{ color: '#9ca3af' }}>About Us</button></li>
                        <li><button onClick={() => navigate(`${baseUrl}/menu`)} className="transition-colors" style={{ color: '#9ca3af' }}>Menu</button></li>
                        <li><a href="#" className="hover:text-orange-500 transition-colors">Terms & Conditions</a></li>
                        <li><a href="#" className="hover:text-orange-500 transition-colors">Privacy Policy</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-lg mb-6">Contact Us</h4>
                    <ul className="space-y-4 text-gray-400">
                        <li className="flex items-start gap-3">
                            <FiMapPin className="text-orange-500 mt-1 flex-shrink-0" />
                            <span>{effectiveWebsiteSettings.contactUsContent?.address || '123 Food Street, Flavor Town, FT 12345'}</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <FiPhone className="text-orange-500 flex-shrink-0" />
                            <span>{effectiveWebsiteSettings.contactUsContent?.phone || '+1 234 567 890'}</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <FiMail className="text-orange-500 flex-shrink-0" />
                            <span>{effectiveWebsiteSettings.contactUsContent?.email || 'contact@restaurantapp.com'}</span>
                        </li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-lg mb-6">Follow Us</h4>
                    <div className="flex gap-4">
                        {socialLinks.length > 0 ? (
                          socialLinks.map((s: any) => {
                            const Icon = socialIconMap[s.platform] || FiInstagram;
                            return (
                              <a
                                key={s.id || s.platform}
                                href={s.url}
                                target="_blank"
                                rel="noreferrer"
                                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white transition-opacity"
                                style={{ backgroundColor: accent }}
                              >
                                <Icon />
                              </a>
                            );
                          })
                        ) : (
                          <>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all"><FiFacebook /></a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all"><FiTwitter /></a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all"><FiInstagram /></a>
                          </>
                        )}
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
