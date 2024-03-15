const fs = require('fs');
import * as dotenv from 'dotenv';

interface CreateQueryRequest {
    name: string;
    query_sql: string;
}

dotenv.config();
const dune_api_key = process.env.DUNE_API_KEY as string; 

async function createLogsTable(duneTableNamespace: string, duneTableName: string, apiKey: string){
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

    try {
        const response = await fetch(url, options);
        const json = await response.json();
        
        if (!response.ok) {
            console.error("Error creating table:", json);
            // throw new Error(`Failed to create table: ${json.error || 'Unknown error'}`); // TODO decide if we want to throw an error here, prolly not
        } else {
            console.log(`Table created: dune.${duneTableNamespace}.${duneTableName}`);
        }
    } catch (error) {
        throw error; // Rethrow the error to be caught by the caller
    }
    
}


async function createDuneQuery(apiKey: string, sql: string): Promise<number> {
    const queryRequest: CreateQueryRequest = {name: 'temp', query_sql: sql};

    console.log(`queryRequest: ${JSON.stringify(queryRequest)}`)
    const options = {
        method: 'POST',
        headers: {
            'X-DUNE-API-KEY': apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(queryRequest)
    };

    try {
        const response = await fetch('https://api.dune.com/api/v1/query', options);
        if (!response.ok) {
            throw new Error(`Failed to create query: ${response.statusText}`);
        }
        const responseData = await response.json();
        console.log('Query created:', responseData);
        return responseData.query_id;
    } catch (error) {
        throw error;
    }
}

async function fetchDuneQuery(apiKey: string, queryId: number): Promise<number> {
    const executeEndpoint = `https://api.dune.com/api/v1/query/${queryId}/execute`;
    const statusEndpointBase = "https://api.dune.com/api/v1/execution/";
    const resultEndpointBase = "https://api.dune.com/api/v1/execution/";

    // Step 1: Trigger an execution through the execute endpoint
    const executeOptions = {
        method: 'POST',
        headers: {
            'X-DUNE-API-KEY': apiKey,
            'Content-Type': 'application/json'
        }
    };

    let executionId: string | undefined;
    try {
        const executeResponse = await fetch(executeEndpoint, executeOptions);
        if (!executeResponse.ok) {
            throw new Error(`Failed to execute query: ${executeResponse.statusText}`);
        }
        const executeData = await executeResponse.json();
        executionId = executeData.execution_id;
        console.log(`Execution for queryId ${queryId} started with ID: ${executionId}`);
    } catch (error) {
        throw new Error(`Failed to trigger execution: ${error}`);
    }

    // Step 2: Poll the status of the execution until it finishes
    if (!executionId) {
        throw new Error("Execution ID not found");
    }
    const statusEndpoint = `${statusEndpointBase}${executionId}/status`;

    let executionState: string | undefined;
    while (true) {
        try {
            const statusResponse = await fetch(statusEndpoint, {
                headers: {
                    'X-DUNE-API-KEY': apiKey
                }
            });
            if (!statusResponse.ok) {
                throw new Error(`Failed to fetch execution status: ${statusResponse.statusText}`);
            }
            const statusData = await statusResponse.json();
            executionState = statusData.state;

            if (executionState === "QUERY_STATE_COMPLETED") {
                console.log("Execution completed");
                break;
            } else if (executionState === "QUERY_STATE_ERROR") {
                throw new Error(`Execution failed: ${statusData.error}`);
            } else if (executionState === "QUERY_STATE_FAILED") {
                console.log("Query to fetch latest block number failed, so default start block number to be 0.")
                return 0; 
            } 
            else {
                console.log(`Execution state: ${executionState}`);
                await new Promise(resolve => setTimeout(resolve, 3000)); // Poll every 3 seconds
            }
        } catch (error) {
            throw new Error(`Error while polling execution status: ${error}`);
        }
    }

    // Step 3: Fetch the result of the execution through the result endpoint
    const resultEndpoint = `${resultEndpointBase}${executionId}/results?limit=1`;
    try {
        const resultResponse = await fetch(resultEndpoint, {
            headers: {
                'X-DUNE-API-KEY': apiKey
            }
        });
        if (!resultResponse.ok) {
            throw new Error(`Failed to fetch execution result: ${resultResponse.statusText}`);
        }
        const resultData = await resultResponse.json();
        const result = resultData.result.rows[0]._col0; 
        return parseInt(result, 10);
    } catch (error) {
        throw new Error(`Error while fetching execution result: ${error}`);
    }
}

async function archiveQuery(apiKey: string, queryId: number) {
    const url = `https://api.dune.com/api/v1/query/${queryId}/archive`;
    const options = {
        method: 'POST',
        headers: {
            'X-DUNE-API-KEY': apiKey,
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await fetch(url, options);
        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to archive query: ${response.statusText}`);
        }
        console.log(`Successfully archived queryId: ${responseData.query_id}`);
    } catch (error) {
        // Handle any errors
        console.error("Error archiving query:", error);
        throw error;
    }
}


async function uploadChunkToDune(chunk: string, apiKey: string, duneTableNamespace: string, duneTableName: string) {
    /*
    This function uploads a chunk of a CSV file to Dune as a table.
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
        const response = await fetch(url, options)
        const json = await response.json()
            
        if (!response.ok) {
            console.error("Error uploading CSV to Dune:", json);
        } else {
            console.log("Upload successful:", json);
        }
    } catch (error) {
        console.error("Error uploading CSV to Dune:", error);
    }
}

async function splitCSVIntoChunks(filePath: string, chunkSizeInLines: number, startBlockNumber: number, apiKey: string, duneTableNamespace: string, duneTableName: string) {
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
    let blockNumberFound = false;

    for await (const line of lineReader) {
        if (isFirstChunk) {
            header = line;
            isFirstChunk = false;
        } else if (!blockNumberFound) {
            const blockNumber = parseInt(line.split(',')['1']);
            if (blockNumber > startBlockNumber) {
                console.log('Start block_number found:', blockNumber);
                blockNumberFound = true;
            } else {
                continue;
            }
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
            await uploadChunkToDune(currentChunk.join('\n'), apiKey, duneTableNamespace, duneTableName);
            
            currentChunk = []; // Reset chunk
        }
    }

    // Save the last chunk to a CSV file
    const chunkFilename = `test_${chunkCounter}.csv`;
    if (header) {
        // Add header as the first line of the chunk
        currentChunk.unshift(header);
    }
    fs.writeFileSync(chunkFilename, currentChunk.join('\n'));
    
    // Upload the last chunk to Dune
    await uploadChunkToDune(currentChunk.join('\n'), apiKey, duneTableNamespace, duneTableName); 


}

export async function uploadDataToDune(
    duneTableNamespace: string,
    duneTableName: string
): Promise<void> {
    console.log(`Creating table dune.${duneTableNamespace}.${duneTableName} on Dune...`);
    try {
        // Call the function to create the table
        await createLogsTable(duneTableNamespace, duneTableName, dune_api_key);

        // Chunk insert the CSV to Dune, 200K lines per chunk
        const chunkSizeInLines = 200_000;
        const filePath = `./${duneTableName}.csv`;
        console.log('Reading from saved file:', filePath);

        // Fetch latest block number from Dune table
        const queryId = await createDuneQuery(dune_api_key, `select max(block_number) from dune.${duneTableNamespace}.${duneTableName}`); 
        const latestBlockNumber = await fetchDuneQuery(dune_api_key, queryId) || 0
        console.log('latestBlockNumber:', latestBlockNumber)
        await archiveQuery(dune_api_key, queryId) 

        // Upload from the latest block number in chunks
        const startBlockNumber = latestBlockNumber
        console.log(`Starting to split CSV and upload in chunk from after this block number: ${startBlockNumber} ...`)
        await splitCSVIntoChunks(filePath, chunkSizeInLines, startBlockNumber, dune_api_key, duneTableNamespace, duneTableName);
        

    } catch (error) {
        console.error(error);
    }
}