import { supabase } from '../../config/supabase';
import { StellarService } from './stellar.service';

export interface RegisterUserPayload {
  email?: string;
  phone_number?: string;
}

export interface RegisterUserWithWalletPayload {
  email?: string;
  phone_number?: string;
  stellar_public_key: string;
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

  /**
   * Registra um usuário com uma carteira Stellar já existente
   * Para usuários que já possuem chaves Stellar
   */
  static async registerUserWithExistingWallet(userData: RegisterUserWithWalletPayload): Promise<{ user: any }> {
    const userToCreate = {
      email: userData.email,
      phone_number: userData.phone_number,
      stellar_public_key: userData.stellar_public_key,
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

    return { user: data };
  }

  /**
   * Registra um usuário criando uma nova carteira Stellar automaticamente
   * Para usuários novos que precisam de onboarding completo
   */
  static async registerUserWithNewWallet(userData: RegisterUserPayload): Promise<{ user: any; secret: string }> {
    // Cria uma nova conta Stellar (gera chaves + financia na testnet)
    const { publicKey, secret } = await StellarService.createTestAccount();
    console.log(`Generated and funded new Stellar account: ${publicKey}`);

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
      if (error.code === '23505') {
        throw new Error('User with this email already exists.');
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return { user: data, secret: secret };
  }

  /**
   * Método legado - mantido para compatibilidade
   * @deprecated Use registerUserWithNewWallet ou registerUserWithExistingWallet
   */
  static async registerUser(userData: RegisterUserPayload): Promise<{ user: any; secret: string }> {
    return this.registerUserWithNewWallet(userData);
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