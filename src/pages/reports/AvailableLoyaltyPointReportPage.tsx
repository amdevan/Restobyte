
import React from 'react';
import FeatureRequirementPage from '@/components/common/FeatureRequirementPage';

const AvailableLoyaltyPointReportPage: React.FC = () => {
    return (
        <FeatureRequirementPage
            title="Available Loyalty Point Report"
            featureName="Customer Loyalty Program"
            featureDescription="This feature allows you to define rules for earning and redeeming loyalty points. It tracks each customer's point balance, including points earned from sales and points redeemed for rewards."
            requiredFor="Loyalty Point Reports"
            backPath="/app/report" backButtonText="Back to Dashboard"
        />
    );
};
export default AvailableLoyaltyPointReportPage;