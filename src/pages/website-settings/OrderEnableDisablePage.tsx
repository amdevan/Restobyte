
import React, { useState } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { useNavigate } from 'react-router-dom';
import {
  FiPower,
  FiCheckCircle,
  FiList,
  FiUsers,
  FiSettings,
  FiExternalLink,
  FiEye,
  FiFileText,
  FiPhone,
  FiBookOpen,
  FiImage,
  FiShare2,
  FiMail,
  FiCreditCard
} from 'react-icons/fi';

const OrderEnableDisablePage: React.FC = () => {
  const { websiteSettings, updateWebsiteSettings, getSingleActiveOutlet, employees } = useRestaurantData();
  const [isEnabled, setIsEnabled] = useState(websiteSettings.orderEnabled);
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const navigate = useNavigate();
  const outlet = getSingleActiveOutlet();

  const handleToggle = () => {
    const newStatus = !isEnabled;
    setIsEnabled(newStatus);
    updateWebsiteSettings({ orderEnabled: newStatus });

    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 2500);
  };

  return (
    <div className="p-6">
      <Card title="Online Order Settings" icon={<FiPower />}>
        <div className="p-4 border-t">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-800">Enable Online Ordering</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-md">
                Turn this on to allow customers to place orders through your website. When off, the ordering functionality will be disabled.
              </p>
            </div>
            <button
              onClick={handleToggle}
              role="switch"
              aria-checked={isEnabled}
              className={`relative inline-flex items-center h-7 w-14 rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 ${
                isEnabled ? 'bg-sky-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block w-6 h-6 transform bg-white rounded-full transition-transform duration-300 ease-in-out ${
                  isEnabled ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="mt-4 h-6">
            {showSavedMessage && (
              <div className="flex items-center text-green-600">
                <FiCheckCircle size={16} className="mr-2" />
                <span className="text-sm font-medium">Settings saved!</span>
              </div>
            )}
          </div>

          <div className="mt-8 space-y-6">
            <div>
              <div className="flex items-center mb-2">
                <FiSettings className="text-sky-600 mr-2" />
                <h4 className="text-md font-semibold text-gray-800">Configure</h4>
              </div>
              <p className="text-sm text-gray-500 mb-4">End-to-end setup for online ordering, content, and integrations.</p>

              {(() => {
                const visibleCount = (websiteSettings.availableOnlineFoodIds || []).length;
                const receiverCount = employees.filter(e => (websiteSettings.orderReceivingUserIds || []).includes(e.id) && e.isActive).length;

                const groups: Array<{
                  title: string;
                  icon: React.ReactNode;
                  items: Array<{ label: string; path: string; icon: React.ReactNode; status?: string; disabled?: boolean }>;
                }> = [
                  {
                    title: 'Visibility & Ordering',
                    icon: <FiEye className="text-sky-600 mr-2" />,
                    items: [
                      { label: 'Available Online Foods', path: '/app/website-settings/available-online-foods', icon: <FiList />, status: `${visibleCount} selected`, disabled: !isEnabled },
                      { label: 'Order Receiving Users', path: '/app/website-settings/order-receiving-user', icon: <FiUsers />, status: `${receiverCount} selected`, disabled: !isEnabled }
                    ]
                  },
                  {
                    title: 'Content',
                    icon: <FiFileText className="text-sky-600 mr-2" />,
                    items: [
                      { label: 'Homepage Content', path: '/app/website-settings/home/content', icon: <FiBookOpen /> },
                      { label: 'Add Photo', path: '/app/website-settings/home/add-photo', icon: <FiImage /> },
                      { label: 'List Photo', path: '/app/website-settings/home/list-photo', icon: <FiImage /> },
                      { label: 'Social Media', path: '/app/website-settings/home/social-media', icon: <FiShare2 /> },
                      { label: 'About Us Content', path: '/app/website-settings/about-us-content', icon: <FiFileText /> },
                      { label: 'Contact Us Content', path: '/app/website-settings/contact-us-content', icon: <FiPhone /> },
                      { label: 'Contact List', path: '/app/website-settings/contact-list', icon: <FiPhone /> },
                      { label: 'Common Menu Page', path: '/app/website-settings/common-menu-page', icon: <FiList /> }
                    ]
                  },
                  {
                    title: 'Branding',
                    icon: <FiSettings className="text-sky-600 mr-2" />,
                    items: [
                      { label: 'Website White Label', path: '/app/website-settings/website-white-label', icon: <FiSettings /> }
                    ]
                  },
                  {
                    title: 'Integrations',
                    icon: <FiSettings className="text-sky-600 mr-2" />,
                    items: [
                      { label: 'Social Login Setting', path: '/app/website-settings/social-login-setting', icon: <FiShare2 /> },
                      { label: 'Email Setting', path: '/app/website-settings/email-setting', icon: <FiMail /> },
                      { label: 'Payment Setting', path: '/app/website-settings/payment-setting', icon: <FiCreditCard /> }
                    ]
                  }
                  ,
                  {
                    title: 'Data & Access',
                    icon: <FiSettings className="text-sky-600 mr-2" />,
                    items: [
                      { label: 'Access & Data Overview', path: '/app/website-settings/access-data', icon: <FiList /> }
                    ]
                  }
                ];

                return (
                  <div className="space-y-4">
                    {groups.map(group => (
                      <div key={group.title}>
                        <div className="flex items-center mb-2">
                          {group.icon}
                          <span className="font-medium text-gray-700">{group.title}</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {group.items.map(item => (
                            <div key={item.path} className="flex items-center gap-2">
                              <Button onClick={() => navigate(item.path)} leftIcon={item.icon} variant="secondary" disabled={item.disabled}>
                                {item.label}
                              </Button>
                              {item.status && (
                                <span className="text-xs text-gray-500">{item.status}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Preview */}
              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={() => navigate('/public/restaurant')} leftIcon={<FiExternalLink />}>
                  Preview Public Site
                </Button>
                <Button onClick={() => navigate('/public/restaurant#menu')} leftIcon={<FiExternalLink />}>
                  Preview Public Menu
                </Button>
                {outlet?.id && (
                  <>
                    <Button onClick={() => navigate(`/public/restaurant/${outlet.id}`)} leftIcon={<FiExternalLink />}>
                      Preview Current Outlet
                    </Button>
                    <Button onClick={() => navigate(`/public/restaurant/${outlet.id}#menu`)} leftIcon={<FiExternalLink />}>
                      Preview Outlet Menu
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OrderEnableDisablePage;
