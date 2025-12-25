import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from './Card';
import Button from './Button';
import { FiSlash, FiArrowLeft, FiFilter } from 'react-icons/fi';

interface FeatureDisabledPageProps {
    type: 'feature' | 'selectOutlet';
    featureName: string;
    reason?: string;
    backPath?: string;
}

const FeatureDisabledPage: React.FC<FeatureDisabledPageProps> = ({ type, featureName, reason, backPath = '/app/home' }) => {
    const navigate = useNavigate();

    const content = {
        feature: {
            icon: <FiSlash size={48} className="mx-auto text-red-500 mb-4" />,
            title: `${featureName} is Not Available`,
            description: reason || 'This feature is currently disabled.'
        },
        selectOutlet: {
            icon: <FiFilter size={48} className="mx-auto text-sky-500 mb-4" />,
            title: `Select a Single Outlet`,
            description: `To manage ${featureName.toLowerCase()}, please select a single outlet from the selector in the header.`
        }
    };

    const currentContent = content[type];

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <Card>
                <div className="p-8 text-center">
                    {currentContent.icon}
                    <h2 className="text-xl font-semibold text-gray-800">{currentContent.title}</h2>
                    <p className="text-gray-600 mt-2 max-w-lg mx-auto">
                        {currentContent.description}
                    </p>
                    <Button onClick={() => navigate(backPath)} className="mt-6" leftIcon={<FiArrowLeft />}>
                        Go Back
                    </Button>
                </div>
            </Card>
        </div>
    );
}

export default FeatureDisabledPage;