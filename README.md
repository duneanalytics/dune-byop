# Dune BYOP (Bring Your Own Protocol)

Leverage this TypeScript-based tool, powered by [Viem](https://viem.sh/docs/getting-started), to seamlessly upload protocol data onto Dune for comprehensive analysis. Designed for protocols on chains not indexed by Dune, this script facilitates easy data extraction from RPC providers and upload to Dune, allowing for enriched data analysis by combining your protocol's data with existing on-chain information.

## Setup Instructions

Follow these steps to configure your environment and prepare the script for use:

### 1. Clone the Repository

Start by cloning this repository to your local machine:

```bash
git clone <repository-url>

```

### 2. Set up `.env` file

[Obtain a Dune API key](https://dune.mintlify.app/api-reference/overview/authentication#generate-an-api-key) and get your RPC URL ready. Create a `.env` file in the root directory and put these two values in there. See `.env.sample` for an example.

### 3. Configure `config.yml`

Specify protocol specifics of the contract you'd like to BYOP for in the `config.yml` file located in the root directory:

- **contractAddress**: Specify the contract address of your protocol.
- **duneTableName**: Define a name for the dataset to be uploaded to Dune. This name must begin with `dataset_` and only include lowercase letters, digits, and underscores.
- **duneTableNamespace**: Indicate the namespace under which the table will be organized in Dune. This is the user or team account handle you created the API with.
- **contractDeployedBlock**: Enter the deployment block of your contract. If unknown, Dune's AI can assist in finding this information. E.g. [Go to Dune AI](https://dune.com/ai) and ask "What is the block for which contract 0xd0b53D9277642d899DF5C87A3966A349A798F224 is deployed on the base chain?"

## How to Use

This repository consists of two primary scripts that helps to bring your protocol data to Dune.

### Preparing Your Data

1. **Backfill Data**: The `run_backfill.ts` script fetches data from your specified RPC endpoint and saves it locally in a CSV file. This file is named according to your `duneTableName` configuration.

   To execute the backfill process, run:

   ```bash
   pnpm backfill
   ```

2. **Review the CSV Data**: Before proceeding to upload, it's recommended to review the CSV file to ensure data accuracy and completeness.

### Uploading Your Data

1. **Upload to Dune**: Once you're satisfied with the data collected, use the `pnpm upload` command to upload the CSV data to Dune, where it will be stored under the specified table name and namespace.

   ```bash
   pnpm upload
   ```

## Important Considerations

- **RPC Endpoint Limits**: Different RPC providers have unique limits. Adapt the script parameters in `src/backfill.ts` to match your RPC endpoint's specifications. This includes adjusting `blockChunkSize`, `txnChunkSize`, and `nodeMaxRange` to fit within your RPC provider's limits.
- **Table Management**: Should you need to remove a table created in error, go to Dune's webapp -> Settings -> Data, and delete the table from there.
- **Data Utilization**: After uploading, your data is ready for querying in Dune. Use the specified table name and namespace to integrate this data into your analyses and dashboards.

## See It in Action

For a practical demonstration of the uploaded data's potential, visit the [BYOP Demo Dashboard](https://dune.com/dune/byop-demo).

---

### For Contributors

I've set up four types of issues right now:

- `bugs`: if you spot a bug in the scripts.
- `improvement` : if you want to make an improvement for the scripts.
- `generic questions`: This is a catch all for other questions or suggestions you may have about the BYOP repo.

If you want to contribute, either start an issue or go directly into making a PR (using the same labels as above).
