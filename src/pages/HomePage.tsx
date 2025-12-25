


import React from 'react';
// FIX: Refactored to use named imports for react-router-dom for consistency.
import { Link } from 'react-router-dom';
import WelcomeCard from '@/components/dashboard/WelcomeCard';
import AtAGlanceCard from '@/components/dashboard/AtAGlanceCard';
import UpcomingReservationsCard from '@/components/dashboard/UpcomingReservationsCard';
import Card from '@/components/common/Card';
import { FiShoppingCart, FiList, FiGrid, FiSettings, FiArrowRight, FiGlobe } from 'react-icons/fi';
import { useRestaurantData } from '../hooks/useRestaurantData';
import { API_BASE_URL } from '../config';


interface IconProps {
    size?: string | number;
    className?: string;
}

interface QuickLinkProps {
    to: string;
    icon: React.ReactElement<IconProps>;
    title: string;
    description: string;
    bgColorClass: string;
    textColorClass: string;
}

const QuickLink: React.FC<QuickLinkProps> = ({ to, icon, title, description, bgColorClass, textColorClass }) => (
    <Link to={to} className={`group flex items-start p-4 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${bgColorClass}`}>
        <div className={`p-3 rounded-lg mr-4 ${textColorClass} bg-white/30 transition-transform duration-300 group-hover:scale-110`}>
            {React.cloneElement(icon, { size: 24 })}
        </div>
        <div>
            <h3 className="font-bold text-gray-800">{title}</h3>
            <p className="text-xs text-gray-600 mt-1">{description}</p>
        </div>
        <FiArrowRight className="ml-auto text-gray-400 self-center transition-transform group-hover:translate-x-1" />
    </Link>
);


const HomePage: React.FC = () => {
    const { getSingleActiveOutlet } = useRestaurantData();
    const singleActiveOutlet = getSingleActiveOutlet();
    const isCloudKitchen = singleActiveOutlet?.outletType === 'CloudKitchen';
    const isAggregateView = !singleActiveOutlet;
    const [message, setMessage] = React.useState('');

    const fetchHello = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/hello`);
            const data = await response.json();
            setMessage(data.message);
        } catch (error) {
            console.error('Error fetching hello:', error);
            setMessage('Failed to fetch message.');
        }
    };


    return (
        <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-full">
            <WelcomeCard />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-6">
                    <Card title="Quick Actions">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <QuickLink 
                                to="/app/panel/pos"
                                icon={<FiShoppingCart />}
                                title="Point of Sale"
                                description="Start a new sale or manage existing orders."
                                bgColorClass="bg-green-100"
                                textColorClass="text-green-600"
                           />
                           <QuickLink 
                                to="/app/website-public"
                                icon={<FiGlobe />}
                                title="Website Public"
                                description="Preview your public website content."
                                bgColorClass="bg-teal-100"
                                textColorClass="text-teal-600"
                           />
                           {!isCloudKitchen && !isAggregateView && (
                                <QuickLink 
                                    to="/app/tables"
                                    icon={<FiGrid />}
                                    title="Table Management"
                                    description="View and update the status of all tables."
                                    bgColorClass="bg-blue-100"
                                    textColorClass="text-blue-600"
                                />
                           )}
                           <QuickLink 
                                to="/app/menu"
                                icon={<FiList />}
                                title="Menu Management"
                                description="Add, edit, or remove menu items."
                                bgColorClass="bg-purple-100"
                                textColorClass="text-purple-600"
                           />
                            <QuickLink 
                                to="/app/settings/app-settings"
                                icon={<FiSettings />}
                                title="Global Settings"
                                description="Configure application, outlets, and users."
                                bgColorClass="bg-gray-200"
                                textColorClass="text-gray-700"
                           />
                           <QuickLink 
                                to="/public/restaurant"
                                icon={<FiGlobe />}
                                title="Restaurant Website"
                                description="View your public menu and homepage."
                                bgColorClass="bg-amber-100"
                                textColorClass="text-amber-600"
                           />
                       </div>
                    </Card>
                    <Card title="API Test">
                        <div className="p-4">
                            <button 
                                onClick={fetchHello}
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Fetch Hello
                            </button>
                            {message && <p className="mt-4 text-gray-800">{message}</p>}
                        </div>
                    </Card>
                </div>

                {/* Right Sidebar Column */}
                <div className="lg:col-span-1 space-y-6">
                    <AtAGlanceCard />
                    {!isCloudKitchen && !isAggregateView && <UpcomingReservationsCard />}
                </div>
            </div>
        </div>
    );
};

export default HomePage;
