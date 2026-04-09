

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiLogOut } from 'react-icons/fi';
import Button from '../common/Button';
import { useRestaurantData } from '../../hooks/useRestaurantData';

type BrandingProps = {
  brandName?: string;
  logoUrl?: string;
  primaryColor?: string;
  hideAuthButtons?: boolean;
};

interface PublicHeaderProps extends BrandingProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
  navLinks?: { id: string; text: string; url: string }[];
  cartCount?: number;
  onCartClick?: () => void;
  user?: any;
  onLogout?: () => void;
}

const PublicHeader: React.FC<PublicHeaderProps> = ({ onLoginClick, onRegisterClick, brandName, logoUrl, primaryColor, hideAuthButtons, navLinks, cartCount, onCartClick, user, onLogout }) => {
  const navigate = useNavigate();
  const { saasWebsiteContent } = useRestaurantData();
  const { header } = saasWebsiteContent;

  const handleNavClick = (link: { id: string; text: string; url: string }) => {
    if (link.url.startsWith('#')) {
      const cleanedId = link.url.substring(1);
      const element = document.getElementById(cleanedId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(link.url);
    }
  };

  // const brand = ( ... ) // Removed as it's now inline
  
  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Brand */}
        <div className="flex items-center">
            {logoUrl ? (
                <Link to="/" className="text-2xl font-bold" style={primaryColor ? { color: primaryColor } : undefined}>
                    <img src={logoUrl} alt={brandName || 'Brand'} className="h-10" />
                </Link>
            ) : (
                 <Link to="/" className="text-2xl font-bold flex items-center gap-2">
                    <span className="bg-orange-500 p-1.5 rounded-lg text-white">
                         <FiShoppingCart size={20} />
                    </span>
                    <span className="text-gray-900">Restaurant<span className="text-orange-500">App</span></span>
                </Link>
            )}
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {(navLinks && navLinks.length > 0 ? navLinks : header.navLinks).map(link => (
            <button 
                key={link.id} 
                onClick={() => handleNavClick(link)} 
                className="text-gray-600 hover:text-orange-500 font-medium transition-colors text-sm uppercase tracking-wide"
            >
              {link.text}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-4">
             {/* Cart Button */}
            {onCartClick && (
                <button onClick={onCartClick} className="relative p-2 text-gray-600 hover:text-orange-500 transition-colors">
                    <FiShoppingCart size={24} />
                    {cartCount !== undefined && cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {cartCount}
                        </span>
                    )}
                </button>
            )}

            {!hideAuthButtons && (
                user ? (
                    <div className="flex items-center gap-3">
                        <Link to={user.roleId === 'role-customer' ? "/customer/dashboard" : "#"} className="flex items-center gap-2 hover:bg-gray-100 p-1 rounded-lg transition-colors">
                             <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                                <FiUser />
                            </div>
                            <span className="text-sm font-medium text-gray-700 hidden md:block">Hi, {user.username || user.name}</span>
                        </Link>
                        {onLogout && (
                             <button onClick={onLogout} className="text-gray-500 hover:text-red-500 transition-colors p-1" title="Logout">
                                <FiLogOut size={20} />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="hidden md:flex items-center space-x-2">
                         <button onClick={onLoginClick} className="px-6 py-2 rounded-full font-bold text-gray-700 hover:text-orange-500 transition-colors">
                            Login
                        </button>
                        <button onClick={onRegisterClick} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full font-bold transition-colors shadow-lg shadow-orange-500/30">
                            Register
                        </button>
                    </div>
                )
            )}
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;
