import { createPublicClient, http, parseAbi, parseAbiItem } from 'viem'
import { mainnet } from 'viem/chains'
import * as dotenv from 'dotenv';

dotenv.config();

export const publicClient = createPublicClient({
    chain: mainnet,
    transport: http('https://eth-mainnet.g.alchemy.com/v2/RyMo60-cLKdpoQxbAiCUt3m9pQjPVnX4')
})

async function main() {
    /**
     * 1. Get the contract deployment block number (not in this script)
     * 2. Call getLogs to grab logs info and the transactionHash, blockNumber
     * 3. call getTransaction to grab tx_from and tx_to 
     * 4. call getBlock to grab timestamp, then convert to block_time and block_date 
     */

    const currentBlockNumber = 19073790n //await publicClient.getBlockNumber()

    let fromBlock = 19072790n;
    let toBlock = fromBlock + 799n; // max range is 800

    const logs = [];

    // while (toBlock <= currentBlockNumber) {
    console.log(`Fetching logs from block ${fromBlock} to ${toBlock}`);
    const result = await publicClient.getLogs({
        address: '0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc',
        events: parseAbi([
            'event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)',
            'event Sync(uint112 reserve0, uint112 reserve1)',
            'event Approval(address indexed owner, address indexed spender, uint256 value)',
            'event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to)',
            'event Mint(address indexed sender, uint256 amount0, uint256 amount1)',
            'event Transfer(address indexed from, address indexed to, uint256 value)'

        ]),
        fromBlock,
        toBlock
    });
    logs.push(...result);
    // fromBlock = toBlock + 1n;
    // toBlock = fromBlock + 799n; //TODO someone check my math here plz
    // }

    // console.log(logs)

    const transactionHashList = logs.map(log => log.transactionHash);
    const blockNumberList = logs.map(log => log.blockNumber);

    const transactions: { transaction_hash: string, transaction_from: string, transaction_to: string }[] = [];
    for (let i = 0; i < transactionHashList.length; i++) {
        const transaction = await publicClient.getTransaction({
            hash: transactionHashList[i],
        });

        transactions.push({
            transaction_hash: transaction.hash,
            transaction_from: transaction.from ?? '',
            transaction_to: transaction.to ?? ''
        });
    }

    const blocks: { block_number: BigInt, block_time: string, block_date: string }[] = [];
    for (let i = 0; i < blockNumberList.length; i++) {
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

    const fullTable = logs.map(log => {
        const matchingTransaction = transactions.find(transaction => transaction.transaction_hash === log.transactionHash);
        const matchingBlock = blocks.find(block => block.block_number === log.blockNumber);

        return `${log.blockHash},${log.blockNumber.toString()},${matchingBlock?.block_time},${matchingBlock?.block_date},${log.address},${log.eventName},${log.transactionHash},${matchingTransaction ? matchingTransaction.transaction_from : ''},${matchingTransaction ? matchingTransaction.transaction_to : ''},${log.transactionIndex.toString()},${log.logIndex.toString()},${log.topics[0] || ''},${log.topics.length > 1 ? log.topics[1] : ''},${log.topics.length > 2 ? log.topics[2] : ''},${log.topics.length > 3 ? log.topics[3] : ''},${log.data},${log.removed.toString()}`;
    }).join('\n');

    // console.log(fullTable)


    // CSV header
    const csvHeader = 'block_hash,block_number,block_time,block_date,contract_address,event_name,tx_hash,tx_from,tx_to,tx_index,log_index,topic0,topic1,topic2,topic3,data,removed\n';

    // // Convert logs to CSV
    // const csvRows = logs.map(log => {
    //     const topics = log.topics as string[];

    //     return [
    //         log.blockHash,
    //         log.blockNumber.toString(),
    //         block_time,
    //         block_date,
    //         log.address,
    //         log.eventName,
    //         log.transactionHash,
    //         transaction.from ?? '',
    //         transaction.to ?? '',
    //         log.transactionIndex.toString(),
    //         log.logIndex.toString(),
    //         topics[0] || '',
    //         topics.length > 1 ? topics[1] : null,
    //         topics.length > 2 ? topics[2] : null,
    //         topics.length > 3 ? topics[3] : null,
    //         log.data,
    //         log.removed.toString()
    //     ].join(',');
    // }).join('\n');

    const csv = csvHeader + fullTable;
    console.log(csv);

    // Approximate size in bytes (assuming UTF-16, 2 bytes per character)
    const sizeInBytes = new TextEncoder().encode(csv).length;
    const sizeInMegabytes = sizeInBytes / (1024 * 1024);

    console.log(`CSV Size: ${sizeInMegabytes.toFixed(2)} MB`);

    // Upload CSV to Dune
    const apiKey = process.env.DUNE_API_KEY; // Assuming the API key is stored in an environment variable
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };

    if (apiKey) {
        headers['X-DUNE-API-KEY'] = apiKey;
    }

    const options = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            data: csv,
            table_name: "jackie_test_byop_two_event_not_decoded",
            is_private: true
        })
    };

    fetch('https://api.dune.com/api/v1/table/upload/csv', options)
        .then(response => response.json())
        .then(response => console.log(response))
        .catch(err => console.error(err));

}

main();