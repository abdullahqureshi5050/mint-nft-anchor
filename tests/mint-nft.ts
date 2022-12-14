import * as anchor from "@project-serum/anchor";
// ** Comment this to use solpg imported IDL **
import { MintNft } from "../target/types/mint_nft";

//mport { web3, utils } from "@project-serum/anchor";

describe("nft-marketplace", async () => {

  const testNftTitle = "Abdullah'sNFT";
  const testNftSymbol = "MAQ";
  const testNftUri = "https://cockadoodle.mypinata.cloud/ipfs/QmUySHfLXqrzko2cLV5FbbsoD146o3RypTS8NuBc8vYoqU/1.json";
  let provider = null;
  let wallet = null;
  try {
    provider = anchor.AnchorProvider.env()
    wallet = provider.wallet as anchor.Wallet;
    anchor.setProvider(provider);
  
  } catch (error) {
    console.log(error);
  } 
  
  
  const program = await anchor.workspace.MintNft as anchor.Program<MintNft>;

  const TOKEN_METADATA_PROGRAM_ID = await new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  async function mintingAccountPDA(pk: anchor.web3.PublicKey) {
    // const [pda, _] = await anchor.web3.PublicKey.findProgramAddress(
    //   [
    //     pk.toBuffer(),
    //     Buffer.from("minting_account")
    //   ], program.programId);

    const [_mintingAccount, _mintingAccountbump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(anchor.utils.bytes.utf8.encode("minting_account"))],
        program.programId);

    return _mintingAccount;
  }

  it("Mint!", async () => {

    // Derive the mint address and the associated token account address

    const mintKeypair: anchor.web3.Keypair = await anchor.web3.Keypair.generate();
    // await new Promise(resolve => {
    //   setTimeout(resolve, 13000);
    // });
    // console.log(`called 1`);
    // const tx = await provider.connection.requestAirdrop(mintKeypair.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    // console.log(`called 2`);
    // await provider.connection.confirmTransaction(tx);
    // console.log(`called 3`);

    let mintingPDA = await mintingAccountPDA(mintKeypair.publicKey);
    const tokenAddress = await anchor.utils.token.associatedAddress({
      mint: mintKeypair.publicKey,
      owner: wallet.publicKey
    });
     
    console.log(`New token: ${mintKeypair.publicKey}`);

    // Derive the metadata and master edition addresses

    const metadataAddress = (await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintKeypair.publicKey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    ))[0];
    console.log("Metadata initialized");
    const masterEditionAddress = (await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintKeypair.publicKey.toBuffer(),
        Buffer.from("edition"),
      ],
      TOKEN_METADATA_PROGRAM_ID
    ))[0];
    console.log("Master edition metadata initialized");

    // Transact with the "mint" function in our on-chain program

     try {
    const account = await program.methods.mint(
      testNftTitle, testNftSymbol, testNftUri
    )
      .accounts({
        masterEdition: masterEditionAddress,
        metadata: metadataAddress,
        mint: mintKeypair.publicKey,
        tokenAccount: tokenAddress,
        mintAuthority: wallet.publicKey,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        //mintingPda: mintingPDA
      })
      .signers([ mintKeypair])
      .rpc();
    console.log(`Account ===`, account);
     } catch (error) {
      console.error(`Error ===`, error);
     }
  });
});