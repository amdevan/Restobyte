
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams, Navigate, Link } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { SaaSHeader } from '@/components/public/SaaSHeader';
import { SaaSFooter } from '@/components/public/SaaSFooter';
import Modal from '@/components/common/Modal';
import { FiClock } from 'react-icons/fi';

const LoginPage = React.lazy(() => import('../auth/LoginPage'));
const RegisterPage = React.lazy(() => import('../auth/RegisterPage'));

const DynamicSaaSPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const location = useLocation();
    const { saasWebsiteContent } = useRestaurantData();
    const [authModal, setAuthModal] = useState<'login' | 'register' | 'demo' | null>(null);

    const effectiveSlug = (slug || location.pathname.replace(/^\/+/, '').replace(/\/+$/, '')).trim();
    const page = saasWebsiteContent.pages.find(p => p.slug === effectiveSlug);

    useEffect(() => {
        if (page) {
            document.title = `${page.title} | ${saasWebsiteContent.header.brandName || saasWebsiteContent.seo.title || 'RestoByte'}`;
        }
    }, [page, saasWebsiteContent.header.brandName, saasWebsiteContent.seo.title]);

    if (!page) {
        return <Navigate to="/" replace />;
    }

    const openLoginModal = () => setAuthModal('login');
    const openRegisterModal = () => setAuthModal('register');
    const openDemoModal = () => setAuthModal('demo');
    const closeModal = () => setAuthModal(null);

    const isAboutUs = effectiveSlug === 'about-us';
    const brand = saasWebsiteContent.header.brandName || saasWebsiteContent.seo.title || 'RestoByte';

    const { aboutIntro, aboutHtml } = useMemo(() => {
        if (!isAboutUs) return { aboutIntro: '', aboutHtml: page.content };
        if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
            return { aboutIntro: '', aboutHtml: page.content };
        }
        try {
            const doc = new DOMParser().parseFromString(page.content || '', 'text/html');
            const firstParagraph = doc.querySelector('p');
            const intro = firstParagraph?.textContent?.trim() || '';
            if (firstParagraph) firstParagraph.remove();
            const html = doc.body.innerHTML || page.content;
            return { aboutIntro: intro, aboutHtml: html };
        } catch {
            return { aboutIntro: '', aboutHtml: page.content };
        }
    }, [isAboutUs, page.content]);

    return (
        <div className="bg-[#fffcfb] min-h-screen flex flex-col">
            <SaaSHeader 
                openDemoModal={openDemoModal} 
                openLoginModal={openLoginModal} 
                openRegisterModal={openRegisterModal}
                content={saasWebsiteContent.header}
            />

            {isAboutUs ? (
                <main className="flex-grow pt-24 pb-20">
                    <section className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-[#2d1510] to-[#fffcfb]" />
                        <div className="absolute inset-0 opacity-30">
                            <div className="absolute -top-24 -right-24 w-[420px] h-[420px] bg-[#8b2d1d] rounded-full blur-[120px]" />
                            <div className="absolute -bottom-24 -left-24 w-[420px] h-[420px] bg-[#ff7b5f] rounded-full blur-[120px]" />
                        </div>

                        <div className="relative container mx-auto px-6 pt-24 pb-16">
                            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                                <div className="lg:col-span-7">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-white/80 text-xs font-black tracking-widest uppercase">
                                        About {brand}
                                    </div>
                                    <h1 className="mt-6 text-4xl md:text-6xl font-black text-white leading-tight">
                                        {page.title}
                                    </h1>
                                    <p className="mt-6 text-white/70 text-lg leading-relaxed max-w-2xl">
                                        {aboutIntro || 'We build modern restaurant tools that keep teams fast, focused, and in control—every service, every day.'}
                                    </p>
                                    <div className="mt-8 flex flex-wrap gap-3">
                                        <button
                                            onClick={openRegisterModal}
                                            className="px-7 py-4 rounded-full bg-white text-[#2d1510] font-black text-sm hover:bg-[#f3e9e5] transition-colors"
                                        >
                                            Start Free Trial
                                        </button>
                                        <button
                                            onClick={openDemoModal}
                                            className="px-7 py-4 rounded-full bg-white/10 text-white font-black text-sm border border-white/20 hover:bg-white/15 transition-colors"
                                        >
                                            Talk to Sales
                                        </button>
                                    </div>
                                </div>

                                <div className="lg:col-span-5">
                                    {page.imageUrl ? (
                                        <div className="rounded-[40px] overflow-hidden border border-white/15 shadow-2xl bg-white/5">
                                            <img src={page.imageUrl} alt={page.title} className="w-full h-[340px] object-cover" />
                                        </div>
                                    ) : (
                                        <div className="rounded-[40px] border border-white/15 bg-white/5 p-10">
                                            <div className="text-white font-black text-2xl">Built for real restaurants.</div>
                                            <div className="mt-4 text-white/70 text-sm leading-relaxed">
                                                Reliable POS. Clear reporting. Smooth operations. Everything works together so your team can focus on guests.
                                            </div>
                                            <div className="mt-8 grid grid-cols-2 gap-4">
                                                {[
                                                    { label: 'Fast setup', value: 'Minutes' },
                                                    { label: 'Support', value: '24/7' },
                                                    { label: 'Uptime', value: '99.9%' },
                                                    { label: 'Teams', value: 'Multi-outlet' },
                                                ].map((item) => (
                                                    <div key={item.label} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                                                        <div className="text-white font-black">{item.value}</div>
                                                        <div className="text-white/60 text-xs mt-1">{item.label}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="container mx-auto px-6 -mt-8">
                        <div className="max-w-6xl mx-auto">
                            {saasWebsiteContent.statistics?.length ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {saasWebsiteContent.statistics.slice(0, 4).map((s) => (
                                        <div key={s.id} className="bg-white rounded-[28px] border border-[#f3e9e5] p-6 shadow-xl">
                                            <div className="text-2xl font-black text-[#2d1510]">{s.value}</div>
                                            <div className="text-xs font-bold text-[#5a4039]/70 mt-2">{s.label}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : null}

                            <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-stretch">
                                <div className="lg:col-span-8">
                                    <div className="rounded-[44px] p-[1px] bg-gradient-to-br from-[#8b2d1d]/25 via-[#ff7b5f]/10 to-[#2d1510]/10 shadow-[0_20px_60px_rgba(45,21,16,0.10)]">
                                        <div className="bg-white/90 backdrop-blur rounded-[44px] border border-white/60 p-10 md:p-14 h-full">
                                            <div
                                                className="text-[#5a4039] leading-relaxed text-[15px] md:text-base [&_h1]:text-3xl [&_h1]:md:text-4xl [&_h1]:font-black [&_h1]:text-[#2d1510] [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:font-black [&_h2]:text-[#2d1510] [&_h3]:text-xl [&_h3]:md:text-2xl [&_h3]:font-black [&_h3]:text-[#2d1510] [&_p]:mt-4 [&_p:first-child]:mt-0 [&_ul]:mt-5 [&_ul]:pl-6 [&_ul]:list-disc [&_li]:mt-2 [&_li]:marker:text-[#8b2d1d] [&_a]:text-[#8b2d1d] [&_a]:font-black hover:[&_a]:text-[#a63928] [&_blockquote]:mt-6 [&_blockquote]:border-l-4 [&_blockquote]:border-[#f3e9e5] [&_blockquote]:pl-5 [&_blockquote]:text-[#2d1510] [&_strong]:text-[#2d1510] [&_strong]:font-black"
                                                dangerouslySetInnerHTML={{ __html: aboutHtml }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-4 space-y-6">
                                    <div className="rounded-[44px] p-[1px] bg-gradient-to-br from-[#8b2d1d]/20 to-[#ff7b5f]/15 shadow-[0_20px_60px_rgba(45,21,16,0.10)]">
                                        <div className="bg-white/90 backdrop-blur rounded-[44px] border border-white/60 p-10">
                                            <div className="flex items-end justify-between gap-3">
                                                <div>
                                                    <div className="text-xs font-black tracking-widest uppercase text-[#8b2d1d]">Included</div>
                                                    <div className="mt-3 text-[#2d1510] font-black text-2xl">What you get</div>
                                                </div>
                                            </div>
                                            <ul className="mt-8 space-y-4 text-sm text-[#5a4039]">
                                                {[
                                                    'One platform across POS, menu, inventory, and reporting',
                                                    'Simple pricing that scales with your business',
                                                    'Fast onboarding for teams and managers',
                                                    'Reliable support when it matters',
                                                ].map((t) => (
                                                    <li key={t} className="flex gap-3">
                                                        <span className="mt-[5px] w-7 h-7 rounded-2xl bg-[#8b2d1d]/10 border border-[#8b2d1d]/15 flex items-center justify-center flex-shrink-0">
                                                            <span className="w-2 h-2 rounded-full bg-[#8b2d1d]" />
                                                        </span>
                                                        <span className="leading-relaxed">{t}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="rounded-[44px] p-[1px] bg-gradient-to-br from-[#2d1510] via-[#3d1f1a] to-[#8b2d1d] shadow-[0_30px_80px_rgba(45,21,16,0.25)]">
                                        <div className="rounded-[44px] bg-[#2d1510] text-white border border-white/5 shadow-2xl p-10 relative overflow-hidden">
                                            <div className="absolute -top-20 -right-20 w-56 h-56 bg-[#8b2d1d] rounded-full blur-[120px] opacity-30" />
                                            <div className="absolute -bottom-24 -left-16 w-56 h-56 bg-[#ff7b5f] rounded-full blur-[120px] opacity-20" />
                                            <div className="relative">
                                                <div className="text-xs font-black tracking-widest uppercase text-white/60">Get Started</div>
                                                <div className="mt-3 text-2xl font-black">Ready to see it in action?</div>
                                                <div className="mt-4 text-white/70 text-sm leading-relaxed">
                                                    {saasWebsiteContent.cta?.subtitle || 'Start your free trial and set up your restaurant in minutes.'}
                                                </div>
                                                <div className="mt-7 flex flex-col gap-3">
                                                    <button
                                                        onClick={openRegisterModal}
                                                        className="w-full px-6 py-4 rounded-full bg-white text-[#2d1510] font-black text-sm hover:bg-[#f3e9e5] transition-colors"
                                                    >
                                                        {saasWebsiteContent.cta?.buttonText || 'Start Free Trial'}
                                                    </button>
                                                    <button
                                                        onClick={openDemoModal}
                                                        className="w-full px-6 py-4 rounded-full bg-white/10 text-white font-black text-sm border border-white/20 hover:bg-white/15 transition-colors"
                                                    >
                                                        Talk to Sales
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-16">
                                <div className="text-center">
                                    <div className="text-xs font-black tracking-widest uppercase text-[#8b2d1d]">Values</div>
                                    <h2 className="mt-3 text-3xl md:text-5xl font-black text-[#2d1510]">Built with restaurants in mind.</h2>
                                    <p className="mt-5 text-[#5a4039] max-w-3xl mx-auto">
                                        We focus on speed, reliability, and clarity—so owners and teams can move faster during service and make better decisions after.
                                    </p>
                                </div>

                                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { title: 'Speed', text: 'Fast workflows for billing, kitchen, and staff—built for peak hours.' },
                                        { title: 'Reliability', text: 'Stable operations with predictable performance and consistent experiences.' },
                                        { title: 'Clarity', text: 'Simple reporting that helps you see what matters without noise.' },
                                        { title: 'Support', text: 'Real help when you need it most—before, during, and after launch.' },
                                    ].map((item) => (
                                        <div key={item.title} className="bg-white rounded-[32px] border border-[#f3e9e5] p-8 shadow-xl">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8b2d1d]/15 to-[#ff7b5f]/10 border border-[#8b2d1d]/15 flex items-center justify-center">
                                                <div className="w-6 h-6 rounded-xl bg-[#8b2d1d]/20 border border-[#8b2d1d]/20" />
                                            </div>
                                            <div className="mt-6 text-xl font-black text-[#2d1510]">{item.title}</div>
                                            <div className="mt-3 text-sm text-[#5a4039] leading-relaxed">{item.text}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {saasWebsiteContent.trustedByLogos?.length ? (
                                <div className="mt-16 bg-white rounded-[40px] border border-[#f3e9e5] shadow-xl p-10 md:p-14">
                                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                                        <div>
                                            <div className="text-xs font-black tracking-widest uppercase text-[#8b2d1d]">Trusted By</div>
                                            <div className="mt-3 text-2xl md:text-3xl font-black text-[#2d1510]">Teams who run busy services.</div>
                                        </div>
                                        <div className="text-sm text-[#5a4039] max-w-md">
                                            From quick-service to full-service restaurants, our tools help teams stay organized and fast.
                                        </div>
                                    </div>

                                    <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                                        {saasWebsiteContent.trustedByLogos.slice(0, 12).map((logo) => (
                                            <div key={logo.id} className="rounded-[24px] border border-[#f3e9e5] bg-[#fffcfb] p-6 flex items-center justify-center">
                                                {logo.logoUrl ? (
                                                    <img src={logo.logoUrl} alt={logo.name} className="h-10 w-auto object-contain" />
                                                ) : (
                                                    <div className="text-xs font-black text-[#2d1510] text-center">{logo.name}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            {saasWebsiteContent.features?.length ? (
                                <div className="mt-16">
                                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                                        <div>
                                            <div className="text-xs font-black tracking-widest uppercase text-[#8b2d1d]">Product</div>
                                            <h2 className="mt-3 text-3xl md:text-5xl font-black text-[#2d1510]">Everything works together.</h2>
                                        </div>
                                        <div className="text-sm text-[#5a4039] max-w-md">
                                            A single system across front-of-house and back-of-house—designed to remove friction from daily operations.
                                        </div>
                                    </div>

                                    <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {saasWebsiteContent.features.slice(0, 6).map((f) => (
                                            <div key={f.id} className="bg-white rounded-[32px] border border-[#f3e9e5] p-8 shadow-xl">
                                                <div className="text-lg font-black text-[#2d1510]">{f.title}</div>
                                                <div className="mt-3 text-sm text-[#5a4039] leading-relaxed">{f.description}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            {saasWebsiteContent.testimonials?.length ? (
                                <div className="mt-16 bg-gradient-to-br from-[#2d1510] to-[#3d1f1a] rounded-[48px] p-10 md:p-14 border border-[#3d1f1a] shadow-2xl relative overflow-hidden">
                                    <div className="absolute -top-16 -right-16 w-[320px] h-[320px] bg-[#8b2d1d] rounded-full blur-[120px] opacity-25" />
                                    <div className="absolute -bottom-20 -left-16 w-[340px] h-[340px] bg-[#ff7b5f] rounded-full blur-[120px] opacity-20" />
                                    <div className="relative">
                                        <div className="text-xs font-black tracking-widest uppercase text-white/70">Results</div>
                                        <h2 className="mt-3 text-3xl md:text-5xl font-black text-white">Loved by operators.</h2>
                                        <p className="mt-5 text-white/70 max-w-3xl">
                                            Hear from restaurants that improved speed, accuracy, and visibility across teams.
                                        </p>

                                        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {saasWebsiteContent.testimonials.slice(0, 4).map((t) => (
                                                <div key={t.id} className="bg-white/5 border border-white/10 rounded-[32px] p-8">
                                                    <div className="flex items-center gap-4">
                                                        {t.imageUrl ? (
                                                            <img src={t.imageUrl} alt={t.storeName} className="w-12 h-12 rounded-2xl object-cover border border-white/10" />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10" />
                                                        )}
                                                        <div>
                                                            <div className="text-white font-black">{t.storeName}</div>
                                                            <div className="text-white/60 text-xs">{t.result}</div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-5 text-white/80 text-sm leading-relaxed">{t.description}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            {saasWebsiteContent.blogPosts?.length ? (
                                <div className="mt-16">
                                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                                        <div>
                                            <div className="text-xs font-black tracking-widest uppercase text-[#8b2d1d]">Learn</div>
                                            <h2 className="mt-3 text-3xl md:text-5xl font-black text-[#2d1510]">Latest insights.</h2>
                                        </div>
                                        <Link to="/blogs" className="text-sm font-black text-[#8b2d1d] hover:text-[#a63928]">
                                            View all blogs
                                        </Link>
                                    </div>

                                    <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {saasWebsiteContent.blogPosts.slice(0, 3).map((b) => (
                                            <div key={b.id} className="bg-white rounded-[32px] border border-[#f3e9e5] shadow-xl overflow-hidden">
                                                {b.imageUrl ? (
                                                    <img src={b.imageUrl} alt={b.title} className="w-full h-44 object-cover" />
                                                ) : (
                                                    <div className="w-full h-44 bg-[#f3e9e5]" />
                                                )}
                                                <div className="p-8">
                                                    <div className="flex items-center gap-3 text-xs font-black tracking-widest uppercase text-[#5a4039]/70">
                                                        <span>{b.category || 'Blog'}</span>
                                                        {b.date ? <span className="w-1 h-1 rounded-full bg-[#5a4039]/40" /> : null}
                                                        {b.date ? <span>{b.date}</span> : null}
                                                    </div>
                                                    <div className="mt-4 text-lg font-black text-[#2d1510]">{b.title}</div>
                                                    <div className="mt-3 text-sm text-[#5a4039] leading-relaxed overflow-hidden max-h-[4.8rem]">{b.excerpt}</div>
                                                    <div className="mt-6">
                                                        <Link to="/blogs" className="text-sm font-black text-[#8b2d1d] hover:text-[#a63928]">
                                                            Read more
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </section>
                </main>
            ) : (
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
                                className="text-[#5a4039] leading-relaxed text-[15px] md:text-base [&_h1]:text-3xl [&_h1]:md:text-4xl [&_h1]:font-black [&_h1]:text-[#2d1510] [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:font-black [&_h2]:text-[#2d1510] [&_h3]:text-xl [&_h3]:md:text-2xl [&_h3]:font-black [&_h3]:text-[#2d1510] [&_p]:mt-4 [&_p:first-child]:mt-0 [&_ul]:mt-5 [&_ul]:pl-6 [&_ul]:list-disc [&_li]:mt-2 [&_li]:marker:text-[#8b2d1d] [&_a]:text-[#8b2d1d] [&_a]:font-black hover:[&_a]:text-[#a63928] [&_blockquote]:mt-6 [&_blockquote]:border-l-4 [&_blockquote]:border-[#f3e9e5] [&_blockquote]:pl-5 [&_blockquote]:text-[#2d1510] [&_strong]:text-[#2d1510] [&_strong]:font-black"
                                dangerouslySetInnerHTML={{ __html: page.content }}
                            />
                        </div>
                    </div>
                </main>
            )}

            <SaaSFooter 
                handleNavClick={() => {}} 
                content={saasWebsiteContent.footer}
            />

            <Modal 
                isOpen={authModal !== null} 
                onClose={closeModal} 
                title={authModal === 'login' ? 'Sign In' : authModal === 'register' ? 'Start Free Trial' : 'Demo'} size={authModal === 'register' ? 'lg' : 'md'}
            >
                <React.Suspense fallback={<div className="p-6 flex justify-center"><FiClock className="animate-spin text-[#8b2d1d]" size={32} /></div>}>
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
                </React.Suspense>
            </Modal>
        </div>
    );
};

export default DynamicSaaSPage;
