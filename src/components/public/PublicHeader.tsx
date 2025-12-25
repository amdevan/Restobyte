

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
}

const PublicHeader: React.FC<PublicHeaderProps> = ({ onLoginClick, onRegisterClick, brandName, logoUrl, primaryColor, hideAuthButtons, navLinks }) => {
  const navigate = useNavigate();
  const { saasWebsiteContent } = useRestaurantData();
  const { header } = saasWebsiteContent;

  const handleScrollTo = (id: string) => {
    const cleanedId = id.startsWith('#') ? id.substring(1) : id;
    const element = document.getElementById(cleanedId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(`/${id}`);
    }
  };

  const brand = (
    <Link to="/" className="text-2xl font-bold" style={primaryColor ? { color: primaryColor } : undefined}>
      {logoUrl ? (
        <img src={logoUrl} alt={brandName || 'Brand'} className="h-8" />
      ) : (
        <span>
          {brandName || (
            <>
              Resto<span className="text-amber-500">Byte</span>
            </>
          )}
        </span>
      )}
    </Link>
  );

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {brand}
        <nav className="hidden md:flex space-x-8">
          {(navLinks && navLinks.length > 0 ? navLinks : header.navLinks).map(link => (
            <button key={link.id} onClick={() => handleScrollTo(link.url)} className="text-gray-600 hover:text-sky-600 font-medium transition-colors">
              {link.text}
            </button>
          ))}
        </nav>
        {!hideAuthButtons && (
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onLoginClick}>Login</Button>
            <Button variant="primary" onClick={onRegisterClick}>Register</Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default PublicHeader;
