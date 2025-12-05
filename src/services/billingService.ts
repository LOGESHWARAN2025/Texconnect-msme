/**
 * Billing Service
 * Handles subscription and payment operations
 */

import { supabase } from '../lib/supabase';

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  billingPeriod: 'monthly' | 'annual';
  features: {
    maxUsers: number;
    maxProducts: number;
    maxOrders: number;
    analytics: boolean;
    api: boolean;
    support: string;
  };
}

export interface Invoice {
  id: string;
  organizationId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'failed';
  invoiceNumber: string;
  dueDate: string;
  paidAt?: string;
  stripeInvoiceId?: string;
}

class BillingService {
  private static instance: BillingService;

  private constructor() {}

  static getInstance(): BillingService {
    if (!BillingService.instance) {
      BillingService.instance = new BillingService();
    }
    return BillingService.instance;
  }

  /**
   * Get all subscription plans
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('❌ Error fetching plans:', error);
      throw error;
    }
  }

  /**
   * Get plan by ID
   */
  async getPlan(planId: string): Promise<SubscriptionPlan> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('❌ Error fetching plan:', error);
      throw error;
    }
  }

  /**
   * Create Stripe checkout session
   */
  async createStripeCheckout(
    organizationId: string,
    planId: string
  ): Promise<{ sessionId: string; url: string }> {
    try {
      const response = await fetch('/api/billing/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          planId
        })
      });

      if (!response.ok) throw new Error('Failed to create checkout session');

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error creating checkout:', error);
      throw error;
    }
  }

  /**
   * Create Razorpay order
   */
  async createRazorpayOrder(
    organizationId: string,
    planId: string
  ): Promise<{ orderId: string; amount: number }> {
    try {
      const plan = await this.getPlan(planId);

      const response = await fetch('/api/billing/razorpay/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          planId,
          amount: plan.price * 100, // Convert to paise
          currency: 'INR'
        })
      });

      if (!response.ok) throw new Error('Failed to create order');

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error creating Razorpay order:', error);
      throw error;
    }
  }

  /**
   * Get organization invoices
   */
  async getInvoices(organizationId: string): Promise<Invoice[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('❌ Error fetching invoices:', error);
      throw error;
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<Invoice> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('❌ Error fetching invoice:', error);
      throw error;
    }
  }

  /**
   * Download invoice PDF
   */
  async downloadInvoicePDF(invoiceId: string): Promise<void> {
    try {
      const response = await fetch(`/api/billing/invoices/${invoiceId}/pdf`);

      if (!response.ok) throw new Error('Failed to download invoice');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice_${invoiceId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Error downloading invoice:', error);
      throw error;
    }
  }

  /**
   * Get billing history
   */
  async getBillingHistory(organizationId: string): Promise<{
    totalSpent: number;
    invoiceCount: number;
    lastPaymentDate?: string;
    nextBillingDate?: string;
  }> {
    try {
      const invoices = await this.getInvoices(organizationId);

      const paidInvoices = invoices.filter(i => i.status === 'paid');
      const totalSpent = paidInvoices.reduce((sum, i) => sum + i.amount, 0);

      const lastPaid = paidInvoices.sort(
        (a, b) => new Date(b.paidAt || '').getTime() - new Date(a.paidAt || '').getTime()
      )[0];

      return {
        totalSpent,
        invoiceCount: invoices.length,
        lastPaymentDate: lastPaid?.paidAt,
        nextBillingDate: undefined // Calculate based on subscription
      };
    } catch (error) {
      console.error('❌ Error fetching billing history:', error);
      throw error;
    }
  }

  /**
   * Estimate monthly cost
   */
  async estimateMonthlyCost(planId: string): Promise<number> {
    try {
      const plan = await this.getPlan(planId);
      return plan.price;
    } catch (error) {
      console.error('❌ Error estimating cost:', error);
      throw error;
    }
  }

  /**
   * Calculate annual savings
   */
  async calculateAnnualSavings(monthlyPrice: number): Promise<number> {
    // Typically 20% discount for annual billing
    const annualPrice = monthlyPrice * 12 * 0.8;
    return (monthlyPrice * 12) - annualPrice;
  }

  /**
   * Get payment methods
   */
  async getPaymentMethods(organizationId: string): Promise<any[]> {
    try {
      const response = await fetch(`/api/billing/payment-methods/${organizationId}`);

      if (!response.ok) throw new Error('Failed to fetch payment methods');

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error fetching payment methods:', error);
      throw error;
    }
  }

  /**
   * Add payment method
   */
  async addPaymentMethod(
    organizationId: string,
    paymentMethodData: any
  ): Promise<void> {
    try {
      const response = await fetch('/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          ...paymentMethodData
        })
      });

      if (!response.ok) throw new Error('Failed to add payment method');

      console.log('✅ Payment method added');
    } catch (error) {
      console.error('❌ Error adding payment method:', error);
      throw error;
    }
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(
    organizationId: string,
    paymentMethodId: string
  ): Promise<void> {
    try {
      const response = await fetch(
        `/api/billing/payment-methods/${paymentMethodId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ organizationId })
        }
      );

      if (!response.ok) throw new Error('Failed to delete payment method');

      console.log('✅ Payment method deleted');
    } catch (error) {
      console.error('❌ Error deleting payment method:', error);
      throw error;
    }
  }
}

export const billingService = BillingService.getInstance();
export default billingService;
