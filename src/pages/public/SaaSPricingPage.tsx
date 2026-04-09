import React, { useState, useEffect } from 'react';
import { SaaSHeader } from '@/components/public/SaaSHeader';
import { SaaSFooter } from '@/components/public/SaaSFooter';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { FiCheck, FiChevronDown, FiSearch, FiSliders, FiGlobe } from 'react-icons/fi';

const LoginPage = React.lazy(() => import('../auth/LoginPage'));
const RegisterPage = React.lazy(() => import('../auth/RegisterPage'));

const SaaSPricingPage: React.FC = () => {
    useEffect(() => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal-active');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
        elements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    const [authModal, setAuthModal] = useState<'login' | 'register' | 'demo' | null>(null);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [comparisonQuery, setComparisonQuery] = useState('');
    const [showOnlyDifferences, setShowOnlyDifferences] = useState(true);

    const CURRENCIES: Record<string, { code: string; symbol: string; rate: number; label: string; locale: string }> = {
        USD: { code: 'USD', symbol: '$', rate: 1, label: 'United States (USD)', locale: 'en-US' },
        EUR: { code: 'EUR', symbol: '€', rate: 0.92, label: 'Europe (EUR)', locale: 'de-DE' },
        GBP: { code: 'GBP', symbol: '£', rate: 0.78, label: 'United Kingdom (GBP)', locale: 'en-GB' },
        INR: { code: 'INR', symbol: '₹', rate: 83, label: 'India (INR)', locale: 'en-IN' },
        NPR: { code: 'NPR', symbol: '₨', rate: 133, label: 'Nepal (NPR)', locale: 'en-NP' },
        CAD: { code: 'CAD', symbol: 'CA$', rate: 1.35, label: 'Canada (CAD)', locale: 'en-CA' },
        AUD: { code: 'AUD', symbol: 'A$', rate: 1.52, label: 'Australia (AUD)', locale: 'en-AU' },
        SGD: { code: 'SGD', symbol: 'S$', rate: 1.34, label: 'Singapore (SGD)', locale: 'en-SG' },
        AED: { code: 'AED', symbol: 'AED', rate: 3.67, label: 'UAE (AED)', locale: 'en-AE' },
        JPY: { code: 'JPY', symbol: '¥', rate: 150, label: 'Japan (JPY)', locale: 'ja-JP' },
        PKR: { code: 'PKR', symbol: '₨', rate: 279, label: 'Pakistan (PKR)', locale: 'en-PK' },
        BDT: { code: 'BDT', symbol: '৳', rate: 119, label: 'Bangladesh (BDT)', locale: 'bn-BD' },
        LKR: { code: 'LKR', symbol: 'Rs', rate: 300, label: 'Sri Lanka (LKR)', locale: 'en-LK' },
        MYR: { code: 'MYR', symbol: 'RM', rate: 4.7, label: 'Malaysia (MYR)', locale: 'ms-MY' },
        THB: { code: 'THB', symbol: '฿', rate: 36, label: 'Thailand (THB)', locale: 'th-TH' },
        IDR: { code: 'IDR', symbol: 'Rp', rate: 15500, label: 'Indonesia (IDR)', locale: 'id-ID' },
        PHP: { code: 'PHP', symbol: '₱', rate: 57, label: 'Philippines (PHP)', locale: 'en-PH' },
        VND: { code: 'VND', symbol: '₫', rate: 24500, label: 'Vietnam (VND)', locale: 'vi-VN' }
    };

    const COUNTRY_TO_CURRENCY: Record<string, keyof typeof CURRENCIES> = {
        US: 'USD', GB: 'GBP', IE: 'EUR', FR: 'EUR', DE: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', PT: 'EUR', BE: 'EUR', AT: 'EUR', FI: 'EUR', GR: 'EUR',
        IN: 'INR', NP: 'NPR', CA: 'CAD', AU: 'AUD', SG: 'SGD', AE: 'AED', JP: 'JPY', PK: 'PKR', BD: 'BDT', LK: 'LKR',
        MY: 'MYR', TH: 'THB', ID: 'IDR', PH: 'PHP', VN: 'VND'
    };

    const [currency, setCurrency] = useState(CURRENCIES.USD);

    useEffect(() => {
        const storageKeys = {
            code: 'rb_pricing_currency',
            mode: 'rb_pricing_currency_mode'
        };

        const setCurrencyByCode = (code: string, mode: 'auto' | 'manual') => {
            const next = CURRENCIES[code] ?? CURRENCIES.USD;
            setCurrency(next);
            try {
                localStorage.setItem(storageKeys.code, next.code);
                localStorage.setItem(storageKeys.mode, mode);
            } catch {
            }
        };

        try {
            const savedCode = localStorage.getItem(storageKeys.code);
            const savedMode = localStorage.getItem(storageKeys.mode) as 'auto' | 'manual' | null;
            if (savedCode && CURRENCIES[savedCode]) {
                setCurrencyByCode(savedCode, savedMode === 'manual' ? 'manual' : 'auto');
                if (savedMode === 'manual') return;
            }
        } catch {
        }

        try {
            const locale = Intl.DateTimeFormat().resolvedOptions().locale || navigator.language || 'en-US';
            const parts = locale.split('-');
            const region = parts.length > 1 ? parts[1].toUpperCase() : '';
            const currencyCode = (region && COUNTRY_TO_CURRENCY[region]) || 'USD';
            setCurrencyByCode(currencyCode, 'auto');
        } catch {
            setCurrencyByCode('USD', 'auto');
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1500);

        const detectFromIp = async () => {
            const tryIpApi = async () => {
                const res = await fetch('https://ipapi.co/json/', { signal: controller.signal, cache: 'no-store' });
                if (!res.ok) throw new Error('ipapi failed');
                const data = await res.json();
                return (data?.country_code || data?.country || '').toString().toUpperCase();
            };

            const tryIpWho = async () => {
                const res = await fetch('https://ipwho.is/', { signal: controller.signal, cache: 'no-store' });
                if (!res.ok) throw new Error('ipwho failed');
                const data = await res.json();
                return (data?.country_code || data?.country_code2 || '').toString().toUpperCase();
            };

            try {
                let countryCode = '';
                try {
                    countryCode = await tryIpApi();
                } catch {
                    countryCode = await tryIpWho();
                }

                const mappedCurrency = COUNTRY_TO_CURRENCY[countryCode] || 'USD';
                setCurrencyByCode(mappedCurrency, 'auto');
            } catch {
            } finally {
                clearTimeout(timeout);
            }
        };

        detectFromIp();

        return () => {
            clearTimeout(timeout);
            controller.abort();
        };
    }, []);

    const formatPrice = (usd: number) => {
        const amount = usd * currency.rate;
        return new Intl.NumberFormat(currency.locale, { style: 'currency', currency: currency.code, maximumFractionDigits: 0 }).format(amount);
    };

    const openLoginModal = () => setAuthModal('login');
    const openRegisterModal = () => setAuthModal('register');
    const openDemoModal = () => setAuthModal('demo');
    const closeModal = () => setAuthModal(null);

    const scrollToId = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }
    };

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        scrollToId(id);
    };

    const slugify = (value: string) =>
        value
            .toLowerCase()
            .replace(/&/g, 'and')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

    const comparisonData = [
        {
            category: "Core Features",
            features: [
                { name: "Live POS System", essential: true, growth: true, enterprise: true, custom: true },
                { name: "Table Management", essential: "Up to 15", growth: "Unlimited", enterprise: "Unlimited", custom: "Unlimited" },
                { name: "Menu Customization", essential: "Basic", growth: "Advanced", enterprise: "Advanced", custom: "Bespoke" },
                { name: "Daily Sales Reports", essential: true, growth: true, enterprise: true, custom: true },
                { name: "Mobile App Access", essential: true, growth: true, enterprise: true, custom: true },
                { name: "QR Menu Generation", essential: true, growth: true, enterprise: true, custom: true },
            ]
        },
        {
            category: "Advanced Operations",
            features: [
                { name: "Inventory Tracking", essential: "Basic", growth: "Advanced", enterprise: "Advanced", custom: "Unlimited" },
                { name: "Staff Scheduling", essential: false, growth: true, enterprise: true, custom: true },
                { name: "Payroll Management", essential: false, growth: true, enterprise: true, custom: true },
                { name: "Kitchen Display System (KDS)", essential: false, growth: true, enterprise: true, custom: true },
                { name: "Loyalty & Gift Cards", essential: false, growth: true, enterprise: true, custom: true },
                { name: "Customer CRM", essential: "Basic", growth: "Advanced", enterprise: "Advanced", custom: "Full" },
            ]
        },
        {
            category: "Admin & Support",
            features: [
                { name: "Admin Users", essential: "1 User", growth: "Up to 5", enterprise: "Unlimited", custom: "Unlimited" },
                { name: "Multi-location Control", essential: false, growth: false, enterprise: true, custom: true },
                { name: "API Access", essential: false, growth: false, enterprise: true, custom: true },
                { name: "Dedicated Account Manager", essential: false, growth: false, enterprise: true, custom: true },
                { name: "Support Type", essential: "Email", growth: "Chat", enterprise: "Priority Phone", custom: "24/7 Priority" },
                { name: "White-label Solution", essential: false, growth: false, enterprise: true, custom: true },
            ]
        }
    ];

    type ComparisonValue = boolean | string;

    type ComparisonRow = {
        name: string;
        essential: ComparisonValue;
        growth: ComparisonValue;
        enterprise: ComparisonValue;
        custom: ComparisonValue;
    };

    const toComparableString = (value: ComparisonValue) =>
        typeof value === 'boolean' ? (value ? 'yes' : 'no') : value.trim().toLowerCase();

    const isDifferent = (row: ComparisonRow) => {
        const values = [row.essential, row.growth, row.enterprise, row.custom].map(toComparableString);
        return new Set(values).size > 1;
    };

    const matchesQuery = (row: ComparisonRow) =>
        row.name.toLowerCase().includes(comparisonQuery.trim().toLowerCase());

    const renderCell = (value: ComparisonValue, variant: 'default' | 'growth' | 'custom' = 'default') => {
        if (typeof value === 'boolean') {
            if (!value) return <span className="text-[#5a4039]/25">—</span>;
            const color =
                variant === 'growth'
                    ? 'text-[#8b2d1d]'
                    : variant === 'custom'
                      ? 'text-[#ff7b5f]'
                      : 'text-green-600';
            return <FiCheck className={`mx-auto ${color}`} />;
        }
        return <span className="font-semibold text-[#2d1510]">{value}</span>;
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

    return (
        <div className="bg-[#fffcfb] min-h-screen">
            <SaaSHeader 
                openDemoModal={openDemoModal} 
                openLoginModal={openLoginModal} 
            />

            <main className="pt-32 pb-24 bg-mesh relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#8b2d1d]/[0.05] rounded-full blur-[120px] motion-safe:animate-bg-drift"></div>
                    <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#ff7b5f]/[0.05] rounded-full blur-[100px] motion-safe:animate-bg-drift [animation-delay:2s]"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-dot-pattern opacity-[0.03]"></div>
                </div>
                <div className="container mx-auto px-6 text-center mb-16 relative z-10">
                    <h1 className="text-4xl md:text-6xl font-black text-[#2d1510] mb-6 animate-fade-in-up">Simple, transparent <span className="text-[#8b2d1d]">pricing.</span></h1>
                    <p className="text-xl text-[#5a4039] max-w-2xl mx-auto mb-12 animate-fade-in-up [animation-delay:150ms]">
                        Choose the perfect plan for your restaurant. No hidden fees, no surprises.
                    </p>

                    {/* Billing Toggle + Currency */}
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up [animation-delay:300ms]">
                        <div className="flex items-center gap-4">
                            <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-[#2d1510]' : 'text-[#5a4039]/40'}`}>Monthly</span>
                            <button 
                                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                                className="w-14 h-8 rounded-full bg-[#2d1510] p-1 relative transition-all"
                            >
                                <div className={`w-6 h-6 rounded-full bg-[#8b2d1d] transition-all ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </button>
                            <span className={`text-sm font-bold ${billingCycle === 'yearly' ? 'text-[#2d1510]' : 'text-[#5a4039]/40'}`}>
                                Yearly <span className="ml-1 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase">Save 20%</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-2 bg-white border border-[#f3e9e5] rounded-full px-4 py-2">
                            <FiGlobe className="text-[#8b2d1d]" />
                            <select
                                className="text-sm font-bold text-[#2d1510] bg-transparent focus:outline-none"
                                value={currency.code}
                                onChange={(e) => {
                                    const next = CURRENCIES[e.target.value] ?? CURRENCIES.USD;
                                    setCurrency(next);
                                    try {
                                        localStorage.setItem('rb_pricing_currency', next.code);
                                        localStorage.setItem('rb_pricing_currency_mode', 'manual');
                                    } catch {
                                    }
                                }}
                                aria-label="Currency"
                            >
                                {Object.values(CURRENCIES).map((c) => (
                                    <option key={c.code} value={c.code}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left animate-fade-in-up [animation-delay:450ms]">
                        {/* Essential Plan */}
                        <div className="group relative overflow-hidden bg-white p-8 rounded-[32px] border border-[#f3e9e5] flex flex-col h-full hover:border-[#8b2d1d] transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-60 transition-opacity duration-700">
                                <div className="absolute inset-0 animate-shimmer opacity-40"></div>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Essential</h3>
                            <p className="text-[#5a4039]/60 mb-6 text-xs">Perfect for single location cafes and food trucks.</p>
                            <div className="mb-8">
                                <span className="text-4xl font-bold inline-block text-[#2d1510]">{formatPrice(billingCycle === 'monthly' ? 49 : 39)}</span>
                                <span className="text-[#5a4039]/60 text-sm">/mo</span>
                            </div>
                            <ul className="space-y-3 mb-10 flex-grow text-sm">
                                {[
                                    "Track live POS System",
                                    "Up to 15 Tables",
                                    "Basic Menu Customization",
                                    "Daily Sales Reports",
                                    "Standard Email Support"
                                ].map((f, i) => (
                                    <li key={i} className="flex items-center gap-2 text-[#5a4039]">
                                        <FiCheck className="text-[#8b2d1d] flex-shrink-0" /> {f}
                                    </li>
                                ))}
                            </ul>
                            <div className="flex flex-col gap-3">
                                <Button onClick={openRegisterModal} className="w-full !bg-[#2d1510] hover:!bg-black text-white rounded-full py-3 text-sm font-bold transition-all border-none">
                                    Get Started
                                </Button>
                                <a 
                                    href="#comparison" 
                                    onClick={(e) => handleNavClick(e, 'comparison')}
                                    className="w-full text-xs font-bold text-[#5a4039]/40 hover:text-[#8b2d1d] transition-colors flex items-center justify-center gap-1"
                                >
                                    View Full Features <FiChevronDown size={12} />
                                </a>
                            </div>
                        </div>

                        {/* Growth Plan */}
                        <div className="group relative overflow-hidden bg-[#8b2d1d] p-8 rounded-[32px] border border-[#a63928] flex flex-col h-full transform scale-[1.05] shadow-2xl z-10 text-white transition-transform duration-500 hover:-translate-y-2">
                            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity duration-700 mix-blend-soft-light">
                                <div className="absolute inset-0 animate-shimmer opacity-40"></div>
                            </div>
                            <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#ff7b5f] text-white text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">RECOMMENDED</div>
                            <h3 className="text-xl font-bold mb-2">Growth</h3>
                            <p className="text-white/60 mb-6 text-xs">Advanced reporting for growing brands.</p>
                            <div className="mb-8">
                                <span className="text-4xl font-bold inline-block">{formatPrice(billingCycle === 'monthly' ? 99 : 79)}</span>
                                <span className="text-white/60 text-sm">/mo</span>
                            </div>
                            <ul className="space-y-3 mb-10 flex-grow text-sm">
                                {[
                                    "Unlimited Table Management",
                                    "Advanced Inventory Tracking",
                                    "Staff Scheduling & Payroll",
                                    "Loyalty & Gift Cards",
                                    "Customer CRM Insights"
                                ].map((f, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <FiCheck className="text-[#ff7b5f] flex-shrink-0" /> {f}
                                    </li>
                                ))}
                            </ul>
                            <div className="flex flex-col gap-3">
                                <Button onClick={openRegisterModal} className="w-full !bg-white !text-[#8b2d1d] hover:bg-[#f3e9e5] rounded-full py-3 text-sm font-bold transition-all border-none">
                                    Get Started
                                </Button>
                                <a 
                                    href="#comparison" 
                                    onClick={(e) => handleNavClick(e, 'comparison')}
                                    className="w-full text-xs font-bold text-white/60 hover:text-white transition-colors flex items-center justify-center gap-1"
                                >
                                    View Full Features <FiChevronDown size={12} />
                                </a>
                            </div>
                        </div>

                        {/* Enterprise Plan */}
                        <div className="group relative overflow-hidden bg-white p-8 rounded-[32px] border border-[#f3e9e5] flex flex-col h-full hover:border-[#8b2d1d] transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-60 transition-opacity duration-700">
                                <div className="absolute inset-0 animate-shimmer opacity-40"></div>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                            <p className="text-[#5a4039]/60 mb-6 text-xs">Multi-location management and white-glove support.</p>
                            <div className="mb-8">
                                <span className="text-4xl font-bold inline-block text-[#2d1510]">{formatPrice(billingCycle === 'monthly' ? 199 : 159)}</span>
                                <span className="text-[#5a4039]/60 text-sm">/mo</span>
                            </div>
                            <ul className="space-y-3 mb-10 flex-grow text-sm">
                                {[
                                    "Multi-location Central Control",
                                    "Advanced Analytics & Forecasting",
                                    "API Access & Integrations",
                                    "Dedicated Account Manager",
                                    "24/7 Priority Support"
                                ].map((f, i) => (
                                    <li key={i} className="flex items-center gap-2 text-[#5a4039]">
                                        <FiCheck className="text-[#8b2d1d] flex-shrink-0" /> {f}
                                    </li>
                                ))}
                            </ul>
                            <div className="flex flex-col gap-3">
                                <Button onClick={openRegisterModal} className="w-full !bg-[#2d1510] hover:!bg-black text-white rounded-full py-3 text-sm font-bold transition-all border-none">
                                    Get Started
                                </Button>
                                <a 
                                    href="#comparison" 
                                    onClick={(e) => handleNavClick(e, 'comparison')}
                                    className="w-full text-xs font-bold text-[#5a4039]/40 hover:text-[#8b2d1d] transition-colors flex items-center justify-center gap-1"
                                >
                                    View Full Features <FiChevronDown size={12} />
                                </a>
                            </div>
                        </div>

                        {/* Custom Plan */}
                        <div className="group relative overflow-hidden bg-gradient-to-br from-[#2d1510] to-[#3d1f1a] p-8 rounded-[32px] border-2 border-dashed border-[#8b2d1d]/30 flex flex-col h-full hover:border-[#8b2d1d] transition-all duration-500 hover:shadow-2xl text-white hover:-translate-y-2">
                            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity duration-700 mix-blend-soft-light">
                                <div className="absolute inset-0 animate-shimmer opacity-40"></div>
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-[#ff7b5f]">Custom Plan</h3>
                            <p className="text-white/60 mb-6 text-xs">Bespoke solutions for high-volume franchises.</p>
                            <div className="mb-8">
                                <span className="text-4xl font-bold inline-block">Custom</span>
                                <p className="text-white/40 text-xs mt-1">Tailored to your needs</p>
                            </div>
                            <ul className="space-y-3 mb-10 flex-grow text-sm">
                                {[
                                    "Unlimited Everything",
                                    "Custom Feature Development",
                                    "On-site Implementation",
                                    "White-label Solution",
                                    "SLA Guarantee Support"
                                ].map((f, i) => (
                                    <li key={i} className="flex items-center gap-2 text-white/80">
                                        <FiCheck className="text-[#ff7b5f] flex-shrink-0" /> {f}
                                    </li>
                                ))}
                            </ul>
                            <div className="flex flex-col gap-3">
                                <Button onClick={openDemoModal} className="w-full bg-white/5 hover:bg-white/10 text-white rounded-full py-3 text-sm font-bold border border-white/20 transition-all">
                                    Talk to Sales
                                </Button>
                                <a 
                                    href="#comparison" 
                                    onClick={(e) => handleNavClick(e, 'comparison')}
                                    className="w-full text-xs font-bold text-white/40 hover:text-[#ff7b5f] transition-colors flex items-center justify-center gap-1"
                                >
                                    View Full Features <FiChevronDown size={12} />
                                </a>
                            </div>
                        </div>
                    </div>

                    <div id="comparison" className="mt-32 reveal-scale">
                        <div className="mx-auto max-w-6xl">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl md:text-5xl font-black text-[#2d1510] mb-6">Compare all <span className="text-[#8b2d1d]">features.</span></h2>
                                <p className="text-[#5a4039] max-w-2xl mx-auto">
                                    Search what matters to you and instantly see the differences across plans.
                                </p>
                            </div>

                            <div className="bg-white border border-[#f3e9e5] rounded-[32px] shadow-xl p-6 md:p-8 relative overflow-hidden">
                                <div className="h-1 w-full rounded-full bg-[#f3e9e5] overflow-hidden mb-6">
                                    <div className="h-full w-full animate-shimmer opacity-60"></div>
                                </div>
                                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
                                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full lg:w-auto">
                                        <div className="relative w-full sm:w-[360px]">
                                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5a4039]/40" />
                                            <input
                                                value={comparisonQuery}
                                                onChange={(e) => setComparisonQuery(e.target.value)}
                                                placeholder="Search features (POS, inventory, CRM...)"
                                                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#8b2d1d]/20"
                                            />
                                        </div>
                                        <button
                                            onClick={() => setShowOnlyDifferences((v) => !v)}
                                            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-black transition-all border ${
                                                showOnlyDifferences
                                                    ? 'bg-[#2d1510] text-white border-[#2d1510]'
                                                    : 'bg-white text-[#2d1510] border-[#f3e9e5] hover:border-[#8b2d1d]/30'
                                            }`}
                                        >
                                            <FiSliders />
                                            Only differences
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2">
                                        {comparisonData.map((cat) => {
                                            const filteredCount = cat.features.filter((row) => {
                                                const r = row as unknown as ComparisonRow;
                                                return matchesQuery(r) && (!showOnlyDifferences || isDifferent(r));
                                            }).length;

                                            return (
                                                <button
                                                    key={cat.category}
                                                    onClick={() => scrollToId(`comparison-${slugify(cat.category)}`)}
                                                    className="px-4 py-2 rounded-full border border-[#f3e9e5] text-xs font-black text-[#2d1510] hover:border-[#8b2d1d]/30 hover:bg-[#8b2d1d]/5 transition-all"
                                                >
                                                    {cat.category} <span className="text-[#5a4039]/50">({filteredCount})</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="hidden md:block">
                                    <div className="overflow-auto max-h-[620px] rounded-[24px] border border-[#f3e9e5]">
                                        <table className="w-full min-w-[920px] text-left border-collapse">
                                            <thead className="sticky top-0 z-30 bg-white">
                                                <tr>
                                                    <th className="sticky left-0 z-40 bg-white p-5 text-xs font-black text-[#2d1510] uppercase tracking-widest border-b border-[#f3e9e5] w-[34%]">
                                                        Feature
                                                    </th>
                                                    <th className="p-5 text-xs font-black text-[#2d1510] uppercase tracking-widest border-b border-[#f3e9e5] text-center">
                                                        Essential
                                                    </th>
                                                    <th className="p-5 text-xs font-black text-[#8b2d1d] uppercase tracking-widest border-b border-[#f3e9e5] text-center bg-[#8b2d1d]/5">
                                                        Growth
                                                    </th>
                                                    <th className="p-5 text-xs font-black text-[#2d1510] uppercase tracking-widest border-b border-[#f3e9e5] text-center">
                                                        Enterprise
                                                    </th>
                                                    <th className="p-5 text-xs font-black text-[#ff7b5f] uppercase tracking-widest border-b border-[#f3e9e5] text-center">
                                                        Custom
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {comparisonData.map((cat) => {
                                                    const categoryId = `comparison-${slugify(cat.category)}`;
                                                    const rows = cat.features
                                                        .map((row) => row as unknown as ComparisonRow)
                                                        .filter((row) => matchesQuery(row) && (!showOnlyDifferences || isDifferent(row)));

                                                    if (rows.length === 0) return null;

                                                    return (
                                                        <React.Fragment key={cat.category}>
                                                            <tr id={categoryId} className="bg-[#f3e9e5]/20">
                                                                <td
                                                                    colSpan={5}
                                                                    className="sticky left-0 z-20 bg-[#f3e9e5]/20 p-4 px-6 text-[11px] font-black text-[#8b2d1d] uppercase tracking-[0.2em] border-b border-[#f3e9e5]"
                                                                >
                                                                    {cat.category}
                                                                </td>
                                                            </tr>
                                                            {rows.map((row) => {
                                                                const different = isDifferent(row);
                                                                return (
                                                                    <tr
                                                                        key={row.name}
                                                                        className={`group transition-colors ${
                                                                            different ? 'hover:bg-[#8b2d1d]/[0.03]' : 'opacity-70 hover:opacity-100 hover:bg-gray-50/50'
                                                                        }`}
                                                                    >
                                                                        <td className="sticky left-0 z-10 bg-white p-5 border-b border-[#f3e9e5] font-semibold text-[#2d1510]">
                                                                            {row.name}
                                                                        </td>
                                                                        <td className="p-5 border-b border-[#f3e9e5] text-center text-sm">
                                                                            {renderCell(row.essential)}
                                                                        </td>
                                                                        <td className="p-5 border-b border-[#f3e9e5] text-center text-sm bg-[#8b2d1d]/5">
                                                                            {renderCell(row.growth, 'growth')}
                                                                        </td>
                                                                        <td className="p-5 border-b border-[#f3e9e5] text-center text-sm">
                                                                            {renderCell(row.enterprise)}
                                                                        </td>
                                                                        <td className="p-5 border-b border-[#f3e9e5] text-center text-sm">
                                                                            {renderCell(row.custom, 'custom')}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="md:hidden space-y-8">
                                    {comparisonData.map((cat) => {
                                        const categoryId = `comparison-${slugify(cat.category)}`;
                                        const rows = cat.features
                                            .map((row) => row as unknown as ComparisonRow)
                                            .filter((row) => matchesQuery(row) && (!showOnlyDifferences || isDifferent(row)));

                                        if (rows.length === 0) return null;

                                        return (
                                            <div key={cat.category} id={categoryId}>
                                                <div className="flex items-end justify-between mb-4">
                                                    <div className="text-sm font-black text-[#8b2d1d] uppercase tracking-[0.2em]">{cat.category}</div>
                                                    <div className="text-xs font-bold text-[#5a4039]/60">{rows.length} items</div>
                                                </div>
                                                <div className="space-y-3">
                                                    {rows.map((row) => (
                                                        <details key={row.name} className="rounded-2xl border border-[#f3e9e5] bg-white px-5 py-4">
                                                            <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
                                                                <span className="text-sm font-black text-[#2d1510]">{row.name}</span>
                                                                <span className="text-[10px] font-black px-3 py-1 rounded-full bg-[#f3e9e5] text-[#5a4039]">
                                                                    {isDifferent(row) ? 'Different' : 'Same'}
                                                                </span>
                                                            </summary>
                                                            <div className="pt-4 grid grid-cols-2 gap-3 text-xs">
                                                                <div className="p-3 rounded-xl bg-gray-50 border border-[#f3e9e5]">
                                                                    <div className="font-black text-[#2d1510] mb-2">Essential</div>
                                                                    <div className="text-[#5a4039]">{renderCell(row.essential)}</div>
                                                                </div>
                                                                <div className="p-3 rounded-xl bg-[#8b2d1d]/5 border border-[#f3e9e5]">
                                                                    <div className="font-black text-[#8b2d1d] mb-2">Growth</div>
                                                                    <div className="text-[#5a4039]">{renderCell(row.growth, 'growth')}</div>
                                                                </div>
                                                                <div className="p-3 rounded-xl bg-gray-50 border border-[#f3e9e5]">
                                                                    <div className="font-black text-[#2d1510] mb-2">Enterprise</div>
                                                                    <div className="text-[#5a4039]">{renderCell(row.enterprise)}</div>
                                                                </div>
                                                                <div className="p-3 rounded-xl bg-gray-50 border border-[#f3e9e5]">
                                                                    <div className="font-black text-[#ff7b5f] mb-2">Custom</div>
                                                                    <div className="text-[#5a4039]">{renderCell(row.custom, 'custom')}</div>
                                                                </div>
                                                            </div>
                                                        </details>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <SaaSFooter handleNavClick={handleNavClick} />

            {/* Auth Modals */}
            <Modal isOpen={authModal !== null} onClose={closeModal} title={authModal === 'login' ? 'Sign In' : authModal === 'register' ? 'Create Account' : 'Request a Free Demo'}>
                <React.Suspense fallback={<div className="p-6 flex justify-center">Loading...</div>}>
                    {authModal === 'login' && <LoginPage onSwitchToRegister={() => setAuthModal('register')} />}
                    {authModal === 'register' && <RegisterPage onSwitchToLogin={() => setAuthModal('login')} />}
                    {authModal === 'demo' && <DemoForm />}
                </React.Suspense>
            </Modal>
        </div>
    );
};

export default SaaSPricingPage;
