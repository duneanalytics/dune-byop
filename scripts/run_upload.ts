import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
const yaml = require('js-yaml');
import { uploadDataToDune } from '../src/upload';

dotenv.config();

async function main() {

    // let {duneTableName, duneTableNamespace } = config;
    // Load the YAML configuration
    const configPath = path.join(__dirname, '..', 'config.yml'); // Adjusted path
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContents) as any;

    const startTime: number = Date.now();

    // Loop through each contract and run the backfill
    for (const { duneTableName, duneTableNamespace } of config.contracts) {
        console.log('================================================');
        console.log('Running upload for')
        console.log('duneTableName:', duneTableName);
        console.log('duneTableNamespace:', duneTableNamespace);
        
        console.log('\n')

        try {
            // Once fetchDataFromRPC() completes, call uploadDataToDune()
            await uploadDataToDune(duneTableNamespace, duneTableName);

        } catch (error) {
            console.error('An error occurred:', error);
        } 
    }

    const endTime: number = Date.now();
    console.log(`Uploading data to Dune took ${(endTime - startTime) / 60000} minutes\n`);
    console.log('================================================\n\n')
}

main().catch(console.error);