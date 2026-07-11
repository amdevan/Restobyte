




import React, { useState } from 'react';
// FIX: Refactored to use named imports for react-router-dom for consistency.
import { Link, useLocation } from 'react-router-dom';
import { FiGrid, FiUsers, FiCreditCard, FiDollarSign, FiSettings, FiLogOut, FiGlobe, FiChevronRight, FiMenu, FiChevronLeft } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import Footer from '@/components/layout/Footer';
import { getSaaSBasePath } from '@/utils/domain';
import { useIsInstalledApp } from '@/hooks/useIsInstalledApp';

interface NavLinkProps {
    to: string;
    icon: React.ReactNode;
    label: string;
    isSubItem?: boolean;
    isCollapsed?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, label, isSubItem = false, isCollapsed = false }) => {
    const location = useLocation();
    const isActive = location.pathname.startsWith(to);

    return (
        <Link
            to={to}
            className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                isCollapsed ? 'justify-center' : 'space-x-3'
            } ${isSubItem ? (isCollapsed ? 'hidden' : 'pl-10 text-sm') : ''} ${
                isActive ? 'bg-[#131a22] text-amber-200 ring-1 ring-amber-400/20' : 'text-slate-300 hover:bg-white/5 hover:text-amber-100'
            }`}
        >
            {icon}
            {!isCollapsed && <span className="font-medium">{label}</span>}
        </Link>
    );
};

const CollapsibleNavLink: React.FC<{
    basePath: string;
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
    isCollapsed?: boolean;
}> = ({ basePath, icon, label, children, isCollapsed = false }) => {
    const location = useLocation();
    const isParentActive = location.pathname.startsWith(basePath);
    const [isOpen, setIsOpen] = useState(isParentActive);

    if (isCollapsed) {
        return (
            <NavLink
                to={basePath}
                icon={icon}
                label={label}
                isCollapsed
            />
        );
    }

    return (
        <div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                    isParentActive ? 'bg-[#131a22] text-amber-200 ring-1 ring-amber-400/20' : 'text-slate-300 hover:bg-white/5 hover:text-amber-100'
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
    const basePath = getSaaSBasePath();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const isInstalledApp = useIsInstalledApp();

    return (
        <div className="flex h-screen bg-gray-200">
            <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-[#0b0f14] text-white p-4 flex flex-col transition-all duration-300 shadow-2xl border-r border-white/5`}>
                <div className="text-2xl font-black text-center text-white py-4 mb-4 rounded-xl bg-gradient-to-b from-white/5 to-transparent ring-1 ring-white/10">
                    {isSidebarCollapsed ? <span className="text-amber-300">SA</span> : <>SaaS <span className="text-amber-300">Admin</span></>}
                </div>
                <nav className="flex-grow space-y-2">
                    <NavLink to={`${basePath}/dashboard`} icon={<FiGrid size={20} />} label="Dashboard" isCollapsed={isSidebarCollapsed} />
                    <NavLink to={`${basePath}/plans`} icon={<FiCreditCard size={20} />} label="Plans" isCollapsed={isSidebarCollapsed} />
                    <NavLink to={`${basePath}/tenants`} icon={<FiUsers size={20} />} label="Tenants" isCollapsed={isSidebarCollapsed} />
                    <NavLink to={`${basePath}/crm/leads`} icon={<FiDollarSign size={20} />} label="CRM" isCollapsed={isSidebarCollapsed} />
                    <NavLink to={`${basePath}/cms/products`} icon={<FiGrid size={20} />} label="Products (Shop)" isCollapsed={isSidebarCollapsed} />
                    
                    <CollapsibleNavLink basePath={`${basePath}/cms`} icon={<FiGlobe size={20} />} label="Website & CMS" isCollapsed={isSidebarCollapsed}>
                         <NavLink to={`${basePath}/cms/home`} icon={<></>} label="Homepage Sections" isSubItem />
                         <NavLink to={`${basePath}/cms/header-footer`} icon={<></>} label="Header & Footer" isSubItem />
                         <NavLink to={`${basePath}/cms/pages`} icon={<></>} label="Content Pages" isSubItem />
                         <NavLink to={`${basePath}/cms/blogs`} icon={<></>} label="Blog Posts" isSubItem />
                         <NavLink to={`${basePath}/cms/seo`} icon={<></>} label="SEO" isSubItem />
                    </CollapsibleNavLink>

                    <NavLink to={`${basePath}/settings`} icon={<FiSettings size={20} />} label="Settings" isCollapsed={isSidebarCollapsed} />
                </nav>
                <div className="mt-auto">
                     <button
                        onClick={logout}
                        className={`flex items-center w-full p-3 rounded-lg text-slate-300 hover:bg-white/5 hover:text-amber-100 transition-colors ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}`}
                    >
                        <FiLogOut size={20} />
                        {!isSidebarCollapsed && <span className="font-medium">Logout</span>}
                    </button>
                </div>
            </aside>
            <div className="flex-1 flex flex-col overflow-hidden">
                {!isInstalledApp && (
                    <header className="bg-white shadow-sm p-4 z-10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setIsSidebarCollapsed(v => !v)}
                                className="p-2 rounded-md hover:bg-gray-100 text-gray-700"
                                aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            >
                                {isSidebarCollapsed ? <FiMenu size={20} /> : <FiChevronLeft size={20} />}
                            </button>
                            <h1 className="text-xl font-semibold text-gray-800">
                                Welcome, {user?.username || 'Super Admin'}!
                            </h1>
                        </div>
                    </header>
                )}
                <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {children}
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default SaaSLayout;
