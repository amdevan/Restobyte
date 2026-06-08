import React, { useState, useRef, useEffect } from 'react';
import { FiHome, FiChevronDown } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { useAuth } from '../../hooks/useAuth';

const OutletSelector: React.FC = () => {
    const { outlets, activeOutletIds, setActiveOutletIds } = useRestaurantData();
    const { user, isAuthenticated } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const location = useLocation();
    const isPos = location.pathname.startsWith('/app/panel/pos');
    const allowedOutletIds = isAuthenticated && user && !user.isSuperAdmin
        ? (Array.isArray(user.outletIds) && user.outletIds.length > 0 ? user.outletIds : (user.outletId ? [user.outletId] : []))
        : outlets.map(o => o.id);
    const filteredOutlets = outlets.filter(o => allowedOutletIds.includes(o.id));
    const isLockedToOutlet = allowedOutletIds.length <= 1;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectionChange = (outletId: string) => {
        if (isPos) {
            setActiveOutletIds([outletId]);
            setIsOpen(false);
            return;
        }

        const newSelection = activeOutletIds.includes(outletId)
            ? activeOutletIds.filter(id => id !== outletId)
            : [...activeOutletIds, outletId];
        
        if (newSelection.length === 0) {
            return;
        }

        setActiveOutletIds(newSelection);
    };

    const handleSelectAll = () => {
        const allOutletIds = filteredOutlets.map(o => o.id);
        if (activeOutletIds.length === allOutletIds.length) {
            // Do not allow deselecting all
        } else {
            setActiveOutletIds(allOutletIds);
        }
    };

    const isAllSelected = activeOutletIds.length === filteredOutlets.length && filteredOutlets.length > 0;
    const selectionText = activeOutletIds.length === 1 
        ? outlets.find(o => o.id === activeOutletIds[0])?.name || 'Select Outlet'
        : activeOutletIds.length === filteredOutlets.length && filteredOutlets.length > 0
        ? 'All Outlets'
        : activeOutletIds.length > 1
        ? `${activeOutletIds.length} Outlets Selected`
        : 'Select Outlet';

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={isLockedToOutlet ? undefined : () => setIsOpen(!isOpen)}
                disabled={isLockedToOutlet}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border shadow-sm transition-colors ${isLockedToOutlet ? 'bg-white border-gray-200 opacity-80 cursor-default' : isOpen ? 'bg-white border-gray-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
            >
                <FiHome size={16} className="text-gray-600" />
                <span className="text-sm font-semibold text-gray-700 max-w-[150px] truncate">{selectionText}</span>
                {!isLockedToOutlet && (
                    <FiChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                )}
            </button>

            {isOpen && !isLockedToOutlet && (
                <div className="absolute left-0 mt-2 w-full sm:w-72 bg-white rounded-2xl shadow-2xl ring-1 ring-gray-200/70 focus:outline-none overflow-hidden z-[210]">
                     {!isPos && (
                        <div className="px-3 py-2 border-b border-gray-200/70 bg-gray-50/60">
                            <label className="w-full flex items-center text-sm text-gray-700 hover:bg-gray-100/70 p-2 rounded-xl cursor-pointer">
                                <input
                                    type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={isAllSelected}
                                    className="h-4 w-4 rounded text-sky-600 focus:ring-sky-500 border-gray-300"
                                />
                                <span className="ml-3 font-semibold">Select All Outlets</span>
                            </label>
                        </div>
                     )}
                     <div className="max-h-60 overflow-y-auto custom-scrollbar py-1">
                        {filteredOutlets.map(outlet => (
                             <label key={outlet.id} className="w-full flex items-center text-sm text-gray-700 hover:bg-gray-100/70 px-3 py-2 cursor-pointer">
                                 <input
                                     type={isPos ? "radio" : "checkbox"}
                                     name={isPos ? "activeOutlet" : undefined}
                                     value={outlet.id}
                                     checked={activeOutletIds.includes(outlet.id)}
                                     onChange={() => handleSelectionChange(outlet.id)}
                                     disabled={!isPos && activeOutletIds.length === 1 && activeOutletIds.includes(outlet.id)}
                                     className="h-4 w-4 rounded text-sky-600 focus:ring-sky-500 border-gray-300"
                                 />
                                 <span className="ml-3">{outlet.name}</span>
                             </label>
                        ))}
                     </div>
                </div>
            )}
        </div>
    );
};

export default OutletSelector;
