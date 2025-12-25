
import React from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import Card from '@/components/common/Card';
import { FiInbox, FiUser, FiMail, FiCalendar } from 'react-icons/fi';

const ContactListPage: React.FC = () => {
  const { websiteSettings } = useRestaurantData();
  const messages = [...websiteSettings.contactMessages].sort((a,b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

  return (
    <div className="p-6">
      <Card>
        <div className="p-5">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center mb-4"><FiInbox className="mr-3 text-sky-600"/>Contact Form Messages</h2>
          <p className="text-sm text-gray-500 mb-6">View messages submitted by visitors through your website's contact form.</p>
          <div className="border-t">
            {messages.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No messages have been received yet.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {messages.map(msg => (
                  <li key={msg.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold text-gray-800 flex items-center"><FiUser className="mr-2 text-gray-400"/>{msg.name}</p>
                            <a href={`mailto:${msg.email}`} className="text-sm text-sky-600 flex items-center hover:underline"><FiMail className="mr-2 text-gray-400"/>{msg.email}</a>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center"><FiCalendar className="mr-1.5"/>{new Date(msg.receivedAt).toLocaleString()}</p>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 bg-gray-100 p-3 rounded-md">{msg.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ContactListPage;
