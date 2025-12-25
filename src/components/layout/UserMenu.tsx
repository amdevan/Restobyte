import React, { useState, useRef, useEffect } from 'react';
import { FiUser, FiLogOut, FiSettings, FiChevronUp } from 'react-icons/fi';

const UserMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={menuRef} className="relative mt-auto">
            {isOpen && (
                <div className="absolute bottom-full mb-2 w-full bg-sky-800 rounded-lg shadow-lg p-2">
                    <a href="#/profile" className="flex items-center space-x-3 text-sky-200 hover:bg-sky-700 p-2 rounded-md transition-colors">
                        <FiUser size={16} />
                        <span className="text-sm font-medium">Profile</span>
                    </a>
                    <a href="#/settings" className="flex items-center space-x-3 text-sky-200 hover:bg-sky-700 p-2 rounded-md transition-colors">
                        <FiSettings size={16} />
                        <span className="text-sm font-medium">Settings</span>
                    </a>
                    <div className="border-t border-sky-700 my-1"></div>
                    <a href="#/logout" className="flex items-center space-x-3 text-rose-300 hover:bg-rose-500/20 p-2 rounded-md transition-colors">
                        <FiLogOut size={16} />
                        <span className="text-sm font-medium">Logout</span>
                    </a>
                </div>
            )}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 bg-sky-800 hover:bg-sky-900/50 rounded-lg transition-colors"
            >
                <div className="flex items-center space-x-3">
                    <img src={`https://ui-avatars.com/api/?name=Admin+User&background=0ea5e9&color=fff&size=40`} alt="User Avatar" className="w-10 h-10 rounded-full" />
                    <div>
                        <p className="text-sm font-semibold text-white text-left">Admin User</p>
                        <p className="text-xs text-sky-300 text-left">Super Admin</p>
                    </div>
                </div>
                <FiChevronUp size={20} className={`text-sky-300 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
        </div>
    );
};

export default UserMenu;
