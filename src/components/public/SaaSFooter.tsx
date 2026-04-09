import React from 'react';
import { Link } from 'react-router-dom';
import { FiDatabase, FiGrid, FiMonitor, FiSettings } from 'react-icons/fi';

interface SaaSFooterProps {
    scrollToTop?: () => void;
    handleNavClick: (e: React.MouseEvent<HTMLAnchorElement>, id: string) => void;
    content?: { copyright: string; columns: Array<{ id: string; title: string; links: Array<{ id: string; text: string; url: string }> }>; socialLinks: Array<{ platform: string; url: string }> };
}

export const SaaSFooter: React.FC<SaaSFooterProps> = ({ scrollToTop, handleNavClick, content }) => {
    void handleNavClick;
    return (
        <footer className="bg-white pt-16 pb-12 border-t border-[#f3e9e5]">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
                    <div className="lg:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-8" onClick={scrollToTop}>
                            <div className="w-8 h-8 bg-[#8b2d1d] rounded-lg flex items-center justify-center">
                                <FiDatabase className="text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-[#8b2d1d]">RestoByte</span>
                        </Link>
                        <p className="text-[#5a4039] leading-relaxed mb-8">Empower your restaurant with the modern tools it deserves. Join the community of successful restaurateurs today.</p>
                        <div className="flex gap-4">
                            {content?.socialLinks && content.socialLinks.length > 0 ? (
                                content.socialLinks.map((link, i) => (
                                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#8b2d1d]/5 rounded-full flex items-center justify-center text-[#8b2d1d] hover:bg-[#8b2d1d] hover:text-white cursor-pointer transition-colors">
                                        <FiGrid />
                                    </a>
                                ))
                            ) : (
                                [FiGrid, FiMonitor, FiSettings].map((Icon, i) => (
                                    <div key={i} className="w-10 h-10 bg-[#8b2d1d]/5 rounded-full flex items-center justify-center text-[#8b2d1d] hover:bg-[#8b2d1d] hover:text-white cursor-pointer transition-colors">
                                        <Icon />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    
                    {content?.columns && content.columns.length > 0 ? (
                        content.columns.map((column, i) => (
                            <div key={i}>
                                <h4 className="font-bold text-lg mb-8">{column.title}</h4>
                                <ul className="space-y-4 text-[#5a4039]">
                                    {column.links.map((link, j) => (
                                        <li key={j}><Link to={link.url} onClick={scrollToTop} className="hover:text-[#8b2d1d]">{link.text}</Link></li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : (
                        <>
                            <div>
                                <h4 className="font-bold text-lg mb-8">Company</h4>
                                <ul className="space-y-4 text-[#5a4039]">
                                    <li><Link to="/" onClick={scrollToTop} className="hover:text-[#8b2d1d]">Home</Link></li>
                                    <li><Link to="/features" className="hover:text-[#8b2d1d]">Features</Link></li>
                                    <li><Link to="/products" className="hover:text-[#8b2d1d]">Products (Shop)</Link></li>
                                    <li><Link to="/pricing" className="hover:text-[#8b2d1d]">Pricing</Link></li>
                                    <li><Link to="/blogs" className="hover:text-[#8b2d1d]">Blogs</Link></li>
                                    <li><Link to="/career" className="hover:text-[#8b2d1d]">Career</Link></li>
                                    <li><Link to="/contact" className="hover:text-[#8b2d1d]">Contact</Link></li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-bold text-lg mb-8">Resources</h4>
                                <ul className="space-y-4 text-[#5a4039]">
                                    <li>
                                        <Link to="/contact" onClick={scrollToTop} className="hover:text-[#8b2d1d]">
                                            Help Center
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/blogs" onClick={scrollToTop} className="hover:text-[#8b2d1d]">
                                            Blog
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/privacy-policy" onClick={scrollToTop} className="hover:text-[#8b2d1d]">
                                            Security
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </>
                    )}

                    <div>
                        <h4 className="font-bold text-lg mb-8">Download App</h4>
                        <div className="flex flex-col gap-4">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" className="h-10 w-fit cursor-pointer" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="h-10 w-fit cursor-pointer" />
                        </div>
                    </div>
                </div>
                
                <div className="border-t border-[#f3e9e5] pt-12 flex flex-col md:flex-row items-center justify-between gap-6 text-[#5a4039] text-sm font-medium">
                    <p>{content?.copyright || "©2026 Restobyte. All Rights Reserved."}</p>
                    <p className="text-[#8b2d1d] font-bold">Powered by IT Relevant Pvt. Ltd</p>
                    <div className="flex gap-8">
                        <Link to="/privacy-policy" className="hover:text-[#8b2d1d]">Privacy Policy</Link>
                        <Link to="/terms-of-service" className="hover:text-[#8b2d1d]">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};
