// Reuse the centralized Supabase client to avoid env/key mismatch issues
import { supabase } from '../lib/supabase';

export interface ContactFormData {
  fullName: string;
  email: string;
  phone: string;
  message: string;
}

export interface ContactSubmission extends ContactFormData {
  id: string;
  createdAt: string;
  status: 'new' | 'read' | 'responded';
}

/**
 * Submit contact form data to Supabase
 */
export async function submitContactForm(data: ContactFormData): Promise<ContactSubmission | null> {
  try {
    const { data: submission, error } = await supabase
      .from('contact_submissions')
      .insert([
        {
          full_name: data.fullName,
          email: data.email,
          phone: data.phone,
          message: data.message,
          status: 'new',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error submitting contact form:', error);
      throw error;
    }

    return {
      id: submission.id,
      fullName: submission.full_name,
      email: submission.email,
      phone: submission.phone,
      message: submission.message,
      createdAt: submission.created_at,
      status: submission.status
    };
  } catch (error) {
    console.error('Failed to submit contact form:', error);
    return null;
  }
}

/**
 * Get all contact submissions (admin only)
 */
export async function getContactSubmissions(): Promise<ContactSubmission[]> {
  try {
    const { data, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contact submissions:', error);
      throw error;
    }

    return data.map((item: any) => ({
      id: item.id,
      fullName: item.full_name,
      email: item.email,
      phone: item.phone,
      message: item.message,
      createdAt: item.created_at,
      status: item.status
    }));
  } catch (error) {
    console.error('Failed to fetch contact submissions:', error);
    return [];
  }
}

/**
 * Update contact submission status
 */
export async function updateContactSubmissionStatus(
  id: string,
  status: 'new' | 'read' | 'responded'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('contact_submissions')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating contact submission:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Failed to update contact submission:', error);
    return false;
  }
}

/**
 * Delete contact submission
 */
export async function deleteContactSubmission(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('contact_submissions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting contact submission:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete contact submission:', error);
    return false;
  }
}
