


import React, { useState, useEffect } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { SaasWebsiteContent } from '@/types';
import CMSHeroForm from '@/components/saas/CMSHeroForm';
import CMSFeaturesForm from '@/components/saas/CMSFeaturesForm';
import CMSPricingForm from '@/components/saas/CMSPricingForm';
import CMSTrustedByForm from '@/components/saas/CMSTrustedByForm';
import CMSStatisticsForm from '@/components/saas/CMSStatisticsForm';
import CMSCTAForm from '@/components/saas/CMSCTAForm';
import CMSTestimonialsForm from '@/components/saas/CMSTestimonialsForm';
import { FiSave, FiCheckCircle, FiArrowUp, FiArrowDown, FiRefreshCcw } from 'react-icons/fi';

const HomePageContentPage: React.FC = () => {
    const { saasWebsiteContent, updateSaasWebsiteContent } = useRestaurantData();
    const [localContent, setLocalContent] = useState<SaasWebsiteContent>(saasWebsiteContent);
    const [showSavedMessage, setShowSavedMessage] = useState(false);

    useEffect(() => {
        setLocalContent(saasWebsiteContent);
    }, [saasWebsiteContent]);

    const handleUpdate = (updater: (prev: SaasWebsiteContent) => SaasWebsiteContent) => {
        const newContent = updater(localContent);
        setLocalContent(newContent);
    };

    const handleSave = () => {
        updateSaasWebsiteContent(() => localContent);
        setShowSavedMessage(true);
        setTimeout(() => setShowSavedMessage(false), 2500);
    };
    
    const isDirty = JSON.stringify(localContent) !== JSON.stringify(saasWebsiteContent);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-gray-800">Homepage Content</h1>
                <div className="flex items-center space-x-3">
                    {showSavedMessage && <span className="text-green-600 flex items-center text-sm"><FiCheckCircle className="mr-1.5"/>Saved!</span>}
                    <Button onClick={handleSave} disabled={!isDirty} leftIcon={<FiSave/>}>
                        Save All Changes
                    </Button>
                </div>
            </div>

            <Card title="Section Order">
                <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">Reorder homepage sections (top to bottom).</p>
                        <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<FiRefreshCcw/>}
                            onClick={() => handleUpdate(() => ({
                                ...localContent,
                                sectionOrder: [
                                    'hero',
                                    'trustedByLogos',
                                    'statistics',
                                    'cta',
                                    'features',
                                    'pricing',
                                    'testimonials',
                                    'blogPosts',
                                ]
                            }))}
                        >
                            Reset Order
                        </Button>
                    </div>
                    <ul className="divide-y divide-gray-200 rounded border">
                        {localContent.sectionOrder.map((key, index) => {
                            const labelMap: Record<string, string> = {
                                hero: 'Hero',
                                trustedByLogos: 'Trusted By',
                                statistics: 'Statistics',
                                cta: 'Call to Action',
                                features: 'Features',
                                pricing: 'Pricing',
                                testimonials: 'Testimonials',
                                blogPosts: 'Blog Posts',
                            };
                            const canUp = index > 0;
                            const canDown = index < localContent.sectionOrder.length - 1;
                            const move = (from: number, to: number) => {
                                const next = [...localContent.sectionOrder];
                                const [item] = next.splice(from, 1);
                                next.splice(to, 0, item);
                                handleUpdate(prev => ({ ...prev, sectionOrder: next }));
                            };
                            return (
                                <li key={`${key}-${index}`} className="flex items-center justify-between p-3 bg-white">
                                    <span className="font-medium text-gray-800">{labelMap[key] ?? key}</span>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            disabled={!canUp}
                                            onClick={() => move(index, index - 1)}
                                        >
                                            <FiArrowUp/>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            disabled={!canDown}
                                            onClick={() => move(index, index + 1)}
                                        >
                                            <FiArrowDown/>
                                        </Button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </Card>

            <Card title="Section Visibility">
                <div className="p-4 space-y-2">
                    {['hero','trustedByLogos','statistics','cta','features','pricing','testimonials','blogPosts'].map((key) => {
                        const isEnabled = localContent.sectionOrder.includes(key);
                        const toggle = () => {
                            if (isEnabled) {
                                const next = localContent.sectionOrder.filter(k => k !== key);
                                handleUpdate(prev => ({ ...prev, sectionOrder: next }));
                            } else {
                                const next = [...localContent.sectionOrder, key];
                                handleUpdate(prev => ({ ...prev, sectionOrder: next }));
                            }
                        };
                        const labelMap: Record<string, string> = {
                            hero: 'Hero',
                            trustedByLogos: 'Trusted By',
                            statistics: 'Statistics',
                            cta: 'Call to Action',
                            features: 'Features',
                            pricing: 'Pricing',
                            testimonials: 'Testimonials',
                            blogPosts: 'Blog Posts',
                        };
                        return (
                            <label key={key} className="flex items-center justify-between p-2 rounded border bg-white">
                                <span className="text-sm font-medium text-gray-800">{labelMap[key] ?? key}</span>
                                <button
                                    onClick={toggle}
                                    role="switch"
                                    aria-checked={isEnabled}
                                    className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${isEnabled ? 'bg-green-600' : 'bg-gray-300'}`}
                                >
                                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </label>
                        );
                    })}
                </div>
            </Card>

            <Card title="Hero Section">
                <CMSHeroForm
                    hero={localContent.hero}
                    onUpdate={hero => handleUpdate(prev => ({ ...prev, hero }))}
                />
            </Card>

            <Card title="Trusted By Section">
                 <CMSTrustedByForm
                    logos={localContent.trustedByLogos}
                    onUpdate={trustedByLogos => handleUpdate(prev => ({ ...prev, trustedByLogos }))}
                />
            </Card>

            <Card title="Statistics Section">
                <CMSStatisticsForm
                    statistics={localContent.statistics}
                    onUpdate={statistics => handleUpdate(prev => ({ ...prev, statistics }))}
                />
            </Card>

            <Card title="Call to Action (CTA) Section">
                <CMSCTAForm
                    cta={localContent.cta}
                    onUpdate={cta => handleUpdate(prev => ({ ...prev, cta }))}
                />
            </Card>
            
            <Card title="Features Section">
                <CMSFeaturesForm
                    features={localContent.features}
                    onUpdate={features => handleUpdate(prev => ({...prev, features}))}
                />
            </Card>

            <Card title="Pricing Section">
                <CMSPricingForm
                    pricingPlans={localContent.pricing}
                    onUpdate={pricing => handleUpdate(prev => ({...prev, pricing}))}
                />
            </Card>
            
            <Card title="Testimonials Section">
                <CMSTestimonialsForm
                    testimonials={localContent.testimonials}
                    onUpdate={testimonials => handleUpdate(prev => ({ ...prev, testimonials }))}
                />
            </Card>
        </div>
    );
};

export default HomePageContentPage;