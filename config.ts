export interface Config {
    chainSelected: string;
    contractAddress: string;
    contractDeployedBlock: bigint;
    nodeProviderURL: string;
    NODE_API_MAX_RANGE: bigint;
    blockChunkSize: number;
    txnChunkSize: number;
    localFileName: string;
    duneTableName: string;
    duneTableNamespace: string;
}

// TODO define your own config here
const config: Config = {
    chainSelected: '<pick a chain>',
    contractAddress: '<input contract address>', 
    nodeProviderURL: '<your node provider URL for your chain>',
    contractDeployedBlock: 1n, // input contract deployed block as bigint
    NODE_API_MAX_RANGE: 9999n, // input max range for your node provider as bigint
    blockChunkSize: 5000, // input block chunk size as number
    txnChunkSize: 5000, // input transaction chunk size as number
    localFileName: '<input file name you want to save the pulled data in>.csv', 
    duneTableName: '<input the table you want this data to live on Dune.com>', // must start with dataset_
    duneTableNamespace:'<input the namespace aka account your API controls and the data will live under, this should be your team handle on Dune>'
};


// // Dmail Mail Executor
// const config: Config = {
//     chainSelected: 'base',
//     contractAddress: '0x47fbe95e981C0Df9737B6971B451fB15fdC989d9', // Dmail mail executor https://basescan.org/address/0x47fbe95e981c0df9737b6971b451fb15fdc989d9
//     nodeProviderURL: 'https://quaint-rough-layer.base-mainnet.quiknode.pro/',
//     contractDeployedBlock: 5409792n,
//     NODE_API_MAX_RANGE: 9999n, // QuickNode has 10k blocks limit
//     blockChunkSize: 5000,
//     txnChunkSize: 5000,
//     localFileName: 'dmail_mail_executor_logs.csv',
//     duneTableName: 'dataset_jackie_byop_mvp_dmail_mail_executor_logs_base_all_events_raw', // must start with dataset_
//     duneTableNamespace:'dune'
// };


// // UniswapV3 PoolFactory
// const config: Config = {
//     chainSelected: 'base',
//     contractAddress: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD', // UniswapV3 PoolFactory https://parsec.fi/address/0x33128a8fc17869897dce68ed026d694621f6fdfd
//     nodeProviderURL: 'https://quaint-rough-layer.base-mainnet.quiknode.pro/',
//     contractDeployedBlock: 1371680n,
//     NODE_API_MAX_RANGE: 9999n, // QuickNode has 10k blocks limit
//     blockChunkSize: 5000,
//     txnChunkSize: 5000,
//     localFileName: 'uniswapV3_Pool_Factory_logs.csv',
//     duneTableName: 'dataset_jackie_byop_mvp_uniswapv3_pool_factory_base_all_events_raw_updated', // must start with dataset_
//     duneTableNamespace:'dune'
// };

// // UniswapV3 ETH/USDC 10
// const config: Config = {
//     chainSelected: 'base',
//     contractAddress: '0xd0b53D9277642d899DF5C87A3966A349A798F224', // UniswapV3 ETH/USDC 10: https://parsec.fi/address/0xd0b53D9277642d899DF5C87A3966A349A798F224#events
//     nodeProviderURL: 'https://quaint-rough-layer.base-mainnet.quiknode.pro/',
//     contractDeployedBlock: 3620407n,
//     NODE_API_MAX_RANGE: 9999n, // QuickNode has 10k blocks limit
//     blockChunkSize: 5000,
//     txnChunkSize: 5000,
//     localFileName: 'uniswapV3_ETH_USDC_10_logs.csv',
//     duneTableName: 'dateset_jackie_byop_mvp_uniswapv3_ETHUSDC_10_base_all_events_raw_updated', // must start with dataset_
// };

export default config;
