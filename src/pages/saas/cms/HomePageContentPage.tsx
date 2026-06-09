


import React, { useState, useEffect } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { SaasWebsiteContent } from '@/types';
import CMSHeroForm from '@/components/saas/CMSHeroForm';
import CMSFeaturesForm from '@/components/saas/CMSFeaturesForm';
import CMSPricingForm from '@/components/saas/CMSPricingForm';
import CMSTrustedByForm from '@/components/saas/CMSTrustedByForm';
import CMSStatisticsForm from '@/components/saas/CMSStatisticsForm';
import CMSCTAForm from '@/components/saas/CMSCTAForm';
import CMSTestimonialsForm from '@/components/saas/CMSTestimonialsForm';
import { FiSave, FiCheckCircle, FiArrowUp, FiArrowDown, FiRefreshCcw, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';

const HomePageContentPage: React.FC<{ initialSection?: string; productsOnly?: boolean }> = ({ initialSection, productsOnly = false }) => {
    const { saasWebsiteContent, updateSaasWebsiteContent, fetchSaasWebsiteContent } = useRestaurantData();
    const [localContent, setLocalContent] = useState<SaasWebsiteContent>(saasWebsiteContent);
    const [showSavedMessage, setShowSavedMessage] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setLocalContent(saasWebsiteContent);
    }, [saasWebsiteContent]);

    useEffect(() => {
        const sectionFromQuery = new URLSearchParams(location.search).get('section') || '';
        const target = (initialSection || sectionFromQuery).trim().toLowerCase();
        if (target !== 'products-shop') return;

        const el = document.getElementById('products-shop-section');
        if (!el) return;

        const timer = window.setTimeout(() => {
            const top = el.getBoundingClientRect().top + window.pageYOffset - 96;
            window.scrollTo({ top, behavior: 'smooth' });
        }, 50);

        return () => window.clearTimeout(timer);
    }, [initialSection, location.search]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchSaasWebsiteContent();
        setIsRefreshing(false);
    };

    const handleUpdate = (updater: (prev: SaasWebsiteContent) => SaasWebsiteContent) => {
        const newContent = updater(localContent);
        setLocalContent(newContent);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveError(null);
        try {
            await updateSaasWebsiteContent(() => localContent);
            setShowSavedMessage(true);
            setTimeout(() => setShowSavedMessage(false), 2500);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to save.';
            setSaveError(message);
        } finally {
            setIsSaving(false);
        }
    };
    
    const isDirty = JSON.stringify(localContent) !== JSON.stringify(saasWebsiteContent);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-gray-800">{productsOnly ? 'Products (Shop)' : 'Homepage Content'}</h1>
                <div className="flex items-center space-x-3">
                    <Button 
                        variant="secondary" 
                        onClick={handleRefresh} 
                        disabled={isRefreshing}
                        leftIcon={<FiRefreshCcw className={isRefreshing ? 'animate-spin' : ''}/>}
                    >
                        {isRefreshing ? 'Refreshing...' : 'Refresh from Server'}
                    </Button>
                    {saveError && <span className="text-red-600 text-sm font-medium">{saveError}</span>}
                    {showSavedMessage && <span className="text-green-600 flex items-center text-sm"><FiCheckCircle className="mr-1.5"/>Saved!</span>}
                    <Button onClick={handleSave} disabled={!isDirty || isSaving} leftIcon={<FiSave/>}>
                        {isSaving ? 'Saving...' : 'Save All Changes'}
                    </Button>
                </div>
            </div>

            {!productsOnly && (
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
            )}

            {!productsOnly && (
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
            )}

            {!productsOnly && (
            <Card title="Hero Section">
                <CMSHeroForm
                    hero={localContent.hero}
                    onUpdate={hero => handleUpdate(prev => ({ ...prev, hero }))}
                />
            </Card>
            )}

            {!productsOnly && (
            <Card title="Trusted By Section">
                 <CMSTrustedByForm
                    logos={localContent.trustedByLogos}
                    onUpdate={trustedByLogos => handleUpdate(prev => ({ ...prev, trustedByLogos }))}
                />
            </Card>
            )}

            {!productsOnly && (
            <Card title="Statistics Section">
                <CMSStatisticsForm
                    statistics={localContent.statistics}
                    onUpdate={statistics => handleUpdate(prev => ({ ...prev, statistics }))}
                />
            </Card>
            )}

            {!productsOnly && (
            <Card title="Call to Action (CTA) Section">
                <CMSCTAForm
                    cta={localContent.cta}
                    onUpdate={cta => handleUpdate(prev => ({ ...prev, cta }))}
                />
            </Card>
            )}
            
            {!productsOnly && (
            <Card title="Features Section">
                <CMSFeaturesForm
                    features={localContent.features}
                    onUpdate={features => handleUpdate(prev => ({...prev, features}))}
                />
            </Card>
            )}

            {!productsOnly && (
            <Card title="Pricing Section">
                <CMSPricingForm
                    pricingPlans={localContent.pricing}
                    onUpdate={pricing => handleUpdate(prev => ({...prev, pricing}))}
                />
            </Card>
            )}

            {productsOnly && (
            <div id="products-shop-section">
                <Card title="Products (Shop) Page">
                    <div className="p-4 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Brand Label"
                                value={localContent.productsShop.brandLabel || ''}
                                onChange={(e) => handleUpdate(prev => ({ ...prev, productsShop: { ...prev.productsShop, brandLabel: e.target.value } }))}
                                placeholder="RestoByte Shop"
                            />
                            <Input
                                label="Title"
                                value={localContent.productsShop.title || ''}
                                onChange={(e) => handleUpdate(prev => ({ ...prev, productsShop: { ...prev.productsShop, title: e.target.value } }))}
                                placeholder="Hardware & Accessories"
                            />
                            <Input
                                label="WhatsApp Number"
                                value={localContent.productsShop.whatsappNumber || ''}
                                onChange={(e) => handleUpdate(prev => ({ ...prev, productsShop: { ...prev.productsShop, whatsappNumber: e.target.value } }))}
                                placeholder="+9779843927360"
                            />
                            <Input
                                label="CTA Button Text"
                                value={localContent.productsShop.ctaButtonText || ''}
                                onChange={(e) => handleUpdate(prev => ({ ...prev, productsShop: { ...prev.productsShop, ctaButtonText: e.target.value } }))}
                                placeholder="Request a Custom Quote"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                                <textarea
                                    value={localContent.productsShop.subtitle || ''}
                                    onChange={(e) => handleUpdate(prev => ({ ...prev, productsShop: { ...prev.productsShop, subtitle: e.target.value } }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm min-h-[96px]"
                                    placeholder="High-performance hardware fully integrated with your software."
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">CTA Subtitle</label>
                                <textarea
                                    value={localContent.productsShop.ctaSubtitle || ''}
                                    onChange={(e) => handleUpdate(prev => ({ ...prev, productsShop: { ...prev.productsShop, ctaSubtitle: e.target.value } }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm min-h-[96px]"
                                    placeholder="Our experts can help you choose the right setup."
                                />
                            </div>
                        </div>

                        <Input
                            label="CTA Title"
                            value={localContent.productsShop.ctaTitle || ''}
                            onChange={(e) => handleUpdate(prev => ({ ...prev, productsShop: { ...prev.productsShop, ctaTitle: e.target.value } }))}
                            placeholder="Need a full restaurant setup?"
                        />

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-semibold text-gray-800">Categories</div>
                                    <div className="text-xs text-gray-500">Used for filters on the Products (Shop) page.</div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    leftIcon={<FiPlus/>}
                                    onClick={() => handleUpdate(prev => ({
                                        ...prev,
                                        productsShop: {
                                            ...prev.productsShop,
                                            categories: [...(prev.productsShop.categories || []), 'New Category']
                                        }
                                    }))}
                                >
                                    Add Category
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {(localContent.productsShop.categories || []).map((cat, idx) => (
                                    <div key={`${cat}-${idx}`} className="flex items-center gap-2">
                                        <Input
                                            value={cat}
                                            onChange={(e) => handleUpdate(prev => ({
                                                ...prev,
                                                productsShop: {
                                                    ...prev.productsShop,
                                                    categories: (prev.productsShop.categories || []).map((c, i) => i === idx ? e.target.value : c)
                                                }
                                            }))}
                                            containerClassName="mb-0 flex-grow"
                                        />
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            onClick={() => handleUpdate(prev => ({
                                                ...prev,
                                                productsShop: {
                                                    ...prev.productsShop,
                                                    categories: (prev.productsShop.categories || []).filter((_, i) => i !== idx)
                                                }
                                            }))}
                                        >
                                            <FiTrash2/>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-semibold text-gray-800">Products</div>
                                    <div className="text-xs text-gray-500">These products appear on the Products (Shop) page.</div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    leftIcon={<FiPlus/>}
                                    onClick={() => handleUpdate(prev => ({
                                        ...prev,
                                        productsShop: {
                                            ...prev.productsShop,
                                            products: [
                                                ...(prev.productsShop.products || []),
                                                {
                                                    id: `shop-${Date.now()}`,
                                                    name: 'New Product',
                                                    category: (prev.productsShop.categories || [])[0] || 'Hardware',
                                                    price: 0,
                                                    rating: 4.8,
                                                    imageUrl: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&q=80&w=400',
                                                    icon: 'FiShoppingCart',
                                                    isInStock: true
                                                }
                                            ]
                                        }
                                    }))}
                                >
                                    Add Product
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {(localContent.productsShop.products || []).map((p, idx) => (
                                    <div key={p.id} className="p-4 border rounded-lg bg-white space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-semibold text-gray-800">{p.name}</div>
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                onClick={() => handleUpdate(prev => ({
                                                    ...prev,
                                                    productsShop: {
                                                        ...prev.productsShop,
                                                        products: (prev.productsShop.products || []).filter((x) => x.id !== p.id)
                                                    }
                                                }))}
                                            >
                                                <FiTrash2/>
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <Input
                                                label="Name"
                                                value={p.name}
                                                onChange={(e) => handleUpdate(prev => ({
                                                    ...prev,
                                                    productsShop: {
                                                        ...prev.productsShop,
                                                        products: (prev.productsShop.products || []).map((x, i) => i === idx ? { ...x, name: e.target.value } : x)
                                                    }
                                                }))}
                                                containerClassName="mb-0"
                                            />
                                            <Input
                                                label="Category"
                                                value={p.category}
                                                onChange={(e) => handleUpdate(prev => ({
                                                    ...prev,
                                                    productsShop: {
                                                        ...prev.productsShop,
                                                        products: (prev.productsShop.products || []).map((x, i) => i === idx ? { ...x, category: e.target.value } : x)
                                                    }
                                                }))}
                                                containerClassName="mb-0"
                                            />
                                            <Input
                                                label="Price"
                                                type="number"
                                                value={String(p.price ?? 0)}
                                                onChange={(e) => handleUpdate(prev => ({
                                                    ...prev,
                                                    productsShop: {
                                                        ...prev.productsShop,
                                                        products: (prev.productsShop.products || []).map((x, i) => i === idx ? { ...x, price: Number(e.target.value || 0) } : x)
                                                    }
                                                }))}
                                                containerClassName="mb-0"
                                            />
                                            <Input
                                                label="Rating (optional)"
                                                type="number"
                                                value={p.rating == null ? '' : String(p.rating)}
                                                onChange={(e) => handleUpdate(prev => ({
                                                    ...prev,
                                                    productsShop: {
                                                        ...prev.productsShop,
                                                        products: (prev.productsShop.products || []).map((x, i) => i === idx ? { ...x, rating: e.target.value === '' ? undefined : Number(e.target.value) } : x)
                                                    }
                                                }))}
                                                containerClassName="mb-0"
                                            />
                                            <Input
                                                label="Image URL"
                                                value={p.imageUrl}
                                                onChange={(e) => handleUpdate(prev => ({
                                                    ...prev,
                                                    productsShop: {
                                                        ...prev.productsShop,
                                                        products: (prev.productsShop.products || []).map((x, i) => i === idx ? { ...x, imageUrl: e.target.value } : x)
                                                    }
                                                }))}
                                                containerClassName="mb-0"
                                            />
                                            <Input
                                                label="Icon (optional)"
                                                value={p.icon || ''}
                                                onChange={(e) => handleUpdate(prev => ({
                                                    ...prev,
                                                    productsShop: {
                                                        ...prev.productsShop,
                                                        products: (prev.productsShop.products || []).map((x, i) => i === idx ? { ...x, icon: e.target.value || undefined } : x)
                                                    }
                                                }))}
                                                placeholder="FiMonitor"
                                                containerClassName="mb-0"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                                <textarea
                                                    value={p.description || ''}
                                                    onChange={(e) => handleUpdate(prev => ({
                                                        ...prev,
                                                        productsShop: {
                                                            ...prev.productsShop,
                                                            products: (prev.productsShop.products || []).map((x, i) => i === idx ? { ...x, description: e.target.value } : x)
                                                        }
                                                    }))}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm min-h-[96px]"
                                                    placeholder="Short description for product detail."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="text-sm font-medium text-gray-700">Highlights</div>
                                                <div className="space-y-2">
                                                    {(p.highlights || []).map((h, hi) => (
                                                        <div key={`${p.id}-h-${hi}`} className="flex items-center gap-2">
                                                            <Input
                                                                value={h}
                                                                onChange={(e) => handleUpdate(prev => ({
                                                                    ...prev,
                                                                    productsShop: {
                                                                        ...prev.productsShop,
                                                                        products: (prev.productsShop.products || []).map((x, i) => {
                                                                            if (i !== idx) return x;
                                                                            const nextHighlights = (x.highlights || []).map((hh, j) => j === hi ? e.target.value : hh);
                                                                            return { ...x, highlights: nextHighlights };
                                                                        })
                                                                    }
                                                                }))}
                                                                containerClassName="mb-0 flex-grow"
                                                            />
                                                            <Button
                                                                size="sm"
                                                                variant="danger"
                                                                onClick={() => handleUpdate(prev => ({
                                                                    ...prev,
                                                                    productsShop: {
                                                                        ...prev.productsShop,
                                                                        products: (prev.productsShop.products || []).map((x, i) => {
                                                                            if (i !== idx) return x;
                                                                            const nextHighlights = (x.highlights || []).filter((_, j) => j !== hi);
                                                                            return { ...x, highlights: nextHighlights };
                                                                        })
                                                                    }
                                                                }))}
                                                            >
                                                                <FiTrash2/>
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    leftIcon={<FiPlus/>}
                                                    onClick={() => handleUpdate(prev => ({
                                                        ...prev,
                                                        productsShop: {
                                                            ...prev.productsShop,
                                                            products: (prev.productsShop.products || []).map((x, i) => {
                                                                if (i !== idx) return x;
                                                                return { ...x, highlights: [...(x.highlights || []), ''] };
                                                            })
                                                        }
                                                    }))}
                                                >
                                                    Add Highlight
                                                </Button>
                                            </div>
                                        </div>

                                        <label className="flex items-center gap-2 text-sm text-gray-700">
                                            <input
                                                type="checkbox"
                                                checked={p.isInStock !== false}
                                                onChange={(e) => handleUpdate(prev => ({
                                                    ...prev,
                                                    productsShop: {
                                                        ...prev.productsShop,
                                                        products: (prev.productsShop.products || []).map((x, i) => i === idx ? { ...x, isInStock: e.target.checked } : x)
                                                    }
                                                }))}
                                                className="h-4 w-4"
                                            />
                                            In Stock
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
            )}
            
            {!productsOnly && (
            <Card title="Testimonials Section">
                <CMSTestimonialsForm
                    testimonials={localContent.testimonials}
                    onUpdate={testimonials => handleUpdate(prev => ({ ...prev, testimonials }))}
                />
            </Card>
            )}
        </div>
    );
};

export default HomePageContentPage;
