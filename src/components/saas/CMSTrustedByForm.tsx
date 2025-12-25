import React, { useState, useEffect } from 'react';
import { SaasTrustedByLogo } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

interface CMSTrustedByFormProps {
    logos: SaasTrustedByLogo[];
    onUpdate: (logos: SaasTrustedByLogo[]) => void;
}

const CMSTrustedByForm: React.FC<CMSTrustedByFormProps> = ({ logos, onUpdate }) => {
    const [localLogos, setLocalLogos] = useState(logos);

    useEffect(() => {
        setLocalLogos(logos);
    }, [logos]);

    const updateLogos = (updatedLogos: SaasTrustedByLogo[]) => {
        setLocalLogos(updatedLogos);
        onUpdate(updatedLogos);
    };

    const handleChange = (id: string, field: keyof Omit<SaasTrustedByLogo, 'id'>, value: string) => {
        updateLogos(localLogos.map(logo => logo.id === id ? { ...logo, [field]: value } : logo));
    };

    const handleAddLogo = () => {
        const newLogo: SaasTrustedByLogo = { id: `new-${Date.now()}`, name: '', logoUrl: '' };
        updateLogos([...localLogos, newLogo]);
    };

    const handleRemoveLogo = (id: string) => {
        updateLogos(localLogos.filter(logo => logo.id !== id));
    };

    return (
        <div className="space-y-4 p-4">
            {localLogos.map(logo => (
                <div key={logo.id} className="grid grid-cols-12 gap-4 p-3 border rounded-lg items-center">
                    <div className="col-span-5"><Input label="Company Name" value={logo.name} onChange={e => handleChange(logo.id, 'name', e.target.value)} containerClassName="mb-0"/></div>
                    <div className="col-span-6"><Input label="Logo URL" value={logo.logoUrl} onChange={e => handleChange(logo.id, 'logoUrl', e.target.value)} containerClassName="mb-0"/></div>
                    <div className="col-span-1 flex items-end">
                        <Button variant="danger" size="sm" onClick={() => handleRemoveLogo(logo.id)} className="w-full"><FiTrash2/></Button>
                    </div>
                </div>
            ))}
            <Button onClick={handleAddLogo} leftIcon={<FiPlus/>}>Add Logo</Button>
        </div>
    );
};

export default CMSTrustedByForm;
