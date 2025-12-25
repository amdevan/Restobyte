
import React from 'react';
import FeatureRequirementPage from '@/components/common/FeatureRequirementPage';

const ConsumptionReportPage: React.FC = () => {
    return (
        <FeatureRequirementPage
            title="Consumption Report"
            featureName="Recipe Management"
            featureDescription="This feature allows you to link stock items as ingredients to your menu items. For example, specifying that one 'Margherita Pizza' uses 150g of Flour, 100g of Tomato Sauce, and 50g of Cheese."
            requiredFor="Consumption Report"
            backPath="/app/report" backButtonText="Back to Dashboard"
        />
    );
};

export default ConsumptionReportPage;