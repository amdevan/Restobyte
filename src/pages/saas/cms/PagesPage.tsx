

import React, { useState } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { SaasPage } from '@/types';
import { FiEdit, FiFileText, FiPlusCircle, FiTrash2 } from 'react-icons/fi';
import Input from '@/components/common/Input';
import RichTextEditor from '@/components/common/RichTextEditor';

const PageEditForm: React.FC<{
    page: SaasPage;
    onSave: (updatedPage: SaasPage) => void;
    onClose: () => void;
}> = ({ page, onSave, onClose }) => {
    const [localPage, setLocalPage] = useState(page);

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
        onSave(localPage);
        onClose();
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar p-1">
            <Input label="Page Title" value={localPage.title} onChange={e => handleChange('title', e.target.value)} />
            <Input label="URL Slug" value={localPage.slug} disabled readOnly />
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
                <Button type="submit">Save Changes</Button>
            </div>
        </form>
    )
}

const PagesPage: React.FC = () => {
    const { saasWebsiteContent, updateSaasWebsiteContent } = useRestaurantData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPage, setEditingPage] = useState<SaasPage | null>(null);

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

    const handleSave = (updatedPage: SaasPage) => {
        updateSaasWebsiteContent(prev => {
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

    const handleDelete = (pageId: string) => {
        if (window.confirm('Delete this page? This cannot be undone.')) {
            updateSaasWebsiteContent(prev => ({
                ...prev,
                pages: prev.pages.filter(p => p.id !== pageId)
            }));
        }
    };

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <FiFileText className="mr-3" /> Content Page Management
                </h1>
                <Button onClick={handleAddNew} leftIcon={<FiPlusCircle/>}>
                    Add New Page
                </Button>
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