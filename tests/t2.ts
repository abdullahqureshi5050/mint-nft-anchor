import * as anchor from "@project-serum/anchor";
import { MintNft } from "../target/types/mint_nft";



function shortKey(key: anchor.web3.PublicKey) {
  return key.toString().substring(0, 8);
}


describe("mint_nft", async () => {
  
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Pdas as anchor.Program<MintNft>;

  //metaplex 

  const TOKEN_METADATA_PROGRAM_ID = await new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  async function generateKeypair() {
    let keypair = await anchor.web3.Keypair.generate();
    const tx = await provider.connection.requestAirdrop(
      keypair.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(tx);
    await new Promise( resolve => setTimeout(resolve, 3 * 1000) ); // Sleep 3s
    return keypair;
  }

  async function genPda(color: string, pubkey: anchor.web3.PublicKey) {
    let [pda, _] = await anchor.web3.PublicKey.findProgramAddress(
      [
        //pubkey.toBuffer(),
        Buffer.from("minting_account"),
        //Buffer.from(color),
      ],
      program.programId
    );
    return pda;
  }

  const keypair = await generateKeypair();

  const pda = await genPda("red", keypair.publicKey);

  async function createLedgerAccount(
    color: string, 
    pda: anchor.web3.PublicKey, 
    wallet: anchor.web3.Keypair
  ) {
    await program.methods.createLedger(color)
      .accounts({
        ledgerAccount: pda,
        wallet: wallet.publicKey,
      })
      .signers([wallet])
      .rpc();
  }

 
    let data;
    
    try {

      data = await program.account.ledger.fetch(pda);
      console.log("It does.");
    
    } catch (e) {
    
      console.log("It does NOT. Creating...");
      await createLedgerAccount("red", pda, keypair);
      data = await program.account.ledger.fetch(pda);
     };

});
