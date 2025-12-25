import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
    FiSearch, FiBell, FiChevronDown,
    FiUser, FiSettings, FiLogOut, FiHome, FiCheck,
    FiShoppingCart, FiGrid, FiMonitor, FiCalendar
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { Outlet } from '../../types';
import Button from '../common/Button';
import OutletSelector from '../common/OutletSelector';


const UserMenuDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { user, logout } = useAuth();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!user) {
        return null;
    }

    const handleLogout = () => {
        logout();
    };

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-gray-100 transition-all duration-200 hover:scale-105"
            >
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=0ea5e9&color=fff&size=36`} alt="User Avatar" className="w-9 h-9 rounded-full" />
                <span className="hidden md:block text-sm font-semibold text-gray-700">{user.username}</span>
                <FiChevronDown size={16} className={`hidden md:block text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none py-1 z-50">
                    <div className="px-4 py-2 border-b">
                        <p className="text-sm font-semibold text-gray-800 capitalize">{user.username}</p>
                        <p className="text-xs text-gray-500">{user.username}@restobyte.app</p>
                    </div>
                    <Link to="/app/account-user" className="flex items-center w-full text-left px-4 hover:pl-5 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-sky-600 transition-all duration-200">
                        <FiUser className="mr-3"/> Profile
                    </Link>
                    <Link to="/app/settings/app-settings" className="flex items-center w-full text-left px-4 hover:pl-5 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-sky-600 transition-all duration-200">
                        <FiSettings className="mr-3"/> Settings
                    </Link>
                    <div className="border-t my-1"></div>
                    <button onClick={handleLogout} className="flex items-center w-full text-left px-4 hover:pl-5 py-2 text-sm text-red-600 hover:bg-red-50 transition-all duration-200">
                        <FiLogOut className="mr-3"/> Logout
                    </button>
                </div>
            )}
        </div>
    );
};


interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { getSingleActiveOutlet } = useRestaurantData();

    const outlet = getSingleActiveOutlet();
    const isCloudKitchen = outlet?.outletType === 'CloudKitchen';
    const isAggregateView = !outlet;
    const showOutletSelectorInHeader = !location.pathname.startsWith('/app/dashboard');


    const actions = [
        { path: '/app/panel/pos', label: 'POS', icon: <FiShoppingCart size={16}/> },
        { path: '/app/tables', label: 'Tables', icon: <FiGrid size={16}/>, cloudKitchenHidden: true },
        { path: '/app/panel/kitchen-display', label: 'KDS', icon: <FiMonitor size={16}/> },
        { path: '/app/reservations', label: 'Reservations', icon: <FiCalendar size={16}/>, cloudKitchenHidden: true },
    ];
    
    const visibleActions = actions.filter(a => !(isCloudKitchen && a.cloudKitchenHidden) && !isAggregateView);

  return (
    <header className="bg-white shadow-sm p-3 flex-shrink-0 grid grid-cols-3 items-center z-20 border-b">
        {/* Left side: Title */}
        <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
            {showOutletSelectorInHeader && <OutletSelector />}
        </div>

        {/* Center: Global Action Bar */}
        <div className="flex justify-center">
            {visibleActions.length > 0 && (
                 <div className="flex items-center space-x-1 bg-gray-100 p-1.5 rounded-full shadow-sm">
                    {visibleActions.map(action => (
                        <Button
                            key={action.path}
                            size="sm"
                            variant={location.pathname.startsWith(action.path) ? 'primary' : 'secondary'}
                            onClick={() => navigate(action.path)}
                            leftIcon={action.icon}
                            className="!rounded-full"
                        >
                            {action.label}
                        </Button>
                    ))}
                </div>
            )}
        </div>

        {/* Right side: User Menu */}
        <div className="flex items-center space-x-4 justify-end">
            <UserMenuDropdown />
        </div>
    </header>
  );
};

export default Header;