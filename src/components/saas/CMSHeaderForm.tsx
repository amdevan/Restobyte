

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
    
    const handleLinkChange = (id: string, field: 'text' | 'url', value: string, parentId?: string) => {
        let newLinks;
        if (parentId) {
            newLinks = localHeader.navLinks.map(link => 
                link.id === parentId 
                    ? { 
                        ...link, 
                        subLinks: link.subLinks?.map(sub => sub.id === id ? { ...sub, [field]: value } : sub) 
                      } 
                    : link
            );
        } else {
            newLinks = localHeader.navLinks.map(link => 
                link.id === id ? { ...link, [field]: value } : link
            );
        }
        updateHeader({ ...localHeader, navLinks: newLinks });
    };

    const handleAddLink = (parentId?: string) => {
        const newLink: SaasNavLink = { id: `new-${Date.now()}`, text: '', url: '' };
        if (parentId) {
            const newLinks = localHeader.navLinks.map(link => 
                link.id === parentId 
                    ? { ...link, subLinks: [...(link.subLinks || []), newLink] } 
                    : link
            );
            updateHeader({ ...localHeader, navLinks: newLinks });
        } else {
            updateHeader({ ...localHeader, navLinks: [...localHeader.navLinks, newLink] });
        }
    };

    const handleRemoveLink = (id: string, parentId?: string) => {
        let newLinks;
        if (parentId) {
            newLinks = localHeader.navLinks.map(link => 
                link.id === parentId 
                    ? { ...link, subLinks: link.subLinks?.filter(sub => sub.id !== id) } 
                    : link
            );
        } else {
            newLinks = localHeader.navLinks.filter(link => link.id !== id);
        }
        updateHeader({ ...localHeader, navLinks: newLinks });
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
                <div className="space-y-4">
                    {localHeader.navLinks.map(link => (
                        <div key={link.id} className="p-4 border rounded-xl bg-gray-50 space-y-3">
                            <div className="flex items-center space-x-2">
                                <Input label="Menu Text" value={link.text} onChange={e => handleLinkChange(link.id, 'text', e.target.value)} containerClassName="mb-0 flex-grow" />
                                <Input label="URL" value={link.url} onChange={e => handleLinkChange(link.id, 'url', e.target.value)} placeholder="#features or /about" containerClassName="mb-0 flex-grow" />
                                <Button variant="danger" size="sm" onClick={() => handleRemoveLink(link.id)} className="!p-2.5 self-end"><FiTrash2 size={16}/></Button>
                            </div>
                            
                            <div className="pl-6 border-l-2 border-gray-200 space-y-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sub-menu Links</p>
                                {link.subLinks?.map(sub => (
                                    <div key={sub.id} className="flex items-center space-x-2 bg-white p-2 rounded-lg border">
                                        <Input label="Sub Text" value={sub.text} onChange={e => handleLinkChange(sub.id, 'text', e.target.value, link.id)} containerClassName="mb-0 flex-grow" />
                                        <Input label="Sub URL" value={sub.url} onChange={e => handleLinkChange(sub.id, 'url', e.target.value, link.id)} placeholder="/features/orders" containerClassName="mb-0 flex-grow" />
                                        <Button variant="danger" size="sm" onClick={() => handleRemoveLink(sub.id, link.id)} className="!p-2.5 self-end"><FiTrash2 size={16}/></Button>
                                    </div>
                                ))}
                                <Button onClick={() => handleAddLink(link.id)} leftIcon={<FiPlus/>} size="sm" variant="secondary" className="mt-1">Add Sub Link</Button>
                            </div>
                        </div>
                    ))}
                </div>
                <Button onClick={() => handleAddLink()} leftIcon={<FiPlus/>} size="sm" variant="primary" className="mt-4">Add Main Menu Item</Button>
            </div>
        </div>
    );
};

export default CMSHeaderForm;