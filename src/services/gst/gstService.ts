/**
 * GST Integration Service
 * Handles GST calculations, invoice generation, and compliance tracking
 */

export interface GSTConfig {
  gstNumber: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
}

export interface GSTRate {
  category: string;
  rate: number; // 0, 5, 12, 18, 28
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  gstRate: number;
  amount: number;
  gstAmount: number;
  totalAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate?: Date;
  gstNumber: string;
  buyerName: string;
  buyerGST?: string;
  buyerAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  totalGST: number;
  totalAmount: number;
  notes?: string;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface GSTCompliance {
  id: string;
  period: string; // YYYY-MM format
  totalSales: number;
  totalGSTCollected: number;
  totalPurchases: number;
  totalGSTPaid: number;
  netGSTPayable: number;
  status: 'pending' | 'filed' | 'approved';
  filedDate?: Date;
}

class GSTService {
  private apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
  private gstRates: Map<string, number> = new Map([
    ['0%', 0],
    ['5%', 5],
    ['12%', 12],
    ['18%', 18],
    ['28%', 28],
  ]);

  /**
   * Validate GST number format
   */
  validateGSTNumber(gstNumber: string): boolean {
    // GST number format: 2 digits (state) + 10 digits (PAN) + 1 digit (entity) + 1 digit (check)
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gstNumber.toUpperCase());
  }

  /**
   * Calculate GST for an item
   */
  calculateItemGST(
    quantity: number,
    unitPrice: number,
    gstRate: number
  ): {
    amount: number;
    gstAmount: number;
    totalAmount: number;
  } {
    const amount = quantity * unitPrice;
    const gstAmount = (amount * gstRate) / 100;
    const totalAmount = amount + gstAmount;

    return {
      amount: Math.round(amount * 100) / 100,
      gstAmount: Math.round(gstAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  }

  /**
   * Calculate invoice totals
   */
  calculateInvoiceTotals(items: InvoiceItem[]): {
    subtotal: number;
    totalGST: number;
    totalAmount: number;
  } {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const totalGST = items.reduce((sum, item) => sum + item.gstAmount, 0);
    const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalGST: Math.round(totalGST * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  }

  /**
   * Create invoice
   */
  async createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/gst/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoice),
      });

      if (!response.ok) throw new Error('Failed to create invoice');
      return response.json();
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Get invoices
   */
  async getInvoices(filters?: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
    buyerName?: string;
  }): Promise<Invoice[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters?.buyerName) params.append('buyerName', filters.buyerName);

      const response = await fetch(`${this.apiBaseUrl}/api/gst/invoices?${params.toString()}`);

      if (!response.ok) throw new Error('Failed to fetch invoices');
      return response.json();
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id: string): Promise<Invoice> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/gst/invoices/${id}`);

      if (!response.ok) throw new Error('Failed to fetch invoice');
      return response.json();
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }
  }

  /**
   * Update invoice
   */
  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/gst/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update invoice');
      return response.json();
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  /**
   * Generate invoice PDF
   */
  async generateInvoicePDF(invoiceId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/gst/invoices/${invoiceId}/pdf`);

      if (!response.ok) throw new Error('Failed to generate invoice PDF');
      return response.blob();
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      throw error;
    }
  }

  /**
   * Download invoice PDF
   */
  async downloadInvoicePDF(invoiceId: string, fileName?: string): Promise<void> {
    try {
      const blob = await this.generateInvoicePDF(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `invoice_${invoiceId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice PDF:', error);
      throw error;
    }
  }

  /**
   * Get GST compliance report
   */
  async getGSTComplianceReport(period: string): Promise<GSTCompliance> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/gst/compliance/${period}`);

      if (!response.ok) throw new Error('Failed to fetch GST compliance report');
      return response.json();
    } catch (error) {
      console.error('Error fetching GST compliance report:', error);
      throw error;
    }
  }

  /**
   * Calculate GST liability
   */
  async calculateGSTLiability(period: string): Promise<{
    totalSales: number;
    totalGSTCollected: number;
    totalPurchases: number;
    totalGSTPaid: number;
    netGSTPayable: number;
  }> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/gst/calculate-liability?period=${period}`
      );

      if (!response.ok) throw new Error('Failed to calculate GST liability');
      return response.json();
    } catch (error) {
      console.error('Error calculating GST liability:', error);
      throw error;
    }
  }

  /**
   * Generate GST report (GSTR-1, GSTR-2, etc.)
   */
  async generateGSTReport(
    reportType: 'GSTR1' | 'GSTR2' | 'GSTR3' | 'GSTR9',
    period: string
  ): Promise<any> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/gst/reports/${reportType}?period=${period}`
      );

      if (!response.ok) throw new Error(`Failed to generate ${reportType} report`);
      return response.json();
    } catch (error) {
      console.error(`Error generating ${reportType} report:`, error);
      throw error;
    }
  }

  /**
   * Export GST data
   */
  async exportGSTData(
    format: 'csv' | 'json' | 'excel',
    period: string
  ): Promise<Blob> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/gst/export?format=${format}&period=${period}`
      );

      if (!response.ok) throw new Error('Failed to export GST data');
      return response.blob();
    } catch (error) {
      console.error('Error exporting GST data:', error);
      throw error;
    }
  }

  /**
   * Get GST rate for category
   */
  getGSTRate(category: string): number {
    return this.gstRates.get(category) || 18; // Default to 18%
  }

  /**
   * Get all GST rates
   */
  getAllGSTRates(): Map<string, number> {
    return new Map(this.gstRates);
  }

  /**
   * Validate invoice before submission
   */
  validateInvoice(invoice: Invoice): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!invoice.invoiceNumber) errors.push('Invoice number is required');
    if (!invoice.gstNumber) errors.push('GST number is required');
    if (!this.validateGSTNumber(invoice.gstNumber)) errors.push('Invalid GST number format');
    if (!invoice.buyerName) errors.push('Buyer name is required');
    if (!invoice.items || invoice.items.length === 0) errors.push('At least one item is required');
    if (invoice.totalAmount <= 0) errors.push('Total amount must be greater than 0');

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate reverse charge
   */
  calculateReverseCharge(
    amount: number,
    gstRate: number,
    isReverseCharge: boolean
  ): {
    amount: number;
    gst: number;
    total: number;
  } {
    if (!isReverseCharge) {
      return {
        amount,
        gst: (amount * gstRate) / 100,
        total: amount + (amount * gstRate) / 100,
      };
    }

    // For reverse charge, GST is not charged by supplier
    return {
      amount,
      gst: 0,
      total: amount,
    };
  }
}

export default new GSTService();
