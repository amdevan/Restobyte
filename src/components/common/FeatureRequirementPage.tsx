import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from './Card';
import Button from './Button';
import { FiTool, FiArrowLeft } from 'react-icons/fi';

interface FeatureRequirementPageProps {
    title: string;
    featureName: string;
    featureDescription: string;
    requiredFor: string;
    backPath?: string;
    backButtonText?: string;
}

const FeatureRequirementPage: React.FC<FeatureRequirementPageProps> = ({ title, featureName, featureDescription, requiredFor, backPath = '/report', backButtonText }) => {
    const navigate = useNavigate();

    return (
        <div className="p-4 sm:p-6 space-y-6">
             <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">{title}</h1>
                <Button onClick={() => navigate(backPath)} variant="outline" leftIcon={<FiArrowLeft />}>
                    {backButtonText || 'Back to Dashboard'}
                </Button>
            </div>
            <Card>
                <div className="p-8 text-center">
                    <FiTool size={48} className="mx-auto text-amber-500 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-800">Feature Prerequisite</h2>
                    <p className="text-gray-600 mt-2 max-w-lg mx-auto">
                        To generate the <strong>{requiredFor}</strong>, the <strong>{featureName}</strong> feature is required.
                    </p>
                    <p className="text-sm text-gray-500 mt-4 max-w-lg mx-auto bg-gray-50 p-3 rounded-md">
                       <strong>Feature Description:</strong> {featureDescription}
                    </p>
                    <p className="mt-6 text-sm text-gray-500">This feature is not yet implemented. Once available, this report will become functional.</p>
                </div>
            </Card>
        </div>
    );
}

export default FeatureRequirementPage;