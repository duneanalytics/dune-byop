const fs = require('fs');
import config from './config';
import * as dotenv from 'dotenv';
import { fetchDataFromRPC } from './src/backfill';
import { uploadDataToDune } from './src/upload';

dotenv.config();

async function main() {

    let { contractAddress, duneTableName, duneTableNamespace } = config;

    console.log('================================================');
    console.log('Starting BYOP for')
    console.log('contractAddress:', contractAddress);
    console.log('duneTableName:', duneTableName);
    console.log('duneTableName:', duneTableNamespace);
    console.log('================================================\n')

    try {
        // Call fetchDataFromRPC() and wait for it to complete
        await fetchDataFromRPC(duneTableName, contractAddress);
        
        // Once fetchDataFromRPC() completes, call uploadDataToDune()
        await uploadDataToDune(duneTableNamespace, duneTableName);

    } catch (error) {
        console.error('An error occurred:', error);
    } 
}

main().catch(console.error);