import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { FiSave, FiCheckCircle } from 'react-icons/fi';
import { IconBaseProps } from 'react-icons';

interface WebsiteSettingCardProps {
  title: string;
  icon: React.ReactElement<IconBaseProps>;
  children: React.ReactNode;
  onSave: () => void;
  isDirty: boolean;
  description?: string;
}

const WebsiteSettingCard: React.FC<WebsiteSettingCardProps> = ({ title, icon, children, onSave, isDirty, description }) => {
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  const handleSave = () => {
    onSave();
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 2500);
  };

  return (
    <Card>
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              {React.cloneElement(icon, { className: 'mr-3 text-sky-600' })}
              {title}
            </h2>
            {description && <p className="text-sm text-gray-500 mt-1 max-w-2xl">{description}</p>}
          </div>
          <div className="flex-shrink-0 flex items-center space-x-3 h-10">
            {showSavedMessage && (
              <div className="flex items-center text-green-600">
                <FiCheckCircle size={16} className="mr-1.5" />
                <span className="text-sm font-medium">Saved!</span>
              </div>
            )}
            <Button onClick={handleSave} leftIcon={<FiSave />} disabled={!isDirty}>
              Save Changes
            </Button>
          </div>
        </div>
        <div className="border-t pt-5">
          {children}
        </div>
      </div>
    </Card>
  );
};

export default WebsiteSettingCard;
