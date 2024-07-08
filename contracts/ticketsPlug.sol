// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract TicketsPlug is ERC721 {
    address private immutable owner;
    uint256 public totalEvents;
    uint256 totalSupply;

    struct Event {
        uint256 id;
        string name;
        uint256 cost;
        uint256 tickets;
        uint256 maxTickets;
        string date;
        string time;
        string location;
    }

    mapping(uint256 => Event) private events;
    mapping(uint256 => uint256[]) private takenSeats;
    mapping(uint256 => mapping(address => bool)) public hasTicket;
    mapping(uint256 => mapping(uint256 => address)) public seatOwner;

    constructor() ERC721("Ticket", "TKT") {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner can call this function");
        _;
    }

    function listEvents(
        string memory name,
        uint256 cost,
        uint256 maxTickets,
        string memory date,
        string memory time,
        string memory location
    ) public onlyOwner {
        totalEvents++;
        events[totalEvents] = Event(
            totalEvents,
            name,
            cost,
            maxTickets,
            maxTickets,
            date,
            time,
            location
        );
    }

    function buyTicket(uint256 id, uint256 seat) public payable {
        require(id != 0);
        require(id <= totalEvents);
        require(msg.value >= events[id].cost, "insufficient funds");
        require(events[id].tickets > 0, "no tickets left for this event");
        require(
            hasTicket[id][msg.sender] == false,
            "already have ticket for this event"
        );
        require(
            seatOwner[id][seat] == address(0),
            "seat owner cannot be address zero"
        );
        require(seat < events[id].maxTickets, "invalid seat number");

        events[id].tickets -= 1;
        seatOwner[id][seat] = msg.sender;
        hasTicket[id][msg.sender] = true;
        takenSeats[id].push(seat);

        totalSupply++;
        _safeMint(msg.sender, totalSupply);
    }

    function withdraw() public onlyOwner {
        (bool success,) = payable(owner).call{value: address(this).balance}("");
        require(success, "withdrawal failed");
    }


    // getters
    function getEvent(uint256 id) public view returns(Event memory) {
        return events[id];
    }

    function getTakenSeats(uint256 id) public view returns (uint256[] memory) {
        return takenSeats[id];
    }
}
