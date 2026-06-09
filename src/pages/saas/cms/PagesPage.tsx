

import React, { useState } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { SaasPage, SaasNavLink } from '@/types';
import { FiEdit, FiFileText, FiPlusCircle, FiTrash2, FiRefreshCcw, FiLink } from 'react-icons/fi';
import Input from '@/components/common/Input';
import RichTextEditor from '@/components/common/RichTextEditor';

const PageEditForm: React.FC<{
    page: SaasPage;
    onSave: (updatedPage: SaasPage) => Promise<void>;
    onClose: () => void;
}> = ({ page, onSave, onClose }) => {
    const [localPage, setLocalPage] = useState(page);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (field: keyof SaasPage, value: string) => {
        setLocalPage(prev => ({...prev, [field]: value}));
    }

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleChange('imageUrl', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void (async () => {
            setIsSaving(true);
            setSaveError(null);
            try {
                await onSave(localPage);
                onClose();
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to save.';
                setSaveError(message);
            } finally {
                setIsSaving(false);
            }
        })();
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar p-1">
            <Input label="Page Title" value={localPage.title} onChange={e => handleChange('title', e.target.value)} />
            <Input label="URL Slug" value={localPage.slug} disabled readOnly />
            {saveError && <div className="text-sm font-medium text-red-600">{saveError}</div>}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <RichTextEditor
                    value={localPage.content}
                    onChange={(html) => handleChange('content', html)}
                    placeholder="Write page content..."
                    className=""
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image (Optional)</label>
                <input 
                    type="file" 
                    onChange={handleImageChange} 
                    accept="image/*" 
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                />
                {localPage.imageUrl && <img src={localPage.imageUrl} alt="Preview" className="mt-2 h-32 w-auto rounded border" />}
            </div>
            <div className="flex justify-end pt-4 border-t">
                <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
        </form>
    )
}

const PagesPage: React.FC = () => {
    const { saasWebsiteContent, updateSaasWebsiteContent, fetchSaasWebsiteContent } = useRestaurantData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPage, setEditingPage] = useState<SaasPage | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchSaasWebsiteContent();
        setIsRefreshing(false);
    };

    const handleEditClick = (page: SaasPage) => {
        setEditingPage(page);
        setIsModalOpen(true);
    };

    const slugify = (text: string) =>
        text
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');

    const handleAddNew = () => {
        const newPage: SaasPage = {
            id: `page-${Date.now()}`,
            title: 'New Page',
            slug: `new-page-${Date.now()}`,
            content: '',
            imageUrl: ''
        };
        setEditingPage(newPage);
        setIsModalOpen(true);
    };

    const handleSave = async (updatedPage: SaasPage) => {
        setSaveError(null);
        await updateSaasWebsiteContent(prev => {
            const exists = prev.pages.some(p => p.id === updatedPage.id);
            const safeSlug = updatedPage.slug || slugify(updatedPage.title || 'page');
            const pageWithSlug = { ...updatedPage, slug: safeSlug };
            return {
                ...prev,
                pages: exists
                    ? prev.pages.map(p => (p.id === updatedPage.id ? pageWithSlug : p))
                    : [...prev.pages, pageWithSlug]
            };
        });
    };

    const handleDelete = async (pageId: string) => {
        if (window.confirm('Delete this page? This cannot be undone.')) {
            setSaveError(null);
            try {
                await updateSaasWebsiteContent(prev => ({
                    ...prev,
                    pages: prev.pages.filter(p => p.id !== pageId)
                }));
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to delete.';
                setSaveError(message);
            }
        }
    };

    const handleAddToMenu = async (page: SaasPage) => {
        const url = `/${page.slug}`;
        const alreadyInMenu = saasWebsiteContent.header.navLinks.some(link => link.url === url);
        
        if (alreadyInMenu) {
            alert('This page is already in the navigation menu.');
            return;
        }

        const newLink: SaasNavLink = {
            id: `nav-${Date.now()}`,
            text: page.title,
            url: url
        };

        setSaveError(null);
        try {
            await updateSaasWebsiteContent(prev => ({
                ...prev,
                header: {
                    ...prev.header,
                    navLinks: [...prev.header.navLinks, newLink]
                }
            }));
            alert('Page added to navigation menu successfully!');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update navigation.';
            setSaveError(message);
        }
    };

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <FiFileText className="mr-3" /> Content Page Management
                </h1>
                <div className="flex items-center gap-3">
                    {saveError && <span className="text-red-600 text-sm font-medium">{saveError}</span>}
                    <Button 
                        variant="secondary" 
                        onClick={handleRefresh} 
                        disabled={isRefreshing}
                        leftIcon={<FiRefreshCcw className={isRefreshing ? 'animate-spin' : ''}/>}
                    >
                        {isRefreshing ? 'Refreshing...' : 'Refresh from Server'}
                    </Button>
                    <Button onClick={handleAddNew} leftIcon={<FiPlusCircle/>}>
                        Add New Page
                    </Button>
                </div>
            </div>

             <Card className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page Title</th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL Path</th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {saasWebsiteContent.pages.map(page => (
                            <tr key={page.id}>
                                <td className="p-3 font-medium">{page.title}</td>
                                <td className="p-3 text-sm text-gray-500 font-mono">/{page.slug}</td>
                                <td className="p-3">
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="secondary" onClick={() => handleAddToMenu(page)} title="Add to navigation menu"><FiLink/></Button>
                                        <Button size="sm" variant="secondary" onClick={() => handleEditClick(page)}><FiEdit/></Button>
                                        <Button size="sm" variant="danger" onClick={() => handleDelete(page.id)}><FiTrash2/></Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            {editingPage && (
                 <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={`Edit Page: ${editingPage.title}`}
                    size="2xl"
                >
                    <PageEditForm 
                        page={editingPage}
                        onSave={handleSave}
                        onClose={() => setIsModalOpen(false)}
                    />
                </Modal>
            )}
        </div>
    );
};

export default PagesPage;
