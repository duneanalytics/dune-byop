This repo is a script written in Typescript using [Viem](https://viem.sh/docs/getting-started) to quickly upload your protocol data onto Dune so you can start analyzing. 

The idea is simple - if you are trying to analyze a protocol's data that exist on a chain that Dune does not yet index, you can pull events data from RPC providers and upload to Dune easily, so that you can join the with other existing onchain daa to draw insights.

This graph illustrates a basic flow with BYOP (bring your own protocol).
![BYOP MVP Flow](https://github.com/agaperste/viem-scripts/assets/5827114/aa06967b-eb91-4dc4-8d0d-7c0440c7019c)

We illustrate how to use this script with an example flow here.
![BYOP MVP Example](https://github.com/agaperste/viem-scripts/assets/5827114/6b9f53ca-2de4-4bb1-9dd9-0860c2cc1e7d)

Here is the resulted example dashboard from this process. https://dune.com/dune/byop-demo
