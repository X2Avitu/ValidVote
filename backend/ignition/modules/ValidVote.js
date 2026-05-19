import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("ValidVoteModule", (m) => {
  const validVote = m.contract("ValidVote");
  return { validVote };
});
