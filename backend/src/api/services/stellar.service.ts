// src/api/services/stellar.service.ts
import { Keypair } from "@stellar/stellar-sdk";
import fetch from 'node-fetch';

export class StellarService {
  /**
   * Gera um novo par de chaves Stellar (pública e secreta).
   * Esta operação não interage com a rede.
   */
  static generateStellarKeypair(): { publicKey: string; secret: string } {
    const pair = Keypair.random();
    return {
      publicKey: pair.publicKey(),
      secret: pair.secret(),
    };
  }

  /**
   * Cria uma nova conta na Testnet da Stellar e a financia usando o Friendbot.
   */
  static async createTestAccount(): Promise<{ publicKey: string; secret: string }> {
    const { publicKey, secret } = this.generateStellarKeypair();

    try {
      const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
      if (!response.ok) {
        throw new Error('Failed to fund account using Friendbot.');
      }
      await response.json();
    } catch (e) {
      console.error("FRIENDBOT ERROR: ", e);
      throw new Error('Could not connect to Friendbot.');
    }

    return { publicKey, secret };
  }
}