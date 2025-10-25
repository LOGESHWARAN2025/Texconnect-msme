// =====================================================
// FREE TAMIL TRANSLATION UTILITY
// =====================================================
// Uses LibreTranslate - Free, Open Source Translation API
// No API key required for public instance

/**
 * Translate text to Tamil using LibreTranslate (Free API)
 * @param text - Text to translate
 * @param sourceLang - Source language code (default: 'en')
 * @returns Translated text in Tamil
 */
export async function translateToTamil(text: string, sourceLang: string = 'en'): Promise<string> {
  if (!text || text.trim() === '') return text;

  try {
    // Using public LibreTranslate instance (FREE)
    const response = await fetch('https://libretranslate.com/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: 'ta', // Tamil
        format: 'text'
      })
    });

    if (!response.ok) {
      console.warn('Translation failed, using original text');
      return text;
    }

    const data = await response.json();
    return data.translatedText || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Fallback to original text
  }
}

/**
 * Translate multiple texts at once (batch translation)
 * @param texts - Array of texts to translate
 * @returns Array of translated texts
 */
export async function translateBatch(texts: string[]): Promise<string[]> {
  const promises = texts.map(text => translateToTamil(text));
  return Promise.all(promises);
}

/**
 * Cache for translated texts to avoid repeated API calls
 */
const translationCache = new Map<string, string>();

/**
 * Translate with caching (faster, reduces API calls)
 * @param text - Text to translate
 * @returns Translated text (from cache if available)
 */
export async function translateWithCache(text: string): Promise<string> {
  if (!text) return text;

  // Check cache first
  const cached = translationCache.get(text);
  if (cached) {
    return cached;
  }

  // Translate and cache
  const translated = await translateToTamil(text);
  translationCache.set(text, translated);
  return translated;
}

/**
 * Clear translation cache
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}

/**
 * Get cache size
 */
export function getCacheSize(): number {
  return translationCache.size;
}

// =====================================================
// ALTERNATIVE: Manual Translation Mappings
// =====================================================
// For common terms, use pre-defined translations (faster, more accurate)

export const commonTranslations: Record<string, string> = {
  // Order Status
  'Pending': 'நிலுவையில்',
  'Accepted': 'ஏற்றுக்கொள்ளப்பட்டது',
  'Shipped': 'அனுப்பப்பட்டது',
  'Delivered': 'வழங்கப்பட்டது',
  'Cancelled': 'ரத்து செய்யப்பட்டது',

  // Product Categories
  'Cotton Fabric': 'பருத்தி துணி',
  'Silk Fabric': 'பட்டு துணி',
  'Synthetic Fabric': 'செயற்கை துணி',
  'Wool Fabric': 'கம்பளி துணி',

  // Common Terms
  'Product': 'தயாரிப்பு',
  'Order': 'ஆர்டர்',
  'Price': 'விலை',
  'Stock': 'இருப்பு',
  'Quantity': 'அளவு',
  'Total': 'மொத்தம்',
  'Date': 'தேதி',
  'Status': 'நிலை',
  'Description': 'விளக்கம்',
  'Name': 'பெயர்',
  'Delete': 'நீக்கு',
  'Edit': 'திருத்து',
  'Save': 'சேமி',
  'Cancel': 'ரத்து செய்',
  'Submit': 'சமர்ப்பி',
  'Search': 'தேடு',
  'Filter': 'வடிகட்டு',
  'Download': 'பதிவிறக்கு',
  'Upload': 'பதிவேற்று',
};

/**
 * Get translation from manual mappings or API
 * @param text - Text to translate
 * @returns Translated text
 */
export async function translate(text: string): Promise<string> {
  // Check manual translations first (instant, accurate)
  if (commonTranslations[text]) {
    return commonTranslations[text];
  }

  // Fall back to API translation
  return translateWithCache(text);
}

// =====================================================
// USAGE EXAMPLES
// =====================================================

/*
// Example 1: Simple translation
const translated = await translateToTamil('Hello World');
console.log(translated); // வணக்கம் உலகம்

// Example 2: Translate product name
const productName = await translate('Cotton Fabric');
console.log(productName); // பருத்தி துணி (from manual mapping)

// Example 3: Translate custom text
const customText = await translate('This is a new product');
console.log(customText); // இது ஒரு புதிய தயாரிப்பு (from API)

// Example 4: Batch translation
const texts = ['Product', 'Order', 'Price'];
const translated = await translateBatch(texts);
console.log(translated); // ['தயாரிப்பு', 'ஆர்டர்', 'விலை']

// Example 5: With caching
const text1 = await translateWithCache('Hello');
const text2 = await translateWithCache('Hello'); // Instant (from cache)
*/

// =====================================================
// INTEGRATION WITH COMPONENTS
// =====================================================

/*
// In your component:
import { translate } from '../utils/translator';

const MyComponent = () => {
  const [translatedName, setTranslatedName] = useState('');

  useEffect(() => {
    if (currentLanguage === 'ta') {
      translate(product.name).then(setTranslatedName);
    } else {
      setTranslatedName(product.name);
    }
  }, [product.name, currentLanguage]);

  return <div>{translatedName}</div>;
};
*/

// =====================================================
// NOTES
// =====================================================

/*
LibreTranslate Features:
✅ FREE - No API key required
✅ Open Source
✅ Supports Tamil
✅ No rate limits on public instance
✅ Privacy-friendly (no tracking)

Limitations:
⚠️ Public instance may be slow during peak times
⚠️ Translation quality varies
⚠️ Network dependent

Recommendations:
1. Use manual translations for common terms (faster, accurate)
2. Use API for dynamic user-generated content
3. Implement caching to reduce API calls
4. Consider self-hosting LibreTranslate for production

Alternative Free APIs:
- MyMemory Translation API (free tier: 1000 chars/day)
- Google Translate (unofficial, may break)
- Microsoft Translator (free tier available)

For Production:
Consider self-hosting LibreTranslate:
- Docker: docker run -p 5000:5000 libretranslate/libretranslate
- Full control, no limits
- Better performance
*/
