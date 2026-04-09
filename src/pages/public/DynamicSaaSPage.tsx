
import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { SaaSHeader } from '@/components/public/SaaSHeader';
import { SaaSFooter } from '@/components/public/SaaSFooter';
import Modal from '@/components/common/Modal';
import { FiClock } from 'react-icons/fi';

const LoginPage = React.lazy(() => import('../auth/LoginPage'));
const RegisterPage = React.lazy(() => import('../auth/RegisterPage'));

const DynamicSaaSPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { saasWebsiteContent } = useRestaurantData();
    const [authModal, setAuthModal] = useState<'login' | 'register' | 'demo' | null>(null);

    const page = saasWebsiteContent.pages.find(p => p.slug === slug);

    useEffect(() => {
        if (page) {
            document.title = `${page.title} | RestoByte`;
        }
    }, [page]);

    if (!page) {
        return <Navigate to="/" replace />;
    }

    const openLoginModal = () => setAuthModal('login');
    const openRegisterModal = () => setAuthModal('register');
    const openDemoModal = () => setAuthModal('demo');
    const closeModal = () => setAuthModal(null);

    return (
        <div className="bg-[#fffcfb] min-h-screen flex flex-col">
            <SaaSHeader 
                openDemoModal={openDemoModal} 
                openLoginModal={openLoginModal} 
                content={saasWebsiteContent.header}
            />

            <main className="flex-grow pt-32 pb-20">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-4xl md:text-6xl font-black mb-8 text-[#2d1510]">
                            {page.title}
                        </h1>
                        
                        {page.imageUrl && (
                            <div className="mb-12 rounded-[2.5rem] overflow-hidden shadow-2xl">
                                <img 
                                    src={page.imageUrl} 
                                    alt={page.title} 
                                    className="w-full h-auto max-h-[500px] object-cover"
                                />
                            </div>
                        )}

                        <div 
                            className="prose prose-lg max-w-none text-[#5a4039] leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: page.content }}
                        />
                    </div>
                </div>
            </main>

            <SaaSFooter 
                handleNavClick={() => {}} 
                content={saasWebsiteContent.footer}
            />

            <Modal 
                isOpen={authModal !== null} 
                onClose={closeModal} 
                title={authModal === 'login' ? 'Sign In' : authModal === 'register' ? 'Create Account' : 'Demo'}
            >
                <React.Suspense fallback={<div className="p-6 flex justify-center"><FiClock className="animate-spin text-[#8b2d1d]" size={32} /></div>}>
                    {authModal === 'login' && <LoginPage onSwitchToRegister={() => setAuthModal('register')} />}
                    {authModal === 'register' && <RegisterPage onSwitchToLogin={() => setAuthModal('login')} />}
                </React.Suspense>
            </Modal>
        </div>
    );
};

export default DynamicSaaSPage;
