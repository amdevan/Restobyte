
import React from 'react';
import Card from '@/components/common/Card';
import { FiDollarSign, FiCheckCircle } from 'react-icons/fi';

const PricingFeatureItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="flex items-center space-x-3 py-2">
    <FiCheckCircle className="text-red-500 w-5 h-5 flex-shrink-0" />
    <span className="text-gray-700">{children}</span>
  </li>
);

const PricingPage: React.FC = () => {
  const features = [
    "Different Price for Dine-in, Take Away and Delivery",
    "Cost Calculation Based on Recipe to Help Setting Price",
    "Outlet Wise Different Price (For Multi Outlet)",
    "Different Price for Different Delivery Aggregator"
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        {/* Using FiDollarSign as a placeholder for the custom icon */}
        <FiDollarSign size={40} className="text-sky-600" />
        <h1 className="text-3xl font-bold text-gray-800">Item Pricing</h1>
      </div>

      <Card className="shadow-xl">
        <div className="p-6 sm:p-8">
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <PricingFeatureItem key={index}>{feature}</PricingFeatureItem>
            ))}
          </ul>
        </div>
      </Card>
      
      <Card title="Configuration (Coming Soon)">
        <p className="text-gray-600">
          Advanced pricing rules and configurations will be available here. 
          This section will allow you to define specific pricing strategies for your menu items based on order type, cost, outlet, and delivery partners.
        </p>
      </Card>
    </div>
  );
};

export default PricingPage;
