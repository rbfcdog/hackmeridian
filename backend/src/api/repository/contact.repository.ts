import { supabase } from '../../config/supabase';
import { Contact } from '../../types';

export class ContactRepository {
  static async create(contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact> {
    const { data, error } = await supabase
      .from('contacts')
      .insert([contactData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating contact:', error.message);
      throw new Error('Failed to create contact record in database.');
    }
    return data;
  }

  static async findByOwnerId(ownerId: string): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error finding contacts by owner ID:', error.message);
      throw new Error('Failed to retrieve user contacts.');
    }
    return data || [];
  }

  static async findByNameForOwner(ownerId: string, contactName: string): Promise<Contact | null> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('contact_name', contactName)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Record not found
        return null;
      }
      console.error('Supabase error finding contact by name for owner:', error.message);
      throw new Error('Failed to retrieve contact by name.');
    }
    return data;
  }
}
