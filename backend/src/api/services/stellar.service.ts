import { Keypair } from "@stellar/stellar-sdk";

export class StellarService {
    static async createTestAccount(): Promise<{ publicKey: string; secretKey: string }> {
        const pair = Keypair.random();
        const publicKey = pair.publicKey();
        const secretKey = pair.secret();
        
        await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);

        return { publicKey, secretKey };
    }
}