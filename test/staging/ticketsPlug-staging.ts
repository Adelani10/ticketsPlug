import { ethers, network, getNamedAccounts, deployments } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { Signer } from "ethers";
import { TicketsPlug } from "../../typechain-types";
import { assert } from "chai";

const name = "OLIC";
const cost = ethers.utils.parseEther("0.05");
const maxTickets = 50;
const date = "Dec 27";
const time = "10:00AM CST";
const location = "Oniru Beach, Lekki";

developmentChains.includes(network.name)
  ? describe.skip
  : describe("TicketsPlug", () => {
      let deployer: string, ticketsPlug: TicketsPlug;
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        ticketsPlug = await ethers.getContract("TicketsPlug", deployer);
      });

      it("lists events and buyers are able to buy, also allows withdrawal", async () => {
        const response = await ticketsPlug.listEvents(
          name,
          cost,
          maxTickets,
          date,
          time,
          location
        );
        await response.wait(1);

        const res = await ticketsPlug.buyTicket(1, 4, { value: cost });
        await res.wait();

        const endBal = await ticketsPlug.provider.getBalance(ticketsPlug.address);

        assert.equal(endBal.toString(), "0");

        assert.equal((await ticketsPlug.getEvent(1)).name, name);
        assert.equal(
          (await ticketsPlug.getTakenSeats(1)).toString().includes("4"),
          true
        );
      });
    });
