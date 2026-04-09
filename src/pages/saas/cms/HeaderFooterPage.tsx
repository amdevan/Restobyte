

import React, { useState, useEffect } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { SaasWebsiteContent } from '@/types';
import CMSHeaderForm from '@/components/saas/CMSHeaderForm';
import CMSFooterForm from '@/components/saas/CMSFooterForm';
import { FiSave, FiCheckCircle, FiRefreshCcw } from 'react-icons/fi';

const HeaderFooterPage: React.FC = () => {
    const { saasWebsiteContent, updateSaasWebsiteContent, fetchSaasWebsiteContent } = useRestaurantData();
    const [localHeader, setLocalHeader] = useState(saasWebsiteContent.header);
    const [localFooter, setLocalFooter] = useState(saasWebsiteContent.footer);
    const [showSavedMessage, setShowSavedMessage] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        setLocalHeader(saasWebsiteContent.header);
        setLocalFooter(saasWebsiteContent.footer);
    }, [saasWebsiteContent]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchSaasWebsiteContent();
        setIsRefreshing(false);
    };

    const handleSave = () => {
        updateSaasWebsiteContent(prev => ({
            ...prev,
            header: localHeader,
            footer: localFooter,
        }));
        setShowSavedMessage(true);
        setTimeout(() => setShowSavedMessage(false), 2500);
    };

    const isDirty = JSON.stringify(localHeader) !== JSON.stringify(saasWebsiteContent.header) || 
                    JSON.stringify(localFooter) !== JSON.stringify(saasWebsiteContent.footer);
    
    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-gray-800">Header & Footer Management</h1>
                <div className="flex items-center space-x-3">
                    <Button 
                        variant="secondary" 
                        onClick={handleRefresh} 
                        disabled={isRefreshing}
                        leftIcon={<FiRefreshCcw className={isRefreshing ? 'animate-spin' : ''}/>}
                    >
                        {isRefreshing ? 'Refreshing...' : 'Refresh from Server'}
                    </Button>
                    {showSavedMessage && <span className="text-green-600 flex items-center text-sm"><FiCheckCircle className="mr-1.5"/>Saved!</span>}
                    <Button onClick={handleSave} disabled={!isDirty} leftIcon={<FiSave/>}>
                        Save All Changes
                    </Button>
                </div>
            </div>

            <Card title="Header Configuration">
                <CMSHeaderForm 
                    header={localHeader}
                    onUpdate={setLocalHeader}
                />
            </Card>

            <Card title="Footer Configuration">
                <CMSFooterForm
                    footer={localFooter}
                    onUpdate={setLocalFooter}
                />
            </Card>
        </div>
    );
};

export default HeaderFooterPage;