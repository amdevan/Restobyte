

import React from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import Card from '@/components/common/Card';
import FeatureDisabledPage from '@/components/common/FeatureDisabledPage';
import { FiCheckCircle } from 'react-icons/fi';
import Button from '@/components/common/Button';
import { Plan } from '@/types';

const PlanCard: React.FC<{ plan: Plan; isCurrent: boolean; currentPrice: number; }> = ({ plan, isCurrent, currentPrice }) => {
    const isUpgrade = plan.price > currentPrice;
    const isDowngrade = plan.price < currentPrice;

    const getButton = () => {
        if (isCurrent) {
            return <Button variant="secondary" disabled className="w-full mt-8">Your Current Plan</Button>;
        }
        if (isUpgrade) {
            return <Button variant="primary" className="w-full mt-8">Upgrade to {plan.name}</Button>;
        }
        return <Button variant="outline" className="w-full mt-8">Downgrade to {plan.name}</Button>;
    };

    return (
        <div className={`relative flex flex-col rounded-xl border-2 p-8 shadow-sm transition-all h-full ${
            plan.isFeatured ? 'border-sky-500 bg-sky-50/50 shadow-lg' : 'bg-white border-gray-200'
        }`}>
            {plan.isFeatured && (
                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                    <span className="bg-sky-600 text-white text-xs font-semibold px-4 py-1 rounded-full uppercase tracking-wider">Most Popular</span>
                </div>
            )}
             {isCurrent && (
                <div className="absolute top-4 right-4">
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center">
                        <FiCheckCircle className="mr-1.5"/> Active Plan
                    </span>
                </div>
            )}

            <div className="flex-grow">
                <h3 className="text-2xl font-bold text-gray-800">{plan.name}</h3>
                <p className="mt-4">
                    <span className="text-4xl font-extrabold text-gray-900">${plan.price.toFixed(2)}</span>
                    <span className="text-gray-500">/{plan.period}</span>
                </p>
                <p className="mt-2 text-sm text-gray-500">Ideal for growing restaurants.</p>
                <ul className="mt-6 space-y-3">
                    {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                            <FiCheckCircle className="text-sky-500 mr-3 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="mt-auto">
                {getButton()}
            </div>
        </div>
    );
};


const SubscriptionPage: React.FC = () => {
    const { getSingleActiveOutlet, plans } = useRestaurantData();
    const outlet = getSingleActiveOutlet();

    if (!outlet) {
        return <FeatureDisabledPage type="selectOutlet" featureName="Subscription Details" />;
    }

    const currentPlanDetails = plans.find(p => p.name === outlet.plan);

    const publicPlans = plans.filter(p => p.isPublic).sort((a,b) => a.price - b.price);

    return (
        <div className="p-2 md:p-6 space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-extrabold text-gray-800">
                    Find the perfect plan
                </h1>
                <p className="mt-3 text-lg text-gray-500 max-w-2xl mx-auto">
                    Choose the plan that best fits your restaurant's needs. Upgrade or downgrade anytime.
                </p>
            </div>
            
             <Card>
                <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 rounded-lg">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">Your Current Subscription</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Status: <span className="font-semibold capitalize text-green-600">{outlet.subscriptionStatus}</span>
                            {outlet.planExpiryDate && (
                                <span className="ml-4">Renews/Expires on: <span className="font-semibold">{new Date(outlet.planExpiryDate).toLocaleDateString()}</span></span>
                            )}
                        </p>
                    </div>
                    <Button variant="secondary" size="sm" className="mt-3 md:mt-0">Manage Billing</Button>
                </div>
            </Card>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                {publicPlans.map(plan => (
                    <PlanCard
                        key={plan.id}
                        plan={plan}
                        isCurrent={plan.name === outlet.plan}
                        currentPrice={currentPlanDetails?.price || 0}
                    />
                ))}
            </div>
        </div>
    );
};

export default SubscriptionPage;