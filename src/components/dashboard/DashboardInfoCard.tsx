
import React from 'react';
import Card from '../common/Card';
import { IconBaseProps } from 'react-icons';

interface DataPoint {
    label: string;
    value: number;
}

interface DashboardInfoCardProps {
    title: string;
    icon: React.ReactElement<IconBaseProps>;
    data: DataPoint[];
    unit: string;
}

const DashboardInfoCard: React.FC<DashboardInfoCardProps> = ({ title, icon, data, unit }) => {
    if (!data || data.length === 0) {
        return (
            <Card title={title} icon={icon}>
                <p className="text-center text-gray-500 py-6">No data available.</p>
            </Card>
        );
    }

    const maxValue = Math.max(...data.map(item => item.value), 0);

    return (
        <Card title={title} icon={icon} className="shadow-lg">
            <div className="space-y-3">
                {data.map((item, index) => (
                    <div key={item.label + index} className="p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-700 truncate" title={item.label}>
                                {item.label}
                            </span>
                            <span className="text-xs font-semibold text-sky-600 bg-sky-100 px-1.5 py-0.5 rounded-full">
                                {item.value} {unit}
                            </span>
                        </div>
                        {maxValue > 0 && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                    className="bg-sky-500 h-1.5 rounded-full"
                                    style={{ width: `${(item.value / maxValue) * 100}%` }}
                                    title={`Value: ${item.value}`}
                                ></div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default DashboardInfoCard;
