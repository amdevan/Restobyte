
import React from 'react';
import FeatureRequirementPage from '@/components/common/FeatureRequirementPage';

const ProductionReportPage: React.FC = () => {
    return (
        <FeatureRequirementPage
            title="Production Report"
            featureName="Production & Pre-Made Food Management"
            featureDescription="This feature allows you to record the production of pre-made food items from stock ingredients. For example, recording that 10 portions of 'Lasagna' were made, which would consume the necessary ingredients from stock."
            requiredFor="Production Report"
            backPath="/app/report"
        />
    );
};
export default ProductionReportPage;