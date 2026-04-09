import React from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiPlus, FiStar, FiFilter, FiSearch, FiMonitor, FiPrinter, FiTablet, FiCpu, FiMessageSquare, FiDatabase, FiGrid } from 'react-icons/fi';
import Button from '@/components/common/Button';

import { SaaSHeader } from '@/components/public/SaaSHeader';
import { SaaSFooter } from '@/components/public/SaaSFooter';
import Modal from '@/components/common/Modal';

const LoginPage = React.lazy(() => import('../auth/LoginPage'));
const RegisterPage = React.lazy(() => import('../auth/RegisterPage'));

const SaaSProductsShopPage: React.FC = () => {
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

    const handleWhatsAppOrder = (productName: string, price: number) => {
        const phoneNumber = "+9779843927360"; // Updated business number
        const message = encodeURIComponent(`Hello RestoByte! I would like to order the ${productName} (Price: $${price}). Please provide more details.`);
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    };

    const products = [
        {
            id: 1,
            name: "Pro POS Terminal v4",
            category: "Hardware",
            price: 599.00,
            rating: 4.9,
            image: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&q=80&w=400",
            icon: <FiMonitor />
        },
        {
            id: 2,
            name: "Thermal Receipt Printer",
            category: "Accessories",
            price: 129.00,
            rating: 4.8,
            image: "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=400",
            icon: <FiPrinter />
        },
        {
            id: 3,
            name: "Waiter Tablet Pro",
            category: "Hardware",
            price: 249.00,
            rating: 4.7,
            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=400",
            icon: <FiTablet />
        },
        {
            id: 4,
            name: "Kitchen KDS Controller",
            category: "Infrastructure",
            price: 189.00,
            rating: 4.9,
            image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=400",
            icon: <FiCpu />
        },
        {
            id: 5,
            name: "Cash Drawer Pro",
            category: "Accessories",
            price: 89.00,
            rating: 4.6,
            image: "https://images.unsplash.com/photo-1556742044-3c52d6e88c02?auto=format&fit=crop&q=80&w=400",
            icon: <FiDatabase />
        },
        {
            id: 6,
            name: "Barcode Scanner v2",
            category: "Accessories",
            price: 75.00,
            rating: 4.8,
            image: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&q=80&w=400",
            icon: <FiGrid />
        }
    ];

    return (
        <div className="bg-[#fffcfb] min-h-screen">
            <SaaSHeader 
                openDemoModal={openDemoModal} 
                openLoginModal={openLoginModal} 
            />

            {/* Shop Header */}
            <header className="bg-[#2d1510] text-white py-24 relative overflow-hidden mt-20">
                <div className="absolute top-0 right-0 w-full h-full opacity-10">
                    <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#8b2d1d] rounded-full blur-[120px]"></div>
                </div>
                <div className="container mx-auto px-6 text-center relative z-10">
                    <Link to="/" className="text-[#8b2d1d] font-black text-2xl mb-8 inline-block">RestoByte Shop</Link>
                    <h1 className="text-4xl md:text-6xl font-black mb-6">Hardware & <span className="text-[#ff7b5f]">Accessories</span></h1>
                    <p className="text-lg text-[#f3e9e5]/60 max-w-2xl mx-auto mb-10">
                        High-performance hardware fully integrated with RestoByte software. Build your dream setup today.
                    </p>
                    
                    {/* Search Bar */}
                    <div className="max-w-2xl mx-auto relative">
                        <input 
                            type="text" 
                            placeholder="Search for terminals, printers, or tablets..." 
                            className="w-full px-8 py-5 rounded-2xl bg-white/10 border border-white/20 focus:outline-none focus:bg-white/20 transition-all text-white placeholder:text-white/40"
                        />
                        <FiSearch className="absolute right-6 top-1/2 -translate-y-1/2 text-white/40 text-xl" />
                    </div>
                </div>
            </header>

            {/* Shop Content */}
            <section className="py-20">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Filters Sidebar */}
                        <aside className="lg:w-1/4">
                            <div className="bg-white p-8 rounded-3xl border border-[#f3e9e5] sticky top-24">
                                <h3 className="text-xl font-bold text-[#2d1510] mb-8 flex items-center gap-2">
                                    <FiFilter /> Filters
                                </h3>
                                
                                <div className="space-y-8">
                                    <div>
                                        <p className="text-sm font-bold text-[#5a4039] uppercase tracking-wider mb-4">Categories</p>
                                        <div className="space-y-3">
                                            {['All Categories', 'Hardware', 'Accessories', 'Infrastructure'].map((cat, i) => (
                                                <label key={i} className="flex items-center gap-3 cursor-pointer group">
                                                    <input type="radio" name="category" defaultChecked={i===0} className="w-4 h-4 accent-[#8b2d1d]" />
                                                    <span className="text-sm text-[#5a4039] group-hover:text-[#8b2d1d] transition-colors">{cat}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm font-bold text-[#5a4039] uppercase tracking-wider mb-4">Price Range</p>
                                        <input type="range" className="w-full accent-[#8b2d1d]" min="0" max="1000" />
                                        <div className="flex justify-between mt-2 text-xs text-[#5a4039] font-medium">
                                            <span>$0</span>
                                            <span>$1000+</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Product Grid */}
                        <div className="lg:w-3/4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {products.map((p) => (
                                    <div key={p.id} className="bg-white rounded-3xl border border-[#f3e9e5] overflow-hidden group hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                                        <div className="relative aspect-square overflow-hidden bg-gray-50">
                                            <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1 text-yellow-500 text-[10px] font-bold shadow-sm">
                                                <FiStar fill="currentColor" /> {p.rating}
                                            </div>
                                        </div>
                                        
                                        <div className="p-5">
                                            <div className="mb-4">
                                                <span className="text-[8px] font-black text-[#8b2d1d] uppercase tracking-[0.15em]">{p.category}</span>
                                                <h4 className="text-base font-black text-[#2d1510] mt-1 line-clamp-1">{p.name}</h4>
                                                <div className="text-lg font-black text-[#8b2d1d] mt-1">${p.price}</div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between pt-4 border-t border-[#f3e9e5]">
                                                <div className="flex items-center gap-2 text-[#5a4039] text-[10px] font-bold">
                                                    <div className="w-6 h-6 bg-[#8b2d1d]/5 rounded-lg flex items-center justify-center text-[#8b2d1d]">
                                                        {p.icon}
                                                    </div>
                                                    In Stock
                                                </div>
                                                <button 
                                                    onClick={() => handleWhatsAppOrder(p.name, p.price)}
                                                    className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-[10px] font-bold transition-all shadow-md shadow-green-200"
                                                >
                                                    <FiMessageSquare size={14} />
                                                    Order
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Shop CTA */}
            <section className="py-24 bg-mesh">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-5xl font-black text-[#2d1510] mb-8">Need a full restaurant setup?</h2>
                    <p className="text-lg text-[#5a4039] mb-12 max-w-2xl mx-auto">Our experts can help you choose the right hardware for your specific floor plan and kitchen volume.</p>
                    <Link to="/contact">
                        <Button className="!bg-[#8b2d1d] text-white rounded-2xl px-10 py-5 text-lg font-bold border-none shadow-2xl shadow-[#8b2d1d]/20">Request a Custom Quote</Button>
                    </Link>
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

export default SaaSProductsShopPage;
