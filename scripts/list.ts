import { deployments, ethers } from "hardhat";

const data: any[] = [
    {
      name: "Made In Lagos Live",
      cost: ethers.utils.parseEther("0.2"),
      tickets: 0,
      date: "Aug 31",
      time: "6:00PM EST",
      location: "Eko Hotel & Suites"
    },
    {
      name: "Island Block Party",
      cost: ethers.utils.parseEther("0.05"),
      tickets: 50,
      date: "Aug 2",
      time: "1:00PM JST",
      location: "Oniru Beach, Lekki"
    },
    {
      name: "Mainland Block Party",
      cost: ethers.utils.parseEther("0.03"),
      tickets: 80,
      date: "Aug 9",
      time: "10:00AM TRT",
      location: "TBS Surulere"
    },
    {
      name: "Enyimba v Rangers Intl ",
      cost: ethers.utils.parseEther("0.02"),
      tickets: 10,
      date: "July 11",
      time: "2:30PM CST",
      location: "Moshood Abiola STadium, Abuja"
    },
    {
      name: "Lagos Fashion Fair",
      cost: ethers.utils.parseEther("0.5"),
      tickets: 30,
      date: "Sep 23",
      time: "11:00AM EST",
      location: "Eko Convention Center"
    }
  ];

const list = async () => {
  await deployments.fixture(["ticketsPlug"]);
  const ticketsPlug = await ethers.getContract("TicketsPlug");
  console.log("listing..")

  for (let i = 0; i < data.length; i++) {
    const res = await ticketsPlug.listEvents(
      data[i].name,
      data[i].cost,
      data[i].tickets,
      data[i].date,
      data[i].time,
      data[i].location
    );

    await res.wait(1)


    const event = await ticketsPlug.getEvent(i + 1)
    console.log(`${event.name} has ${event.tickets} tickets left, hurry & purchase!`)
  }

};

list()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
