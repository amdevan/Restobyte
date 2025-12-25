

import React from 'react';
import { FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiYoutube, FiSend } from 'react-icons/fi';
import Input from '../common/Input';
import Button from '../common/Button';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import * as AllFiIcons from 'react-icons/fi';

const SocialIcon: React.FC<{platform: string}> = ({ platform }) => {
    const IconComponent = (AllFiIcons as any)[`Fi${platform}`];
    if (IconComponent) {
        return <IconComponent />;
    }
    return null;
}

type SocialLink = { id: string; platform: string; url: string };

interface PublicFooterProps {
  brandName?: string;
  brandDescription?: string;
  socialLinks?: SocialLink[];
  hideCtaAndNewsletter?: boolean;
}

const PublicFooter: React.FC<PublicFooterProps> = ({ brandName, brandDescription, socialLinks, hideCtaAndNewsletter }) => {
  const { saasWebsiteContent } = useRestaurantData();
  const { footer } = saasWebsiteContent;

  const resolvedBrandName = brandName || 'RestoByte';
  const resolvedSocial = socialLinks && socialLinks.length > 0 ? socialLinks : footer.socialLinks;

  return (
    <footer className="bg-white">
      {!hideCtaAndNewsletter && (
        <div className="bg-indigo-600 text-white">
          <div className="container mx-auto px-6 py-12 md:flex md:justify-between md:items-center">
            <div className="mb-6 md:mb-0">
              <span className="text-sm text-indigo-200">GET STARTED</span>
              <h2 className="text-3xl font-bold mt-1">Ready to transform your restaurant?</h2>
              <p className="text-indigo-200 mt-2">Join hundreds of successful restaurants growing with {resolvedBrandName}.</p>
            </div>
            <form className="w-full md:w-auto md:min-w-[350px] space-y-3 bg-white/10 p-6 rounded-lg">
              <Input containerClassName="mb-0" className="!bg-indigo-500 !border-indigo-400 !text-white placeholder-indigo-200" placeholder="Email Address" type="email" />
              <Input containerClassName="mb-0" className="!bg-indigo-500 !border-indigo-400 !text-white placeholder-indigo-200" placeholder="Password" type="password" />
              <Button variant="secondary" className="w-full !bg-orange-500 !text-white hover:!bg-orange-600">GET STARTED</Button>
            </form>
          </div>
        </div>
      )}
      <div className="bg-gray-800 text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Column 1: Brand */}
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-xl font-bold">{resolvedBrandName}</h3>
              {(
                brandDescription || ''
              ) && (
                <p className="text-sm text-gray-400 mt-2">{brandDescription}</p>
              )}
              <div className="flex space-x-4 mt-4">
                {resolvedSocial.map(link => (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                    <SocialIcon platform={link.platform} />
                  </a>
                ))}
              </div>
            </div>
            {/* Dynamic Columns */}
            {footer.columns.map(column => (
              <div key={column.id}>
                <h4 className="font-semibold mb-3">{column.title}</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  {column.links.map(link => (
                    <li key={link.id}><a href={link.url} className="hover:text-white">{link.text}</a></li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Column 4: Newsletter */}
            {!hideCtaAndNewsletter && (
              <div className="col-span-2 md:col-span-2">
                <h4 className="font-semibold mb-3">Join Our Newsletter</h4>
                <form className="flex">
                  <Input containerClassName="mb-0 flex-grow" className="!rounded-r-none" placeholder="Your email address" type="email" />
                  <Button variant="primary" className="!rounded-l-none bg-indigo-600 hover:bg-indigo-700">Subscribe</Button>
                </form>
                <p className="text-xs text-gray-500 mt-2">* Receive weekly tips and updates for restaurant owners.</p>
              </div>
            )}
          </div>
          <div className="mt-12 pt-8 border-t border-gray-700 text-center text-sm text-gray-500">
            <p>{footer.copyright}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
