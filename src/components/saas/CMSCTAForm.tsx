import React, { useState, useEffect } from 'react';
import { SaasCallToAction } from '../../types';
import Input from '../common/Input';
import RichTextEditor from '../common/RichTextEditor';

interface CMSCTAFormProps {
    cta: SaasCallToAction;
    onUpdate: (cta: SaasCallToAction) => void;
}

const CMSCTAForm: React.FC<CMSCTAFormProps> = ({ cta, onUpdate }) => {
    const [localCta, setLocalCta] = useState(cta);

    useEffect(() => {
        setLocalCta(cta);
    }, [cta]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const updatedCta = { ...localCta, [name]: value };
        setLocalCta(updatedCta);
        onUpdate(updatedCta);
    };

    const handleSubtitleChange = (html: string) => {
        const updatedCta = { ...localCta, subtitle: html };
        setLocalCta(updatedCta);
        onUpdate(updatedCta);
    };

    return (
        <div className="space-y-4 p-4">
            <Input label="Title" name="title" value={localCta.title} onChange={handleChange} />
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <RichTextEditor
                    value={localCta.subtitle}
                    onChange={handleSubtitleChange}
                    placeholder="Explain your value proposition..."
                />
            </div>
            <Input label="Button Text" name="buttonText" value={localCta.buttonText} onChange={handleChange} />
        </div>
    );
};

export default CMSCTAForm;
