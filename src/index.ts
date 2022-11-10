/*  What this program will do?
    My generated client will transfer 2 SOL to my Phantom wallet address. 
    When the SOL count drops below 2, the program will automatically airdrop 2 more SOL.
    It also generates a transaction signature at the end which is a link you can navigate to to check the authenticity.
*/

import * as Web3 from '@solana/web3.js'; // i'll be using solana's web3.js library for this
import * as fs from 'fs'; // for file handling
import dotenv from 'dotenv';
dotenv.config();

const MY_ACCOUNT_PUBLIC_KEY = new Web3.PublicKey("AeVRH9jcRvGAaThsY9m2s1q1xfbrHisrzR4N3u4fTjzT") // the public key to my phantom wallet

async function initializeKeypair(connection : Web3.Connection) : Promise<Web3.Keypair> {
    if(!process.env.PRIVATE_KEY) {
        console.log("Generating new keypair... 🗝️")
        const signer = Web3.Keypair.generate() // generates a keypair from which we take the secret key and save it in .env file

        console.log("Creating .env file...")
        fs.writeFileSync('.env', `PRIVATE_KEY=[${signer.secretKey.toString()}]`) // DON'T FORGET TO PUT THE ARRAY BRACKETS
        // creates and updates .env file if the private key does not exist even if the file doesn't already exist

        return signer
    }

    const secret = JSON.parse(process.env.PRIVATE_KEY ?? '') as number [] // pass the generated private key as a JSON object
    const secretKey = Uint8Array.from(secret) // convert the private key into a Uint8Array, read more about it here https://solanacookbook.com/references/keypairs-and-wallets.html#how-to-restore-a-keypair-from-a-secret
    const keypairFromSecret = Web3.Keypair.fromSecretKey(secretKey) // gets the private key from the Uint8Array

    await airdropSolIfNeeded(keypairFromSecret, connection) // airdrops 2 SOL if balance < 2 SOL

    return keypairFromSecret
}

async function airdropSolIfNeeded(signer : Web3.Keypair, connection : Web3.Connection) {
    const balance = await connection.getBalance(signer.publicKey) // gets our client's balance
    console.log("Current balance is ", balance / Web3.LAMPORTS_PER_SOL, 'SOL') // the unit of fetched balance is in lamports, so convert it to SOL

    if(balance / Web3.LAMPORTS_PER_SOL < 2) {
        console.log("Airdropping 2 SOL...")
        // We can only get up to 2 SOL per request 
        const airdropSignature = await connection.requestAirdrop(signer.publicKey, 2 * Web3.LAMPORTS_PER_SOL) // requests airdrop

        const latestBlockhash = await connection.getLatestBlockhash()

        await connection.confirmTransaction({
            blockhash : latestBlockhash.blockhash,
            lastValidBlockHeight : latestBlockhash.lastValidBlockHeight,
            signature : airdropSignature
        })

        const newBalance = await connection.getBalance(signer.publicKey)
        console.log("The new balance is ", newBalance / Web3.LAMPORTS_PER_SOL, 'SOL')
    }
}

async function transfer_sol(connection : Web3.Connection, signer : Web3.Keypair) {
    const transaction = new Web3.Transaction()
    const instruction = new Web3.TransactionInstruction(
        Web3.SystemProgram.transfer({
            fromPubkey : signer.publicKey,
            toPubkey : MY_ACCOUNT_PUBLIC_KEY,
            lamports : 2 * Web3.LAMPORTS_PER_SOL
        })
    )

    transaction.add(instruction)

    const transactionSignature = await Web3.sendAndConfirmTransaction(connection, transaction, [signer])
    console.log(`Transaction https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`)
}

async function main() {
    const connection = new Web3.Connection(Web3.clusterApiUrl('devnet'))
    const signer = await initializeKeypair(connection)

    console.log("Public key : ", signer.publicKey.toBase58()) // Solana Public keys are Base58 alphanumeric characters

    console.log(`Transferring 2 SOL to ${MY_ACCOUNT_PUBLIC_KEY}`)
    await transfer_sol(connection, signer)
}

main()
    .then(() => {
        console.log("Finished successfully")
        process.exit(0)
    })
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
