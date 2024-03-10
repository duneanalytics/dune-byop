export interface Config {
    contractAddress: string;
    duneTableName: string;
    duneTableNamespace: string;
}

// Define the contract and table upload details
const config: Config = {
    contractAddress: '<input contract address>', 
    duneTableName: 'dataset_<contract name>', // must start with dataset_
    duneTableNamespace:'<handle that API key belongs to>'
};


// @TODO: we should make this a yaml where you can specify multiple contracts, or just event topics in the case of many contracts/factories
// // UniswapV3 PoolFactory
// const config: Config = {
//     contractAddress: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD', // UniswapV3 PoolFactory https://parsec.fi/address/0x33128a8fc17869897dce68ed026d694621f6fdfd
//    // contractDeployedBlock: 1371680n,
//     duneTableName: 'dataset_jackie_byop_mvp_uniswapv3_pool_factory_base_all_events_raw_updated', // must start with dataset_
//     duneTableNamespace:'dune'
// };

// // UniswapV3 ETH/USDC 10
// const config: Config = {
//     contractAddress: '0xd0b53D9277642d899DF5C87A3966A349A798F224', // UniswapV3 ETH/USDC 10: https://parsec.fi/address/0xd0b53D9277642d899DF5C87A3966A349A798F224#events
//    // contractDeployedBlock: 3620407n,
//     duneTableName: 'dateset_jackie_byop_mvp_uniswapv3_ETHUSDC_10_base_all_events_raw_updated', // must start with dataset_
//     duneTableNamespace:'dune'
// };

export default config;
