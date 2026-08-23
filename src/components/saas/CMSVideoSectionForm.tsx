import React, { useState, useEffect } from 'react';
import { SaasVideoSection } from '../../types';
import Input from '../common/Input';

interface CMSVideoSectionFormProps {
    videoSection: SaasVideoSection;
    onUpdate: (videoSection: SaasVideoSection) => void;
}

const CMSVideoSectionForm: React.FC<CMSVideoSectionFormProps> = ({ videoSection, onUpdate }) => {
    const [local, setLocal] = useState(videoSection);

    useEffect(() => {
        setLocal(videoSection);
    }, [videoSection]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const updated = { ...local, [name]: value };
        setLocal(updated);
        onUpdate(updated);
    };

    return (
        <div className="space-y-4 p-4">
            <Input label="Title" name="title" value={local.title} onChange={handleChange} placeholder="See RestoByte in Action" />
            <Input label="Subtitle" name="subtitle" value={local.subtitle} onChange={handleChange} placeholder="Watch how our platform transforms restaurant operations" />
            <Input label="Background Image URL" name="imageUrl" value={local.imageUrl} onChange={handleChange} placeholder="https://images.unsplash.com/..." />
            <Input label="Video URL (optional)" name="videoUrl" value={local.videoUrl || ''} onChange={handleChange} placeholder="https://youtube.com/watch?v=..." />
        </div>
    );
};

export default CMSVideoSectionForm;
