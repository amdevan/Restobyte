
import React from 'react';

const Footer: React.FC = () => {
  const appVersion = process.env.APP_VERSION; 

  return (
    <footer className="bg-white text-gray-500 text-xs p-3 text-center flex-shrink-0 z-10 border-t">
      <div className="container mx-auto flex flex-wrap justify-between items-center gap-2 px-4">
        <span>&copy; {new Date().getFullYear()} RestoByte | Version: {appVersion}</span>
        <span className="font-medium">
          Powered By{' '}
          <a href="https://itrelevant.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-sky-600 hover:underline">
            IT Relevant Pvt. Ltd.
          </a>
        </span>
        <a href="mailto:support@itrelevant.com" className="hover:text-sky-600 hover:underline">
          Support
        </a>
      </div>
    </footer>
  );
};

export default Footer;