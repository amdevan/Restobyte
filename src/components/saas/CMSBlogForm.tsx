

import React, { useState, useEffect } from 'react';
import { SaasPost } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiSave, FiXCircle } from 'react-icons/fi';

interface CMSBlogFormProps {
    initialData: SaasPost | null;
    onSave: (post: SaasPost) => void;
    onClose: () => void;
}

const CMSBlogForm: React.FC<CMSBlogFormProps> = ({ initialData, onSave, onClose }) => {
    const [post, setPost] = useState<SaasPost>(
        initialData || { 
            id: '', 
            title: '', 
            category: '', 
            date: new Date().toISOString().split('T')[0], 
            excerpt: '', 
            imageUrl: '' 
        }
    );

    const handleChange = (field: keyof Omit<SaasPost, 'id'>, value: string) => {
        setPost(prev => ({...prev, [field]: value}));
    };

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
        onSave(post);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Title" value={post.title} onChange={e => handleChange('title', e.target.value)} containerClassName="mb-0"/>
                <Input label="Category" value={post.category} onChange={e => handleChange('category', e.target.value)} containerClassName="mb-0"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Date" type="date" value={post.date} onChange={e => handleChange('date', e.target.value)} containerClassName="mb-0"/>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                    <input 
                        type="file" 
                        onChange={handleImageChange} 
                        accept="image/*" 
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                    />
                    {post.imageUrl && <img src={post.imageUrl} alt="Post preview" className="mt-2 h-20 w-auto rounded border" />}
                </div>
            </div>
            <div>
                <label htmlFor={`excerpt-${post.id}`} className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                <textarea
                    id={`excerpt-${post.id}`}
                    value={post.excerpt}
                    onChange={e => handleChange('excerpt', e.target.value)}
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded-md"
                />
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button type="button" variant="secondary" onClick={onClose} leftIcon={<FiXCircle/>}>Cancel</Button>
                <Button type="submit" leftIcon={<FiSave/>}>Save Post</Button>
            </div>
        </form>
    );
};

export default CMSBlogForm;