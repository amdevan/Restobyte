import React, { useState, useRef, useEffect } from 'react';
import { FiHome, FiChevronDown } from 'react-icons/fi';
import { useRestaurantData } from '../../hooks/useRestaurantData';

const OutletSelector: React.FC = () => {
    const { outlets, activeOutletIds, setActiveOutletIds } = useRestaurantData();
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

    const handleSelectionChange = (outletId: string) => {
        const newSelection = activeOutletIds.includes(outletId)
            ? activeOutletIds.filter(id => id !== outletId)
            : [...activeOutletIds, outletId];
        
        // Prevent deselecting all outlets
        if (newSelection.length === 0) {
            return;
        }

        setActiveOutletIds(newSelection);
    };

    const handleSelectAll = () => {
        const allOutletIds = outlets.map(o => o.id);
        if (activeOutletIds.length === allOutletIds.length) {
            // Do not allow deselecting all
        } else {
            setActiveOutletIds(allOutletIds);
        }
    };

    const isAllSelected = activeOutletIds.length === outlets.length && outlets.length > 0;
    const selectionText = activeOutletIds.length === 1 
        ? outlets.find(o => o.id === activeOutletIds[0])?.name || 'Select Outlet'
        : activeOutletIds.length === outlets.length && outlets.length > 0
        ? 'All Outlets'
        : activeOutletIds.length > 1
        ? `${activeOutletIds.length} Outlets Selected`
        : 'Select Outlet';

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
                <FiHome size={16} className="text-gray-600" />
                <span className="text-sm font-semibold text-gray-700 max-w-[150px] truncate">{selectionText}</span>
                <FiChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-2 w-72 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none py-1 z-50">
                     <div className="px-3 py-2 border-b">
                        <label className="w-full flex items-center text-sm text-gray-700 hover:bg-gray-100 p-2 rounded-md cursor-pointer">
                            <input
                                type="checkbox"
                                onChange={handleSelectAll}
                                checked={isAllSelected}
                                className="h-4 w-4 rounded text-sky-600 focus:ring-sky-500 border-gray-300"
                            />
                            <span className="ml-3 font-semibold">Select All Outlets</span>
                        </label>
                     </div>
                     <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {outlets.map(outlet => (
                             <label key={outlet.id} className="w-full flex items-center text-sm text-gray-700 hover:bg-gray-100 p-3 cursor-pointer">
                                 <input
                                     type="checkbox"
                                     value={outlet.id}
                                     checked={activeOutletIds.includes(outlet.id)}
                                     onChange={() => handleSelectionChange(outlet.id)}
                                     disabled={activeOutletIds.length === 1 && activeOutletIds.includes(outlet.id)} // Prevent deselecting last one
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
