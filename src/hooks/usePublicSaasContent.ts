import { useState, useEffect } from 'react';
import { SaasWebsiteContent } from '@/types';
import { API_BASE_URL } from '@/config';

const DEFAULT_CONTENT: SaasWebsiteContent = {
    sectionOrder: [],
    header: { brandName: 'RestoByte', logoUrl: '/logo.png', navLinks: [] },
    footer: { brandTitle: 'RestoByte', brandDescription: '', poweredByText: 'Powered by IT Relevant Pvt. Ltd', copyright: '© 2024 RestoByte.', columns: [], socialLinks: [] },
    seo: { title: 'RestoByte', description: '', faviconUrl: '' },
    pages: [],
    hero: { title: 'The Ultimate Restaurant Management Platform', subtitle: 'From point of sale to inventory management, streamline your operations.', imageUrl: '' },
    trustedByLogos: [],
    statistics: [],
    features: [],
    cta: { title: 'Get Started with RestoByte', subtitle: 'Sign up today.', buttonText: 'Start Free Trial' },
    pricing: [],
    testimonials: [],
    blogPosts: [],
    productsShop: { brandLabel: '', title: '', subtitle: '', whatsappNumber: '', ctaTitle: '', ctaSubtitle: '', ctaButtonText: '', categories: [], products: [] },
    showcase: { badge: '', title: '', subtitle: '', imageUrl: '', features: [] },
    videoSection: { title: '', subtitle: '', imageUrl: '', videoUrl: '' },
    benefits: [],
    faq: [],
    about: { title: '', subtitle: '', imageUrl: '', story: '', mission: '', vision: '' },
    contact: { title: '', subtitle: '', email: '', phone: '', address: '' },
};

export const usePublicSaasContent = () => {
    const [content, setContent] = useState<SaasWebsiteContent>(DEFAULT_CONTENT);

    useEffect(() => {
        const url = `${API_BASE_URL}/public/saas-website-content?env=default`;
        fetch(url)
            .then((res) => res.json())
            .then((data) => {
                if (data?.content && typeof data.content === 'object') {
                    setContent((prev) => ({ ...prev, ...data.content }));
                }
            })
            .catch(() => {});
    }, []);

    return content;
};
