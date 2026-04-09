import React from 'react';
import { Link } from 'react-router-dom';
import { SaaSHeader } from '@/components/public/SaaSHeader';
import { SaaSFooter } from '@/components/public/SaaSFooter';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';

const LoginPage = React.lazy(() => import('../auth/LoginPage'));
const RegisterPage = React.lazy(() => import('../auth/RegisterPage'));

const SaaSTermsPage: React.FC = () => {
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
                    <h1 className="text-4xl md:text-6xl font-black text-[#2d1510] mb-8">Terms of Service</h1>
                    <p className="text-[#5a4039] mb-12 font-medium">Last Updated: March 24, 2026</p>

                    <div className="prose prose-lg max-w-none text-[#5a4039] space-y-8">
                        <section>
                            <h2 className="text-2xl font-black text-[#2d1510] mb-4">1. Acceptance of Terms</h2>
                            <p className="leading-relaxed">
                                By accessing or using RestoByte, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-[#2d1510] mb-4">2. Use of Services</h2>
                            <p className="leading-relaxed">
                                You agree to use our services only for lawful purposes and in accordance with these terms. You are responsible for maintaining the confidentiality of your account information.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-[#2d1510] mb-4">3. Subscription and Billing</h2>
                            <p className="leading-relaxed">
                                Certain features of our services require a paid subscription. You agree to provide accurate billing information and authorize us to charge the applicable fees to your chosen payment method.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-[#2d1510] mb-4">4. Intellectual Property</h2>
                            <p className="leading-relaxed">
                                All content and materials available on RestoByte are the property of IT Relevant Pvt. Ltd and are protected by intellectual property laws.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-[#2d1510] mb-4">5. Limitation of Liability</h2>
                            <p className="leading-relaxed">
                                RestoByte and IT Relevant Pvt. Ltd shall not be liable for any indirect, incidental, or consequential damages arising out of your use of our services.
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

export default SaaSTermsPage;
