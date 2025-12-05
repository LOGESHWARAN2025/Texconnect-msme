/**
 * Tenant Service
 * Handles multi-tenancy operations
 */

import { supabase } from '../lib/supabase';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  max_users: number;
  max_products: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  organization_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired';
  current_period_start: string;
  current_period_end: string;
  stripe_subscription_id?: string;
}

class TenantService {
  private static instance: TenantService;

  private constructor() {}

  static getInstance(): TenantService {
    if (!TenantService.instance) {
      TenantService.instance = new TenantService();
    }
    return TenantService.instance;
  }

  /**
   * Create new organization
   */
  async createOrganization(
    name: string,
    ownerId: string
  ): Promise<Organization> {
    try {
      const slug = name.toLowerCase().replace(/\s+/g, '-');

      const { data, error } = await supabase
        .from('organizations')
        .insert([{
          name,
          slug,
          owner_id: ownerId,
          subscription_tier: 'free',
          max_users: 5,
          max_products: 100
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Organization created:', data);
      return data;
    } catch (error) {
      console.error('❌ Error creating organization:', error);
      throw error;
    }
  }

  /**
   * Get user's organizations
   */
  async getUserOrganizations(userId: string): Promise<Organization[]> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .or(`owner_id.eq.${userId},id.in.(
          SELECT organization_id FROM users WHERE id = ${userId}
        )`);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('❌ Error fetching organizations:', error);
      throw error;
    }
  }

  /**
   * Get organization details
   */
  async getOrganization(organizationId: string): Promise<Organization> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('❌ Error fetching organization:', error);
      throw error;
    }
  }

  /**
   * Update organization
   */
  async updateOrganization(
    organizationId: string,
    updates: Partial<Organization>
  ): Promise<Organization> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', organizationId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Organization updated');
      return data;
    } catch (error) {
      console.error('❌ Error updating organization:', error);
      throw error;
    }
  }

  /**
   * Get organization subscription
   */
  async getSubscription(organizationId: string): Promise<Subscription> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('❌ Error fetching subscription:', error);
      throw error;
    }
  }

  /**
   * Check subscription limits
   */
  async checkSubscriptionLimits(
    organizationId: string,
    resource: 'users' | 'products' | 'orders'
  ): Promise<{
    current: number;
    limit: number;
    exceeded: boolean;
  }> {
    try {
      const org = await this.getOrganization(organizationId);
      let current = 0;
      let limit = 0;

      if (resource === 'users') {
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact' })
          .eq('organization_id', organizationId);
        current = count || 0;
        limit = org.max_users;
      } else if (resource === 'products') {
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact' })
          .eq('organization_id', organizationId);
        current = count || 0;
        limit = org.max_products;
      }

      return {
        current,
        limit,
        exceeded: current >= limit
      };
    } catch (error) {
      console.error('❌ Error checking limits:', error);
      throw error;
    }
  }

  /**
   * Upgrade subscription
   */
  async upgradeSubscription(
    organizationId: string,
    newPlanId: string
  ): Promise<Subscription> {
    try {
      // Get current subscription
      const currentSub = await this.getSubscription(organizationId);

      // Update subscription
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          plan_id: newPlanId,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSub.id)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Subscription upgraded');
      return data;
    } catch (error) {
      console.error('❌ Error upgrading subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(organizationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancel_at_period_end: true,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId);

      if (error) throw error;

      console.log('✅ Subscription cancelled');
    } catch (error) {
      console.error('❌ Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Get organization members
   */
  async getOrganizationMembers(organizationId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', organizationId);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('❌ Error fetching members:', error);
      throw error;
    }
  }

  /**
   * Add member to organization
   */
  async addMember(
    organizationId: string,
    email: string,
    _role: string
  ): Promise<void> {
    try {
      // Check limits
      const limits = await this.checkSubscriptionLimits(organizationId, 'users');
      if (limits.exceeded) {
        throw new Error('User limit exceeded for this subscription');
      }

      // Invite user (implementation depends on your auth system)
      console.log('📧 Sending invite to:', email);
    } catch (error) {
      console.error('❌ Error adding member:', error);
      throw error;
    }
  }

  /**
   * Remove member from organization
   */
  async removeMember(organizationId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ organization_id: null })
        .eq('id', userId)
        .eq('organization_id', organizationId);

      if (error) throw error;

      console.log('✅ Member removed');
    } catch (error) {
      console.error('❌ Error removing member:', error);
      throw error;
    }
  }

  /**
   * Get organization usage
   */
  async getOrganizationUsage(organizationId: string): Promise<{
    users: number;
    products: number;
    orders: number;
    storage: number;
  }> {
    try {
      const [usersRes, productsRes, ordersRes] = await Promise.all([
        supabase
          .from('users')
          .select('*', { count: 'exact' })
          .eq('organization_id', organizationId),
        supabase
          .from('products')
          .select('*', { count: 'exact' })
          .eq('organization_id', organizationId),
        supabase
          .from('orders')
          .select('*', { count: 'exact' })
          .eq('organization_id', organizationId)
      ]);

      return {
        users: usersRes.count || 0,
        products: productsRes.count || 0,
        orders: ordersRes.count || 0,
        storage: 0 // Calculate based on file uploads
      };
    } catch (error) {
      console.error('❌ Error fetching usage:', error);
      throw error;
    }
  }
}

export const tenantService = TenantService.getInstance();
export default tenantService;
