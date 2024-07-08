import { Signer } from "ethers";
import { developmentChains } from "../../helper-hardhat-config";
import { TicketsPlug } from "../../typechain-types";
import { deployments, ethers, network } from "hardhat";
import { assert, expect } from "chai";

const name = "OLIC";
const cost = ethers.utils.parseEther("0.5");
const maxTickets = 50;
const date = "Dec 27";
const time = "10:00AM CST";
const location = "Oniru Beach, Lekki";

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("TicketsPlug", () => {
      let deployer: Signer, buyer: Signer, ticketsPlug: TicketsPlug;

      beforeEach(async () => {
        [deployer, buyer] = await ethers.getSigners();
        await deployments.fixture(["all"]);
        ticketsPlug = await ethers.getContract("TicketsPlug", deployer);
      });

      describe("constructor", () => {
        it("sets the name and symbol of the nft correctly", async () => {
          const name = await ticketsPlug.name();
          const symbol = await ticketsPlug.symbol();

          assert.equal(name, "Ticket");
          assert.equal(symbol, "TKT");
        });
      });

      describe("list", () => {
        it("reverts if it isn't the owner that calls the function", async () => {
          await expect(
            ticketsPlug
              .connect(buyer)
              .listEvents(name, cost, maxTickets, date, time, location)
          ).to.be.revertedWith("only owner can call this function");
        });

        it("updates totalEvents count", async () => {
          for (let i = 1; i <= 5; i++) {
            const response = await ticketsPlug.listEvents(
              name,
              cost,
              maxTickets,
              date,
              time,
              location
            );
          }

          const totalEvents = await ticketsPlug.totalEvents();
          assert.equal(totalEvents.toString(), "5");
        });

        it("properly lists events on the blockchain", async () => {
          const response = await ticketsPlug.listEvents(
            name,
            cost,
            maxTickets,
            date,
            time,
            location
          );
          await response.wait();

          const event = await ticketsPlug.getEvent(1);

          assert.equal(event.name, name);
          assert.equal(event.cost.toString(), cost.toString());
          assert.equal(event.tickets.toString(), maxTickets.toString());
          assert.equal(event.maxTickets.toString(), maxTickets.toString());
          assert.equal(event.date, date);
          assert.equal(event.time, time);
          assert.equal(event.location, location);
        });
      });

      describe("buyTickets", () => {
        beforeEach(async () => {
          const response = await ticketsPlug.listEvents(
            name,
            cost,
            maxTickets,
            date,
            time,
            location
          );
          await response.wait();
        });

        it("reverts if the id passed in is 0", async () => {
          await expect(
            ticketsPlug.connect(buyer).buyTicket(0, 25, { value: cost })
          ).to.be.reverted;
        });

        it("reverts if seat wanted is greater than available seat number", async () => {
          await expect(
            ticketsPlug.connect(buyer).buyTicket(1, 51, { value: cost })
          ).to.be.revertedWith("invalid seat number");
        });

        it("reverts if the id passed in is greater than totalEvents", async () => {
          await expect(
            ticketsPlug.connect(buyer).buyTicket(2, 25, { value: cost })
          ).to.be.reverted;
        });

        it("reverts if buyer already has ticket for the event", async () => {
          const res = await ticketsPlug
            .connect(buyer)
            .buyTicket(1, 1, { value: cost });
          await res.wait();

          await expect(
            ticketsPlug.connect(buyer).buyTicket(1, 2, { value: cost })
          ).to.be.revertedWith("already have ticket for this event");
        });

        // it("reverts if the payment is lower than cost", async () => {
        //   await expect(
        //     ticketsPlug
        //       .connect(buyer)
        //       .buyTicket(1, 5, {value: ethers.utils.parseEther("0.4")})
        //   ).to.be.revertedWith("insufficient funds");
        // });

        it("updates number of available tickets after purchase", async () => {
          const res = await ticketsPlug
            .connect(buyer)
            .buyTicket(1, 45, { value: cost });
          await res.wait();
          const availTickets = (await ticketsPlug.getEvent(1)).tickets;
          assert.equal((maxTickets - 1).toString(), availTickets.toString());
        });

        it("updates seatOwner mapping", async () => {
          const res = await ticketsPlug
            .connect(buyer)
            .buyTicket(1, 4, { value: cost });
          await res.wait();
          const address = await ticketsPlug.seatOwner(1, 4);
          assert.equal(address, await buyer.getAddress());
        });

        it("updates hasTicket mapping", async () => {
          const res = await ticketsPlug
            .connect(buyer)
            .buyTicket(1, 4, { value: cost });
          await res.wait();
          const hasTicket = await ticketsPlug.hasTicket(1, buyer.getAddress());
          assert.equal(hasTicket, true);
        });

        it("pushes seat number into seatsTaken array after a ticket has been bought", async () => {
          const res = await ticketsPlug
            .connect(buyer)
            .buyTicket(1, 4, { value: cost });
          await res.wait();
          const arr = await ticketsPlug.getTakenSeats(1);
          assert.equal(arr.toString().includes("4"), true);
        });

        it("mints nft to the buyer address once ticket is bought", async () => {
          const res = await ticketsPlug
            .connect(buyer)
            .buyTicket(1, 4, { value: cost });
          await res.wait();

          const owner = await ticketsPlug.ownerOf(1);
          assert.equal(owner, await buyer.getAddress());
        });
      });

      describe("withdraw", () => {
        beforeEach(async () => {
          const response = await ticketsPlug.listEvents(
            name,
            cost,
            maxTickets,
            date,
            time,
            location
          );
          await response.wait();

          const res = await ticketsPlug
            .connect(buyer)
            .buyTicket(1, 5, { value: cost });
          await res.wait();
        });

        it("transfers contract balance to the deployer", async () => {
          const initial = await ethers.provider.getBalance(ticketsPlug.address);

          await ticketsPlug.withdraw();

          const finalBal = await ethers.provider.getBalance(
            ticketsPlug.address
          );

          assert.equal(initial.toString(), finalBal.add(cost).toString());
        });

        it("updates deployer balance after funds have been withdrawn", async () => {
          const initial = await ethers.provider.getBalance(
            deployer.getAddress()
          );

          const res = await ticketsPlug.withdraw();
          const rec = await res.wait(1);

          const { effectiveGasPrice, gasUsed } = rec;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const finalBal = await ethers.provider.getBalance(
            deployer.getAddress()
          );

          assert.equal(
            initial.sub(gasCost).add(cost).toString(),
            finalBal.toString()
          );
        });
      });
    });
