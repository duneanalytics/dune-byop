import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import * as dotenv from 'dotenv';

dotenv.config();

const alchemy_api_key = process.env.ALCHEMY_API_KEY as string; // Assuming the API key is stored in an environment variable
export const publicClient = createPublicClient({
    chain: base,
    transport: http(`https://base-mainnet.g.alchemy.com/v2/${alchemy_api_key}`)
});

async function main() {
    const currentBlockNumber = await publicClient.getBlockNumber();

    let fromBlock: bigint = 3620407n;
    let toBlock: bigint = currentBlockNumber;

    const logs: any[] = [];

    while (fromBlock <= currentBlockNumber) {
        try {
            const result = await publicClient.getLogs({
                address: '0xd0b53D9277642d899DF5C87A3966A349A798F224',
                fromBlock,
                toBlock
            });

            logs.push(...result);
            fromBlock = toBlock + 1n;
            toBlock = currentBlockNumber;
        } catch (error: any) {
            if (error.details) {
                const match = error.details.match(/\[0x([a-f0-9]+), 0x([a-f0-9]+)\]/);
                if (match) {
                    fromBlock = BigInt(`0x${match[1]}`);
                    toBlock = BigInt(`0x${match[2]}`);
                    console.log(`Fetching logs from block ${fromBlock} to ${toBlock}`);
                } else {
                    console.error("Error parsing block range from error message:", error);
                    break;
                }
            } else {
                console.error("Unexpected error:", error);
                break;
            }
        }
    }

    const blockNumberList = logs.map(log => log.blockNumber);
    console.log(`Number of blocks to get info on: ${logs.length}`);

    const blocks: { block_number: bigint, block_time: string, block_date: string }[] = [];
    for (let i = 0; i < blockNumberList.length; i++) {
        console.log(`Fetching block ${blockNumberList[i]}`);
        const block = await publicClient.getBlock({
            blockNumber: blockNumberList[i],
        });

        const timestampInSeconds = Number(block.timestamp);
        const block_time = new Date(timestampInSeconds * 1000).toISOString().replace('T', ' ').replace(/\.\d+Z/, '');
        const block_date = block_time.substring(0, 10);

        blocks.push({
            block_number: block.number,
            block_time: block_time,
            block_date: block_date
        });
    }

    const transactionHashList = logs.map(log => log.transactionHash);
    console.log(`Number of transactions to get info on: ${logs.length}`);

    const transactions: { transaction_hash: string, transaction_from: string, transaction_to: string }[] = [];
    for (let i = 0; i < transactionHashList.length; i++) {
        console.log(`Fetching transaction ${transactionHashList[i]}`);
        const transaction = await publicClient.getTransaction({
            hash: transactionHashList[i],
        });

        transactions.push({
            transaction_hash: transaction.hash,
            transaction_from: transaction.from ?? '',
            transaction_to: transaction.to ?? ''
        });
    }

    console.log("Joining all together for the full table")
    const fullTable: string = logs.map((log: any) => {
        const matchingTransaction = transactions.find((transaction: any) => transaction.transaction_hash === log.transactionHash);
        const matchingBlock = blocks.find((block: any) => block.block_number === log.blockNumber);

        return `${log.blockHash},${log.blockNumber.toString()},${matchingBlock?.block_time},${matchingBlock?.block_date},${log.address},${log.transactionHash},${matchingTransaction ? matchingTransaction.transaction_from : ''},${matchingTransaction ? matchingTransaction.transaction_to : ''},${log.transactionIndex.toString()},${log.logIndex.toString()},${log.topics[0] || ''},${log.topics.length > 1 ? log.topics[1] : ''},${log.topics.length > 2 ? log.topics[2] : ''},${log.topics.length > 3 ? log.topics[3] : ''},${log.data},${log.removed.toString()}`;
    }).join('\n');

    // CSV header
    const csvHeader: string = 'block_hash,block_number,block_time,block_date,contract_address,tx_hash,tx_from,tx_to,tx_index,log_index,topic0,topic1,topic2,topic3,data,removed\n';

    const csv: string = csvHeader + fullTable;
    console.log(csv);

    // Approximate size in bytes (assuming UTF-16, 2 bytes per character)
    const sizeInBytes: number = new TextEncoder().encode(csv).length;
    const sizeInMegabytes: number = sizeInBytes / (1024 * 1024);

    console.log(`CSV Size: ${sizeInMegabytes.toFixed(2)} MB`);

    // Upload CSV to Dune
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
            table_name: "jackie_test_byop_base_all_events_raw",
            is_private: true
        })
    };

    console.log("Uploading to Dune...")
    fetch('https://api.dune.com/api/v1/table/upload/csv', options)
        .then(response => response.json())
        .then(response => console.log(response))
        .catch(err => console.error(err));
}

main().catch(console.error);
