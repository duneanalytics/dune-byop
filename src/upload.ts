const fs = require('fs');
import * as dotenv from 'dotenv';
import * as readline from 'readline'; 

dotenv.config();
const dune_api_key = process.env.DUNE_API_KEY as string;

function createLogsTable(duneTableNamespace: string, duneTableName: string, apiKey: string): void {
    /*
    This function creates a table with the basic Ethereum logs structure and also transaction from and to fields.
    */
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
        //@TODO: add gas, gas used, gas price, and tx data fields
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
    /*
    This function uploads a chunk of a CSV file to Dune as a table.
    @TODO: upload only from specific block number? read from dune to get latest block number and start from there?
    */
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
    /*
    This function reads a CSV file and splits it into chunks of a specified size and then uploads each chunk to Dune as a table.
    */
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

export async function uploadDataToDune(
    duneTableNamespace: string,
    duneTableName: string
): Promise<void> {
    (async () => {
        console.log(`Creating table dune.${duneTableNamespace}.${duneTableName} on Dune...`);
        try {
            // Call the function to create the table
            await createLogsTable(duneTableNamespace, duneTableName, dune_api_key);

            // Wait for createLogsTable to finish before proceeding
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Chunk insert the CSV to Dune, 200K lines per chunk
            const chunkSizeInLines = 200_000;
            const filePath = `./${duneTableName}.csv`;
            console.log('Reading from saved file:', filePath);
            splitCSVIntoChunks(filePath, chunkSizeInLines, dune_api_key, duneTableNamespace, duneTableName);

        } catch (error) {
            console.error("Error creating table:", error);
        }
    })();
}