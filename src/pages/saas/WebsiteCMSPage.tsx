import React from 'react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { FiHome, FiLayout, FiFileText, FiGlobe, FiSettings, FiGrid } from 'react-icons/fi';
import HomePageContentPage from './cms/HomePageContentPage';
import HeaderFooterPage from './cms/HeaderFooterPage';
import PagesPage from './cms/PagesPage';
import BlogsPage from './cms/BlogsPage';
import SeoPage from './cms/SeoPage';
import { getSaaSBasePath } from '@/utils/domain';

const WebsiteCMSPage: React.FC = () => {
    const basePath = getSaaSBasePath();
    
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <FiLayout className="mr-3" /> Website Content Management
            </h1>
            
            <div className="flex flex-col md:flex-row gap-6">
                <aside className="w-full md:w-64 flex-shrink-0">
                    <nav className="space-y-1">
                        <NavLink 
                            to={`${basePath}/cms/home`}
                            className={({ isActive }) => `flex items-center px-4 py-3 text-sm font-medium rounded-md ${isActive ? 'bg-sky-50 text-sky-700' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                            <FiHome className="mr-3 flex-shrink-0" size={18} />
                            Home Page
                        </NavLink>
                        <NavLink 
                            to={`${basePath}/cms/header-footer`}
                            className={({ isActive }) => `flex items-center px-4 py-3 text-sm font-medium rounded-md ${isActive ? 'bg-sky-50 text-sky-700' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                            <FiGrid className="mr-3 flex-shrink-0" size={18} />
                            Header & Footer
                        </NavLink>
                         <NavLink 
                            to={`${basePath}/cms/pages`}
                            className={({ isActive }) => `flex items-center px-4 py-3 text-sm font-medium rounded-md ${isActive ? 'bg-sky-50 text-sky-700' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                            <FiFileText className="mr-3 flex-shrink-0" size={18} />
                            Pages
                        </NavLink>
                         <NavLink 
                            to={`${basePath}/cms/blogs`}
                            className={({ isActive }) => `flex items-center px-4 py-3 text-sm font-medium rounded-md ${isActive ? 'bg-sky-50 text-sky-700' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                            <FiFileText className="mr-3 flex-shrink-0" size={18} />
                            Blogs
                        </NavLink>
                         <NavLink 
                            to={`${basePath}/cms/seo`}
                            className={({ isActive }) => `flex items-center px-4 py-3 text-sm font-medium rounded-md ${isActive ? 'bg-sky-50 text-sky-700' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                            <FiGlobe className="mr-3 flex-shrink-0" size={18} />
                            SEO Settings
                        </NavLink>
                    </nav>
                </aside>

                <main className="flex-1 min-h-[500px]">
                     <Routes>
                        <Route path="/" element={<Navigate to="home" replace />} />
                        <Route path="home" element={<HomePageContentPage />} />
                        <Route path="header-footer" element={<HeaderFooterPage />} />
                        <Route path="pages" element={<PagesPage />} />
                        <Route path="blogs" element={<BlogsPage />} />
                        <Route path="seo" element={<SeoPage />} />
                     </Routes>
                </main>
            </div>
        </div>
    );
};

export default WebsiteCMSPage;
