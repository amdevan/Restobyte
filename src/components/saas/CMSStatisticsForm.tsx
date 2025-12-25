import React, { useState, useEffect } from 'react';
import { SaasStatistic } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

interface CMSStatisticsFormProps {
    statistics: SaasStatistic[];
    onUpdate: (statistics: SaasStatistic[]) => void;
}

const CMSStatisticsForm: React.FC<CMSStatisticsFormProps> = ({ statistics, onUpdate }) => {
    const [localStats, setLocalStats] = useState(statistics);

    useEffect(() => {
        setLocalStats(statistics);
    }, [statistics]);

    const updateStats = (updatedStats: SaasStatistic[]) => {
        setLocalStats(updatedStats);
        onUpdate(updatedStats);
    };

    const handleChange = (id: string, field: keyof Omit<SaasStatistic, 'id'>, value: string) => {
        updateStats(localStats.map(stat => stat.id === id ? { ...stat, [field]: value } : stat));
    };

    const handleAddStat = () => {
        const newStat: SaasStatistic = { id: `new-${Date.now()}`, value: '0', label: '' };
        updateStats([...localStats, newStat]);
    };

    const handleRemoveStat = (id: string) => {
        updateStats(localStats.filter(stat => stat.id !== id));
    };

    return (
        <div className="space-y-4 p-4">
            {localStats.map(stat => (
                <div key={stat.id} className="grid grid-cols-12 gap-4 p-3 border rounded-lg items-center">
                    <div className="col-span-5"><Input label="Value" value={stat.value} onChange={e => handleChange(stat.id, 'value', e.target.value)} placeholder="e.g., 1M+" containerClassName="mb-0"/></div>
                    <div className="col-span-6"><Input label="Label" value={stat.label} onChange={e => handleChange(stat.id, 'label', e.target.value)} placeholder="e.g., Records Processed" containerClassName="mb-0"/></div>
                    <div className="col-span-1 flex items-end">
                        <Button variant="danger" size="sm" onClick={() => handleRemoveStat(stat.id)} className="w-full"><FiTrash2/></Button>
                    </div>
                </div>
            ))}
            <Button onClick={handleAddStat} leftIcon={<FiPlus/>}>Add Statistic</Button>
        </div>
    );
};

export default CMSStatisticsForm;
