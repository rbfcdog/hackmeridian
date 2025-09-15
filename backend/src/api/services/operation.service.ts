// src/api/services/operation.service.ts

import { supabase } from '../../config/supabase';

export class OperationService {
  /**
   * Busca no banco de dados todas as operações associadas a um user_id.
   * @param userId O ID do usuário para o qual o histórico será buscado.
   * @returns Uma lista de operações, ordenada da mais recente para a mais antiga.
   */
  static async getOperationHistory(userId: string): Promise<any[]> {
    console.log(`Fetching operation history for user_id: ${userId}`);

    const { data, error } = await supabase
      .from('operations') // O nome da sua tabela de operações
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }); // Ordena para mostrar as mais recentes primeiro

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Retorna os dados encontrados ou um array vazio se o usuário não tiver operações
    return data || [];
  }
}