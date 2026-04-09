import React from 'react';
import { Link } from 'react-router-dom';
import { SaaSHeader } from '@/components/public/SaaSHeader';
import { SaaSFooter } from '@/components/public/SaaSFooter';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';

const LoginPage = React.lazy(() => import('../auth/LoginPage'));
const RegisterPage = React.lazy(() => import('../auth/RegisterPage'));

const SaaSPrivacyPage: React.FC = () => {
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

            <main className="pt-32 pb-24">
                <div className="container mx-auto px-6 max-w-4xl">
                    <h1 className="text-4xl md:text-6xl font-black text-[#2d1510] mb-8">Privacy Policy</h1>
                    <p className="text-[#5a4039] mb-12 font-medium">Last Updated: March 24, 2026</p>

                    <div className="prose prose-lg max-w-none text-[#5a4039] space-y-8">
                        <section>
                            <h2 className="text-2xl font-black text-[#2d1510] mb-4">1. Information We Collect</h2>
                            <p className="leading-relaxed">
                                We collect information you provide directly to us when you create an account, use our services, or communicate with us. This may include your name, email address, restaurant details, and payment information.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-[#2d1510] mb-4">2. How We Use Your Information</h2>
                            <p className="leading-relaxed">
                                We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you about updates and promotions.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-[#2d1510] mb-4">3. Data Security</h2>
                            <p className="leading-relaxed">
                                We implement industry-standard security measures to protect your data from unauthorized access, alteration, or disclosure. However, no method of transmission over the internet is 100% secure.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-[#2d1510] mb-4">4. Sharing of Information</h2>
                            <p className="leading-relaxed">
                                We do not sell your personal information. We may share information with third-party service providers who perform services on our behalf, subject to confidentiality agreements.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-[#2d1510] mb-4">5. Your Choices</h2>
                            <p className="leading-relaxed">
                                You may update or correct your account information at any time. You can also opt-out of receiving promotional communications from us by following the instructions in those messages.
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <SaaSFooter handleNavClick={handleNavClick} />

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

export default SaaSPrivacyPage;
