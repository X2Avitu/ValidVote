# ValidVote - Devpost Submission
## Track: AI-Native Agentic Track (Jac/Jaseci Integration)

## Inspiration
While decentralized voting platforms provide strong cryptographic primitives, standard public blockchains remain opaque to everyday users, and auditing election patterns requires tedious manual data querying. Evaluating threats like collusive voting, Sybil networks, or duplicate identities requires more than just a static database or on-chain store — it requires **Graph Intelligence**. 

Our project, **ValidVote**, was sparked by this exact dissonance: the gap between secure cryptographic voting (Commit-Reveal schemes) and accessible, real-time security auditing. We set out to build a platform that pairs premium Web3 commit-reveal contracts on Ethereum with an **AI-native graph intelligence layer built in Jac-lang** to autonomously audit, explain, and simulate complex voting scenarios.

---

## What it does
ValidVote is a decentralized, secure voting platform driven by an interactive **Agentic AI Auditor HUD**:

1. **The Cryptographic Ballot Box**: Operates via a Solidity smart contract deployed on a local Ethereum network (Hardhat). Voters submit Keccak256 commitment hashes combined with local secret salts, keeping their selections private until the reveal phase.
2. **The Agentic AI Console (Main Focus)**: Powered by a native Jac graph structure of `VotingGraph`, `PollNode`, `VoterNode`, and `AuditEventNode` paths, operated by two specialized Jac Walkers:
   - **AuditorWalker**: Recursively traverses the live poll and transaction graph, executes local tool integrations (queries database audits, scans entropy on commitments), and runs semantic AI-native threat assessments to flag collusive activity or Sybil profiles.
   - **PlannerWalker**: Processes complex, unstructured natural language prompts from the user (e.g., *"Create and simulate a poll on Quantum Computing Focus with 5 active voter commits"*). It plans the parameters, executes database tool injections to deploy the new poll, and seeds simulated cryptographic commitments.
3. **The Live Traversal Network**: An interactive SVG visualization that animates the Jac Walker dot traveling along the nodes and edges as it performs dynamic security check tasks.
4. **The Live Transparency Engine**: Exposes an SQLite-powered real-time Audit Log tracking every on-chain commit, reveal, and poll creation.

---

## How we built it
- **The Intelligence Layer (Jac-lang & FastAPI)**: Written natively in **Jac-lang** (representing Jaseci node/edge schemas). We structured our active voter-registry as a spatial graph model traversed by autonomous walkers. Jaseci’s `by llm` semantic compiler performs planning and threat reasoning. The walkers bind to local python database tools in FastAPI to fetch logs and dynamically inject simulated polls.
- **The Smart Contracts Layer**: Programmed in **Solidity (v0.8.24)**, managing commitment arrays and reveal verification securely on a local **Hardhat** Node.
- **The UI Layer**: Crafted in **React, TypeScript, and Vite**, leveraging **Tailwind CSS** for a premium glassmorphic dark-space dashboard, with **RainbowKit** and **Wagmi** handling blockchain wallet orchestration.

---

## Challenges we ran into
- **Synchronizing Continual & Graph Spaces**: Coordinating the flat transactional logs of the SQLite database and the decentralized Hardhat chain with the relational Node/Edge graph layout needed by the Jac runtime. We resolved this by building a live hydrator class that translates database states into node topologies in real time.
- **Visualizing Traversal**: Animating the asynchronous thought steps of a Jaseci Walker agent in React so that the user can visually "see" the AI-native agent walking through nodes. We solved this by mapping Jaseci plan logs to an SVG-motion path representing the graph grid.

---

## Accomplishments that we're proud of
- **Demonstrating True Agent Behavior**: Going beyond simple chat wrappers by making a real agent that performs **Planning** (drafting election parameters), **Tool Use** (actually inserting polls and voter events into the SQLite database), and **Multi-step Reasoning** (entropy and Sybil audits).
- **Smooth HMR compilation**: Developing a complex Web3 + FastAPI + SQLite + TS dashboard that syncs and executes immediately without latency spikes during active LLM walker runs.
- **Aesthetic Premium HUD**: Crafting a gorgeous space-dark glassmorphic UI with amber glows and scanner layouts that feel like software from 2030.

---

## What we learned
- We discovered that structuring AI operations as graph traversals (using Jac-lang Walkers) yields significantly more explainable, modular reasoning chains compared to traditional Python orchestrations.
- Working with commit-reveal schemes on-chain taught us valuable lessons about balancing front-running prevention with intuitive voting wizard UXs.

---

## What's next for ValidVote
- ** zk-SNARKs Private Walkers**: Utilizing zero-knowledge proof walkers so that voters can prove they are authorized to cast ballots without revealing their public addresses or choices, removing the two-phase manual overhead.
- **Gasless ERC-4337 Account Abstraction**: Integrating gas paymasters so non-crypto voters can sign commitments with standard local logins.

---

## Jac / Jaseci Features Used
- **Node & Edge Schemas**: Built topological nodes (`VotingGraph`, `PollNode`, `VoterNode`, `AuditEventNode`) and edge classes (`SystemToPoll`, `PollToVoter`) to model the polling framework.
- **Walker Traverse (`visit`)**: Utilized the `visit` statement in our `AuditorWalker` to autonomously query connected nodes in sequential threat-hunting paths.
- **AI-Native `by llm()` Declarations**: Used Jaseci’s semantic compile decorator to perform zero-shot risk reports (`analyze_poll_vulnerability`) and natural language simulation planning (`plan_simulation_steps`) using temperature-calibrated Gemini endpoints.
- **External Python Bindings**: Bound the walkers to python SQLite tools to read logs and insert active polls during simulated planning tasks.
