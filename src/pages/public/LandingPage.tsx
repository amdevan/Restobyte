import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import { 
    FiCheckCircle, FiPlayCircle, FiArrowRight, FiDatabase, FiGrid, FiBarChart2, 
    FiMonitor, FiUsers, FiCalendar, FiClock, FiCheck, FiChevronDown,
    FiShoppingCart, FiGlobe, FiStar, FiArrowUp,
    FiSmartphone, FiLayers
} from 'react-icons/fi';

import { SaaSHeader } from '@/components/public/SaaSHeader';
import { SaaSFooter } from '@/components/public/SaaSFooter';
import { getSaasWebsiteContent, SaasWebsiteContent } from '@/services/api';

const LoginPage = React.lazy(() => import('../auth/LoginPage'));
const RegisterPage = React.lazy(() => import('../auth/RegisterPage'));

const useScrollReveal = () => {
    useEffect(() => {
        // Fallback for browsers that don't support IntersectionObserver or if it fails
        const fallbackTimeout = setTimeout(() => {
            const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
            reveals.forEach(el => {
                if (!el.classList.contains('reveal-active')) {
                    el.classList.add('reveal-active');
                }
            });
        }, 2000);

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

        return () => {
            clearTimeout(fallbackTimeout);
            observer.disconnect();
        };
    }, []);
};

