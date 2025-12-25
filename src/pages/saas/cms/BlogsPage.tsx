

import React, { useState } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { SaasPost } from '@/types';
import { FiPlusCircle, FiEdit, FiTrash2, FiMessageSquare } from 'react-icons/fi';
import CMSBlogForm from '@/components/saas/CMSBlogForm';

const BlogsPage: React.FC = () => {
    const { saasWebsiteContent, updateSaasWebsiteContent } = useRestaurantData();
    const { blogPosts } = saasWebsiteContent;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<SaasPost | null>(null);

    const handleOpenModal = (post: SaasPost | null) => {
        setEditingPost(post);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingPost(null);
        setIsModalOpen(false);
    };

    const handleSave = (postToSave: SaasPost) => {
        let updatedPosts;
        if (editingPost) { // Update existing
            updatedPosts = blogPosts.map(p => p.id === postToSave.id ? postToSave : p);
        } else { // Add new
            updatedPosts = [...blogPosts, { ...postToSave, id: `blog-${Date.now()}` }];
        }
        updateSaasWebsiteContent(prev => ({ ...prev, blogPosts: updatedPosts }));
        handleCloseModal();
    };

    const handleDelete = (postId: string) => {
        if (window.confirm("Are you sure you want to delete this blog post?")) {
            const updatedPosts = blogPosts.filter(p => p.id !== postId);
            updateSaasWebsiteContent(prev => ({ ...prev, blogPosts: updatedPosts }));
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <FiMessageSquare className="mr-3" /> Blog Post Management
                </h1>
                <Button onClick={() => handleOpenModal(null)} leftIcon={<FiPlusCircle/>}>
                    Add New Post
                </Button>
            </div>

            <Card className="overflow-x-auto">
                {blogPosts.length === 0 ? (
                    <div className="text-center p-8">No blog posts found.</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {blogPosts.map(post => (
                                <tr key={post.id}>
                                    <td className="p-3"><img src={post.imageUrl} alt={post.title} className="w-24 h-16 object-cover rounded"/></td>
                                    <td className="p-3 font-medium">{post.title}</td>
                                    <td className="p-3 text-sm text-gray-500">{post.category}</td>
                                    <td className="p-3 text-sm text-gray-500">{new Date(post.date).toLocaleDateString()}</td>
                                    <td className="p-3">
                                        <div className="flex space-x-2">
                                            <Button size="sm" variant="secondary" onClick={() => handleOpenModal(post)}><FiEdit/></Button>
                                            <Button size="sm" variant="danger" onClick={() => handleDelete(post.id)}><FiTrash2/></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingPost ? "Edit Blog Post" : "Add New Blog Post"}
                size="xl"
            >
                <CMSBlogForm 
                    initialData={editingPost}
                    onSave={handleSave}
                    onClose={handleCloseModal}
                />
            </Modal>
        </div>
    );
};

export default BlogsPage;