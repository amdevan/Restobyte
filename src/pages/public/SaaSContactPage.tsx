import React from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin, FiMessageSquare, FiGlobe } from 'react-icons/fi';
import Button from '@/components/common/Button';

import { SaaSHeader } from '@/components/public/SaaSHeader';
import { SaaSFooter } from '@/components/public/SaaSFooter';
import Modal from '@/components/common/Modal';

const LoginPage = React.lazy(() => import('../auth/LoginPage'));
const RegisterPage = React.lazy(() => import('../auth/RegisterPage'));

const SaaSContactPage: React.FC = () => {
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

    return (
        <div className="bg-[#fffcfb] min-h-screen">
            <SaaSHeader 
                openDemoModal={openDemoModal} 
                openLoginModal={openLoginModal} 
            />

            {/* Header */}
            <header className="bg-white border-b border-[#f3e9e5] py-16 mt-20">
                <div className="container mx-auto px-6">
                    <Link to="/" className="text-[#8b2d1d] font-black text-2xl mb-12 inline-block">RestoByte</Link>
                    <h1 className="text-4xl md:text-6xl font-black text-[#2d1510] mb-6">Let's talk about your <span className="text-[#8b2d1d]">growth.</span></h1>
                    <p className="text-xl text-[#5a4039] max-w-2xl">
                        Have questions about our platform or need a custom solution? Our team is here to help you scale your restaurant.
                    </p>
                </div>
            </header>

            {/* Contact Content */}
            <section className="py-24">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                        {/* Form */}
                        <div className="bg-white p-10 md:p-16 rounded-[40px] border border-[#f3e9e5] shadow-xl">
                            <h2 className="text-3xl font-black text-[#2d1510] mb-8">Send us a message</h2>
                            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert('Message sent! We will get back to you shortly.'); }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#5a4039]">First Name</label>
                                        <input type="text" required className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-[#8b2d1d]/20 transition-all" placeholder="John" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#5a4039]">Last Name</label>
                                        <input type="text" required className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-[#8b2d1d]/20 transition-all" placeholder="Doe" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#5a4039]">Email Address</label>
                                    <input type="email" required className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-[#8b2d1d]/20 transition-all" placeholder="john@example.com" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#5a4039]">Restaurant Name</label>
                                    <input type="text" required className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-[#8b2d1d]/20 transition-all" placeholder="My Awesome Bistro" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#5a4039]">How can we help?</label>
                                    <textarea required className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-[#8b2d1d]/20 transition-all h-40 resize-none" placeholder="Tell us about your needs..."></textarea>
                                </div>
                                <Button type="submit" className="w-full !bg-[#8b2d1d] text-white rounded-2xl py-5 text-lg font-bold border-none shadow-xl shadow-[#8b2d1d]/20 hover:-translate-y-1 transition-all">Send Message</Button>
                            </form>
                        </div>

                        {/* Contact Info */}
                        <div className="flex flex-col justify-center">
                            <div className="space-y-12">
                                <div className="flex gap-8">
                                    <div className="w-16 h-16 bg-[#8b2d1d]/5 rounded-2xl flex items-center justify-center text-[#8b2d1d] text-2xl flex-shrink-0">
                                        <FiMail />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-[#2d1510] mb-2">Email Us</h3>
                                        <p className="text-[#5a4039] mb-1">General Inquiries: hello@restobyte.com</p>
                                        <p className="text-[#5a4039]">Support: support@restobyte.com</p>
                                    </div>
                                </div>

                                <div className="flex gap-8">
                                    <div className="w-16 h-16 bg-[#8b2d1d]/5 rounded-2xl flex items-center justify-center text-[#8b2d1d] text-2xl flex-shrink-0">
                                        <FiPhone />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-[#2d1510] mb-2">Call Us</h3>
                                        <p className="text-[#5a4039] mb-1">Mon-Fri from 9am to 6pm.</p>
                                        <p className="text-[#8b2d1d] font-bold text-xl">+977 1 2345678</p>
                                    </div>
                                </div>

                                <div className="flex gap-8">
                                    <div className="w-16 h-16 bg-[#8b2d1d]/5 rounded-2xl flex items-center justify-center text-[#8b2d1d] text-2xl flex-shrink-0">
                                        <FiMapPin />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-[#2d1510] mb-2">Visit Us</h3>
                                        <p className="text-[#5a4039]">Kathmandu, Nepal</p>
                                        <p className="text-[#5a4039]">Jhamsikhel, Lalitpur</p>
                                    </div>
                                </div>

                                <div className="p-10 rounded-[40px] bg-[#2d1510] text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#8b2d1d] rounded-full blur-[80px] opacity-20"></div>
                                    <h4 className="text-2xl font-bold mb-4 relative z-10">Quick Support?</h4>
                                    <p className="text-[#f3e9e5]/60 mb-8 relative z-10">Check our FAQ or start a live chat with our team for instant help.</p>
                                    <div className="flex gap-4 relative z-10">
                                        <Link to="/#faq" className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 font-bold hover:bg-white/20 transition-all text-sm">Read FAQ</Link>
                                        <button className="px-6 py-3 rounded-xl bg-[#8b2d1d] font-bold hover:bg-[#a63928] transition-all text-sm">Start Chat</button>
                                    </div>
                                </div>
                            </div>
                        </div>
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

export default SaaSContactPage;