const useParallax = () => {
    useEffect(() => {
        const handleScroll = () => {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('.parallax-bg');
            parallaxElements.forEach((el: any) => {
                const speed = el.dataset.speed || 0.5;
                el.style.transform = `translateY(${scrolled * speed}px)`;
            });
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
};

const LandingPage: React.FC = () => {
    useScrollReveal();
    useParallax();
    const [authModal, setAuthModal] = useState<'login' | 'register' | 'demo' | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [content, setContent] = useState<SaasWebsiteContent | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const data = await getSaasWebsiteContent();
                if (data && data.content) {
                    setContent(data.content);
                }
            } catch (error) {
                console.error('Failed to fetch SaaS content:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchContent();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 500) {
                setShowBackToTop(true);
            } else {
                setShowBackToTop(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getSlides = () => {
        if (!content || !content.hero) {
            return [
                {
                    badge: "Trusted by 500+ Restaurants Worldwide",
                    title: "The Intelligent Operating System for Modern Dining",
                    highlight: "Operating System",
                    description: "From POS to kitchen display, reservations to staff management—RestoByte unifies your entire operation into one seamless, high-speed experience.",
                    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070",
                    stats: [
                        { label: "Revenue Growth", value: "+32.5%", icon: <FiBarChart2 />, color: "green" },
                        { label: "Active Guests", value: "142", icon: <FiUsers />, color: "primary", badge: "Live" }
                    ]
                },
                {
                    badge: "AI-Powered Inventory Management",
                    title: "Smart Inventory & Predictive Analytics",
                    highlight: "Predictive Analytics",
                    description: "Stop the guesswork. Track every ingredient in real-time and get AI-powered insights on your most profitable dishes and low-stock alerts.",
                    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2026",
                    stats: [
                        { label: "Food Waste", value: "-18.4%", icon: <FiDatabase />, color: "orange" },
                        { label: "Profit Margin", value: "+12.2%", icon: <FiStar />, color: "green" }
                    ]
                },
                {
                    badge: "Multi-Channel Synchronization",
                    title: "Seamless Multi-Channel Ordering & POS",
                    highlight: "Multi-Channel",
                    description: "Dine-in, Takeaway, or Delivery. Sync every order source into one centralized screen and never miss a beat during the dinner rush.",
                    image: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&q=80&w=2070",
                    stats: [
                        { label: "Order Speed", value: "2.4m avg", icon: <FiClock />, color: "blue" },
                        { label: "Table Turnover", value: "+25%", icon: <FiGrid />, color: "primary" }
                    ]
                }
            ];
        }

        // For now, if the backend only has one hero, we create a slide from it
        // If the backend is updated to support multiple slides in the future, we can map them here
        return [
            {
                badge: "Experience RestoByte",
                title: content.hero.title,
                highlight: content.hero.title.split(' ').slice(-2).join(' '),
                description: content.hero.subtitle,
                image: content.hero.imageUrl,
                stats: content.statistics?.length > 1 ? [
                    { label: content.statistics[0].label, value: content.statistics[0].value, icon: <FiBarChart2 />, color: "green" },
                    { label: content.statistics[1].label, value: content.statistics[1].value, icon: <FiUsers />, color: "primary", badge: "Live" }
                ] : [
                    { label: "Revenue Growth", value: "+32.5%", icon: <FiBarChart2 />, color: "green" },
                    { label: "Active Guests", value: "142", icon: <FiUsers />, color: "primary", badge: "Live" }
                ]
            }
        ];
    };

    const slides = getSlides();

    useEffect(() => {
        const timer = setInterval(() => {
            if (slides.length > 1) {
                setCurrentSlide((prev) => (prev + 1) % slides.length);
            }
        }, 6000);
        return () => clearInterval(timer);
    }, [slides.length]);

    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const id = hash.replace('#', '');
            const element = document.getElementById(id);
            if (element) {
                setTimeout(() => {
                    const headerOffset = 80;
                    const elementPosition = element.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
                }, 100);
            }
        }
    }, []);

    useEffect(() => {
        const action = searchParams.get('action');
        if (action === 'login') {
            setAuthModal('login');
        } else if (action === 'register') {
            setAuthModal('register');
        }
    }, [searchParams]);

    const openLoginModal = () => setAuthModal('login');
    const openRegisterModal = () => setAuthModal('register');
    const openDemoModal = () => setAuthModal('demo');
    const closeModal = () => {
        setAuthModal(null);
        setSearchParams({});
    };

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };

    const DemoForm = () => (
        <form className="space-y-4 p-4" onSubmit={(e) => { e.preventDefault(); alert('Demo request sent! Our team will contact you soon.'); closeModal(); }}>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-sm font-bold">First Name</label>
                    <input type="text" required className="w-full p-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#8b2d1d]/20" placeholder="John" />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-bold">Last Name</label>
                    <input type="text" required className="w-full p-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#8b2d1d]/20" placeholder="Doe" />
                </div>
            </div>
            <div className="space-y-1">
                <label className="text-sm font-bold">Email Address</label>
                <input type="email" required className="w-full p-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#8b2d1d]/20" placeholder="john@example.com" />
            </div>
            <div className="space-y-1">
                <label className="text-sm font-bold">Restaurant Name</label>
                <input type="text" required className="w-full p-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#8b2d1d]/20" placeholder="My Awesome Bistro" />
            </div>
            <div className="space-y-1">
                <label className="text-sm font-bold">Number of Locations</label>
                <select className="w-full p-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#8b2d1d]/20">
                    <option>1 location</option>
                    <option>2-5 locations</option>
                    <option>5-10 locations</option>
                    <option>10+ locations</option>
                </select>
            </div>
            <Button type="submit" className="w-full bg-[#8b2d1d] hover:bg-[#7a2719] text-white rounded-xl py-4 font-bold mt-4">
                Submit Request
            </Button>
        </form>
    );

    const faqItems = [
        {
            question: "How long does setup take?",
            answer: "Manage orders, reservations, and more with our integrated system. Most restaurants are up and running within 24-48 hours with our guided onboarding process."
        },
        {
            question: "Do you provide customer support?",
            answer: "Yes, we offer 24/7 dedicated support via chat, email, and phone for all our plans."
        },
        {
            question: "Can I manage multiple restaurant locations?",
            answer: "Absolutely. Our Growth and Enterprise plans are designed for multi-location management with centralized reporting."
        },
        {
            question: "Is there a free trial?",
            answer: "Yes, we offer a 14-day free trial on our Essential and Growth plans so you can explore all features before committing."
        },
        {
            question: "Is there a free trial setup within 24 hours?",
            answer: "Yes! Our team works quickly to get your basic setup ready so you can start testing the platform almost immediately."
        }
    ];

    const getFeatures = () => {
        if (!content || !content.features || content.features.length === 0) {
            return [
                { id: '1', title: "Order Management", description: "Track dining, multi-waiter and takeaway orders with ease through intuitive interfaces.", icon: <FiShoppingCart size={28} />, image: "https://images.unsplash.com/photo-1556740734-7f9a2f77d59a?auto=format&fit=crop&q=80&w=400" },
                { id: '2', title: "Menu & Pricing Control", description: "Simply customize, edit, and sync your menu and prices with a unified management system.", icon: <FiGrid size={28} />, image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=400" },
                { id: '3', title: "Reservation System", description: "Smart table reservations with automated confirmations and availability tracking.", icon: <FiCalendar size={28} />, image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400" },
                { id: '4', title: "Staff Management", description: "Schedule shifts, track performance, and manage staff permissions across all locations.", icon: <FiUsers size={28} />, isStaff: true },
                { id: '5', title: "Sales Reports & Insights", description: "Get real-time hours performance insights to make smarter business decisions.", icon: <FiBarChart2 size={28} />, isChart: true }
            ];
        }

        const iconMap: { [key: string]: any } = {
            'FiShoppingCart': <FiShoppingCart size={28} />,
            'FiGrid': <FiGrid size={28} />,
            'FiCalendar': <FiCalendar size={28} />,
            'FiUsers': <FiUsers size={28} />,
            'FiBarChart2': <FiBarChart2 size={28} />,
            'FiMonitor': <FiMonitor size={28} />,
            'FiSmartphone': <FiSmartphone size={28} />,
            'FiLayers': <FiLayers size={28} />
        };

        return content.features.map(f => ({
            id: f.id,
            title: f.title,
            description: f.description,
            icon: iconMap[f.icon] || <FiCheck size={28} />,
            image: "https://images.unsplash.com/photo-1556740734-7f9a2f77d59a?auto=format&fit=crop&q=80&w=400" // Default fallback image
        }));
    };

    const features = getFeatures();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fffcfb]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-[#8b2d1d]/20 border-t-[#8b2d1d] rounded-full animate-spin"></div>
                    <p className="text-[#8b2d1d] font-bold animate-pulse">Loading RestoByte...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#fffcfb] font-sans text-[#2d1510] selection:bg-[#8b2d1d] selection:text-white relative">
            <SaaSHeader 
                openDemoModal={openDemoModal} 
                openLoginModal={openLoginModal} 
                scrollToTop={scrollToTop} 
                content={content?.header}
            />

            <main className="pt-20">
                {/* Hero Slider Section */}
                <section id="home" className="relative min-h-[95vh] flex items-center pt-32 pb-20 overflow-hidden bg-mesh">
                    {/* Dynamic background elements */}
                    <div className="absolute top-0 right-0 w-full h-full pointer-events-none">
                        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#8b2d1d]/[0.05] rounded-full blur-[120px] animate-bg-drift"></div>
                        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#ff7b5f]/[0.05] rounded-full blur-[100px] animate-bg-drift [animation-delay:2s]"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-dot-pattern opacity-[0.03]"></div>
                    </div>
                    
                    <div className="container mx-auto px-6 relative z-10">
                        {slides.map((slide, index) => (
                            <div key={index} className={`transition-all duration-1000 absolute inset-0 flex items-center px-6 ${index === currentSlide ? 'opacity-100 translate-x-0 relative z-10' : 'opacity-0 translate-x-20 pointer-events-none absolute'}`}>
                                <div className="flex flex-col lg:flex-row items-center gap-16 w-full">
                                    <div className="lg:w-1/2 text-left">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#8b2d1d]/10 text-[#8b2d1d] text-sm font-bold mb-8 animate-fade-in-down">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8b2d1d] opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8b2d1d]"></span>
                                            </span>
                                            {slide.badge}
                                        </div>
                                        
                                        <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.1] mb-8 text-[#2d1510] animate-fade-in-up">
                                            {slide.title.split(slide.highlight)[0]}
                                            <span className="text-[#8b2d1d]">{slide.highlight}</span>
                                            {slide.title.split(slide.highlight)[1]}
                                        </h1>
                                        
                                        <p className="text-xl text-[#5a4039] mb-10 leading-relaxed max-w-xl animate-fade-in-up [animation-delay:200ms]">
                                            {slide.description}
                                        </p>
                                        
                                        <div className="flex flex-col sm:flex-row items-start gap-4 animate-fade-in-up [animation-delay:400ms]">
                                            <Button size="lg" onClick={openRegisterModal} className="!bg-[#8b2d1d] !text-white hover:bg-[#7a2719] rounded-2xl px-10 py-5 text-lg font-bold shadow-2xl shadow-[#8b2d1d]/20 transition-all hover:-translate-y-1 border-none">
                                                Start Your Free Trial <FiArrowRight className="ml-2 inline" />
                                            </Button>
                                            <button onClick={openDemoModal} className="flex items-center gap-3 px-8 py-5 rounded-2xl border-2 border-[#f3e9e5] hover:bg-[#f3e9e5]/30 text-[#2d1510] font-bold transition-all">
                                                <FiPlayCircle className="text-[#8b2d1d] text-2xl" /> Watch Demo
                                            </button>
                                        </div>
                                        
                                        <div className="mt-12 flex items-center gap-6 animate-fade-in-up [animation-delay:600ms]">
                                            <div className="flex -space-x-3">
                                                {[1,2,3,4].map(i => (
                                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                                                        <img src={`https://i.pravatar.cc/100?img=${i+index*5+10}`} alt="User" />
                                                    </div>
                                                ))}
                                            </div>
                                            <div>
                                                <div className="flex text-yellow-400 mb-1">
                                                    {[1,2,3,4,5].map(i => <FiStar key={i} fill="currentColor" size={14} />)}
                                                </div>
                                                <p className="text-sm font-medium text-[#5a4039]">4.9/5 from 2,000+ reviews</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="lg:w-1/2 relative">
                                        <div className="relative z-20 animate-zoom-in [animation-delay:400ms]">
                                            <div className="bg-[#2d1510] rounded-[2rem] p-3 shadow-[0_50px_100px_-20px_rgba(45,21,16,0.3)] border-4 border-[#3d1f1a]">
                                                <img 
                                                    src={slide.image} 
                                                    alt="Dashboard" 
                                                    className="rounded-[1.5rem] w-full shadow-2xl h-[400px] object-cover"
                                                    crossOrigin="anonymous"
                                                />
                                            </div>
                                            
                                            {/* Floating Stats Card 1 */}
                                            <div className={`absolute -top-10 -left-10 bg-white p-6 rounded-3xl shadow-2xl border border-[#f3e9e5] animate-float hidden md:block transition-all duration-700 ${index === currentSlide ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                                                <div className="flex items-center gap-4 mb-3">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${slide.stats[0].color === 'green' ? 'bg-green-100 text-green-600' : slide.stats[0].color === 'orange' ? 'bg-orange-100 text-orange-600' : slide.stats[0].color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-[#8b2d1d]/10 text-[#8b2d1d]'}`}>
                                                        {slide.stats[0].icon}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-[#5a4039] font-bold uppercase tracking-wider">{slide.stats[0].label}</p>
                                                        <p className="text-2xl font-black text-[#2d1510]">{slide.stats[0].value}</p>
                                                    </div>
                                                </div>
                                                <div className={`flex items-center gap-2 text-xs font-bold ${slide.stats[0].color === 'green' ? 'text-green-600' : slide.stats[0].color === 'orange' ? 'text-orange-600' : 'text-[#8b2d1d]'}`}>
                                                    <FiArrowRight className="-rotate-45" /> vs. last month
                                                </div>
                                            </div>
                                            
                                            {/* Floating Stats Card 2 */}
                                            <div className={`absolute -bottom-10 -right-10 bg-white p-6 rounded-3xl shadow-2xl border border-[#f3e9e5] animate-float-delayed hidden md:block transition-all duration-700 ${index === currentSlide ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${slide.stats[1].color === 'green' ? 'bg-green-100 text-green-600' : slide.stats[1].color === 'orange' ? 'bg-orange-100 text-orange-600' : slide.stats[1].color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-[#8b2d1d]/10 text-[#8b2d1d]'}`}>
                                                        {slide.stats[1].icon}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-[#5a4039] font-bold uppercase tracking-wider">{slide.stats[1].label}</p>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-2xl font-black text-[#2d1510]">{slide.stats[1].value}</p>
                                                            {slide.stats[1].badge && (
                                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full">{slide.stats[1].badge}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Background blur element */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#8b2d1d]/10 blur-[100px] -z-10 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Slider Controls */}
                        <div className="absolute bottom-10 left-6 flex items-center gap-4 z-20">
                            <div className="flex gap-2">
                                {slides.map((_, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => setCurrentSlide(i)}
                                        className={`h-2 transition-all duration-500 rounded-full ${i === currentSlide ? 'w-12 bg-[#8b2d1d]' : 'w-2 bg-[#8b2d1d]/20 hover:bg-[#8b2d1d]/40'}`}
                                    />
                                ))}
                            </div>
                            <div className="h-4 w-px bg-[#f3e9e5]"></div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                                    className="w-10 h-10 rounded-full border border-[#f3e9e5] flex items-center justify-center text-[#5a4039] hover:bg-[#8b2d1d] hover:text-white transition-all group"
                                >
                                    <FiArrowRight className="rotate-180 group-active:-translate-x-1 transition-transform" />
                                </button>
                                <button 
                                    onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                                    className="w-10 h-10 rounded-full border border-[#f3e9e5] flex items-center justify-center text-[#5a4039] hover:bg-[#8b2d1d] hover:text-white transition-all group"
                                >
                                    <FiArrowRight className="group-active:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Trusted By / Logos */}
                <section className="py-16 bg-white border-y border-[#f3e9e5] overflow-hidden">
                    <div className="container mx-auto px-6">
                        <p className="text-center text-sm font-bold text-[#5a4039]/60 uppercase tracking-[0.2em] mb-12">Powering the world's most innovative kitchens</p>
                        <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-10 opacity-30 grayscale contrast-125">
                            {content?.trustedByLogos && content.trustedByLogos.length > 0 ? (
                                content.trustedByLogos.map((logo, i) => (
                                    <img key={i} src={logo} alt="Partner Logo" className="h-12 w-auto object-contain" crossOrigin="anonymous" />
                                ))
                            ) : (
                                <>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-black rounded-full"></div>
                                        <span className="text-xl font-black tracking-tighter">CLOUD KITCHEN</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 border-4 border-black rotate-45"></div>
                                        <span className="text-xl font-black tracking-tighter">RESTAURANT PRO</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[26px] border-b-black"></div>
                                        <span className="text-xl font-black tracking-tighter">FOODIE HUB</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-black rounded-sm"></div>
                                        <span className="text-xl font-black tracking-tighter">BISTRO FLOW</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 border-2 border-black rounded-full flex items-center justify-center">
                                            <div className="w-4 h-4 bg-black rounded-full"></div>
                                        </div>
                                        <span className="text-xl font-black tracking-tighter">DINE SYNC</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                {/* Dashboard Built for Speed Section */}
                <section className="py-32 bg-white overflow-hidden">
                    <div className="container mx-auto px-6">
                        <div className="flex flex-col lg:flex-row items-center gap-20">
                            <div className="lg:w-1/2 reveal-left">
                                <div className="relative">
                                    <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] transform lg:-rotate-2 transition-transform hover:rotate-0 duration-700">
                                        <img 
                                            src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=1000" 
                                            alt="Chef using dashboard" 
                                            className="w-full h-auto"
                                            crossOrigin="anonymous"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#2d1510]/60 to-transparent"></div>
                                        <div className="absolute bottom-10 left-10 text-white">
                                            <p className="text-sm font-bold uppercase tracking-widest mb-2 opacity-80">Real-time Sync</p>
                                            <h4 className="text-3xl font-bold">Kitchen Display System</h4>
                                        </div>
                                    </div>
                                    
                                    {/* Floating Order Card */}
                                    <div className="absolute -top-10 -right-10 z-20 bg-white p-6 rounded-[2rem] shadow-2xl border border-[#f3e9e5] w-64 animate-float hidden md:block">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-xs font-black text-[#8b2d1d] bg-[#8b2d1d]/10 px-3 py-1 rounded-full uppercase">Order #429</span>
                                            <span className="text-xs font-bold text-[#5a4039]/60">2m ago</span>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-[#2d1510]">Wagyu Burger</span>
                                                <span className="text-xs font-bold text-[#5a4039]">x2</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-[#2d1510]">Truffle Fries</span>
                                                <span className="text-xs font-bold text-[#5a4039]">x1</span>
                                            </div>
                                        </div>
                                        <div className="mt-6 pt-6 border-t border-[#f3e9e5]">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold text-[#5a4039]">Status</span>
                                                <span className="text-xs font-bold text-orange-500">In Preparation</span>
                                            </div>
                                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                                <div className="bg-orange-500 h-full w-[65%] animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Decorative dots */}
                                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[radial-gradient(#8b2d1d_2px,transparent_2px)] [background-size:20px_20px] opacity-20 -z-10"></div>
                                </div>
                            </div>
                            <div className="lg:w-1/2 reveal-right">
                                <div className="inline-block px-4 py-2 rounded-full bg-[#8b2d1d]/5 text-[#8b2d1d] text-xs font-bold uppercase tracking-widest mb-6">Efficiency First</div>
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8 leading-tight text-[#2d1510]">
                                    Engineered for the <span className="text-[#8b2d1d]">Rush Hour</span>
                                </h2>
                                <p className="text-lg text-[#5a4039] mb-10 leading-relaxed">
                                    Stop wrestling with legacy systems that slow you down when it matters most. RestoByte's zero-latency interface ensures that from the moment an order is placed to the moment it hits the table, every second is optimized.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
                                    <div className="flex flex-col gap-3">
                                        <div className="w-10 h-10 bg-[#8b2d1d] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#8b2d1d]/30">
                                            <FiClock size={20} />
                                        </div>
                                        <h4 className="text-xl font-bold text-[#2d1510]">4x Faster Checkout</h4>
                                        <p className="text-sm text-[#5a4039]">Proprietary "One-Tap" billing flow reduces table turnaround time by 25%.</p>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <div className="w-10 h-10 bg-[#2d1510] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#2d1510]/30">
                                            <FiMonitor size={20} />
                                        </div>
                                        <h4 className="text-xl font-bold text-[#2d1510]">Offline Mode</h4>
                                        <p className="text-sm text-[#5a4039]">Internet down? No problem. Keep taking orders and sync automatically when you're back.</p>
                                    </div>
                                </div>
                                <Button onClick={openRegisterModal} className="!bg-[#2d1510] !text-white hover:bg-black rounded-xl px-8 py-4 font-bold border-none">
                                    Explore the Dashboard
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section id="features" className="relative py-20 bg-mesh overflow-hidden">
                    {/* Subtle background decoration */}
                    <div className="absolute top-1/2 left-0 w-64 h-64 bg-[#8b2d1d]/[0.02] rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#ff7b5f]/[0.01] rounded-full blur-[120px] pointer-events-none"></div>
                    
                    <div className="container mx-auto px-6 relative z-10">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 reveal">
                            <div className="max-w-xl">
                                <span className="text-[#8b2d1d] font-bold tracking-widest uppercase text-sm mb-4 block">FEATURES</span>
                                <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                                    Run Your Restaurant with Confidence
                                </h2>
                            </div>
                            <p className="text-[#5a4039] max-w-sm text-lg">
                                Eliminate errors and double entry. Everything you need to manage your space is right here.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {features.map((feature, index) => (
                                <div key={feature.id} className={`bg-white p-8 rounded-3xl border border-[#f3e9e5] hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group reveal reveal-delay-${index * 100}`}>
                                    <div className="w-14 h-14 bg-[#8b2d1d]/5 rounded-2xl flex items-center justify-center text-[#8b2d1d] mb-6 group-hover:bg-[#8b2d1d] group-hover:text-white transition-colors duration-500">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                                    <p className="text-[#5a4039] mb-6 leading-relaxed">
                                        {feature.description}
                                    </p>
                                    {feature.image && (
                                        <div className="overflow-hidden rounded-2xl h-40">
                                            <img src={feature.image} alt={feature.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" crossOrigin="anonymous" />
                                        </div>
                                    )}
                                    {feature.id === '4' && ( // Staff Management special decoration
                                        <div className="flex -space-x-4 mb-2 overflow-hidden">
                                            {[1, 2, 3, 4].map(i => (
                                                <img key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-white transition-transform duration-300 hover:scale-125 hover:z-10 cursor-pointer" src={`https://i.pravatar.cc/150?u=${i}`} alt="" />
                                            ))}
                                        </div>
                                    )}
                                    {feature.id === '5' && ( // Sales Reports special decoration
                                        <div className="flex items-end gap-2 h-20">
                                            {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                                                <div key={i} className="flex-1 bg-[#8b2d1d]/20 rounded-t-md group-hover:bg-[#8b2d1d] transition-all duration-500 ease-out" style={{ height: `${h}%`, transitionDelay: `${i * 50}ms` }}></div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Video / Worker Section */}
                <section className="py-24 bg-white overflow-hidden">
                    <div className="container mx-auto px-6">
                        <div className="relative rounded-[40px] overflow-hidden group reveal">
                            <img 
                                src="https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?auto=format&fit=crop&q=80&w=2000" 
                                alt="Restaurant Worker" 
                                className="w-full h-[600px] object-cover transition-transform duration-[2000ms] group-hover:scale-105"
                                crossOrigin="anonymous"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                            <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white/90 rounded-full flex items-center justify-center text-[#8b2d1d] shadow-2xl hover:scale-110 transition-transform z-10">
                                <FiPlayCircle size={48} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Why Top Restaurants Choose Us */}
                <section className="relative py-20 bg-mesh overflow-hidden">
                    <div className="absolute inset-0 bg-dot-pattern opacity-[0.01]"></div>
                    <div className="container mx-auto px-6 relative z-10">
                        <div className="flex flex-col lg:flex-row gap-20">
                            <div className="lg:w-1/3 reveal-left">
                                <span className="text-[#8b2d1d] font-bold tracking-widest uppercase text-sm mb-4 block">BENEFITS</span>
                                <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                                    Why Top Restaurants Choose Us
                                </h2>
                                <p className="text-lg text-[#5a4039] leading-relaxed">
                                    A years of all-in-one system that simplifies operations, reduces errors, and gives you full control over your restaurant.
                                </p>
                            </div>
                            <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
                                {[
                                    { icon: <FiCheckCircle />, title: "Reduce errors & miscommunication", desc: "Track management workflow with our intuitive and easy to use software systems." },
                                    { icon: <FiGlobe />, title: "Centralized Control, Anywhere", desc: "Update menu, prices, and availability instantly across all channels." },
                                    { icon: <FiClock />, title: "Save Time on Daily Operations", desc: "Automate repetitive tasks and focus on what matters: serving your guests." },
                                    { icon: <FiBarChart2 />, title: "Increase Revenue with Insights", desc: "Use data-driven insights to optimize your menu and pricing strategy." }
                                ].map((benefit, i) => (
                                    <div key={i} className={`flex gap-6 reveal-right reveal-delay-${(i % 2) * 100 + Math.floor(i / 2) * 100}`}>
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#8b2d1d] shadow-sm border border-[#f3e9e5] flex-shrink-0 transition-all hover:rotate-12 hover:scale-110 duration-300">
                                            {benefit.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                                            <p className="text-[#5a4039] leading-relaxed">{benefit.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="py-24 bg-white overflow-hidden">
                    <div className="container mx-auto px-6">
                        <div className="text-center max-w-3xl mx-auto mb-20 reveal-scale">
                            <span className="text-[#8b2d1d] font-bold tracking-widest uppercase text-sm mb-4 block">TESTIMONIALS</span>
                            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                                What They Say About Us
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Testimonial 1 */}
                            <div className="bg-white p-12 rounded-[40px] border border-[#f3e9e5] shadow-sm reveal-left hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
                                <div className="flex text-orange-400 mb-8 gap-1">
                                    {[1, 2, 3, 4, 5].map(s => <FiStar key={s} fill="currentColor" />)}
                                </div>
                                <p className="text-2xl font-medium mb-12 leading-relaxed text-[#2d1510]">
                                    "This system completely changed our Friday nights. The kitchen is quieter, orders are accurate, and we're turning tables 15% faster."
                                </p>
                                <div className="flex items-center gap-4 mb-12 border-b border-[#f3e9e5] pb-12">
                                    <img src="https://i.pravatar.cc/150?u=sarah" alt="Sarah" className="w-16 h-16 rounded-full ring-4 ring-[#8b2d1d]/10 transition-transform hover:scale-110 duration-300" />
                                    <div>
                                        <p className="font-bold text-lg text-[#2d1510]">Sarah Jenkins</p>
                                        <p className="text-[#5a4039]">Owner of Bistro 101</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-3xl font-bold text-[#8b2d1d]">Increased 84%</p>
                                        <p className="text-sm text-[#5a4039] font-medium">Operations Efficiency</p>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold text-[#8b2d1d]">Reduced 21%</p>
                                        <p className="text-sm text-[#5a4039] font-medium">Faster Turnover Time</p>
                                    </div>
                                </div>
                            </div>

                            {/* Testimonial 2 */}
                            <div className="bg-white p-12 rounded-[40px] border border-[#f3e9e5] shadow-sm reveal-right hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
                                <div className="flex text-orange-400 mb-8 gap-1">
                                    {[1, 2, 3, 4, 5].map(s => <FiStar key={s} fill="currentColor" />)}
                                </div>
                                <p className="text-2xl font-medium mb-12 leading-relaxed text-[#2d1510]">
                                    "Finally, software that doesn't feel like it was built in the 90s. The inventory tracking alone saved us $2k in our first month."
                                </p>
                                <div className="flex items-center gap-4 mb-12 border-b border-[#f3e9e5] pb-12">
                                    <img src="https://i.pravatar.cc/150?u=mike" alt="Mike" className="w-16 h-16 rounded-full ring-4 ring-[#8b2d1d]/10 transition-transform hover:scale-110 duration-300" />
                                    <div>
                                        <p className="font-bold text-lg text-[#2d1510]">Mike Ross</p>
                                        <p className="text-[#5a4039]">GM at Urban Eats</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-3xl font-bold text-[#8b2d1d]">Increased 55%</p>
                                        <p className="text-sm text-[#5a4039] font-medium">Operating Efficiency</p>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold text-[#8b2d1d]">Reduced 15%</p>
                                        <p className="text-sm text-[#5a4039] font-medium">Faster Turnover Time</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section id="faq" className="relative py-20 bg-mesh overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-dot-pattern opacity-[0.02]"></div>
                    <div className="container mx-auto px-6 max-w-4xl relative z-10">
                        <div className="text-center mb-16 reveal-scale">
                            <span className="text-[#8b2d1d] font-bold tracking-widest uppercase text-sm mb-4 block">FAQ</span>
                            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                                Frequently Asked Questions?
                            </h2>
                            <p className="text-[#5a4039] mt-6 text-lg">
                                Everything you need to know about getting started with our restaurant management system.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {faqItems.map((item, i) => (
                                <div key={i} className={`bg-white rounded-3xl border border-[#f3e9e5] overflow-hidden reveal reveal-delay-${i * 100}`}>
                                    <button 
                                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                        className="w-full px-8 py-6 flex items-center justify-between text-left font-bold text-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <span>{item.question}</span>
                                        <div className={`transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}>
                                            <FiChevronDown />
                                        </div>
                                    </button>
                                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openFaq === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="px-8 pb-8 text-[#5a4039] leading-relaxed">
                                            {item.answer}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Final CTA Section */}
                <section className="py-24 bg-white overflow-hidden">
                    <div className="container mx-auto px-6">
                        <div className="bg-[#2d1510] rounded-[50px] p-12 lg:p-20 flex flex-col lg:flex-row items-center gap-16 overflow-hidden relative reveal-scale">
                            <div className="lg:w-1/2 relative z-10">
                                <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
                                    {content?.cta?.title || "Manage Projects Better Start Now"}
                               </h2>
                                <p className="text-[#f3e9e5]/60 text-lg mb-12 max-w-lg leading-relaxed">
                                    {content?.cta?.subtitle || "Elevate your restaurant management experience with RestoByte. Get started today and see the difference."}
                                </p>
                                <div className="flex flex-wrap items-center gap-12">
                                    <div className="flex items-center gap-12">
                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-white">450K+</p>
                                            <p className="text-xs text-[#f3e9e5]/40 uppercase tracking-widest mt-1">RESTAURANTS</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-white">800M+</p>
                                            <p className="text-xs text-[#f3e9e5]/40 uppercase tracking-widest mt-1">ORDERS</p>
                                        </div>
                                    </div>
                                    <Button size="lg" onClick={openDemoModal} className="!bg-white !text-[#8b2d1d] hover:bg-[#f3e9e5] rounded-full px-10 py-4 font-bold transition-all hover:shadow-2xl hover:-translate-y-1 border-none">
                                        {content?.cta?.buttonText || "Download App"}
                                    </Button>
                                </div>
                            </div>
                            <div className="lg:w-1/2 relative z-10 flex justify-center lg:justify-end">
                                <div className="relative group perspective-1000">
                                    <div className="absolute -inset-4 bg-[#8b2d1d]/20 rounded-[50px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                    <img 
                                        src="https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&q=80&w=1000" 
                                        alt="Restaurant Manager" 
                                        className="rounded-[40px] w-full max-w-md h-[500px] object-cover shadow-2xl relative z-10 transition-transform duration-700 group-hover:scale-[1.02] hover-3d"
                                        crossOrigin="anonymous"
                                    />
                                </div>
                            </div>
                            
                            {/* Decorative background elements */}
                            <div className="absolute top-0 right-0 w-[50%] h-full bg-[#8b2d1d]/20 blur-[100px] -rotate-45 translate-x-1/2 animate-pulse-glow"></div>
                        </div>
                    </div>
                </section>
            </main>

            <SaaSFooter 
                scrollToTop={scrollToTop} 
                handleNavClick={handleNavClick} 
                content={content?.footer}
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
                <React.Suspense fallback={<div className="p-6 flex justify-center"><FiClock className="animate-spin text-[#8b2d1d]" size={32} /></div>}>
                    {authModal === 'login' && <LoginPage onSwitchToRegister={() => setAuthModal('register')} />}
                    {authModal === 'register' && <RegisterPage onSwitchToLogin={() => setAuthModal('login')} />}
                    {authModal === 'demo' && <DemoForm />}
                </React.Suspense>
            </Modal>

            {/* Back to Top Button */}
            <button 
                onClick={scrollToTop}
                className={`fixed bottom-8 right-8 z-[100] w-12 h-12 bg-[#8b2d1d] text-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-90 ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
            >
                <FiArrowUp size={24} />
            </button>
        </div>
    );
};

export default LandingPage;
