import { supabase } from '../../config/supabase';
import { StellarService } from './stellar.service';
import { AuthService } from './auth.service';

export interface OnboardUserPayload {
  email?: string;
  phoneNumber?: string;
  publicKey?: string;
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

  static async onboardUser(input: OnboardUserPayload): Promise<{ 
    userId: string; 
    publicKey: string; 
    sessionToken: string; 
    secretKey?: string;
  }> {
    let publicKey: string;
    let secretKey: string | undefined;

    if (input.publicKey) {
      publicKey = input.publicKey;
      secretKey = undefined;
    } else {
      const { publicKey: newPublicKey, secret } = await StellarService.createTestAccount();
      publicKey = newPublicKey;
      secretKey = secret;
    }

    const userToCreate = {
      email: input.email,
      phone_number: input.phoneNumber,
      stellar_public_key: publicKey,
    };

    const { data, error } = await supabase
      .from('users')
      .insert(userToCreate)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('User with this email or public key already exists.');
      }
      throw new Error(`Database error: ${error.message}`);
    }

    const sessionToken = AuthService.generateTokenForUser(data.id);

    return {
      userId: data.id,
      publicKey,
      sessionToken,
      ...(secretKey && { secretKey }) 
    };
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