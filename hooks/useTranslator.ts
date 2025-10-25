import { useState, useEffect } from 'react';
import { translate, translateBatch } from '../utils/translator';
import { useLocalization } from './useLocalization';

/**
 * Hook for translating dynamic content (product names, usernames, etc.)
 * @param text - Text to translate
 * @returns Translated text
 */
export function useTranslate(text: string): string {
  const { language } = useLocalization();
  const [translated, setTranslated] = useState(text);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (language === 'ta' && text) {
      setIsLoading(true);
      translate(text)
        .then(setTranslated)
        .finally(() => setIsLoading(false));
    } else {
      setTranslated(text);
    }
  }, [text, language]);

  return isLoading ? text : translated; // Show original while loading
}

/**
 * Hook for translating multiple texts
 * @param texts - Array of texts to translate
 * @returns Array of translated texts
 */
export function useTranslateBatch(texts: string[]): string[] {
  const { language } = useLocalization();
  const [translated, setTranslated] = useState(texts);

  useEffect(() => {
    if (language === 'ta' && texts.length > 0) {
      translateBatch(texts).then(setTranslated);
    } else {
      setTranslated(texts);
    }
  }, [texts, language]);

  return translated;
}

/**
 * Hook for translating object properties
 * @param obj - Object with properties to translate
 * @param keys - Keys to translate
 * @returns Object with translated properties
 */
export function useTranslateObject<T extends Record<string, any>>(
  obj: T,
  keys: (keyof T)[]
): T {
  const { language } = useLocalization();
  const [translated, setTranslated] = useState(obj);

  useEffect(() => {
    if (language === 'ta' && obj) {
      const textsToTranslate = keys.map(key => String(obj[key]));
      translateBatch(textsToTranslate).then(translatedTexts => {
        const newObj = { ...obj };
        keys.forEach((key, index) => {
          newObj[key] = translatedTexts[index] as any;
        });
        setTranslated(newObj);
      });
    } else {
      setTranslated(obj);
    }
  }, [obj, keys, language]);

  return translated;
}

// =====================================================
// USAGE EXAMPLES
// =====================================================

/*
// Example 1: Translate product name
const ProductCard = ({ product }) => {
  const translatedName = useTranslate(product.name);
  const translatedDesc = useTranslate(product.description);

  return (
    <div>
      <h3>{translatedName}</h3>
      <p>{translatedDesc}</p>
    </div>
  );
};

// Example 2: Translate multiple items
const ProductList = ({ products }) => {
  const productNames = products.map(p => p.name);
  const translatedNames = useTranslateBatch(productNames);

  return (
    <ul>
      {translatedNames.map((name, i) => (
        <li key={i}>{name}</li>
      ))}
    </ul>
  );
};

// Example 3: Translate object properties
const OrderCard = ({ order }) => {
  const translatedOrder = useTranslateObject(order, ['status', 'buyerName']);

  return (
    <div>
      <p>Status: {translatedOrder.status}</p>
      <p>Buyer: {translatedOrder.buyerName}</p>
    </div>
  );
};
*/
