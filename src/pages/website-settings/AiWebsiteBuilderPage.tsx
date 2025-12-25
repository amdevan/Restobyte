import React, { useState } from 'react';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/Spinner';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { generateWebsiteContentFromPrompt, generateAdvancedWebsiteSettingsFromPrompt } from '@/services/geminiService';
import type { WebsiteHomePageContent, WebsiteWhiteLabelSettings, WebsiteContactUsContent, WebsiteAboutUsContent } from '@/types';
import { FiWind, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';

const AiWebsiteBuilderPage: React.FC = () => {
  const { websiteSettings, updateWebsiteSettings } = useRestaurantData();
  const [prompt, setPrompt] = useState<string>(
    'Create an inviting homepage for a modern casual dining restaurant specializing in Nepali and Indian cuisine. Emphasize warm hospitality, signature momos, biryani, and a cozy ambience.'
  );
  const [brandName, setBrandName] = useState<string>(websiteSettings.whiteLabel?.appName || 'Your Restaurant');
  const [primaryColor, setPrimaryColor] = useState<string>(websiteSettings.whiteLabel?.primaryColor || '#0ea5e9');
  const [cuisine, setCuisine] = useState<string>('Nepali & Indian');
  const [tone, setTone] = useState<'modern' | 'elegant' | 'casual' | 'luxury'>('modern');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedWhiteLabel, setGeneratedWhiteLabel] = useState<WebsiteWhiteLabelSettings | null>(null);
  const [generatedContent, setGeneratedContent] = useState<WebsiteHomePageContent | null>(null);
  const [generatedContact, setGeneratedContact] = useState<WebsiteContactUsContent | null>(null);
  const [generatedAbout, setGeneratedAbout] = useState<WebsiteAboutUsContent | null>(null);
  const [useAdvanced, setUseAdvanced] = useState<boolean>(true);
  const [includeAboutUs, setIncludeAboutUs] = useState<boolean>(true);
  const [includeContact, setIncludeContact] = useState<boolean>(true);
  const [includeGallery, setIncludeGallery] = useState<boolean>(true);
  const [includeSocial, setIncludeSocial] = useState<boolean>(true);
  const [showSavedMessage, setShowSavedMessage] = useState<boolean>(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setShowSavedMessage(false);
    try {
      if (useAdvanced) {
        const adv = await generateAdvancedWebsiteSettingsFromPrompt(prompt, {
          brandName, primaryColor, cuisine, tone,
          includeAboutUs, includeContact, includeGallery, includeSocial
        });
        if (!adv || !adv.whiteLabel || !adv.homePageContent) {
          setError('Could not generate website content. Please try again later.');
          setIsLoading(false);
          return;
        }
        setGeneratedWhiteLabel(adv.whiteLabel);
        setGeneratedContent(adv.homePageContent);
        setGeneratedContact((adv as any).contactUsContent || null);
        setGeneratedAbout((adv as any).aboutUsContent || null);
      } else {
        const result = await generateWebsiteContentFromPrompt(prompt, { brandName, primaryColor, cuisine, tone });
        if (!result) {
          setError('Could not generate website content. Please try again later.');
          setIsLoading(false);
          return;
        }
        setGeneratedWhiteLabel(result.whiteLabel);
        setGeneratedContent(result.homePageContent);
        setGeneratedContact(result.contactUsContent || null);
      }
    } catch (err: any) {
      setError(err?.message || 'Unexpected error occurred while generating content.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!generatedWhiteLabel || !generatedContent) return;
    updateWebsiteSettings({
      whiteLabel: {
        appName: generatedWhiteLabel.appName,
        primaryColor: generatedWhiteLabel.primaryColor,
        logoUrl: generatedWhiteLabel.logoUrl,
        faviconUrl: generatedWhiteLabel.faviconUrl,
      },
      homePageContent: generatedContent,
      contactUsContent: generatedContact || websiteSettings.contactUsContent,
      aboutUsContent: generatedAbout || websiteSettings.aboutUsContent,
    });
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 3000);
  };

  const handleResetPreview = () => {
    setGeneratedWhiteLabel(null);
    setGeneratedContent(null);
    setGeneratedContact(null);
    setGeneratedAbout(null);
    setShowSavedMessage(false);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">AI Website Builder</h1>
        {showSavedMessage && (
          <div className="flex items-center text-green-600"><FiCheckCircle className="mr-2" /> Applied to Website Settings</div>
        )}
      </div>

      <Card title="Describe Your Restaurant">
        <div className="space-y-4">
          <label className="block">
            <span className="text-gray-700">Prompt</span>
            <textarea
              className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:ring-sky-500 focus:border-sky-500"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the vibe, cuisine, signature items, ambience, and any unique selling points."
            />
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Brand Name" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
            <div>
              <label className="text-gray-700">Primary Color</label>
              <div className="mt-1 flex items-center space-x-3">
                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 p-0 border rounded" />
                <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
              </div>
            </div>
            <Input label="Cuisine" value={cuisine} onChange={(e) => setCuisine(e.target.value)} />
            <div>
              <label className="text-gray-700">Tone</label>
              <select
                className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:ring-sky-500 focus:border-sky-500"
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
              >
                <option value="modern">Modern</option>
                <option value="elegant">Elegant</option>
                <option value="casual">Casual</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={useAdvanced} onChange={(e) => setUseAdvanced(e.target.checked)} />
              <span className="text-gray-700">Advanced generation</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={includeAboutUs} onChange={(e) => setIncludeAboutUs(e.target.checked)} />
              <span className="text-gray-700">Include About Us</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={includeContact} onChange={(e) => setIncludeContact(e.target.checked)} />
              <span className="text-gray-700">Include Contact</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={includeGallery} onChange={(e) => setIncludeGallery(e.target.checked)} />
              <span className="text-gray-700">Include Gallery</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={includeSocial} onChange={(e) => setIncludeSocial(e.target.checked)} />
              <span className="text-gray-700">Include Social Links</span>
            </label>
          </div>
          <div className="flex space-x-2 mt-2">
            <Button onClick={handleGenerate} variant="primary" disabled={isLoading}>
              <FiWind className="inline mr-2" /> Generate
            </Button>
            <Button onClick={handleResetPreview} variant="secondary">
              <FiRefreshCw className="inline mr-2" /> Reset Preview
            </Button>
          </div>
          {isLoading && (
            <div className="flex items-center text-sky-600"><Spinner size="sm" /> <span className="ml-2">Generating content…</span></div>
          )}
          {error && <p className="text-red-600">{error}</p>}
        </div>
      </Card>

      <Card title="Preview & Apply">
        {!generatedWhiteLabel || !generatedContent ? (
          <p className="text-gray-500">Generate content above to preview here.</p>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">White Label</h2>
              <div className="mt-2 p-4 border rounded-md" style={{ borderColor: generatedWhiteLabel.primaryColor }}>
                <p><span className="font-medium">App Name:</span> {generatedWhiteLabel.appName}</p>
                <p><span className="font-medium">Primary Color:</span> {generatedWhiteLabel.primaryColor}</p>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Hero Section</h2>
              <div className="mt-2 p-4 border rounded-md">
                <p className="text-xl font-bold">{generatedContent.bannerSection?.title}</p>
                <p className="text-gray-600">{generatedContent.bannerSection?.subtitle}</p>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Services</h2>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {generatedContent.serviceSection?.services?.map(s => (
                  <div key={s.id} className="p-4 border rounded-md">
                    <p className="font-medium">{s.title}</p>
                    <p className="text-gray-600 text-sm">{s.description}</p>
                    <p className="text-xs text-gray-400 mt-1">Icon: {s.icon}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Explore Menu</h2>
              <div className="mt-2 p-4 border rounded-md">
                <p className="text-gray-600">{generatedContent.exploreMenuSection?.subtitle}</p>
                <p className="text-gray-800 font-medium">Button: {generatedContent.exploreMenuSection?.buttonText || 'Explore Menu'}</p>
              </div>
            </div>
            {generatedAbout && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800">About Us</h2>
                <div className="mt-2 p-4 border rounded-md">
                  <p className="text-xl font-bold">{generatedAbout.title}</p>
                  <p className="text-gray-700 mt-1 whitespace-pre-line">{generatedAbout.content}</p>
                </div>
              </div>
            )}
            {generatedContact && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Contact</h2>
                <div className="mt-2 p-4 border rounded-md">
                  {generatedContact.address && <p><span className="font-medium">Address:</span> {generatedContact.address}</p>}
                  {generatedContact.phone && <p><span className="font-medium">Phone:</span> {generatedContact.phone}</p>}
                  {generatedContact.email && <p><span className="font-medium">Email:</span> {generatedContact.email}</p>}
                  {generatedContact.mapUrl && (
                    <div className="mt-3">
                      <iframe title="Map Preview" src={generatedContact.mapUrl} className="w-full h-48 border rounded-md" loading="lazy"></iframe>
                    </div>
                  )}
                </div>
              </div>
            )}
            {(generatedContent.gallery?.length || 0) > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Gallery</h2>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {generatedContent.gallery!.map((p) => (
                    <div key={p.id} className="border rounded-md overflow-hidden">
                      <img src={p.url} alt={p.caption || 'Photo'} className="w-full h-24 object-cover" />
                      {p.caption && <p className="text-xs text-gray-600 p-2">{p.caption}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(generatedContent.socialMedia?.length || 0) > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Social Links</h2>
                <ul className="mt-2 list-disc list-inside text-gray-700">
                  {generatedContent.socialMedia!.map((s, idx) => (
                    <li key={idx}>{s.platform}: {s.url}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="pt-2 flex items-center space-x-3">
              <Button onClick={handleApply} variant="primary">
                <FiCheckCircle className="inline mr-2" /> Apply to Website Settings
              </Button>
              <Button onClick={() => window.open('/public/restaurant', '_blank')} variant="secondary">
                Preview Public Site
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AiWebsiteBuilderPage;
