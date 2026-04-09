import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiClock, FiUser, FiTag } from 'react-icons/fi';
import Button from '@/components/common/Button';

import { SaaSHeader } from '@/components/public/SaaSHeader';
import { SaaSFooter } from '@/components/public/SaaSFooter';
import Modal from '@/components/common/Modal';

const LoginPage = React.lazy(() => import('../auth/LoginPage'));
const RegisterPage = React.lazy(() => import('../auth/RegisterPage'));

const SaaSBlogsPage: React.FC = () => {
    const [authModal, setAuthModal] = React.useState<'login' | 'register' | 'demo' | null>(null);
    const openLoginModal = () => setAuthModal('login');
    const openRegisterModal = () => setAuthModal('register');
    const openDemoModal = () => setAuthModal('demo');
    const closeModal = () => setAuthModal(null);

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {};

    const DemoForm = () => (
        <form className="space-y-4 p-4" onSubmit={(e) => { e.preventDefault(); alert('Demo request sent!'); closeModal(); }}>
            <div className="space-y-1">
                <label className="text-sm font-bold">Email Address</label>
                <input type="email" required className="w-full p-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#8b2d1d]/20" placeholder="john@example.com" />
            </div>
            <Button type="submit" className="w-full bg-[#8b2d1d] text-white rounded-xl py-4 font-bold mt-4">Submit Request</Button>
        </form>
    );

    const blogs = [
        {
            title: "10 Ways to Increase Your Restaurant Profit Margins",
            excerpt: "Discover the hidden leaks in your restaurant operations and how to plug them using modern data analytics.",
            author: "Sarah Jenkins",
            date: "March 15, 2024",
            category: "Management",
            image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800"
        },
        {
            title: "The Future of Dining: AI and Automation in Kitchens",
            excerpt: "How smart technology is reshaping the back-of-house operations and what it means for your staff.",
            author: "Mike Ross",
            date: "March 10, 2024",
            category: "Technology",
            image: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&q=80&w=800"
        },
        {
            title: "Why Your POS System is Your Most Important Marketing Tool",
            excerpt: "Learn how to leverage customer data from your POS to create highly effective loyalty programs.",
            author: "Devan Thakur",
            date: "March 5, 2024",
            category: "Marketing",
            image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800"
        }
    ];

    return (
        <div className="bg-[#fffcfb] min-h-screen">
            <SaaSHeader 
                openDemoModal={openDemoModal} 
                openLoginModal={openLoginModal} 
            />

            {/* Header */}
            <header className="bg-white border-b border-[#f3e9e5] py-12 mt-20">
                <div className="container mx-auto px-6 text-center">
                    <Link to="/" className="text-[#8b2d1d] font-black text-2xl mb-8 inline-block">RestoByte</Link>
                    <h1 className="text-4xl md:text-6xl font-black text-[#2d1510] mb-6">Our Insights & Stories</h1>
                    <p className="text-xl text-[#5a4039] max-w-2xl mx-auto">
                        Stay ahead of the curve with the latest trends, tips, and technology in the restaurant industry.
                    </p>
                </div>
            </header>

            {/* Featured Blog */}
            <section className="py-20">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-white rounded-[40px] overflow-hidden shadow-xl border border-[#f3e9e5]">
                        <img src={blogs[0].image} alt="Featured" className="w-full h-full object-cover min-h-[400px]" />
                        <div className="p-12">
                            <span className="bg-[#8b2d1d]/10 text-[#8b2d1d] px-4 py-1 rounded-full text-sm font-bold mb-6 inline-block">FEATURED POST</span>
                            <h2 className="text-3xl md:text-4xl font-black text-[#2d1510] mb-6 leading-tight">
                                {blogs[0].title}
                            </h2>
                            <p className="text-lg text-[#5a4039] mb-8 leading-relaxed">
                                {blogs[0].excerpt}
                            </p>
                            <div className="flex items-center gap-6 mb-8 text-sm text-[#5a4039]">
                                <span className="flex items-center gap-2"><FiUser /> {blogs[0].author}</span>
                                <span className="flex items-center gap-2"><FiClock /> {blogs[0].date}</span>
                            </div>
                            <Button className="!bg-[#8b2d1d] text-white rounded-xl px-8 py-4 font-bold">Read Article</Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Blog Grid */}
            <section className="pb-32">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {blogs.map((blog, i) => (
                            <div key={i} className="group cursor-pointer">
                                <div className="rounded-3xl overflow-hidden mb-6 aspect-[4/3] shadow-lg border border-[#f3e9e5]">
                                    <img src={blog.image} alt={blog.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                </div>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-[#8b2d1d] text-xs font-black uppercase tracking-widest">{blog.category}</span>
                                    <span className="w-1 h-1 bg-[#f3e9e5] rounded-full"></span>
                                    <span className="text-[#5a4039] text-xs font-medium">{blog.date}</span>
                                </div>
                                <h3 className="text-xl font-black text-[#2d1510] mb-4 group-hover:text-[#8b2d1d] transition-colors leading-tight">
                                    {blog.title}
                                </h3>
                                <p className="text-[#5a4039] text-sm leading-relaxed mb-6 line-clamp-2">
                                    {blog.excerpt}
                                </p>
                                <Link to="#" className="flex items-center gap-2 text-[#8b2d1d] font-bold text-sm">
                                    Read More <FiArrowRight />
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer Newsletter */}
            <section className="py-24 bg-[#2d1510] text-white">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-4xl font-black mb-6">Get the latest insights delivered</h2>
                    <p className="text-[#f3e9e5]/60 mb-10 max-w-xl mx-auto">Join 5,000+ restaurant owners who receive our weekly newsletter on scaling and technology.</p>
                    <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                        <input type="email" placeholder="Your email address" className="flex-1 px-6 py-4 rounded-xl bg-white/10 border border-white/20 focus:outline-none focus:border-[#8b2d1d] transition-all" />
                        <Button className="!bg-[#8b2d1d] text-white rounded-xl px-8 py-4 font-bold border-none whitespace-nowrap">Subscribe Now</Button>
                    </div>
                </div>
            </section>

            <SaaSFooter 
                handleNavClick={handleNavClick} 
            />

            {/* Auth Modals */}
            <Modal 
                isOpen={authModal !== null} 
                onClose={closeModal} 
                title={
                    authModal === 'login' ? 'Sign In' : 
                    authModal === 'register' ? 'Create Account' : 
                    'Request a Free Demo'
                }
            >
                <React.Suspense fallback={<div className="p-6 flex justify-center">Loading...</div>}>
                    {authModal === 'login' && <LoginPage onSwitchToRegister={() => setAuthModal('register')} />}
                    {authModal === 'register' && <RegisterPage onSwitchToLogin={() => setAuthModal('login')} />}
                    {authModal === 'demo' && <DemoForm />}
                </React.Suspense>
            </Modal>
        </div>
    );
};

export default SaaSBlogsPage;
