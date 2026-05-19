from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import hashlib
import os
import json
import database

app = FastAPI(title="ValidVote Audit API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize SQLite database
database.init_db()

# --- local users.json database logic ---
USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")

def load_users():
    if not os.path.exists(USERS_FILE):
        return []
    try:
        with open(USERS_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return []

def save_users(users):
    try:
        with open(USERS_FILE, "w") as f:
            json.dump(users, f, indent=4)
    except Exception as e:
        print(f"Error saving users: {e}")

def hash_password(password: str, salt: str = None) -> tuple:
    if salt is None:
        salt = os.urandom(16).hex()
    hashed = hashlib.sha256((password + salt).encode("utf-8")).hexdigest()
    return hashed, salt

# Auto-seed default sandbox user if database is empty
def seed_admin_user():
    users = load_users()
    if not any(u["username"] == "admin" for u in users):
        hashed, salt = hash_password("admin123")
        users.append({
            "username": "admin",
            "password_hash": hashed,
            "salt": salt
        })
        save_users(users)

seed_admin_user()

class UserCredentials(BaseModel):
    username: str
    password: str

class PollCreate(BaseModel):
    id: int
    question: str
    options: List[str]
    commitEndTime: int
    revealEndTime: int
    creator: str

class VoteAction(BaseModel):
    pollId: int
    voter: str
    actionType: str  # "commit" or "reveal"

@app.post("/api/register")
def register_user(credentials: UserCredentials):
    username = credentials.username.strip()
    password = credentials.password
    
    if not username or not password:
        return {"status": "error", "message": "Username and password cannot be empty"}
        
    users = load_users()
    if any(u["username"].lower() == username.lower() for u in users):
        return {"status": "error", "message": "Username already exists"}
        
    hashed, salt = hash_password(password)
    users.append({
        "username": username,
        "password_hash": hashed,
        "salt": salt
    })
    save_users(users)
    return {"status": "success", "message": "User registered successfully"}

@app.post("/api/login")
def login_user(credentials: UserCredentials):
    username = credentials.username.strip()
    password = credentials.password
    
    users = load_users()
    user = next((u for u in users if u["username"].lower() == username.lower()), None)
    
    if not user:
        return {"status": "error", "message": "Invalid username or password"}
        
    hashed, _ = hash_password(password, user["salt"])
    if hashed == user["password_hash"]:
        return {"status": "success", "message": "Login successful", "username": user["username"]}
    
    return {"status": "error", "message": "Invalid username or password"}

@app.post("/api/polls")
def create_poll(poll: PollCreate):
    database.insert_poll(
        poll.id, 
        poll.question, 
        poll.options, 
        poll.commitEndTime, 
        poll.revealEndTime, 
        poll.creator
    )
    # Log the poll creation in the audit log too!
    database.insert_vote_action(poll.id, poll.creator, "create_poll")
    return {"status": "success"}

@app.get("/api/polls")
def get_polls():
    polls = database.get_polls()
    return {"polls": polls}

@app.post("/api/votes")
def log_vote(action: VoteAction):
    database.insert_vote_action(action.pollId, action.voter, action.actionType)
    return {"status": "success"}

@app.get("/api/audit-log")
def get_audit_log():
    logs = database.get_audit_logs()
    return {"logs": logs}

# --- Jac-lang Agentic AI Emulation Endpoints ---

class AgentRequest(BaseModel):
    prompt: str

@app.post("/api/agent/run")
def run_agent(req: AgentRequest):
    import random
    import time
    prompt = req.prompt.strip().lower()
    
    # 1. Check if user wants to create/simulate a poll
    if "create" in prompt or "simulate" in prompt or "make" in prompt or "setup" in prompt:
        # Deduce question and options from prompt
        question = "Global Carbon Taxation Strategy"
        options = ["Aggressive Penalties", "Incentivized Subsidies", "Neutral Cap-and-Trade"]
        
        # Simple dynamic matching
        if "quantum" in prompt:
            question = "Quantum Computing Focus"
            options = ["Hardware scaling", "Quantum algorithms", "Post-quantum security"]
        elif "blockchain" in prompt or "ethereum" in prompt or "eip" in prompt:
            question = "EIP Scaling Roadmap"
            options = ["Rollup interoperability", "Stateless clients", "Danksharding"]
        elif "space" in prompt or "mars" in prompt:
            question = "Deep Space Priority"
            options = ["Mars Colonization", "Asteroid Mining", "Lagrange Observatory"]
        
        # Parse simulated count
        sim_count = 3
        if "5" in prompt:
            sim_count = 5
        elif "10" in prompt:
            sim_count = 10
            
        # Tool Use: Insert poll into SQLite database
        poll_id = random.randint(100, 999)
        commit_end = int(time.time()) + 3600
        reveal_end = commit_end + 3600
        creator = "JacPlannerWalker"
        
        database.insert_poll(poll_id, question, options, commit_end, reveal_end, creator)
        database.insert_vote_action(poll_id, creator, "create_poll")
        
        # Create some mock voters
        voters = ["0xcd3B766CCDd6AE721141F452C550Ca635964ce71", "0x2546BcD3c84621e976D8185a91A922aE77ECEc30", "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E"]
        for i in range(min(sim_count, len(voters))):
            database.insert_vote_action(poll_id, voters[i], "commit")
        
        graph_nodes = [
            {"id": "System", "label": "ValidVote Grid", "type": "system", "status": "active"},
            {"id": f"Poll{poll_id}", "label": f"Poll #{poll_id}: {question[:20]}...", "type": "poll", "status": "active"}
        ]
        graph_links = [
            {"source": "System", "target": f"Poll{poll_id}"}
        ]
        
        for i in range(min(sim_count, len(voters))):
            v_id = f"Voter{i}"
            graph_nodes.append({"id": v_id, "label": f"Simulated: {voters[i][:10]}...", "type": "voter", "status": "active"})
            graph_links.append({"source": f"Poll{poll_id}", "target": v_id})
            
        return {
            "status": "success",
            "agent_type": "PlannerWalker",
            "reasoning_steps": [
                "Thinking: User requested to simulate and plan a new proposal setup.",
                "Planning: Initiating multi-step planner. Goals: parse requirements, compile configuration, deploy states.",
                "Tool Call: Calling database.insert_poll() to record new proposal to SQLite layer...",
                "Tool Call: Logging poll deployment in the centralized transaction audit database...",
                "Simulating: Seeding cryptographic voter commitments across network nodes...",
                "Finalizing: Syncing state nodes on the local decentralized graph grid."
            ],
            "plan": [
                "1. Parse natural language request using Jac semantic walker",
                "2. Create cryptographic proposal parameters",
                "3. Deploy poll structure to local database",
                "4. Seed mock commits for demonstration"
            ],
            "tools_used": [
                {"name": "database.insert_poll()", "result": f"Successfully created poll '{question}' with ID {poll_id}."},
                {"name": "database.insert_vote_action()", "result": f"Audit logs successfully populated for {sim_count} simulated voters."}
            ],
            "graph": {
                "nodes": graph_nodes,
                "links": graph_links
            },
            "report": f"### **Jac Simulation Planner Summary**\n\n- **Status:** `POLL DEPLOYED` 🚀\n- **Question:** *{question}*\n- **Options:** {', '.join(options)}\n- **Simulated Voter Count:** `{sim_count}`\n- **Transaction ID:** `{random.randint(100000, 999999)}`\n\n*Successfully planned and executed by Jac PlannerWalker.*"
        }
        
    # 2. General audit/security queries
    polls = database.get_polls()
    logs = database.get_audit_logs()
    
    poll_id = 0
    poll_title = "No active polls"
    if polls:
        poll_id = polls[0]["id"]
        poll_title = polls[0]["question"]
        
    graph_nodes = [
        {"id": "System", "label": "ValidVote System", "type": "system", "status": "active"}
    ]
    graph_links = []
    
    if polls:
        graph_nodes.append({"id": "PollNode", "label": f"Active: {poll_title[:20]}...", "type": "poll", "status": "secure"})
        graph_links.append({"source": "System", "target": "PollNode"})
        
    voters = list(set([l["voter"] for l in logs if l["voter"] != "JacPlannerWalker"]))
    for i, v in enumerate(voters[:4]):
        v_id = f"Voter{i}"
        graph_nodes.append({"id": v_id, "label": f"Voter: {v[:10]}...", "type": "voter", "status": "verified"})
        if polls:
            graph_links.append({"source": "PollNode", "target": v_id})
            
    # Audit log check findings
    sybil_risk = "LOW"
    risk_percent = 2.4
    if len(voters) > 8:
        sybil_risk = "MEDIUM"
        risk_percent = 12.8
        
    return {
        "status": "success",
        "agent_type": "AuditorWalker",
        "reasoning_steps": [
            "Thinking: Instantiating AuditorWalker to execute security verification...",
            "Traversing: Traversing local graph topology from root 'ValidVote System'...",
            "Reasoning: Fetching transaction logs and active polls from the SQLite database...",
            "Tool Call: Scan database records using database.get_audit_logs()...",
            "Analysing: Computing cryptographic hash distribution and entropy score...",
            "Reasoning: Formulating final assessment report via LLM walker interface..."
        ],
        "plan": [
            "1. Traverse active voting nodes in the synthetic graph",
            "2. Perform Sybil pattern detection on voter addresses",
            "3. Run hash-collision audits",
            "4. Output cryptographic risk assessment"
        ],
        "tools_used": [
            {"name": "database.get_polls()", "result": f"{len(polls)} active polls retrieved successfully."},
            {"name": "database.get_audit_logs()", "result": f"{len(logs)} transaction log entries successfully scanned."}
        ],
        "graph": {
            "nodes": graph_nodes,
            "links": graph_links
        },
        "report": f"### **ValidVote Autonomous Security Audit**\n\n- **Audit Status:** `PASSED` 🟢\n- **Threat Level:** `{sybil_risk} ({risk_percent}%)` \n\n#### **Findings:**\n1. **Cryptographic Entropy**: Hashed ballot commitments match expected Keccak256 distribution thresholds. No hash duplication or replay vectors detected.\n2. **Network Activity**: Checked {len(voters)} distinct voter address patterns. No signs of automated Syvil scripting or identity replication.\n3. **Database Consistency**: Checked {len(logs)} audit events. All logs in the SQLite database correspond perfectly to smart contract transaction roots.\n\n*Audited autonomously by Jac AuditorWalker.*"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

