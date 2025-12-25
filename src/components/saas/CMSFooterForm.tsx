

import React, { useState, useEffect } from 'react';
import { SaasFooter, SaasFooterColumn, SaasFooterLink, WebsiteSocialMediaLink } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

interface CMSFooterFormProps {
    footer: SaasFooter;
    onUpdate: (footer: SaasFooter) => void;
}

const SOCIAL_PLATFORMS: WebsiteSocialMediaLink['platform'][] = ['Facebook', 'Instagram', 'Twitter', 'YouTube', 'LinkedIn'];

const CMSFooterForm: React.FC<CMSFooterFormProps> = ({ footer, onUpdate }) => {
    const [localFooter, setLocalFooter] = useState(footer);

    useEffect(() => {
        setLocalFooter(footer);
    }, [footer]);

    const updateFooter = (updatedFooter: SaasFooter) => {
        setLocalFooter(updatedFooter);
        onUpdate(updatedFooter);
    };

    // --- General ---
    const handleCopyrightChange = (value: string) => {
        updateFooter({ ...localFooter, copyright: value });
    };

    // --- Columns & Links ---
    const handleColumnChange = (colId: string, value: string) => {
        const newCols = localFooter.columns.map(c => c.id === colId ? { ...c, title: value } : c);
        updateFooter({ ...localFooter, columns: newCols });
    };
    const handleAddColumn = () => {
        const newCol: SaasFooterColumn = { id: `new-col-${Date.now()}`, title: 'New Column', links: [{ id: `new-link-${Date.now()}`, text: '', url: '' }] };
        updateFooter({ ...localFooter, columns: [...localFooter.columns, newCol] });
    };
    const handleRemoveColumn = (colId: string) => {
        updateFooter({ ...localFooter, columns: localFooter.columns.filter(c => c.id !== colId) });
    };
    const handleLinkChange = (colId: string, linkId: string, field: 'text' | 'url', value: string) => {
        const newCols = localFooter.columns.map(c => {
            if (c.id === colId) {
                const newLinks = c.links.map(l => l.id === linkId ? { ...l, [field]: value } : l);
                return { ...c, links: newLinks };
            }
            return c;
        });
        updateFooter({ ...localFooter, columns: newCols });
    };
    const handleAddLink = (colId: string) => {
        const newCols = localFooter.columns.map(c => {
            if (c.id === colId) {
                const newLink: SaasFooterLink = { id: `new-link-${Date.now()}`, text: '', url: '' };
                return { ...c, links: [...c.links, newLink] };
            }
            return c;
        });
        updateFooter({ ...localFooter, columns: newCols });
    };
    const handleRemoveLink = (colId: string, linkId: string) => {
        const newCols = localFooter.columns.map(c => {
            if (c.id === colId) {
                return { ...c, links: c.links.filter(l => l.id !== linkId) };
            }
            return c;
        });
        updateFooter({ ...localFooter, columns: newCols });
    };
    
     // --- Social Links ---
    const handleSocialLinkChange = (id: string, field: 'platform' | 'url', value: string) => {
        const newLinks = localFooter.socialLinks.map(link => 
            link.id === id ? { ...link, [field]: value } : link
        );
        updateFooter({ ...localFooter, socialLinks: newLinks });
    };
     const handleAddSocialLink = () => {
        const newLink: WebsiteSocialMediaLink = { id: `new-social-${Date.now()}`, platform: 'Facebook', url: '' };
        updateFooter({ ...localFooter, socialLinks: [...localFooter.socialLinks, newLink] });
    };
    const handleRemoveSocialLink = (id: string) => {
        updateFooter({ ...localFooter, socialLinks: localFooter.socialLinks.filter(link => link.id !== id) });
    };

    return (
        <div className="p-4 space-y-6">
            <Input label="Copyright Text" value={localFooter.copyright} onChange={e => handleCopyrightChange(e.target.value)} />
            
            {/* Social Links */}
            <div>
                <h4 className="text-md font-medium text-gray-700 mb-2">Social Media Links</h4>
                <div className="space-y-2">
                    {localFooter.socialLinks.map(link => (
                        <div key={link.id} className="flex items-center space-x-2 p-2 border rounded-md">
                            <select value={link.platform} onChange={e => handleSocialLinkChange(link.id, 'platform', e.target.value)} className="p-2 border rounded-md">
                                {SOCIAL_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <Input label="URL" value={link.url} onChange={e => handleSocialLinkChange(link.id, 'url', e.target.value)} containerClassName="mb-0 flex-grow" />
                            <Button variant="danger" size="sm" onClick={() => handleRemoveSocialLink(link.id)} className="!p-2.5 self-end"><FiTrash2 size={16}/></Button>
                        </div>
                    ))}
                </div>
                <Button onClick={handleAddSocialLink} leftIcon={<FiPlus/>} size="sm" variant="secondary" className="mt-2">Add Social Link</Button>
            </div>

            {/* Link Columns */}
            <div>
                <h4 className="text-md font-medium text-gray-700 mb-2">Footer Link Columns</h4>
                <div className="space-y-4">
                    {localFooter.columns.map(col => (
                        <div key={col.id} className="p-3 border rounded-lg bg-gray-50/50">
                             <div className="flex items-center space-x-2 mb-2">
                                <Input label="Column Title" value={col.title} onChange={e => handleColumnChange(col.id, e.target.value)} containerClassName="mb-0 flex-grow"/>
                                <Button variant="danger" size="sm" onClick={() => handleRemoveColumn(col.id)}><FiTrash2/></Button>
                            </div>
                            <div className="space-y-2 pl-4 border-l-2">
                                {col.links.map(link => (
                                    <div key={link.id} className="flex items-end space-x-2">
                                        <Input label="Link Text" value={link.text} onChange={e => handleLinkChange(col.id, link.id, 'text', e.target.value)} containerClassName="mb-0 flex-grow"/>
                                        <Input label="URL" value={link.url} onChange={e => handleLinkChange(col.id, link.id, 'url', e.target.value)} containerClassName="mb-0 flex-grow"/>
                                        <Button variant="danger" size="sm" onClick={() => handleRemoveLink(col.id, link.id)} className="!p-1.5"><FiTrash2 size={12}/></Button>
                                    </div>
                                ))}
                                <Button onClick={() => handleAddLink(col.id)} leftIcon={<FiPlus/>} size="sm" variant="outline" className="mt-2">Add Link</Button>
                            </div>
                        </div>
                    ))}
                </div>
                <Button onClick={handleAddColumn} leftIcon={<FiPlus/>} size="sm" variant="secondary" className="mt-2">Add Column</Button>
            </div>
        </div>
    );
};

export default CMSFooterForm;