// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/IDRX.sol";
import "../src/ArminaReputation.sol";
import "../src/ArminaFactory.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy IDRX token
        IDRX idrx = new IDRX();
        console.log("IDRX deployed to:", address(idrx));

        // 2. Deploy Reputation NFT
        ArminaReputation reputation = new ArminaReputation();
        console.log("ArminaReputation deployed to:", address(reputation));

        // 3. Deploy Factory
        ArminaFactory factory = new ArminaFactory(address(idrx), address(reputation));
        console.log("ArminaFactory deployed to:", address(factory));

        // 4. Transfer reputation ownership to factory for pool authorization
        // Note: Factory will authorize pools automatically when created

        vm.stopBroadcast();

        // Output addresses for .env
        console.log("\n--- Copy these to .env.local ---");
        console.log("NEXT_PUBLIC_IDRX_ADDRESS=", address(idrx));
        console.log("NEXT_PUBLIC_FACTORY_ADDRESS=", address(factory));
        console.log("NEXT_PUBLIC_REPUTATION_ADDRESS=", address(reputation));
    }
}
