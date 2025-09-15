// src/api/services/user.service.ts
import { supabase } from '../../config/supabase';
import { StellarService } from './stellar.service';


// Interface para o payload de registro de usuário
export interface RegisterUserPayload {
  email?: string;
  phone_number?: string;
}

export interface AddContactPayload {
  user_email: string;
  contact_email: string;
  contact_name: string;
}

interface LookupContactPayload {
  user_email: string;
  contact_name: string;
}


export class UserService {

  static async registerUser(userData: RegisterUserPayload): Promise<{ user: any; secret: string }> {
    // 1. Gera um novo par de chaves Stellar para o usuário
    const { publicKey, secret } = StellarService.generateStellarKeypair();
    console.log(`Generated new public key for user: ${publicKey}`);

    // 2. Prepara os dados para salvar no banco de dados
    const userToCreate = {
      email: userData.email,
      phone_number: userData.phone_number,
      stellar_public_key: publicKey, // Usa a chave pública recém-gerada
    };

    // 3. Insere o novo usuário no banco de dados
    const { data, error } = await supabase
      .from('users')
      .insert(userToCreate)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // 4. Retorna o usuário criado E a chave secreta
    // A chave secreta não é salva no banco de dados por segurança.
    return { user: data, secret: secret };
  }


  static async addContact(payload: AddContactPayload): Promise<any> {
    const { user_email, contact_email, contact_name } = payload;

    // 1. Encontra o ID do usuário que está adicionando o contato (o "dono")
    const { data: ownerUser, error: ownerError } = await supabase
      .from('users')
      .select('id')
      .eq('email', user_email)
      .single();

    if (ownerError || !ownerUser) {
      throw new Error(`User (owner) with email ${user_email} not found.`);
    }

    // 2. Encontra a chave pública do usuário que está sendo adicionado como contato
    const { data: contactUser, error: contactError } = await supabase
      .from('users')
      .select('stellar_public_key')
      .eq('email', contact_email)
      .single();

    if (contactError || !contactUser) {
      throw new Error(`Contact with email ${contact_email} not found.`);
    }

    // 3. Insere o novo registro na tabela 'contacts'
    const { data: newContact, error: insertError } = await supabase
      .from('contacts')
      .insert({
        owner_id: ownerUser.id,
        contact_name: contact_name,
        stellar_public_key: contactUser.stellar_public_key,
      })
      .select()
      .single();

    if (insertError) {
      // Trata a violação de constraint 'unique' (usuário já tem um contato com esse nome)
      if (insertError.code === '23505') {
        throw new Error(`A contact with the name "${contact_name}" already exists.`);
      }
      throw new Error(`Database insert error: ${insertError.message}`);
    }

    return newContact;
  }

  static async lookupContactByName(payload: LookupContactPayload): Promise<any> {
    const { user_email, contact_name } = payload;

    // 1. Encontra o ID do usuário (dono dos contatos) com base no email fornecido.
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', user_email)
      .single();

    if (userError || !user) {
      throw new Error(`User with email ${user_email} not found.`);
    }

    // 2. Com o ID do usuário, procura na tabela 'contacts' pelo registro
    // que corresponde ao ID do dono e ao nome do contato.
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*') // Retorna todos os dados do contato
      .eq('owner_id', user.id)
      .eq('contact_name', contact_name)
      .single();

    if (contactError || !contact) {
      throw new Error(`Contact with name "${contact_name}" not found for this user.`);
    }

    return contact;
  }

  
}