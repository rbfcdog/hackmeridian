import { supabase } from '../../config/supabase';
import { StellarService } from './stellar.service';


export interface RegisterUserPayload {
  email?: string;
  phone_number?: string;
}

export interface AddContactPayload {
  userId: string;
  contact_name: string;
  public_key: string;
}

interface LookupContactPayload {
  userId: string;
  contact_name: string;
}

interface ListContactsPayload {
  userId: string;
}

export class UserService {

  static async registerUser(userData: RegisterUserPayload): Promise<{ user: any; secret: string }> {
    const { publicKey, secret } = StellarService.generateStellarKeypair();
    console.log(`Generated new public key for user: ${publicKey}`);

    const userToCreate = {
      email: userData.email,
      phone_number: userData.phone_number,
      stellar_public_key: publicKey,
    };

    const { data, error } = await supabase
      .from('users')
      .insert(userToCreate)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return { user: data, secret: secret };
  }


  static async addContact(payload: AddContactPayload): Promise<any> {
    const { userId, contact_name, public_key } = payload;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    const { data: newContact, error: insertError } = await supabase
      .from('contacts')
      .insert({
        owner_id: userId,
        contact_name: contact_name,
        stellar_public_key: public_key,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        throw new Error(`A contact with the name "${contact_name}" already exists.`);
      }
      throw new Error(`Database insert error: ${insertError.message}`);
    }

    return newContact;
  }

  static async lookupContactByNameAndUserId(payload: LookupContactPayload): Promise<any> {
    const { userId, contact_name } = payload;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('owner_id', userId)
      .eq('contact_name', contact_name)
      .single();

    if (contactError || !contact) {
      throw new Error(`Contact with name "${contact_name}" not found for this user.`);
    }

    return contact;
  }

    static async listContacts(payload: ListContactsPayload): Promise<any[]> {
    const { userId } = payload;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('owner_id', userId)
      .order('contact_name', { ascending: true });

    if (contactsError) {
      throw new Error(`Database error: ${contactsError.message}`);
    }

    return contacts || [];
  }

  
}