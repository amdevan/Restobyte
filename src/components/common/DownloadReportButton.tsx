
import React, { useState, useRef, useEffect } from 'react';
import Button from './Button';
import { FiDownload, FiChevronDown, FiFileText } from 'react-icons/fi';

interface DownloadReportButtonProps {
    onDownload: (format: 'PDF' | 'Excel' | 'CSV') => void;
}

const DownloadReportButton: React.FC<DownloadReportButtonProps> = ({ onDownload }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleOptionClick = (format: 'PDF' | 'Excel' | 'CSV') => {
        onDownload(format);
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <div>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsOpen(!isOpen)}
                    leftIcon={<FiDownload />}
                    rightIcon={<FiChevronDown />}
                >
                    Download
                </Button>
            </div>

            {isOpen && (
                <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button"
                >
                    <div className="py-1" role="none">
                        <button
                            onClick={() => handleOptionClick('PDF')}
                            className="text-gray-700 flex items-center w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            role="menuitem"
                        >
                            <FiFileText className="mr-2" />
                            PDF
                        </button>
                        <button
                            onClick={() => handleOptionClick('Excel')}
                            className="text-gray-700 flex items-center w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            role="menuitem"
                        >
                           <FiFileText className="mr-2" />
                            Excel
                        </button>
                        <button
                            onClick={() => handleOptionClick('CSV')}
                            className="text-gray-700 flex items-center w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            role="menuitem"
                        >
                            <FiFileText className="mr-2" />
                            CSV
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DownloadReportButton;
