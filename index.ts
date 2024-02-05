import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
const fs = require('fs');
import config from './config';
import * as dotenv from 'dotenv';

dotenv.config();

const rpc_api_key = process.env.QUICK_NODE_BASE_API_KEY as string;
const nodeProviderURL = config.nodeProviderURL + rpc_api_key;
export const publicClient = createPublicClient({
    chain: base,
    transport: http(nodeProviderURL)
});

async function main() {

    // =============================================================================
    /**
     * This block gets all the logs or events for a particular contract
     */
    const startTimeLogs: number = Date.now();

    let { contractAddress, contractDeployedBlock, NODE_API_MAX_RANGE, blockChunkSize, txnChunkSize, localFileName, duneTableName } = config;
    console.log('contractAddress:', contractAddress);
    console.log('contractDeployedBlock:', contractDeployedBlock);
    console.log('NODE_API_MAX_RANGE:', NODE_API_MAX_RANGE);
    console.log('blockChunkSize:', blockChunkSize);
    console.log('txnChunkSize:', txnChunkSize);
    console.log('txnChunkSize:', localFileName);
    console.log('txnChunkSize:', duneTableName);
    console.log('================================================\n')

    const currentBlockNumber = await publicClient.getBlockNumber();
    let deployedBlock: bigint = contractDeployedBlock;
    const logs: any[] = [];
    console.log(`Preparing to fetch logs for from ${deployedBlock} to ${currentBlockNumber}.`);

    const MAX_RANGE = NODE_API_MAX_RANGE;
    const ranges: { fromBlock: bigint, toBlock: bigint }[] = [];
    for (let from = deployedBlock; from <= currentBlockNumber; from += MAX_RANGE + 1n) {
        const toBlock = BigInt(Math.min(Number(from) + Number(MAX_RANGE), Number(currentBlockNumber)));
        ranges.push({ fromBlock: from, toBlock });
    }

    const logPromises = ranges.map(range => publicClient.getLogs({
        address: (contractAddress.startsWith('0x') ? contractAddress : `0x${contractAddress}`) as `0x${string}` | `0x${string}`[] | undefined,
        fromBlock: range.fromBlock,
        toBlock: range.toBlock
    }));

    try {
        const results = await Promise.all(logPromises);
        results.forEach(result => logs.push(...result));
        console.log('All logs have been fetched.');
    } catch (error: any) {
        console.error("Error calling getLogs:\n", error);
    }

    const endTimeLogs: number = Date.now();
    console.log(`GetLogs execution time: ${(endTimeLogs - startTimeLogs) / 1000} seconds\n`);
    console.log('================================================\n\n')
    // =================================================================
    /**
     * Fetching block time from
     */

    const startTimeBlocks: number = Date.now();

    const blockNumberList = logs.map(log => log.blockNumber);
    console.log(`Number of blocks to get info on: ${blockNumberList.length} `);
    console.log('First 10 elements in blockNumberList:', blockNumberList.slice(0, 10));

    const BLOCK_CHUNK_SIZE = blockChunkSize;

    const blocks: { block_number: bigint, block_time: string, block_date: string }[] = [];
    let leftBlocks: number[] = [...blockNumberList]; // Initially set to all blocks

    const fetchBlocks = async (blockNumbers: number[]) => {
        let newFailedBlocks: number[] = [];

        for (let i = 0; i < blockNumbers.length; i += BLOCK_CHUNK_SIZE) {
            const blockNumberChunk = blockNumbers.slice(i, i + BLOCK_CHUNK_SIZE);
            console.log(`Fetching blocks from ${blockNumberChunk[0]} to ${blockNumberChunk[blockNumberChunk.length - 1]} `);

            const blockPromises = blockNumberChunk.map(blockNumber => publicClient.getBlock({
                blockNumber: BigInt(blockNumber),
            }).catch(error => {
                // Check if error.body and error.body.params are defined
                if (error.body && error.body.params && error.body.params.length > 0) {
                    const failedBlockNumber = parseInt(error.body.params[0], 16);
                    newFailedBlocks.push(blockNumber);
                    console.error(`Error fetching block ${failedBlockNumber}: ${error} `);
                } else {
                    // Handle the case where error.body or error.body.params is undefined
                    newFailedBlocks.push(blockNumber);
                    console.error(`Unexpected error fetching block ${blockNumber}: ${error} `);
                }
                return null; // Return null for failed requests
            }));

            const results = await Promise.all(blockPromises);
            results.forEach(block => {
                if (block) {
                    const timestampInSeconds = Number(block.timestamp);
                    const block_time = new Date(timestampInSeconds * 1000).toISOString().replace('T', ' ').replace(/\.\d+Z/, '');
                    const block_date = block_time.substring(0, 10);

                    blocks.push({
                        block_number: block.number,
                        block_time,
                        block_date
                    });
                }
            });
        }

        return newFailedBlocks;
    };

    // Keep retrying until there are no more failed blocks
    while (leftBlocks.length > 0) {
        console.log(`Trying / Retrying ${leftBlocks.length} left blocks.`);
        leftBlocks = await fetchBlocks(leftBlocks);
    }

    // Deduplicate blocks
    const uniqueBlocks = Array.from(new Map(blocks.map(block => [block.block_number, block])).values());
    console.log('All blocks have been fetched and deduplicated.');


    const endTimeBlocks: number = Date.now();
    console.log(`GetBlocks execution time: ${(endTimeBlocks - startTimeBlocks) / 60000} minutes\n`);
    console.log('================================================\n\n')

    // =================================================================
    /**
     * Fetching txn from and to
     */
    const startTimeTxns: number = Date.now();

    const transactionHashList = logs.map(log => log.transactionHash);
    console.log(`Number of transactions to get info on: ${transactionHashList.length} `);
    console.log('First 10 elements in transactionHashList:', transactionHashList.slice(0, 10));

    const TXN_CHUNK_SIZE = txnChunkSize;

    const transactions: { transaction_hash: string, transaction_from: string, transaction_to: string }[] = [];
    let leftTransactions: string[] = [...transactionHashList]; // Initially set to all transactions

    const fetchTransactions = async (transactionHashes: string[]) => {
        let newFailedTransactions: string[] = [];

        for (let i = 0; i < transactionHashes.length; i += TXN_CHUNK_SIZE) {
            const transactionHashChunk = transactionHashes.slice(i, i + TXN_CHUNK_SIZE);
            console.log(`Fetching transactions for chunk starting from ${transactionHashChunk[0]} `);

            const transactionPromises = transactionHashChunk.map(hash => publicClient.getTransaction({
                hash: (hash.startsWith('0x') ? hash : `0x${hash} `) as `0x${string} `,
            }).catch(error => {
                newFailedTransactions.push(hash);
                console.error(`Error fetching transaction ${hash}: ${error} `);
                return null; // Return null for failed requests
            }));

            const results = await Promise.all(transactionPromises);
            results.forEach(transaction => {
                if (transaction) {
                    transactions.push({
                        transaction_hash: transaction.hash,
                        transaction_from: transaction.from ?? '',
                        transaction_to: transaction.to ?? ''
                    });
                }
            });
        }

        return newFailedTransactions;
    };

    // Keep retrying until there are no more failed transactions
    while (leftTransactions.length > 0) {
        console.log(`Trying / Retrying ${leftTransactions.length} left transactions.`);
        leftTransactions = await fetchTransactions(leftTransactions);
    }

    console.log('All transactions have been fetched.');


    const endTimeTxns: number = Date.now();
    console.log(`GetTransactions execution time: ${(endTimeTxns - startTimeTxns) / 60000} minutes\n\n`);

    // =================================================================
    /**
     * Joining all fetched info into one table
     */

    console.log("Joining all together for the full table")
    // Create indexed structures
    const blockIndex = new Map(uniqueBlocks.map(block => [block.block_number.toString(), block]));
    const transactionIndex = new Map(transactions.map(transaction => [transaction.transaction_hash, transaction]));

    const fullTable = logs.map(log => {
        const matchingTransaction = transactionIndex.get(log.transactionHash);
        const matchingBlock = blockIndex.get(log.blockNumber.toString());

        return `${log.blockHash},${log.blockNumber.toString()},${matchingBlock?.block_time},${matchingBlock?.block_date},${log.address},${log.transactionHash},${matchingTransaction ? matchingTransaction.transaction_from : ''},${matchingTransaction ? matchingTransaction.transaction_to : ''},${log.transactionIndex.toString()},${log.logIndex.toString()},${log.topics[0] || ''},${log.topics.length > 1 ? log.topics[1] : ''},${log.topics.length > 2 ? log.topics[2] : ''},${log.topics.length > 3 ? log.topics[3] : ''},${log.data},${log.removed.toString()} `;
    }).join('\n');

    const csvHeader: string = 'block_hash,block_number,block_time,block_date,contract_address,tx_hash,tx_from,tx_to,tx_index,log_index,topic0,topic1,topic2,topic3,data,removed\n';

    const csv: string = csvHeader + fullTable;
    fs.writeFileSync(localFileName, csv);

    const sizeInBytes: number = new TextEncoder().encode(csv).length;
    const sizeInMegabytes: number = sizeInBytes / (1024 * 1024);
    console.log(`CSV Size: ${sizeInMegabytes.toFixed(2)} MB`);

    // =================================================================
    /**
     * Upload CSV to Dune
     */
    const dune_api_key = process.env.DUNE_API_KEY as string; // Assuming the API key is stored in an environment variable
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };

    if (dune_api_key) {
        headers['X-DUNE-API-KEY'] = dune_api_key;
    }

    const options = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            data: csv,
            table_name: duneTableName,
            is_private: true
        })
    };

    console.log("Uploading to Dune...")
    fetch('https://api.dune.com/api/v1/table/upload/csv', options)
        .then(response => response.json())
        .then(response => console.log(response))
        .catch(err => console.error(err));


    const end = new Date().getTime();
    const minutesTaken = (end - startTimeLogs) / 60000;
    console.log(`Total time taken for this process: ${minutesTaken} minutes`);
}

main().catch(console.error);
