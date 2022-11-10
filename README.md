# Transfer SOL from one account to another

To make this possible, I am using the [Web3.JS](https://docs.solana.com/developing/clients/javascript-api) library provided by [Solana](https://solana.com/)

The entire source code, `index.ts` is well documented within the file to guide the reader at every step

This is the [buildspace](https://buildspace.so/) Solana Core-1 final shipping task

Keeping in mind the following points, anyone can make a simple transaction program using Solana :

1. keypair

```
const keypair = Keypair.fromSecretKey(
  Uint8Array.from([32 byte Array])
); //assuming that the array exists, if not, do the following
const secret = JSON.parse(process.env.PRIVATE_KEY ?? "") as number[] //loads the value to the constant secret only if it exists else empty
const keypairFromSecretKey = Keypair.fromSecretKey(Uint8Array.from(secret))
```

2. connection

```
const key = new web3.PublicKey(address) //This will validate that whatever you pass in is actually a Solana address
const connection = new web3.Connection(web3.clusterApiUrl('devnet'))
```

3. transaction

```
const transaction = new Transaction()
const sendSolInstruction = SystemProgram.transfer({
    fromPubkey: sender,
    toPubkey: recipient,
    lamports: LAMPORTS_PER_SOL * amount
})
transaction.add(sendSolInstruction)
const signature = sendAndConfirmTransaction(
    connection,
    transaction,
    [senderKeypair] //for signing purposes. Signing is necessary so we can only make changes that we are authorized to. Since this transaction moves SOL from one account to another, we need to prove that we control the account we're trying to send from.
)
```


### IN ACTION ###

```
async function callProgram(
    connection: web3.Connection,
    payer: web3.Keypair,
    programId: web3.PublicKey,
    programDataAccount: web3.PublicKey
) {
    const instruction = new web3.TransactionInstruction({
        // We only have one key here
        keys: [
            {
                pubkey: programDataAccount,
                isSigner: false,
                isWritable: true
            },
        ],
        
        // The program we're interacting with
        programId
        
        // We don't have any data here!
    })

    const sig = await web3.sendAndConfirmTransaction(
        connection,
        new web3.Transaction().add(instruction),
        [payer]
    )
}
```
