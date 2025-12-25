
import React from 'react';
import FeatureRequirementPage from '@/components/common/FeatureRequirementPage';

const AuditLogReportPage: React.FC = () => {
    return (
        <FeatureRequirementPage
            title="Audit Log Report"
            featureName="User Activity Logging"
            featureDescription="This feature records important actions performed by users, such as creating, updating, or deleting items, changing settings, and processing payments. Each log entry includes the action, the user who performed it, and a timestamp."
            requiredFor="Audit Log Report"
            backPath="/app/report" backButtonText="Back to Dashboard"
        />
    );
};
export default AuditLogReportPage;