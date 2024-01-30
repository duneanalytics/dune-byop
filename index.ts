import { createPublicClient, http, parseAbiItem } from 'viem'
import { mainnet } from 'viem/chains'
import * as dotenv from 'dotenv';

dotenv.config();

export const publicClient = createPublicClient({
    chain: mainnet,
    transport: http()
})

async function main() {
    const logs = await publicClient.getLogs({
        address: '0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc',
        event: parseAbiItem('event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)'),
        blockHash: '0x6bd38cd96a967ec730acbbccc12564c769ccd03fcbeb702b3ef646044625a0bd'
    })

    // CSV header
    const csvHeader = 'block_hash,block_number,contract_address,event_name,tx_hash,tx_from,tx_to,tx_index,log_index,topic0,topic1,topic2,topic3,data,removed\n';

    // Convert logs to CSV
    const csvRows = logs.map(log => {
        const topics = log.topics as string[];

        return [
            log.blockHash,
            log.blockNumber.toString(),
            log.address,
            log.eventName,
            log.transactionHash,
            log.args.sender,
            log.args.to,
            log.transactionIndex.toString(),
            log.logIndex.toString(),
            topics[0] || '',
            topics.length > 1 ? topics[1] : null,
            topics.length > 2 ? topics[2] : null,
            topics.length > 3 ? topics[3] : null,
            log.data,
            log.removed.toString()
        ].join(',');
    }).join('\n');

    const csv = csvHeader + csvRows;
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
            table_name: "jackie_test_byop_single_event_not_decoded",
            is_private: true
        })
    };

    fetch('https://api.dune.com/api/v1/table/upload/csv', options)
        .then(response => response.json())
        .then(response => console.log(response))
        .catch(err => console.error(err));
}

main();