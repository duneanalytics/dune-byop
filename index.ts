const fs = require('fs');
import config from './config';
import * as dotenv from 'dotenv';
import { fetchDataFromRPC } from './src/pull_data_from_rpc';
import { uploadDataToDune } from './src/upload_data_to_dune';

dotenv.config();


async function main() {

    let { contractAddress, nodeProviderURL, contractDeployedBlock, NODE_API_MAX_RANGE, blockChunkSize, txnChunkSize, localFileName, duneTableName, duneTableNamespace } = config;

    console.log('================================================');
    console.log('Starting BYOP for')
    console.log('contractAddress:', contractAddress);
    console.log('nodeProviderURL:', nodeProviderURL);
    console.log('contractDeployedBlock:', contractDeployedBlock);
    console.log('NODE_API_MAX_RANGE:', NODE_API_MAX_RANGE);
    console.log('blockChunkSize:', blockChunkSize);
    console.log('txnChunkSize:', txnChunkSize);
    console.log('localFileName:', localFileName);
    console.log('duneTableName:', duneTableName);
    console.log('duneTableName:', duneTableNamespace);
    console.log('================================================\n')

    try {
        // Call fetchDataFromRPC() and wait for it to complete
        await fetchDataFromRPC();
        
        // Once fetchDataFromRPC() completes, call uploadDataToDune()
        await uploadDataToDune();

    } catch (error) {
        console.error('An error occurred:', error);
    } 


}

main().catch(console.error);