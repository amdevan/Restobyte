import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle, FiDatabase, FiGrid, FiBarChart2, FiSmartphone, FiPieChart, FiLayers, FiShield, FiZap, FiCpu, FiMonitor, FiChevronDown, FiCheck } from 'react-icons/fi';
import Button from '@/components/common/Button';

import { SaaSHeader } from '@/components/public/SaaSHeader';
import { SaaSFooter } from '@/components/public/SaaSFooter';
import Modal from '@/components/common/Modal';
import { useRestaurantData } from '@/hooks/useRestaurantData';

const LoginPage = React.lazy(() => import('../auth/LoginPage'));
const RegisterPage = React.lazy(() => import('../auth/RegisterPage'));

const SaaSFeaturesPage: React.FC = () => {
    const { saasWebsiteContent } = useRestaurantData();
    const content = saasWebsiteContent;
    const location = useLocation();
    const [authModal, setAuthModal] = React.useState<'login' | 'register' | 'demo' | null>(null);
    const openLoginModal = () => setAuthModal('login');
    const openRegisterModal = () => setAuthModal('register');
    const openDemoModal = () => setAuthModal('demo');
    const closeModal = () => setAuthModal(null);

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        // Since we are not on landing page, just let default Link behavior handle it
    };

    const DemoForm = () => (
        <form className="space-y-4 p-4" onSubmit={(e) => { e.preventDefault(); alert('Demo request sent!'); closeModal(); }}>
            <div className="space-y-1">
                <label className="text-sm font-bold">Email Address</label>
                <input type="email" required className="w-full p-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#8b2d1d]/20" placeholder="john@example.com" />
            </div>
            <Button type="submit" className="w-full bg-[#8b2d1d] text-white rounded-xl py-4 font-bold mt-4">Submit Request</Button>
        </form>
    );

    const iconMap: Record<string, React.ReactNode> = {
        FiZap: <FiZap />,
        FiDatabase: <FiDatabase />,
        FiPieChart: <FiPieChart />,
        FiGrid: <FiGrid />,
        FiLayers: <FiLayers />,
        FiBarChart2: <FiBarChart2 />,
        FiSmartphone: <FiSmartphone />,
        FiMonitor: <FiMonitor />,
        FiShield: <FiShield />,
    };

    const fallbackFeatures = [
        { id: 'f1', title: 'Order & KOT Management', description: 'The fastest point of sale workflow designed for rush hours.', icon: 'FiZap' },
        { id: 'f2', title: 'Inventory & Waste Control', description: 'Track ingredients in real-time and get low-stock alerts.', icon: 'FiDatabase' },
        { id: 'f3', title: 'Accounting & Expense Manager', description: 'Track expenses, bills, and cash flow with clarity.', icon: 'FiPieChart' },
        { id: 'f4', title: 'Digital QR Menu', description: 'Guests scan, browse, and order from their phones.', icon: 'FiGrid' },
        { id: 'f5', title: 'Table & Space Management', description: 'Manage tables, reservations, and waitlists smoothly.', icon: 'FiLayers' },
        { id: 'f6', title: 'Real-Time Sales Report', description: 'Monitor sales and trends and act faster.', icon: 'FiBarChart2' },
        { id: 'f7', title: 'Mobile & Web App', description: 'Access the dashboard from anywhere.', icon: 'FiSmartphone' },
        { id: 'f8', title: 'Kitchen Display System (KDS)', description: 'Sync FOH and BOH in real time and reduce errors.', icon: 'FiMonitor' },
    ];

    const featuresSource = content.features && content.features.length > 0 ? content.features : fallbackFeatures;
    const features = featuresSource.map((f, idx) => ({
        id: f.id,
        title: f.title,
        desc: f.description,
        icon: iconMap[f.icon] || <FiZap />,
        points: [f.description].filter(Boolean),
        image: [
            'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&q=80&w=1000',
            'https://images.unsplash.com/photo-1586769852836-bc069f19e1b6?auto=format&fit=crop&q=80&w=1000',
            'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1000',
            'https://images.unsplash.com/photo-1595113316349-9fa4eb24f884?auto=format&fit=crop&q=80&w=1000',
        ][idx % 4],
    }));

    const anchors = ['feature-orders','feature-inventory','feature-accounting','feature-qr','feature-tables','feature-sales','feature-mobile','feature-kds'];

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const section = params.get('section') || '';
        if (!section) return;

        const scroll = () => {
            const el = document.getElementById(section);
            if (!el) return;
            const headerOffset = 90;
            const elementPosition = el.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        };

        const raf = window.requestAnimationFrame(scroll);
        const t = window.setTimeout(scroll, 120);
        return () => {
            window.cancelAnimationFrame(raf);
            window.clearTimeout(t);
        };
    }, [location.search]);

    return (
        <div className="bg-[#fffcfb] min-h-screen">
            <SaaSHeader 
                openDemoModal={openDemoModal} 
                openLoginModal={openLoginModal} 
                openRegisterModal={openRegisterModal}
                content={content.header}
            />

            {/* Hero Section */}
            <header className="bg-mesh py-32 relative overflow-hidden mt-20">
                <div className="container mx-auto px-6 text-center relative z-10">
                    <Link to="/" className="text-[#8b2d1d] font-black text-2xl mb-12 inline-block">{content.seo?.title || 'RestoByte'}</Link>
                    <h1 className="text-5xl md:text-7xl font-black text-[#2d1510] mb-8 leading-tight">Modern <span className="text-[#8b2d1d]">Features</span> for modern dining.</h1>
                    <p className="text-xl text-[#5a4039] max-w-2xl mx-auto">
                        Explore our comprehensive suite of features designed to streamline every aspect of your restaurant operations.
                    </p>
                </div>
            </header>

            {/* Features List */}
            <section className="py-24">
                <div className="container mx-auto px-6">
                    <div className="space-y-32">
                        {features.slice(0, 4).map((f, i) => (
                            <div id={anchors[i] || `feature-${i}`} key={i} className={`scroll-mt-28 flex flex-col lg:flex-row items-center gap-20 ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                                <div className="lg:w-1/2">
                                    <div className="w-16 h-16 bg-[#8b2d1d]/10 rounded-2xl flex items-center justify-center text-[#8b2d1d] text-2xl mb-8">
                                        {f.icon}
                                    </div>
                                    <h2 className="text-4xl font-black text-[#2d1510] mb-6">{f.title}</h2>
                                    <p className="text-lg text-[#5a4039] mb-10 leading-relaxed">
                                        {f.desc}
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {f.points.map((p, j) => (
                                            <div key={j} className="flex items-center gap-3 text-[#2d1510] font-bold">
                                                <FiCheckCircle className="text-[#8b2d1d]" />
                                                <span>{p}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <Button onClick={openRegisterModal} className="mt-12 !bg-[#2d1510] text-white rounded-xl px-8 py-4 font-bold border-none">
                                        Get Started with {f.title.split(' ')[0]}
                                    </Button>
                                </div>
                                <div className="lg:w-1/2">
                                    <div className="bg-white p-4 rounded-[40px] shadow-2xl border border-[#f3e9e5] relative group overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#8b2d1d]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <img 
                                            src={f.image} 
                                            alt={f.title} 
                                            className="rounded-[32px] w-full h-auto shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Platform Highlights Grid */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-black text-[#2d1510] mb-6">Even More to Explore</h2>
                        <p className="text-lg text-[#5a4039] max-w-2xl mx-auto">Everything you need to run a modern, high-performance restaurant operation.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.slice(4).map((f, i) => (
                            <div id={anchors[i + 4] || `feature-${i + 4}`} key={i} className="scroll-mt-28 bg-[#fffcfb] p-10 rounded-[40px] border border-[#f3e9e5] hover:border-[#8b2d1d] hover:shadow-2xl transition-all duration-500 group">
                                <div className="w-14 h-14 bg-[#8b2d1d]/5 rounded-2xl flex items-center justify-center text-[#8b2d1d] text-2xl mb-8 group-hover:bg-[#8b2d1d] group-hover:text-white transition-all">
                                    {f.icon}
                                </div>
                                <h3 className="text-2xl font-black text-[#2d1510] mb-4">{f.title}</h3>
                                <p className="text-[#5a4039] text-sm leading-relaxed mb-8">{f.desc}</p>
                                <ul className="space-y-3">
                                    {f.points.slice(0, 3).map((p, j) => (
                                        <li key={j} className="flex items-center gap-2 text-xs font-bold text-[#2d1510]">
                                            <FiCheck className="text-[#8b2d1d]" /> {p}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Global Infrastructure */}
            <section className="py-32 bg-[#2d1510] text-white overflow-hidden relative">
                <div className="absolute inset-0 bg-dot-pattern opacity-[0.05]"></div>
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <h2 className="text-4xl font-black mb-20">Enterprise-grade infrastructure</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center text-[#ff7b5f] text-3xl mb-8">
                                <FiShield />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Bank-Level Security</h3>
                            <p className="text-[#f3e9e5]/60">Your data is encrypted and protected with industry-standard security protocols.</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center text-[#ff7b5f] text-3xl mb-8">
                                <FiZap />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Zero Latency</h3>
                            <p className="text-[#f3e9e5]/60">Our cloud infrastructure is optimized for sub-millisecond response times globally.</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center text-[#ff7b5f] text-3xl mb-8">
                                <FiCpu />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">AI-Driven Insights</h3>
                            <p className="text-[#f3e9e5]/60">Leverage advanced machine learning to predict demand and optimize staffing.</p>
                        </div>
                    </div>
                </div>
            </section>

            <SaaSFooter 
                handleNavClick={handleNavClick} 
                content={content.footer}
            />

            {/* Auth Modals */}
            <Modal 
                isOpen={authModal !== null} 
                onClose={closeModal} 
                title={
                    authModal === 'login' ? 'Sign In' : 
                    authModal === 'register' ? 'Start Free Trial' : 
                    'Request a Free Demo'
                }
                size={authModal === 'register' ? 'lg' : 'md'}
            >
                <React.Suspense fallback={<div className="p-6 flex justify-center">Loading...</div>}>
                    {authModal === 'login' && <LoginPage onSwitchToRegister={() => setAuthModal('register')} />}
                    {authModal === 'register' && (
                        <RegisterPage
                            onSwitchToLogin={() => setAuthModal('login')}
                            embedded
                            heading="Start Free Trial"
                            subtitle="Create your restaurant account and start your trial now."
                            submitLabel="Start Free Trial"
                        />
                    )}
                    {authModal === 'demo' && <DemoForm />}
                </React.Suspense>
            </Modal>
        </div>
    );
};

export default SaaSFeaturesPage;
