import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const rpc_api_key = process.env.QUICK_NODE_BASE_API_KEY as string;
export const publicClient = createPublicClient({
    chain: base,
    transport: http(`https://quaint-rough-layer.base-mainnet.quiknode.pro/${rpc_api_key}`)
});

async function main() {

    // =============================================================================
    /**
     * This block gets all the logs or events for a particular contract
     * TODO refactor out so contract address & block number the contract was deployed at & CHUNK SIZE can be parameters
     */
    const currentBlockNumber = await publicClient.getBlockNumber();
    let deployedBlock: bigint = 3620407n;
    const logs: any[] = [];
    console.log(`Preparing to fetch logs for from ${deployedBlock} to ${currentBlockNumber}.`);

    const MAX_RANGE = 9999n; //QuickNode has 10k blocks limit
    const ranges: { fromBlock: bigint, toBlock: bigint }[] = [];
    for (let from = deployedBlock; from <= currentBlockNumber; from += MAX_RANGE + 1n) {
        const toBlock = BigInt(Math.min(Number(from) + Number(MAX_RANGE), Number(currentBlockNumber)));
        ranges.push({ fromBlock: from, toBlock });
    }

    const logPromises = ranges.map(range => publicClient.getLogs({
        address: '0xd0b53D9277642d899DF5C87A3966A349A798F224',
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

    // =============================================================================
    /**
     * Save all the logs for future debugging so we don't need to run it over and over again
     */
    const logFilePath = 'saved_logs.json';
    const stringifiedLogs = logs.map(log => ({
        ...log,
        blockNumber: log.blockNumber.toString()
    }));
    fs.writeFileSync(logFilePath, JSON.stringify(stringifiedLogs, null, 2));
    console.log(`Logs saved to ${logFilePath}`);

    // =============================================================================
    /**
     * This block is for when starting with saved logs, mainly used to debug the getBlocks and getTransactions calls
     */
    // type Log = {
    //     address: string;
    //     blockHash: string;
    //     blockNumber: string;
    //     data: string;
    //     logIndex: number;
    //     removed: boolean;
    //     topics: string[];
    //     transactionHash: string;
    //     transactionIndex: number;
    // };

    // const logs: Log[] = require('./saved_logs.json');

    // =================================================================
    /**
     * Fetching block time from
     */


    // STOPPING POINT: switch to quicknode, so test that it still works, then potentially get the getBlockReceipt function for base
    // but anyways test out the parallelization with that 

    //     const blockNumberList = logs.map(log => log.blockNumber);
    //     console.log(`Number of blocks to get info on: ${blockNumberList.length}`);

    //     const CHUNK_SIZE = 80; // Number of blocks to process at a time, this is to avoid rate limiting
    //     const blocks: { block_number: bigint, block_time: string, block_date: string }[] = [];
    //     for (let i = 0; i < blockNumberList.length; i += CHUNK_SIZE) {
    //         const blockNumberChunk = blockNumberList.slice(i, i + CHUNK_SIZE);
    //         console.log(`Fetching blocks from ${blockNumberChunk[0]} to ${blockNumberChunk[blockNumberChunk.length - 1]}`);

    //         // Collect an array of promises for this chunk
    //         const blockPromises = blockNumberChunk.map(blockNumber => publicClient.getBlock({
    //             blockNumber: BigInt(blockNumber), // TODO: remove BigInt casting after testing
    //         }));

    //         // Resolve all promises in this chunk
    //         const results = await Promise.all(blockPromises);

    //         // Process results
    //         const blockDetails = results.map(block => {
    //             const timestampInSeconds = Number(block.timestamp);
    //             const block_time = new Date(timestampInSeconds * 1000).toISOString().replace('T', ' ').replace(/\.\d+Z/, '');
    //             const block_date = block_time.substring(0, 10);

    //             return {
    //                 block_number: block.number,
    //                 block_time: block_time,
    //                 block_date: block_date
    //             };
    //         });

    //         blocks.push(...blockDetails);
    //     }

    // =============================================================================
    /**
     * Save all the blocks for future debugging so we don't need to run it over and over again
     */
    // const blockFilePath = 'test_blocks.json';
    // const blocksJson = JSON.stringify(blocks.map(block => ({
    //     block_number: block.block_number.toString(),
    //     block_time: block.block_time,
    //     block_date: block.block_date
    // })), null, 2);
    // fs.writeFileSync(blockFilePath, blocksJson);
    // console.log(`Logs saved to ${blockFilePath}`);

    // =================================================================
    /**
     * Fetching txn from and to
     */
    // const transactionHashList = logs.map(log => log.transactionHash);
    // console.log(`Number of transactions to get info on: ${transactionHashList}`);

    // const transactions: { transaction_hash: string, transaction_from: string, transaction_to: string }[] = [];
    // for (let i = 0; i < transactionHashList.length; i++) {
    //     console.log(`Fetching transaction ${transactionHashList[i]}`);
    //     const transaction = await publicClient.getTransaction({
    //         hash: transactionHashList[i],
    //     });

    //     transactions.push({
    //         transaction_hash: transaction.hash,
    //         transaction_from: transaction.from ?? '',
    //         transaction_to: transaction.to ?? ''
    //     });
    // }

    // console.log("Joining all together for the full table")
    // const fullTable: string = logs.map((log: any) => {
    //     const matchingTransaction = transactions.find((transaction: any) => transaction.transaction_hash === log.transactionHash);
    //     const matchingBlock = blocks.find((block: any) => block.block_number === log.blockNumber);

    //     return `${log.blockHash},${log.blockNumber.toString()},${matchingBlock?.block_time},${matchingBlock?.block_date},${log.address},${log.transactionHash},${matchingTransaction ? matchingTransaction.transaction_from : ''},${matchingTransaction ? matchingTransaction.transaction_to : ''},${log.transactionIndex.toString()},${log.logIndex.toString()},${log.topics[0] || ''},${log.topics.length > 1 ? log.topics[1] : ''},${log.topics.length > 2 ? log.topics[2] : ''},${log.topics.length > 3 ? log.topics[3] : ''},${log.data},${log.removed.toString()}`;
    // }).join('\n');

    // // CSV header
    // const csvHeader: string = 'block_hash,block_number,block_time,block_date,contract_address,tx_hash,tx_from,tx_to,tx_index,log_index,topic0,topic1,topic2,topic3,data,removed\n';

    // const csv: string = csvHeader + fullTable;
    // console.log(csv);

    // // Approximate size in bytes (assuming UTF-16, 2 bytes per character)
    // const sizeInBytes: number = new TextEncoder().encode(csv).length;
    // const sizeInMegabytes: number = sizeInBytes / (1024 * 1024);

    // console.log(`CSV Size: ${sizeInMegabytes.toFixed(2)} MB`);

    // // Upload CSV to Dune
    // const dune_api_key = process.env.DUNE_API_KEY as string; // Assuming the API key is stored in an environment variable
    // const headers: Record<string, string> = {
    //     'Content-Type': 'application/json'
    // };

    // if (dune_api_key) {
    //     headers['X-DUNE-API-KEY'] = dune_api_key;
    // }

    // const options = {
    //     method: 'POST',
    //     headers: headers,
    //     body: JSON.stringify({
    //         data: csv,
    //         table_name: "jackie_test_byop_base_all_events_raw",
    //         is_private: true
    //     })
    // };

    // console.log("Uploading to Dune...")
    // fetch('https://api.dune.com/api/v1/table/upload/csv', options)
    //     .then(response => response.json())
    //     .then(response => console.log(response))
    //     .catch(err => console.error(err));
}

main().catch(console.error);
