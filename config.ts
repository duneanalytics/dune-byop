export interface Config {
    contractAddress: string;
    contractDeployedBlock: bigint;
    nodeProviderURL: string;
    NODE_API_MAX_RANGE: bigint;
    blockChunkSize: number;
    txnChunkSize: number;
    localFileName: string;
    duneTableName: string;
}

// // UniswapV3 PoolFactory
// const config: Config = {
//     contractAddress: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD', // UniswapV3 PoolFactory https://parsec.fi/address/0x33128a8fc17869897dce68ed026d694621f6fdfd
//     nodeProviderURL: 'https://quaint-rough-layer.base-mainnet.quiknode.pro/',
//     contractDeployedBlock: 1371680n,
//     NODE_API_MAX_RANGE: 9999n, // QuickNode has 10k blocks limit
//     blockChunkSize: 5000,
//     txnChunkSize: 5000,
//     localFileName: 'uniswapV3_Pool_Factory_logs.csv',
//     duneTableName: 'jackie_byop_mvp_uniswapv3_pool_factory_base_all_events_raw'
// };

// UniswapV3 ETH/USDC 10
const config: Config = {
    contractAddress: '0xd0b53D9277642d899DF5C87A3966A349A798F224', // UniswapV3 ETH/USDC 10: https://parsec.fi/address/0xd0b53D9277642d899DF5C87A3966A349A798F224#events
    nodeProviderURL: 'https://quaint-rough-layer.base-mainnet.quiknode.pro/',
    contractDeployedBlock: 3620407n,
    NODE_API_MAX_RANGE: 9999n, // QuickNode has 10k blocks limit
    blockChunkSize: 5000,
    txnChunkSize: 5000,
    localFileName: 'uniswapV3_ETH_USDC_10_logs.csv',
    duneTableName: 'jackie_byop_mvp_uniswapv3_ETHUSDC_10_base_all_events_raw'
};

export default config;
