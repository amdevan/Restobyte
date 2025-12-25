




import React, { useState } from 'react';
// FIX: Refactored to use named imports for react-router-dom for consistency.
import { Link, useLocation } from 'react-router-dom';
import { FiGrid, FiUsers, FiCreditCard, FiDollarSign, FiSettings, FiLogOut, FiGlobe, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import Footer from '@/components/layout/Footer';

interface NavLinkProps {
    to: string;
    icon: React.ReactNode;
    label: string;
    isSubItem?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, label, isSubItem = false }) => {
    const location = useLocation();
    const isActive = location.pathname.startsWith(to);

    return (
        <Link
            to={to}
            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                isSubItem ? 'pl-10 text-sm' : ''
            } ${
                isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
            }`}
        >
            {icon}
            <span className="font-medium">{label}</span>
        </Link>
    );
};

const CollapsibleNavLink: React.FC<{
    basePath: string;
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
}> = ({ basePath, icon, label, children }) => {
    const location = useLocation();
    const isParentActive = location.pathname.startsWith(basePath);
    const [isOpen, setIsOpen] = useState(isParentActive);

    return (
        <div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                    isParentActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
            >
                <div className="flex items-center space-x-3">
                    {icon}
                    <span className="font-medium">{label}</span>
                </div>
                <FiChevronRight size={16} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>
            <div className={`pl-4 pt-1 space-y-1 overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                {children}
            </div>
        </div>
    );
};


const SaaSLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout } = useAuth();

    return (
        <div className="flex h-screen bg-gray-200">
            <aside className="w-64 bg-gray-800 text-white p-4 flex flex-col">
                <div className="text-2xl font-bold text-center text-white py-4 mb-4">
                    SaaS Admin
                </div>
                <nav className="flex-grow space-y-2">
                    <NavLink to="/saas/dashboard" icon={<FiGrid size={20} />} label="Dashboard" />
                    <NavLink to="/saas/tenants" icon={<FiUsers size={20} />} label="Tenants" />
                    <NavLink to="/saas/plans" icon={<FiCreditCard size={20} />} label="Plans" />
                    
                    <CollapsibleNavLink basePath="/saas/cms" icon={<FiGlobe size={20} />} label="Website & CMS">
                         <NavLink to="/saas/cms/home" icon={<></>} label="Homepage Sections" isSubItem />
                         <NavLink to="/saas/cms/header-footer" icon={<></>} label="Header & Footer" isSubItem />
                         <NavLink to="/saas/cms/pages" icon={<></>} label="Content Pages" isSubItem />
                         <NavLink to="/saas/cms/blogs" icon={<></>} label="Blog Posts" isSubItem />
                         <NavLink to="/saas/cms/seo" icon={<></>} label="SEO" isSubItem />
                    </CollapsibleNavLink>

                    <NavLink to="/saas/settings" icon={<FiSettings size={20} />} label="Settings" />
                </nav>
                <div className="mt-auto">
                     <button
                        onClick={logout}
                        className="flex items-center space-x-3 w-full p-3 rounded-lg text-gray-300 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                    >
                        <FiLogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm p-4 z-10">
                    <h1 className="text-xl font-semibold text-gray-800">
                        Welcome, {user?.username || 'Super Admin'}!
                    </h1>
                </header>
                <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {children}
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default SaaSLayout;
