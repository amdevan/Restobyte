import React from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiPlus, FiStar, FiFilter, FiSearch, FiMonitor, FiPrinter, FiTablet, FiCpu, FiMessageSquare, FiDatabase, FiGrid } from 'react-icons/fi';
import Button from '@/components/common/Button';

import { SaaSHeader } from '@/components/public/SaaSHeader';
import { SaaSFooter } from '@/components/public/SaaSFooter';
import Modal from '@/components/common/Modal';
import { useRestaurantData } from '@/hooks/useRestaurantData';

const LoginPage = React.lazy(() => import('../auth/LoginPage'));
const RegisterPage = React.lazy(() => import('../auth/RegisterPage'));

const SaaSProductsShopPage: React.FC = () => {
    const { saasWebsiteContent } = useRestaurantData();
    const content = saasWebsiteContent;
    const shop = content.productsShop;
    const [authModal, setAuthModal] = React.useState<'login' | 'register' | 'demo' | null>(null);
    const [productModalOpen, setProductModalOpen] = React.useState(false);
    const [activeProductId, setActiveProductId] = React.useState<string | null>(null);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedCategory, setSelectedCategory] = React.useState('All Categories');
    const [maxPrice, setMaxPrice] = React.useState<number>(0);
    const [priceCap, setPriceCap] = React.useState<number>(0);
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
        const phoneNumberRaw = (shop?.whatsappNumber || '').trim();
        const phoneNumber = phoneNumberRaw.replace(/[^\d]/g, '');
        const message = encodeURIComponent(`Hello! I would like to order the ${productName} (Price: Rs ${price}). Please provide more details.`);
        if (!phoneNumber) return;
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    };

    const ICON_MAP: Record<string, React.ReactNode> = {
        FiMonitor: <FiMonitor />,
        FiPrinter: <FiPrinter />,
        FiTablet: <FiTablet />,
        FiCpu: <FiCpu />,
        FiDatabase: <FiDatabase />,
        FiGrid: <FiGrid />,
        FiShoppingCart: <FiShoppingCart />
    };

    const products = Array.isArray(shop?.products) ? shop.products : [];
    const activeProduct = activeProductId ? products.find(p => p.id === activeProductId) : undefined;

    React.useEffect(() => {
        const prices = products.map(p => (typeof p?.price === 'number' ? p.price : 0)).filter((n) => Number.isFinite(n));
        const nextMax = prices.length > 0 ? Math.max(...prices) : 0;
        setMaxPrice(nextMax);
        setPriceCap(prev => (prev > 0 ? prev : nextMax));
    }, [products]);

    const categories = (() => {
        const fromCms = Array.isArray(shop?.categories) ? shop.categories : [];
        const fromProducts = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
        const list = (fromCms.length > 0 ? fromCms : fromProducts).filter(Boolean);
        return ['All Categories', ...list];
    })();

    const filteredProducts = products.filter((p) => {
        const matchesCategory = selectedCategory === 'All Categories' ? true : p.category === selectedCategory;
        const q = searchTerm.trim().toLowerCase();
        const matchesSearch = !q ? true : `${p.name} ${p.category}`.toLowerCase().includes(q);
        const matchesPrice = priceCap > 0 ? p.price <= priceCap : true;
        return matchesCategory && matchesSearch && matchesPrice;
    });

    const openProductModal = (id: string) => {
        setActiveProductId(id);
        setProductModalOpen(true);
    };

    return (
        <div className="bg-[#fffcfb] min-h-screen">
            <SaaSHeader 
                openDemoModal={openDemoModal} 
                openLoginModal={openLoginModal} 
                openRegisterModal={openRegisterModal}
                content={content.header}
            />

            {/* Shop Header */}
            <header className="bg-[#2d1510] text-white py-24 relative overflow-hidden mt-20">
                <div className="absolute top-0 right-0 w-full h-full opacity-10">
                    <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#8b2d1d] rounded-full blur-[120px]"></div>
                </div>
                <div className="container mx-auto px-6 text-center relative z-10">
                    <Link to="/" className="text-[#8b2d1d] font-black text-2xl mb-8 inline-block">{shop?.brandLabel || `${content.header.brandName || 'RestoByte'} Shop`}</Link>
                    <h1 className="text-4xl md:text-6xl font-black mb-6">{shop?.title || 'Products'} </h1>
                    <p className="text-lg text-[#f3e9e5]/60 max-w-2xl mx-auto mb-10">{shop?.subtitle || ''}</p>
                    
                    {/* Search Bar */}
                    <div className="max-w-2xl mx-auto relative">
                        <input 
                            type="text" 
                            placeholder="Search for terminals, printers, or tablets..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                                            {categories.map((cat, i) => (
                                                <label key={i} className="flex items-center gap-3 cursor-pointer group">
                                                    <input
                                                        type="radio"
                                                        name="category"
                                                        checked={selectedCategory === cat}
                                                        onChange={() => setSelectedCategory(cat)}
                                                        className="w-4 h-4 accent-[#8b2d1d]"
                                                    />
                                                    <span className="text-sm text-[#5a4039] group-hover:text-[#8b2d1d] transition-colors">{cat}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm font-bold text-[#5a4039] uppercase tracking-wider mb-4">Price Range</p>
                                        <input
                                            type="range"
                                            className="w-full accent-[#8b2d1d]"
                                            min="0"
                                            max={Math.max(0, maxPrice)}
                                            value={priceCap}
                                            onChange={(e) => setPriceCap(Number(e.target.value))}
                                        />
                                        <div className="flex justify-between mt-2 text-xs text-[#5a4039] font-medium">
                                            <span>Rs 0</span>
                                            <span>{maxPrice > 0 ? `Rs ${priceCap || maxPrice}` : '—'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Product Grid */}
                        <div className="lg:w-3/4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredProducts.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => openProductModal(p.id)}
                                        className="text-left bg-white rounded-3xl border border-[#f3e9e5] overflow-hidden group hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
                                    >
                                        <div className="relative aspect-square overflow-hidden bg-gray-50">
                                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                            {typeof p.rating === 'number' && (
                                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1 text-yellow-500 text-[10px] font-bold shadow-sm">
                                                    <FiStar fill="currentColor" /> {p.rating}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="p-5">
                                            <div className="mb-4">
                                                <span className="text-[8px] font-black text-[#8b2d1d] uppercase tracking-[0.15em]">{p.category}</span>
                                                    <h4 className="text-base font-black text-[#2d1510] mt-1 truncate">{p.name}</h4>
                                                <div className="text-lg font-black text-[#8b2d1d] mt-1">Rs {Number(p.price).toLocaleString()}</div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between pt-4 border-t border-[#f3e9e5]">
                                                <div className="flex items-center gap-2 text-[#5a4039] text-[10px] font-bold">
                                                    <div className="w-6 h-6 bg-[#8b2d1d]/5 rounded-lg flex items-center justify-center text-[#8b2d1d]">
                                                        {p.icon && ICON_MAP[p.icon] ? ICON_MAP[p.icon] : <FiShoppingCart />}
                                                    </div>
                                                    {p.isInStock === false ? 'Out of Stock' : 'In Stock'}
                                                </div>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleWhatsAppOrder(p.name, p.price); }}
                                                    disabled={p.isInStock === false}
                                                    type="button"
                                                    aria-label={`Order ${p.name} on WhatsApp`}
                                                    className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:text-gray-600 text-white rounded-xl text-[10px] font-bold transition-all shadow-md shadow-green-200 disabled:shadow-none"
                                                >
                                                    <FiMessageSquare size={14} />
                                                    Order
                                                </button>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Shop CTA */}
            <section className="py-24 bg-mesh">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-5xl font-black text-[#2d1510] mb-8">{shop?.ctaTitle || 'Need a full restaurant setup?'}</h2>
                    <p className="text-lg text-[#5a4039] mb-12 max-w-2xl mx-auto">{shop?.ctaSubtitle || ''}</p>
                    <Link to="/contact">
                        <Button className="!bg-[#8b2d1d] text-white rounded-2xl px-10 py-5 text-lg font-bold border-none shadow-2xl shadow-[#8b2d1d]/20">{shop?.ctaButtonText || 'Request a Custom Quote'}</Button>
                    </Link>
                </div>
            </section>

            <SaaSFooter 
                handleNavClick={handleNavClick} 
                content={content.footer}
            />

            <Modal
                isOpen={productModalOpen && Boolean(activeProduct)}
                onClose={() => setProductModalOpen(false)}
                title={activeProduct?.name || 'Product'}
                size="lg"
            >
                {activeProduct && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="rounded-2xl overflow-hidden bg-gray-50 border border-[#f3e9e5]">
                            <img src={activeProduct.imageUrl} alt={activeProduct.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="text-[10px] font-black text-[#8b2d1d] uppercase tracking-[0.15em]">{activeProduct.category}</div>
                                <div className="text-2xl font-black text-[#2d1510] mt-1">{activeProduct.name}</div>
                                <div className="text-xl font-black text-[#8b2d1d] mt-2">Rs {Number(activeProduct.price).toLocaleString()}</div>
                                {typeof activeProduct.rating === 'number' && (
                                    <div className="mt-2 inline-flex items-center gap-2 text-yellow-600 text-sm font-bold">
                                        <FiStar fill="currentColor" /> {activeProduct.rating}
                                    </div>
                                )}
                            </div>

                            {activeProduct.description && (
                                <p className="text-sm text-[#5a4039] leading-relaxed">{activeProduct.description}</p>
                            )}

                            {(activeProduct.highlights || []).length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-sm font-black text-[#2d1510]">Highlights</div>
                                    <ul className="space-y-1 text-sm text-[#5a4039]">
                                        {(activeProduct.highlights || []).map((h, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#8b2d1d]" />
                                                <span>{h}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => handleWhatsAppOrder(activeProduct.name, activeProduct.price)}
                                    disabled={activeProduct.isInStock === false}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:text-gray-600 text-white rounded-xl text-sm font-bold transition-all w-full"
                                >
                                    <FiMessageSquare size={16} />
                                    Order on WhatsApp
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setProductModalOpen(false)}
                                    className="px-4 py-3 rounded-xl text-sm font-bold border border-[#f3e9e5] text-[#5a4039] hover:bg-[#8b2d1d]/5"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

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

export default SaaSProductsShopPage;
