import { createContext, useContext } from 'react';
import type { Currency, ApplicationSettings, WebsiteSettings } from '../types';

interface AppDataContextType {
    currencies: Currency[];
    applicationSettings: ApplicationSettings;
    websiteSettings: WebsiteSettings;
}

export const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const useAppData = () => {
    const context = useContext(AppDataContext);
    if (context === undefined) {
        throw new Error('useAppData must be used within an AppDataProvider');
    }
    return context;
};
