import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
const LoginPage = React.lazy(() => import('../auth/LoginPage'));
const RegisterPage = React.lazy(() => import('../auth/RegisterPage'));
import TestimonialSlider from '@/components/public/TestimonialSlider';
import { FiCheckCircle, FiStar, FiPlayCircle, FiArrowRight, FiGift, FiShoppingCart, FiGlobe, FiDatabase, FiGrid, FiBarChart2, FiMonitor } from 'react-icons/fi';
import * as AllFiIcons from 'react-icons/fi';

const LandingPage: React.FC = () => {
    const { saasWebsiteContent } = useRestaurantData();
    const { hero, features, pricing, trustedByLogos, statistics, cta, testimonials, blogPosts } = saasWebsiteContent;
    const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const action = searchParams.get('action');
        if (action === 'login') {
            setAuthModal('login');
        } else if (action === 'register') {
            setAuthModal('register');
        }
    }, [searchParams]);

    const openLoginModal = () => {
        setAuthModal('login');
        setSearchParams({ action: 'login' });
    };
    const openRegisterModal = () => {
        setAuthModal('register');
        setSearchParams({ action: 'register' });
    };
    const closeModal = () => {
        setAuthModal(null);
        setSearchParams({});
    };
    const switchToRegister = () => {
        setAuthModal('register');
        setSearchParams({ action: 'register' });
    };
    const switchToLogin = () => {
        setAuthModal('login');
        setSearchParams({ action: 'login' });
    };
    
    const renderIcon = (iconName: string) => {
        const IconComponent = (AllFiIcons as any)[iconName];
        if (IconComponent) {
            return <IconComponent size={24} className="text-white" />;
        }
        return <FiGift size={24} className="text-white" />; // Fallback
    };

    return (
        <div className="bg-white font-sans">
            <PublicHeader onLoginClick={openLoginModal} onRegisterClick={openRegisterModal} />

            <main>
                {/* Hero Section */}
                <section id="home" className="relative bg-white text-gray-800">
                    <div className="container mx-auto px-6 py-24 md:py-32 flex flex-col items-center text-center">
                        <div className="mb-4 inline-flex items-center space-x-2 border rounded-full px-3 py-1 text-sm text-gray-600 bg-gray-50 animate-fade-in-down">
                            <span className="font-semibold text-indigo-600">Now with Integrated KDS</span>
                            <FiArrowRight size={14} />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4 animate-fade-in-down" style={{ animationDelay: '0.2s' }}>{hero.title}</h1>
                        <p className="text-lg md:text-xl text-gray-500 max-w-3xl mx-auto mb-8 animate-fade-in-down" style={{ animationDelay: '0.4s' }}>{hero.subtitle}</p>
                        <div className="flex justify-center space-x-4 animate-fade-in-down" style={{ animationDelay: '0.6s' }}>
                            <Button size="lg" variant="primary" className="!text-base bg-indigo-600 hover:bg-indigo-700">Request a Demo</Button>
                            <Button size="lg" variant="secondary" className="!text-base" leftIcon={<FiPlayCircle />}>See How It Works</Button>
                        </div>
                        <img src={hero.imageUrl} alt="App Screenshot" className="mt-12 rounded-t-xl shadow-2xl animate-fade-in-down" style={{ animationDelay: '0.8s' }} />
                    </div>
                </section>
                
                {/* Trusted By Section */}
                <section id="trusted-by" className="py-16 bg-gray-50">
                    <div className="container mx-auto px-6">
                        <h3 className="text-center text-sm font-semibold text-gray-500 mb-6">Powering successful restaurants of all sizes</h3>
                        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6">
                            {trustedByLogos.map(logo => (
                                <p key={logo.id} className="text-lg font-semibold text-gray-400 italic">{logo.name}</p>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                 <section id="features" className="py-20">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <span className="text-sm font-semibold text-indigo-600 uppercase">Everything you need</span>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mt-2">One Platform to Rule Them All</h2>
                            <p className="text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
                                From the front-of-house to the back office, RestoByte provides the tools you need to increase efficiency, boost sales, and deliver outstanding hospitality.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {features.map(feature => (
                                <div key={feature.id} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-500 text-white mb-4">
                                        {renderIcon(feature.icon)}
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                                    <p className="text-gray-500 text-sm">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>


                {/* Statistics Section */}
                <section id="statistics" className="py-20 bg-gray-50">
                    <div className="container mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                            {statistics.map(stat => (
                                <div key={stat.id}>
                                    <p className="text-4xl md:text-5xl font-bold text-indigo-600">{stat.value}</p>
                                    <p className="text-gray-500 mt-2">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                        <div className="text-center mt-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">{cta.title}</h2>
                            <p className="text-lg text-gray-500 mt-2 max-w-2xl mx-auto">{cta.subtitle}</p>
                            <Button size="lg" className="mt-6">{cta.buttonText}</Button>
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section id="pricing" className="py-20 bg-white">
                    <div className="container mx-auto px-6 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Choose the perfect plan for you</h2>
                        <p className="text-lg text-gray-500 mb-12">Flexible pricing for restaurants of all sizes.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {pricing.map(plan => (
                                <div key={plan.id} className={`p-8 rounded-xl border-2 flex flex-col ${plan.isFeatured ? 'border-indigo-500 shadow-2xl relative' : 'border-gray-200'}`}>
                                    {plan.isFeatured && (
                                        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                                            <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase">Most Popular</span>
                                        </div>
                                    )}
                                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                                    <p className="mt-4">
                                        <span className="text-4xl font-extrabold">{plan.price}</span>
                                        <span className="text-gray-500"> {plan.period}</span>
                                    </p>
                                    <ul className="mt-6 text-left space-y-3 flex-grow">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-center">
                                                <FiCheckCircle className="text-orange-500 mr-3 flex-shrink-0"/>
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Button size="lg" variant={plan.isFeatured ? 'primary' : 'outline'} className="w-full mt-8 !text-base">Get Started</Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                
                {/* Testimonials */}
                <section id="testimonials" className="py-20 bg-gray-50">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <span className="text-sm border rounded-full px-3 py-1">Testimonials</span>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mt-4">Real Results from Real Restaurants</h2>
                            <p className="text-lg text-gray-500 mt-2">See what our customers are saying about RestoByte.</p>
                        </div>
                        <TestimonialSlider testimonials={testimonials} />
                    </div>
                </section>
                
                {/* Blog Section */}
                <section id="blog" className="py-20 bg-white">
                    <div className="container mx-auto px-6">
                        <div className="flex justify-between items-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">From Our Blog</h2>
                            <Button variant="outline">See All Blog Posts</Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                           {blogPosts.map(post => (
                             <div key={post.id} className="bg-white rounded-lg shadow-lg overflow-hidden group">
                                <img src={post.imageUrl} alt={post.title} className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" />
                                <div className="p-6">
                                    <p className="text-sm text-gray-500">{post.date} - {post.category}</p>
                                    <h3 className="text-xl font-semibold my-2 hover:text-indigo-600 transition-colors cursor-pointer">{post.title}</h3>
                                    <p className="text-gray-600 text-sm">{post.excerpt}</p>
                                </div>
                            </div>
                           ))}
                        </div>
                    </div>
                </section>
            </main>
            
            <PublicFooter />

            <Modal isOpen={authModal !== null} onClose={closeModal} title={authModal === 'login' ? 'Sign In' : 'Create Account'}>
                <React.Suspense fallback={<div className="p-6"><span>Loading...</span></div>}>
                    {authModal === 'login' && <LoginPage onSwitchToRegister={switchToRegister} />}
                    {authModal === 'register' && <RegisterPage onSwitchToLogin={switchToLogin} />}
                </React.Suspense>
            </Modal>
        </div>
    );
};

export default LandingPage;