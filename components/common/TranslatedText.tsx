import React from 'react';
import { useTranslate } from '../../hooks/useTranslator';

interface TranslatedTextProps {
    text: string;
    className?: string;
    as?: any; // To render as p, h1, etc.
}

export const TranslatedText: React.FC<TranslatedTextProps> = ({ text, className, as: Component = 'span' }) => {
    const translated = useTranslate(text);
    return <Component className={className}>{translated}</Component>;
};
