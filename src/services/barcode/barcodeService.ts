import JsBarcode from 'jsbarcode';
// @ts-ignore
import QRCode from 'qrcode';

export interface BarcodeData {
  id: string;
  sku: string;
  productName: string;
  quantity: number;
  batchNumber?: string;
  expiryDate?: Date;
  manufacturingDate?: Date;
}

export interface ScanResult {
  barcode: string;
  timestamp: Date;
  type: 'barcode' | 'qrcode';
  data?: BarcodeData;
}

/**
 * Generate barcode for a product
 */
export const generateBarcode = async (
  data: string,
  elementId: string,
  options?: {
    format?: string;
    width?: number;
    height?: number;
    displayValue?: boolean;
  }
): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id ${elementId} not found`);
    }

    const defaultOptions = {
      format: 'CODE128',
      width: 2,
      height: 100,
      displayValue: true,
      ...options,
    };

    JsBarcode(element, data, defaultOptions);
  } catch (error) {
    console.error('Error generating barcode:', error);
    throw error;
  }
};

/**
 * Generate QR code for a product
 */
export const generateQRCode = async (
  data: BarcodeData | string,
  options?: {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }
): Promise<string> => {
  try {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);

    const defaultOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      ...options,
    };

    const qrCodeDataUrl = await QRCode.toDataURL(dataString, defaultOptions);
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

/**
 * Download barcode as image
 */
export const downloadBarcode = (
  elementId: string,
  fileName: string = 'barcode.png'
): void => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id ${elementId} not found`);
    }

    const svg = element.querySelector('svg');
    if (!svg) {
      throw new Error('SVG element not found');
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = fileName;
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  } catch (error) {
    console.error('Error downloading barcode:', error);
    throw error;
  }
};

/**
 * Download QR code as image
 */
export const downloadQRCode = async (
  qrCodeDataUrl: string,
  fileName: string = 'qrcode.png'
): Promise<void> => {
  try {
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = fileName;
    link.click();
  } catch (error) {
    console.error('Error downloading QR code:', error);
    throw error;
  }
};

/**
 * Parse barcode data
 */
export const parseBarcodeData = (barcodeString: string): BarcodeData | null => {
  try {
    // Try to parse as JSON (for QR codes)
    try {
      return JSON.parse(barcodeString);
    } catch {
      // If not JSON, treat as simple SKU
      return {
        id: '',
        sku: barcodeString,
        productName: '',
        quantity: 0,
      };
    }
  } catch (error) {
    console.error('Error parsing barcode data:', error);
    return null;
  }
};

/**
 * Validate barcode format
 */
export const validateBarcode = (barcode: string): boolean => {
  // Basic validation - can be extended based on specific requirements
  if (!barcode || barcode.trim().length === 0) {
    return false;
  }

  // Check for valid barcode length (typically 8-18 digits for CODE128)
  if (!/^\d{8,18}$/.test(barcode)) {
    return false;
  }

  return true;
};

/**
 * Generate SKU from product details
 */
export const generateSKU = (
  productCode: string,
  categoryCode: string,
  sequenceNumber: number
): string => {
  const paddedSequence = sequenceNumber.toString().padStart(4, '0');
  return `${productCode}-${categoryCode}-${paddedSequence}`;
};

/**
 * Create barcode data object
 */
export const createBarcodeData = (
  id: string,
  sku: string,
  productName: string,
  quantity: number,
  batchNumber?: string,
  expiryDate?: Date,
  manufacturingDate?: Date
): BarcodeData => {
  return {
    id,
    sku,
    productName,
    quantity,
    batchNumber,
    expiryDate,
    manufacturingDate,
  };
};

/**
 * Format barcode for display
 */
export const formatBarcodeForDisplay = (barcode: string): string => {
  // Add spaces every 4 characters for readability
  return barcode.replace(/(.{4})/g, '$1 ').trim();
};

/**
 * Generate batch barcode
 */
export const generateBatchBarcode = (
  productId: string,
  batchNumber: string,
  quantity: number
): string => {
  const timestamp = Date.now().toString().slice(-6);
  return `${productId}-${batchNumber}-${quantity}-${timestamp}`;
};

/**
 * Scan history management
 */
export interface ScanHistory {
  scans: ScanResult[];
  addScan: (scan: ScanResult) => void;
  clearHistory: () => void;
  getRecentScans: (limit: number) => ScanResult[];
}

export const createScanHistory = (): ScanHistory => {
  const scans: ScanResult[] = [];

  return {
    scans,
    addScan: (scan: ScanResult) => {
      scans.unshift(scan);
      // Keep only last 100 scans in memory
      if (scans.length > 100) {
        scans.pop();
      }
    },
    clearHistory: () => {
      scans.length = 0;
    },
    getRecentScans: (limit: number) => {
      return scans.slice(0, limit);
    },
  };
};

/**
 * Export scan history to CSV
 */
export const exportScanHistoryToCSV = (scans: ScanResult[]): string => {
  const headers = ['Barcode', 'Type', 'Timestamp', 'Product Name', 'Quantity'];
  const rows = scans.map((scan) => [
    scan.barcode,
    scan.type,
    scan.timestamp.toISOString(),
    scan.data?.productName || '',
    scan.data?.quantity || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
};

/**
 * Download scan history as CSV
 */
export const downloadScanHistoryAsCSV = (
  scans: ScanResult[],
  fileName: string = 'scan_history.csv'
): void => {
  try {
    const csvContent = exportScanHistoryToCSV(scans);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading scan history:', error);
    throw error;
  }
};
