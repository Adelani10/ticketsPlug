import { ethers, network } from "hardhat";
import { DeployFunction } from "hardhat-deploy/dist/types";
import fs from "fs";

const abiFile = "../ticketsplug-ui/constants/abi.json";
const CaFile = "../ticketsplug-ui/constants/contractAddresses.json";

const updateFrontend: DeployFunction = async () => {
  if (process.env.UPDATE_FRONT_END) {
    console.log("Writing to frontend...");
    await updateAbi();
    await updateContractAddress();
    console.log("Frontend written!");
  }
};

const updateAbi = async () => {
  const contract = await ethers.getContract("TicketsPlug");
  fs.writeFileSync(
    abiFile,
    contract.interface.format(ethers.utils.FormatTypes.json).toString()
  );
};

const updateContractAddress = async () => {
  const contract = await ethers.getContract("TicketsPlug");
  const chainId = network.config.chainId!.toString();
  const currentAddresses = JSON.parse(fs.readFileSync(CaFile, "utf-8"));
  if (chainId in currentAddresses) {
    if (!currentAddresses[chainId]["ticketsPlug"].includes(contract.address)) {
      currentAddresses[chainId]["ticketsPlug"].push(contract.address);
    }
  } else {
    currentAddresses[chainId] = { ticketsPlug: contract.address };
  }

  fs.writeFileSync(CaFile, JSON.stringify(currentAddresses))
};

export default updateFrontend;

updateFrontend.tags = ["all", "updateFrontend"];
