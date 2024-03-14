import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
const yaml = require('js-yaml');
import { fetchDataFromRPC } from '../src/backfill';

dotenv.config();

async function main() {

    // Load the YAML configuration
    const configPath = path.join(__dirname, '..', 'config.yml'); // Adjusted path
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContents) as any;

    const startTime: number = Date.now();

    // Loop through each contract and run the backfill
    for (const { contractAddress, duneTableName, contractDeployedBlock } of config.contracts) {
        console.log('================================================');
        console.log('Running backfill for');
        console.log('contractAddress:', contractAddress);
        console.log('duneTableName:', duneTableName);
        console.log('contractDeployedBlock:', contractDeployedBlock);
        console.log('\n');

        try {
            const convertedStartBlock = BigInt(contractDeployedBlock);
            await fetchDataFromRPC(duneTableName, contractAddress, convertedStartBlock);
        } catch (error) {
            console.error('An error occurred:', error);
        }

        
    }
    const endTime: number = Date.now();
    console.log(`Running backfill for took ${(endTime - startTime) / 60000} minutes\n`);
    console.log('================================================\n\n');
}

main().catch(console.error);