import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiMapPin, FiBriefcase, FiUsers, FiClock } from 'react-icons/fi';
import Button from '@/components/common/Button';

import { SaaSHeader } from '@/components/public/SaaSHeader';
import { SaaSFooter } from '@/components/public/SaaSFooter';
import Modal from '@/components/common/Modal';

const LoginPage = React.lazy(() => import('../auth/LoginPage'));
const RegisterPage = React.lazy(() => import('../auth/RegisterPage'));

const SaaSCareerPage: React.FC = () => {
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

    const jobs = [
        {
            title: "Senior Full Stack Engineer",
            department: "Engineering",
            location: "Remote / Kathmandu",
            type: "Full-time"
        },
        {
            title: "Product Designer (UI/UX)",
            department: "Design",
            location: "Remote",
            type: "Full-time"
        },
        {
            title: "Customer Success Manager",
            department: "Sales",
            location: "Kathmandu",
            type: "Full-time"
        }
    ];

    return (
        <div className="bg-[#fffcfb] min-h-screen">
            <SaaSHeader 
                openDemoModal={openDemoModal} 
                openLoginModal={openLoginModal} 
            />

            {/* Hero Section */}
            <header className="bg-[#2d1510] text-white py-32 relative overflow-hidden mt-20">
                <div className="absolute top-0 right-0 w-full h-full opacity-10">
                    <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#8b2d1d] rounded-full blur-[100px]"></div>
                </div>
                <div className="container mx-auto px-6 text-center relative z-10">
                    <Link to="/" className="text-[#8b2d1d] font-black text-2xl mb-12 inline-block">RestoByte</Link>
                    <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight">Help us build the future of <span className="text-[#ff7b5f]">dining.</span></h1>
                    <p className="text-xl text-[#f3e9e5]/60 max-w-2xl mx-auto mb-12">
                        We're on a mission to empower restaurant owners with world-class technology. Join our distributed team and make an impact.
                    </p>
                    <Button className="!bg-[#8b2d1d] text-white rounded-xl px-10 py-5 text-lg font-bold border-none shadow-2xl shadow-[#8b2d1d]/40">See Open Positions</Button>
                </div>
            </header>

            {/* Values Section */}
            <section className="py-32">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-black text-[#2d1510] mb-6">Our Core Values</h2>
                        <p className="text-[#5a4039] max-w-xl mx-auto">What drives us every day to build better software for the hospitality industry.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { title: "Ownership", desc: "We believe in high autonomy and deep responsibility. You own your projects from start to finish.", icon: <FiBriefcase /> },
                            { title: "Empathy", desc: "We listen to our customers and each other. We build solutions that solve real human problems.", icon: <FiUsers /> },
                            { title: "Innovation", desc: "We challenge the status quo of legacy systems. We move fast and iterate constantly.", icon: <FiArrowRight /> }
                        ].map((v, i) => (
                            <div key={i} className="bg-white p-10 rounded-[40px] border border-[#f3e9e5] shadow-sm hover:shadow-xl transition-all">
                                <div className="w-14 h-14 bg-[#8b2d1d]/5 rounded-2xl flex items-center justify-center text-[#8b2d1d] text-2xl mb-8">
                                    {v.icon}
                                </div>
                                <h3 className="text-2xl font-black text-[#2d1510] mb-4">{v.title}</h3>
                                <p className="text-[#5a4039] leading-relaxed">{v.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Open Positions */}
            <section className="py-32 bg-white">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                        <div>
                            <h2 className="text-4xl font-black text-[#2d1510] mb-4">Open Positions</h2>
                            <p className="text-[#5a4039]">We're always looking for talented individuals to join our mission.</p>
                        </div>
                        <div className="flex gap-4">
                            <span className="px-4 py-2 rounded-full bg-gray-100 text-sm font-bold text-gray-600">Engineering</span>
                            <span className="px-4 py-2 rounded-full bg-gray-100 text-sm font-bold text-gray-600">Design</span>
                            <span className="px-4 py-2 rounded-full bg-gray-100 text-sm font-bold text-gray-600">Sales</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {jobs.map((job, i) => (
                            <div key={i} className="group p-8 rounded-3xl border border-[#f3e9e5] flex flex-col md:flex-row md:items-center justify-between hover:border-[#8b2d1d] hover:shadow-lg transition-all cursor-pointer">
                                <div className="mb-6 md:mb-0">
                                    <h3 className="text-2xl font-black text-[#2d1510] mb-2 group-hover:text-[#8b2d1d] transition-colors">{job.title}</h3>
                                    <div className="flex flex-wrap gap-6 text-[#5a4039] text-sm font-medium">
                                        <span className="flex items-center gap-2"><FiBriefcase /> {job.department}</span>
                                        <span className="flex items-center gap-2"><FiMapPin /> {job.location}</span>
                                        <span className="flex items-center gap-2"><FiClock /> {job.type}</span>
                                    </div>
                                </div>
                                <Button className="!bg-[#2d1510] text-white rounded-xl px-8 py-4 font-bold group-hover:!bg-[#8b2d1d] transition-colors">Apply Now</Button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-32 bg-[#fffcfb]">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-4xl font-black text-[#2d1510] mb-8">Don't see a role that fits?</h2>
                    <p className="text-[#5a4039] mb-12 max-w-xl mx-auto">We're always looking for passionate people. Send us your resume and tell us how you can contribute to RestoByte.</p>
                    <Link to="/contact" className="text-[#8b2d1d] font-black text-xl hover:underline">Get in touch with us <FiArrowRight className="inline ml-2" /></Link>
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

export default SaaSCareerPage;
