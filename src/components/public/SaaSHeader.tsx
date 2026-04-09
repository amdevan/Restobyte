import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
    FiDatabase, FiChevronDown, FiGrid, FiSmartphone, FiX, FiMenu, FiZap, FiPieChart, FiLayers, FiBarChart2, FiMonitor 
} from 'react-icons/fi';
import Button from '@/components/common/Button';

interface SaaSHeaderProps {
    openDemoModal: () => void;
    openLoginModal: () => void;
    scrollToTop?: () => void;
    content?: { logoUrl: string; navLinks: Array<{ id: string; text: string; url: string; subLinks?: Array<{ id: string; text: string; url: string }> }> };
}

export const SaaSHeader: React.FC<SaaSHeaderProps> = ({ openDemoModal, openLoginModal, scrollToTop, content }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
    const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
    const [, setSearchParams] = useSearchParams();

    const featureItems = [
        { title: "Order & KOT Management", desc: "Take orders perfectly and reduce errors.", icon: <FiZap />, color: "bg-blue-50 text-blue-600" },
        { title: "Inventory & Waste Control", desc: "Track real-time stock to lower food costs.", icon: <FiDatabase />, color: "bg-orange-50 text-orange-600" },
        { title: "Accounting & Expense Manager", desc: "Track every expense, bill, and payment.", icon: <FiPieChart />, color: "bg-green-50 text-green-600" },
        { title: "Digital QR Menu", desc: "Let guests scan and order without waiting.", icon: <FiGrid />, color: "bg-purple-50 text-purple-600", badge: "Trending" },
        { title: "Table & Space Management", desc: "Optimize seating and turn tables faster.", icon: <FiLayers />, color: "bg-red-50 text-red-600" },
        { title: "Real-Time Sales Report", desc: "Monitor live sales and profit analytics.", icon: <FiBarChart2 />, color: "bg-indigo-50 text-indigo-600" },
        { title: "Mobile & Web App", desc: "Works on iOS, Android, or Web.", icon: <FiSmartphone />, color: "bg-pink-50 text-pink-600" },
        { title: "Kitchen Display System (KDS)", desc: "Sync front and back of house.", icon: <FiMonitor />, color: "bg-cyan-50 text-cyan-600" },
    ];

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        if (window.location.pathname !== '/') return;
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-[100] bg-white/70 backdrop-blur-xl border-b border-[#f3e9e5]/50">
            <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 group cursor-pointer" onClick={scrollToTop}>
                    {content?.logoUrl ? (
                        <img src={content.logoUrl} alt="RestoByte" className="h-10 w-auto" />
                    ) : (
                        <>
                            <div className="w-10 h-10 bg-[#8b2d1d] rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12">
                                <FiDatabase className="text-white text-xl" />
                            </div>
                            <span className="text-2xl font-black tracking-tight text-[#8b2d1d]">RestoByte</span>
                        </>
                    )}
                </Link>
                
                <nav className="hidden lg:flex items-center gap-8 text-sm font-bold text-[#5a4039]">
                    <div className="relative py-8" onMouseEnter={() => setIsMegaMenuOpen(true)} onMouseLeave={() => setIsMegaMenuOpen(false)}>
                        <button className="flex items-center gap-1 hover:text-[#8b2d1d] transition-all">
                            Features <FiChevronDown className={`transition-transform duration-300 ${isMegaMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={`absolute top-full left-0 w-[900px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-[#f3e9e5] p-8 transition-all duration-300 ${isMegaMenuOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 translate-y-4 invisible pointer-events-none'}`}>
                            <div className="flex gap-8">
                                <div className="w-3/4 grid grid-cols-2 gap-x-8 gap-y-6">
                                    {featureItems.map((item, i) => (
                                        <Link key={i} to="/features" className="flex gap-4 group cursor-pointer hover:translate-x-1 transition-transform" onClick={() => setIsMegaMenuOpen(false)}>
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${item.color} group-hover:shadow-md`}>{item.icon}</div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-sm font-black text-[#2d1510] group-hover:text-[#8b2d1d]">{item.title}</h4>
                                                    {item.badge && <span className="text-[8px] font-bold bg-[#8b2d1d] text-white px-1.5 py-0.5 rounded-full uppercase tracking-tighter animate-pulse">{item.badge}</span>}
                                                </div>
                                                <p className="text-xs text-[#5a4039] leading-tight opacity-70">{item.desc}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                <div className="w-1/4">
                                    <div className="bg-gradient-to-br from-[#8b2d1d] to-[#2d1510] rounded-2xl p-6 h-full text-white relative overflow-hidden group">
                                        <div className="relative z-10">
                                            <h4 className="text-xl font-bold mb-2">Digital QR Menu</h4>
                                            <p className="text-xs text-white/70 mb-6 leading-relaxed">Make your restaurant smart. Let guests scan and order instantly from their tables.</p>
                                            <Button onClick={() => { setIsMegaMenuOpen(false); openDemoModal(); }} className="!bg-white !text-[#8b2d1d] rounded-xl px-4 py-2 text-xs font-bold w-full shadow-lg">Start for free</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {content?.navLinks && content.navLinks.length > 0 ? (
                        content.navLinks.map((link) => (
                            <div 
                                key={link.id} 
                                className="relative py-8 group/nav"
                                onMouseEnter={() => setActiveSubMenu(link.id)}
                                onMouseLeave={() => setActiveSubMenu(null)}
                            >
                                <Link 
                                    to={link.url} 
                                    className="flex items-center gap-1 hover:text-[#8b2d1d] transition-all relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-[#8b2d1d] hover:after:w-full after:transition-all"
                                >
                                    {link.text}
                                    {link.subLinks && link.subLinks.length > 0 && <FiChevronDown className={`transition-transform duration-300 ${activeSubMenu === link.id ? 'rotate-180' : ''}`} />}
                                </Link>
                                
                                {link.subLinks && link.subLinks.length > 0 && (
                                    <div className={`absolute top-full left-0 w-56 bg-white rounded-2xl shadow-xl border border-[#f3e9e5] p-2 transition-all duration-300 ${activeSubMenu === link.id ? 'opacity-100 translate-y-0 visible' : 'opacity-0 translate-y-4 invisible pointer-events-none'}`}>
                                        {link.subLinks.map(subLink => (
                                            <Link 
                                                key={subLink.id} 
                                                to={subLink.url} 
                                                className="block px-4 py-2.5 text-xs font-bold text-[#5a4039] hover:text-[#8b2d1d] hover:bg-[#8b2d1d]/5 rounded-xl transition-all"
                                                onClick={() => setActiveSubMenu(null)}
                                            >
                                                {subLink.text}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        ['Products', 'Pricing', 'Blogs', 'Career', 'Contact'].map((item) => (
                            <Link 
                                key={item} 
                                to={`/${item.toLowerCase()}`} 
                                className="hover:text-[#8b2d1d] transition-all relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-[#8b2d1d] hover:after:w-full after:transition-all"
                            >
                                {item}
                            </Link>
                        ))
                    )}
                </nav>
                
                <div className="hidden md:flex items-center gap-6">
                    <button onClick={openLoginModal} className="text-sm font-bold text-[#5a4039] hover:text-[#8b2d1d] transition-colors">Login</button>
                    <Button size="sm" onClick={openDemoModal} className="!bg-[#8b2d1d] hover:!bg-[#7a2719] text-white rounded-xl px-6 py-3 shadow-lg shadow-[#8b2d1d]/20 border-none font-bold">Request a Demo</Button>
                </div>
                <button className="md:hidden p-2 text-[#2d1510]" onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <FiX size={28} /> : <FiMenu size={28} />}</button>
            </div>

            {/* Mobile Menu Overlay */}
            <div className={`md:hidden absolute top-20 left-0 w-full bg-white/95 backdrop-blur-2xl border-b border-[#f3e9e5] transition-all duration-300 overflow-y-auto ${isMenuOpen ? 'max-h-[90vh] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="flex flex-col p-6 gap-6">
                    <div className="flex flex-col gap-4">
                        <p className="text-[10px] font-black text-[#8b2d1d] uppercase tracking-[0.2em] mb-2">Features</p>
                        <div className="grid grid-cols-1 gap-4">
                            {featureItems.map((item, i) => (
                                <Link key={i} to="/features" className="flex gap-4 items-center" onClick={() => setIsMenuOpen(false)}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>{item.icon}</div>
                                    <h4 className="text-sm font-bold text-[#2d1510]">{item.title}</h4>
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className="h-px bg-[#f3e9e5]"></div>
                    {content?.navLinks && content.navLinks.length > 0 ? (
                        content.navLinks.map((link) => (
                            <div key={link.id} className="flex flex-col gap-2">
                                <Link 
                                    to={link.url} 
                                    onClick={() => !link.subLinks?.length && setIsMenuOpen(false)} 
                                    className="text-lg font-bold text-[#5a4039] hover:text-[#8b2d1d] flex items-center justify-between"
                                >
                                    {link.text}
                                    {link.subLinks && link.subLinks.length > 0 && (
                                        <button 
                                            onClick={(e) => { e.preventDefault(); setActiveSubMenu(activeSubMenu === link.id ? null : link.id); }}
                                            className="p-2"
                                        >
                                            <FiChevronDown className={`transition-transform ${activeSubMenu === link.id ? 'rotate-180' : ''}`} />
                                        </button>
                                    )}
                                </Link>
                                {link.subLinks && link.subLinks.length > 0 && activeSubMenu === link.id && (
                                    <div className="flex flex-col gap-3 pl-4 border-l-2 border-[#f3e9e5] mt-2">
                                        {link.subLinks.map(subLink => (
                                            <Link 
                                                key={subLink.id} 
                                                to={subLink.url} 
                                                onClick={() => setIsMenuOpen(false)} 
                                                className="text-sm font-bold text-[#5a4039]/70 hover:text-[#8b2d1d]"
                                            >
                                                {subLink.text}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        ['Products', 'Pricing', 'Blogs', 'Career', 'Contact'].map((item) => (
                            <Link key={item} to={`/${item.toLowerCase()}`} onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-[#5a4039] hover:text-[#8b2d1d]">{item}</Link>
                        ))
                    )}
                    <div className="h-px bg-[#f3e9e5]"></div>
                    <div className="flex flex-col gap-4">
                        <button onClick={() => { setIsMenuOpen(false); openLoginModal(); }} className="text-left text-lg font-bold text-[#5a4039]">Login</button>
                        <Button onClick={() => { setIsMenuOpen(false); openDemoModal(); }} className="!bg-[#8b2d1d] text-white rounded-xl py-4 font-bold">Request a Demo</Button>
                    </div>
                </div>
            </div>
        </header>
    );
};
