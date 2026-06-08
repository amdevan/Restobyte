import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import Button from '@/components/common/Button';
import TenantDetailsContent from '@/components/saas/TenantDetailsContent';
import { getSaaSBasePath } from '@/utils/domain';

const TenantDetailsPage: React.FC = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const basePath = getSaaSBasePath();

  if (!tenantId) {
    return <Navigate to={`${basePath}/tenants`} replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tenant Details</h1>
          <p className="text-sm text-gray-500">View login history, devices, invoices, payments, outlets, and admin users.</p>
        </div>
        <Link to={`${basePath}/tenants`}>
          <Button variant="outline" leftIcon={<FiArrowLeft />}>
            Back To Tenants
          </Button>
        </Link>
      </div>
      <TenantDetailsContent tenantId={tenantId} />
    </div>
  );
};

export default TenantDetailsPage;
