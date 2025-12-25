

import React from 'react';
// FIX: Refactored to use named imports for react-router-dom for consistency.
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import { FiArrowLeft } from 'react-icons/fi';
import DownloadReportButton from './DownloadReportButton';

interface PlaceholderPageProps {
  title: string;
  backPath?: string;
  backButtonText?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, backPath, backButtonText }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  const handleDownload = (format: 'PDF' | 'Excel' | 'CSV') => {
    alert(`Downloading ${title} report as ${format}... (This is a simulation)`);
  };

  const buttonIcon = backPath ? <FiArrowLeft /> : undefined;
  const isReportPage = backPath === '/app/report';

  return (
    <div className="p-6 bg-white rounded-lg shadow-md m-4">
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-2xl font-semibold text-gray-700">{title}</h1>
        {isReportPage && (
          <div className="flex items-center space-x-2">
            <DownloadReportButton onDownload={handleDownload} />
            <Button onClick={handleBack} variant="outline" leftIcon={buttonIcon}>
                {backButtonText || 'Go Back'}
            </Button>
          </div>
        )}
      </div>
      <p className="mt-2 text-gray-500">This is a placeholder page for {title}. Content will be added soon.</p>
      {!isReportPage && (
        <Button onClick={handleBack} className="mt-4" leftIcon={buttonIcon} variant={backPath ? 'outline' : 'primary'}>
          {backButtonText || 'Go Back'}
        </Button>
      )}
    </div>
  );
};

export default PlaceholderPage;