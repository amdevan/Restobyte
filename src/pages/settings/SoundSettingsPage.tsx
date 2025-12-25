import React, { useState, useEffect } from 'react';
import Card from '@/components/common/Card';
import { FiVolume2, FiVolumeX, FiCheckCircle } from 'react-icons/fi';

const SOUND_SETTINGS_KEY = 'restoByteSoundSettings';

const SoundSettingsPage: React.FC = () => {
    const [soundsEnabled, setSoundsEnabled] = useState(() => {
        try {
            const saved = localStorage.getItem(SOUND_SETTINGS_KEY);
            if (saved) {
                return JSON.parse(saved).soundsEnabled;
            }
        } catch (e) {
            console.error("Could not parse sound settings", e);
        }
        return true; // Default to enabled
    });
    const [showSavedMessage, setShowSavedMessage] = useState(false);

    useEffect(() => {
        try {
            localStorage.setItem(SOUND_SETTINGS_KEY, JSON.stringify({ soundsEnabled }));
        } catch (e) {
            console.error("Could not save sound settings", e);
        }
    }, [soundsEnabled]);

    const handleToggle = () => {
        setSoundsEnabled(prev => !prev);
        setShowSavedMessage(true);
        setTimeout(() => setShowSavedMessage(false), 2500);
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <Card title="Sound Settings" icon={soundsEnabled ? <FiVolume2 /> : <FiVolumeX />}>
                <div className="p-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium text-gray-800">Application Sounds</h3>
                            <p className="text-sm text-gray-500 mt-1 max-w-md">
                                Enable or disable all audible notifications, such as POS action sounds and assistance request alerts.
                            </p>
                        </div>
                        
                        <button
                            onClick={handleToggle}
                            role="switch"
                            aria-checked={soundsEnabled}
                            className={`relative inline-flex items-center h-7 w-14 rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 ${
                                soundsEnabled ? 'bg-sky-600' : 'bg-gray-300'
                            }`}
                        >
                            <span
                                className={`inline-block w-6 h-6 transform bg-white rounded-full transition-transform duration-300 ease-in-out ${
                                    soundsEnabled ? 'translate-x-8' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>
                    
                    <div className="mt-4 h-6">
                        {showSavedMessage && (
                            <div className="flex items-center text-green-600 transition-opacity duration-300 ease-in-out opacity-100">
                                <FiCheckCircle size={16} className="mr-2" />
                                <span className="text-sm font-medium">Settings saved!</span>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default SoundSettingsPage;