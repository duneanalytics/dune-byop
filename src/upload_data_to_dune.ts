const fs = require('fs');
import config from '../config';
import * as dotenv from 'dotenv';
import * as readline from 'readline'; 

dotenv.config();
let { localFileName, duneTableName, duneTableNamespace } = config;
const dune_api_key = process.env.DUNE_API_KEY as string;


export async function uploadDataToDune(): Promise<void> {
    // =================================================================
    /**
     * Upload CSV to Dune
     */

    function createTable(duneTableNamespace: string, duneTableName: string, apiKey: string): void {
        const url = `https://api.dune.com/api/v1/table/${duneTableNamespace}/${duneTableName}/create`;

        const schema = [
            { name: "block_hash", type: "varchar" },
            { name: "block_number", type: "integer" },
            { name: "block_time", type: "timestamp" },
            { name: "block_date", type: "timestamp" },
            { name: "contract_address", type: "varchar" },
            { name: "tx_hash", type: "varchar" },
            { name: "tx_from", type: "varchar" },
            { name: "tx_to", type: "varchar" },
            { name: "tx_index", type: "integer" },
            { name: "log_index", type: "integer" },
            { name: "topic0", type: "varchar" },
            { name: "topic1", type: "varchar" },
            { name: "topic2", type: "varchar" },
            { name: "topic3", type: "varchar" },
            { name: "data", type: "varchar" }
        ];

        const body = {
            is_private: false,
            schema: schema
        };

        const headers = {
            'X-DUNE-API-KEY': apiKey,
            'Content-Type': 'application/json'
        };

        const options = {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        };

        fetch(url, options)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("Table created:", data);
            })
            .catch(error => {
                console.error("Error creating table:", error);
            });
    }


    function uploadChunkToDune(chunk: string, apiKey: string, duneTableNamespace: string, duneTableName: string): void {
        const url = `https://api.dune.com/api/v1/table/${duneTableNamespace}/${duneTableName}/insert`;
        const headers = {
            'X-DUNE-API-KEY': apiKey,
            'Content-Type': 'text/csv'
        };
    
        console.log("Uploading chunk to Dune...");
    
        const options = {
            method: 'POST',
            headers: headers,
            body: chunk 
        };
    
        try {
            fetch(url, options)
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(errorData => {
                            console.error("Error uploading CSV to Dune (inner):", errorData);
                        });
                    } else {
                        return response.json().then(responseData => {
                            console.log("Upload successful:", responseData);
                        });
                    }
                })
                .catch(error => {
                    console.error("Error uploading CSV to Dune (outer):", error);
                });
        } catch (error) {
            console.error("Error uploading CSV to Dune (outer):", error);
        }
    }

    function splitCSVIntoChunks(filePath: string, chunkSizeInLines: number, apiKey: string, duneTableNamespace: string, duneTableName: string): void {
        const fs = require('fs');
        const readline = require('readline');
    
        const lineReader = readline.createInterface({
            input: fs.createReadStream(filePath, 'utf8'),
            crlfDelay: Infinity,
        });
    
        let currentChunk: string[] = [];
        let isFirstChunk = true;
        let chunkCounter = 1;
        let header: string | null = null;
    
        lineReader.on('line', (line: string) => {
            if (isFirstChunk) {
                header = line;
                isFirstChunk = false;
            } else {
                currentChunk.push(line);
            }
    
            if (currentChunk.length >= chunkSizeInLines) {
                const chunkFilename = `test_${chunkCounter}.csv`;
                if (header) {
                    // Add header as the first line of the chunk
                    currentChunk.unshift(header);
                }
                fs.writeFileSync(chunkFilename, currentChunk.join('\n'));
                chunkCounter++;
    
                // Upload current chunk to Dune
                uploadChunkToDune(currentChunk.join('\n'), apiKey, duneTableNamespace, duneTableName);
                
                currentChunk = []; // Reset chunk
            }
        });
    
        lineReader.on('close', () => {
            // Save the last chunk to a CSV file
            const chunkFilename = `test_${chunkCounter}.csv`;
            if (header) {
                // Add header as the first line of the chunk
                currentChunk.unshift(header);
            }
            fs.writeFileSync(chunkFilename, currentChunk.join('\n'));
            
            // Upload the last chunk to Dune
            uploadChunkToDune(currentChunk.join('\n'), apiKey, duneTableNamespace, duneTableName);
        });
    }


    // Call the function to create the table
    (async () => {
        console.log(`Creating table dune.${duneTableNamespace}.${duneTableName} on Dune...`);
        try {
            await createTable(duneTableNamespace, duneTableName, dune_api_key);
            
            // Chunk insert the CSV to Dune, 200K lines per chunk
            const chunkSizeInLines = 200_000;
            const filePath = `./${localFileName}`;
            console.log('Reading from saved file:', filePath);
            splitCSVIntoChunks(filePath, chunkSizeInLines, dune_api_key, duneTableNamespace, duneTableName);

        } catch (error) {
            console.error("Error creating table:", error);
        }

    })();
}