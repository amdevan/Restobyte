

import React, { useState, useEffect } from 'react';
import { SaasHeader, SaasNavLink } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

interface CMSHeaderFormProps {
    header: SaasHeader;
    onUpdate: (header: SaasHeader) => void;
}

const CMSHeaderForm: React.FC<CMSHeaderFormProps> = ({ header, onUpdate }) => {
    const [localHeader, setLocalHeader] = useState(header);

    useEffect(() => {
        setLocalHeader(header);
    }, [header]);
    
    const updateHeader = (updatedHeader: SaasHeader) => {
        setLocalHeader(updatedHeader);
        onUpdate(updatedHeader);
    }

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateHeader({ ...localHeader, logoUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleLinkChange = (id: string, field: 'text' | 'url', value: string) => {
        const newLinks = localHeader.navLinks.map(link => 
            link.id === id ? { ...link, [field]: value } : link
        );
        updateHeader({ ...localHeader, navLinks: newLinks });
    };

    const handleAddLink = () => {
        const newLink: SaasNavLink = { id: `new-${Date.now()}`, text: '', url: '' };
        updateHeader({ ...localHeader, navLinks: [...localHeader.navLinks, newLink] });
    };

    const handleRemoveLink = (id: string) => {
        updateHeader({ ...localHeader, navLinks: localHeader.navLinks.filter(link => link.id !== id) });
    };

    return (
        <div className="p-4 space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                <input 
                    type="file" 
                    onChange={handleLogoChange} 
                    accept="image/*" 
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                />
                {localHeader.logoUrl && <img src={localHeader.logoUrl} alt="Logo Preview" className="mt-2 h-16 w-auto rounded border p-1 bg-gray-50" />}
            </div>
            
            <div>
                <h4 className="text-md font-medium text-gray-700 mb-2">Navigation Links</h4>
                <div className="space-y-2">
                    {localHeader.navLinks.map(link => (
                        <div key={link.id} className="flex items-center space-x-2 p-2 border rounded-md">
                            <Input label="Text" value={link.text} onChange={e => handleLinkChange(link.id, 'text', e.target.value)} containerClassName="mb-0 flex-grow" />
                            <Input label="URL" value={link.url} onChange={e => handleLinkChange(link.id, 'url', e.target.value)} placeholder="#features or /about" containerClassName="mb-0 flex-grow" />
                            <Button variant="danger" size="sm" onClick={() => handleRemoveLink(link.id)} className="!p-2.5 self-end"><FiTrash2 size={16}/></Button>
                        </div>
                    ))}
                </div>
                <Button onClick={handleAddLink} leftIcon={<FiPlus/>} size="sm" variant="secondary" className="mt-2">Add Nav Link</Button>
            </div>
        </div>
    );
};

export default CMSHeaderForm;