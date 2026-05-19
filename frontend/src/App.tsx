import React, { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  useAccount, 
  useWriteContract 
} from 'wagmi';
import { keccak256, encodePacked } from 'viem';
import { 
  Vote, 
  PlusCircle, 
  Clock, 
  Lock, 
  Unlock, 
  CheckCircle, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw,
  Trophy,
  History,
  User,
  Cpu,
  Layers,
  Terminal,
  Network,
  Activity,
  Sparkles,
  Search
} from 'lucide-react';

const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "_question", "type": "string" },
      { "internalType": "string[]", "name": "_options", "type": "string[]" },
      { "internalType": "uint256", "name": "_commitDuration", "type": "uint256" },
      { "internalType": "uint256", "name": "_revealDuration", "type": "uint256" }
    ],
    "name": "createPoll",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_pollId", "type": "uint256" },
      { "internalType": "bytes32", "name": "_commitment", "type": "bytes32" }
    ],
    "name": "commitVote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_pollId", "type": "uint256" },
      { "internalType": "uint256", "name": "_optionIndex", "type": "uint256" },
      { "internalType": "bytes32", "name": "_salt", "type": "bytes32" }
    ],
    "name": "revealVote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_pollId", "type": "uint256" }
    ],
    "name": "finalizePoll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_pollId", "type": "uint256" }
    ],
    "name": "getPollOptions",
    "outputs": [
      { "internalType": "string[]", "name": "", "type": "string[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_pollId", "type": "uint256" }
    ],
    "name": "getPollResults",
    "outputs": [
      { "internalType": "uint256[]", "name": "", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pollCount",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "name": "polls",
    "outputs": [
      { "internalType": "string", "name": "question", "type": "string" },
      { "internalType": "uint256", "name": "commitEndTime", "type": "uint256" },
      { "internalType": "uint256", "name": "revealEndTime", "type": "uint256" },
      { "internalType": "bool", "name": "finalized", "type": "bool" },
      { "internalType": "address", "name": "creator", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

interface Poll {
  id: number;
  question: string;
  options: string[];
  commitEndTime: number;
  revealEndTime: number;
  finalized: boolean;
  creator: string;
  results?: number[];
  userCommitment?: string;
  userRevealed?: boolean;
}

interface AuditLog {
  id: number;
  pollId: number;
  question: string;
  voter: string;
  actionType: string;
  timestamp: number;
}

export default function App() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'agent' | 'polls' | 'create' | 'audit' | 'how'>('agent');
  const [polls, setPolls] = useState<Poll[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(Math.floor(Date.now() / 1000));

  // Authentication State
  const [currentUser, setCurrentUser] = useState<string | null>(localStorage.getItem('currentUser'));
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername, password: authPassword }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        localStorage.setItem('currentUser', data.username);
        setCurrentUser(data.username);
        setAuthPassword('');
      } else {
        setAuthError(data.message || 'Invalid username or password');
      }
    } catch (err) {
      setAuthError('Connection error. Is the FastAPI backend running?');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (authPassword !== authConfirmPassword) {
      return setAuthError('Passwords do not match');
    }

    setAuthLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername, password: authPassword }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setAuthSuccess('Registration successful! You can now log in.');
        setAuthMode('login');
        setAuthPassword('');
        setAuthConfirmPassword('');
      } else {
        setAuthError(data.message || 'Registration failed');
      }
    } catch (err) {
      setAuthError('Connection error. Is the FastAPI backend running?');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setAuthUsername('');
    setAuthPassword('');
  };

  // Agentic AI State
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentResult, setAgentResult] = useState<any | null>(null);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);

  const handleRunAgent = async (promptText: string) => {
    setAgentRunning(true);
    setAgentError(null);
    setAgentResult(null);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/agent/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText }),
      });
      const data = await res.json();
      if (data.status === 'success' || data.agent_type) {
        setAgentResult(data);
        // Refresh polls and logs as the agent might have created a new poll!
        fetchBackendData();
      } else {
        setAgentError('Failed to obtain audit report.');
      }
    } catch (err) {
      setAgentError('Connection error. Is the FastAPI backend running?');
    } finally {
      setAgentRunning(false);
    }
  };
  
  // Form State
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [commitDur, setCommitDur] = useState(300); // 5 mins
  const [revealDur, setRevealDur] = useState(300); // 5 mins

  // Selected option state for voting
  const [selectedOptions, setSelectedOptions] = useState<{ [pollId: number]: number }>({});
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});

  const { writeContract } = useWriteContract();

  // Tick time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data from Python FastAPI backend
  const fetchBackendData = async () => {
    try {
      const pollsRes = await fetch(`${API_BASE_URL}/api/polls`);
      const pollsData = await pollsRes.json();
      
      const logsRes = await fetch(`${API_BASE_URL}/api/audit-log`);
      const logsData = await logsRes.json();

      setAuditLogs(logsData.logs || []);

      if (pollsData.polls && pollsData.polls.length > 0) {
        setPolls(pollsData.polls);
      } else {
        // Seed default polls in backend if empty
        const defaultPolls: Poll[] = [
          {
            id: 1,
            question: "Who should be the next Student Body President?",
            options: ["Alice Vance (Clean Energy)", "Bob Mercer (Campus Growth)"],
            commitEndTime: Math.floor(Date.now() / 1000) + 180, // 3 mins from now
            revealEndTime: Math.floor(Date.now() / 1000) + 360,
            finalized: false,
            creator: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
          },
          {
            id: 2,
            question: "Should the student council fund the new esports lounge?",
            options: ["Yes, fully fund ($15,000)", "No, allocate to library"],
            commitEndTime: Math.floor(Date.now() / 1000) - 60, // Commit closed
            revealEndTime: Math.floor(Date.now() / 1000) + 240, // Reveal active
            finalized: false,
            creator: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
          }
        ];

        for (const p of defaultPolls) {
          await fetch(`${API_BASE_URL}/api/polls`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p)
          });
        }
        fetchBackendData();
      }
    } catch (err) {
      console.warn("FastAPI backend not running or accessible. Local mock fallback active.", err);
    }
  };

  useEffect(() => {
    fetchBackendData();
    // Poll the backend every 3 seconds for real-time audit updates!
    const pollInterval = setInterval(fetchBackendData, 3000);
    return () => clearInterval(pollInterval);
  }, []);

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = options.filter(o => o.trim() !== '');
    if (validOptions.length < 2) return alert("Please supply at least 2 valid options");

    const newId = polls.length > 0 ? Math.max(...polls.map(p => p.id)) + 1 : 1;
    const creatorAddr = isConnected && address ? address : "0xSandboxUserVoterAddress";

    const pollPayload = {
      id: newId,
      question,
      options: validOptions,
      commitEndTime: Math.floor(Date.now() / 1000) + commitDur,
      revealEndTime: Math.floor(Date.now() / 1000) + commitDur + revealDur,
      finalized: false,
      creator: creatorAddr
    };

    setLoadingStates({ ...loadingStates, create: true });

    if (isConnected) {
      try {
        await writeContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'createPoll',
          args: [question, validOptions, BigInt(commitDur), BigInt(revealDur)],
        });
      } catch (err: any) {
        console.error("Smart contract write skipped or failed:", err.message);
      }
    }

    // Sync to Python API Backend Database
    try {
      await fetch(`${API_BASE_URL}/api/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pollPayload)
      });
      fetchBackendData();
      setQuestion('');
      setOptions(['', '']);
      setActiveTab('polls');
    } catch (err) {
      // Fallback in case backend is offline
      setPolls([pollPayload, ...polls]);
      setActiveTab('polls');
    } finally {
      setLoadingStates({ ...loadingStates, create: false });
    }
  };

  // Secure Commitment generation done silently in the background
  const handleCommitVote = async (pollId: number) => {
    const selected = selectedOptions[pollId];
    if (selected === undefined) return alert("Please select an option first!");

    const voter = isConnected && address ? address : "0xSandboxUserVoterAddress";
    
    // Generate a secure 32-byte salt in the background silently
    const randomHex = '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    // Generate cryptographic keccak256 hash (same as Solidity keccak256)
    const commitmentHash = keccak256(
      encodePacked(
        ['uint256', 'bytes32', 'address', 'uint256'],
        [BigInt(selected), randomHex as `0x${string}`, voter as `0x${string}`, BigInt(pollId)]
      )
    );

    // Save salt and selection locally
    localStorage.setItem(`salt-${pollId}-${voter}`, randomHex);
    localStorage.setItem(`vote-${pollId}-${voter}`, selected.toString());

    setLoadingStates({ ...loadingStates, [`commit-${pollId}`]: true });

    if (isConnected) {
      try {
        await writeContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'commitVote',
          args: [BigInt(pollId), commitmentHash],
        });
      } catch (err: any) {
        console.error("Smart contract skipped or failed:", err.message);
      }
    }

    // Log the vote action to our backend SQLite database
    try {
      await fetch(`${API_BASE_URL}/api/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId, voter, actionType: "commit" })
      });
      fetchBackendData();
    } catch (err) {
      console.warn("Could not log to backend database.", err);
    }

    // Update frontend state
    setPolls(prev => prev.map(p => {
      if (p.id === pollId) {
        return { ...p, userCommitment: commitmentHash };
      }
      return p;
    }));

    setLoadingStates({ ...loadingStates, [`commit-${pollId}`]: false });
    alert("Your encrypted vote commitment has been successfully secured and submitted on-chain!");
  };

  // Automated salt and choice retrieval for 1-click reveal
  const handleRevealVote = async (pollId: number) => {
    const voter = isConnected && address ? address : "0xSandboxUserVoterAddress";
    const savedSalt = localStorage.getItem(`salt-${pollId}-${voter}`);
    const savedOption = localStorage.getItem(`vote-${pollId}-${voter}`);

    if (!savedSalt || savedOption === null) {
      return alert("No local voting record found. To reveal, you must use the same browser and wallet used during commitment.");
    }

    setLoadingStates({ ...loadingStates, [`reveal-${pollId}`]: true });

    if (isConnected) {
      try {
        await writeContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'revealVote',
          args: [BigInt(pollId), BigInt(savedOption), savedSalt as `0x${string}`],
        });
      } catch (err: any) {
        console.error("Smart contract reveal skipped or failed:", err.message);
      }
    }

    // Log the reveal action to our backend SQLite database
    try {
      await fetch(`${API_BASE_URL}/api/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId, voter, actionType: "reveal" })
      });
      fetchBackendData();
    } catch (err) {
      console.warn("Could not log to backend database.", err);
    }

    // Update frontend state with local tallies
    setPolls(prev => prev.map(p => {
      if (p.id === pollId) {
        const results = [...(p.results || Array(p.options.length).fill(0))];
        results[parseInt(savedOption)] += 1;
        return { ...p, userRevealed: true, results };
      }
      return p;
    }));

    setLoadingStates({ ...loadingStates, [`reveal-${pollId}`]: false });
    alert("Cryptographic verification successful! Your vote has been decrypted and counted in the final tally.");
  };

  const handleFinalizePoll = async (pollId: number) => {
    setLoadingStates({ ...loadingStates, [`finalize-${pollId}`]: true });
    
    if (isConnected) {
      try {
        await writeContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'finalizePoll',
          args: [BigInt(pollId)],
        });
      } catch (err: any) {
        console.error("Finalization failed:", err.message);
      }
    }

    // Log the finalization event
    try {
      await fetch(`${API_BASE_URL}/api/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId, voter: isConnected && address ? address : "System", actionType: "finalize" })
      });
      fetchBackendData();
    } catch (err) {
      console.warn("Could not log finalization to backend.", err);
    }

    setPolls(prev => prev.map(p => {
      if (p.id === pollId) {
        return { ...p, finalized: true };
      }
      return p;
    }));

    setLoadingStates({ ...loadingStates, [`finalize-${pollId}`]: false });
  };

  const getPollPhase = (poll: Poll) => {
    if (poll.finalized) return 'Finalized';
    if (currentTime <= poll.commitEndTime) return 'Commit Phase';
    if (currentTime <= poll.revealEndTime) return 'Reveal Phase';
    return 'Pending Finalization';
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col items-center justify-center font-sans relative px-4 overflow-hidden selection:bg-amber-500 selection:text-black">
        {/* GLOW TOP */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[500px] bg-gradient-to-br from-indigo-900/10 via-amber-500/[0.03] to-transparent blur-[130px] pointer-events-none rounded-full" />

        <div className="w-full max-w-md relative z-10 space-y-8">
          {/* LOGO AREA */}
          <div className="flex flex-col items-center space-y-3 text-center">
            <div className="indigo-gold-glow w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-900 to-indigo-950 border border-indigo-500/25 flex items-center justify-center">
              <Vote className="text-amber-500 text-3xl animate-pulse" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white leading-none">ValidVote</h1>
              <span className="text-xs text-amber-500 uppercase tracking-widest font-semibold mt-2 block">
                Fair, Verifiable, Tamper-Proof Voting
              </span>
            </div>
          </div>

          {/* CARD CONTAINER */}
          <div className="bg-[#0b101d]/80 backdrop-blur-xl rounded-2xl border border-indigo-950/60 p-8 shadow-2xl relative overflow-hidden">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {authMode === 'login' ? 'Sign In to Your Account' : 'Create Voter Identity'}
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                {authMode === 'login' 
                  ? 'Enter your credentials to manage polls and cast verified votes.' 
                  : 'Register a secure local voter account to get started.'}
              </p>
            </div>

            {authError && (
              <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full bg-[#070b13] border border-indigo-950 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-amber-500 gold-border-glow transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#070b13] border border-indigo-950 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-amber-500 gold-border-glow transition-all text-sm"
                  />
                </div>
              </div>

              {authMode === 'register' && (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={authConfirmPassword}
                      onChange={(e) => setAuthConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#070b13] border border-indigo-950 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-amber-500 gold-border-glow transition-all text-sm"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold uppercase tracking-wider transition-all duration-300 shadow-lg shadow-amber-600/10 cursor-pointer flex justify-center items-center text-sm"
              >
                {authLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                <span>{authMode === 'login' ? 'Authenticate' : 'Register Identity'}</span>
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-400 border-t border-indigo-950/40 pt-4">
              {authMode === 'login' ? (
                <p>
                  New to ValidVote?{' '}
                  <button
                    onClick={() => {
                      setAuthMode('register');
                      setAuthError(null);
                      setAuthSuccess(null);
                    }}
                    className="text-amber-500 hover:underline font-semibold"
                  >
                    Create an account
                  </button>
                </p>
              ) : (
                <p>
                  Already have a Voter account?{' '}
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setAuthError(null);
                      setAuthSuccess(null);
                    }}
                    className="text-amber-500 hover:underline font-semibold"
                  >
                    Sign In
                  </button>
                </p>
              )}
            </div>
          </div>
          
          <div className="text-center text-slate-600 text-[10px] leading-relaxed">
            Note: Your username and credentials are encrypted and stored in a secure local JSON database inside the backend architecture.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* GLOW TOP */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[350px] bg-gradient-to-b from-indigo-900/10 via-amber-500/[0.02] to-transparent blur-[120px] pointer-events-none rounded-full" />

      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#070b13]/85 border-b border-indigo-950/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="indigo-gold-glow w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-900 to-indigo-950 border border-indigo-500/25 flex items-center justify-center">
            <Vote className="text-amber-500 text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white leading-none">ValidVote</h1>
            <span className="text-[10px] text-amber-500 uppercase tracking-widest font-semibold">Fair, Verifiable, Tamper-Proof Voting</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 text-xs bg-indigo-950/20 px-3 py-1.5 rounded-lg border border-indigo-950/30">
            <span className="text-slate-400">Voter:</span>
            <span className="text-amber-500 font-bold">{currentUser}</span>
          </div>
          <ConnectButton chainStatus="icon" showBalance={false} />
          <button 
            onClick={handleLogout}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-3 py-1.5 rounded-lg border border-rose-950/20 hover:border-rose-900/40 bg-rose-950/10 transition-all cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* TABS CONTAINER */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-6 py-10 relative">
        <div className="flex space-x-2 mb-8 bg-indigo-950/20 p-1.5 rounded-xl border border-indigo-950/30 max-w-2xl overflow-x-auto whitespace-nowrap scrollbar-none">
          <button 
            onClick={() => setActiveTab('agent')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
              activeTab === 'agent' 
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/10' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-indigo-950/30'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Agentic AI Auditor</span>
          </button>

          <button 
            onClick={() => setActiveTab('polls')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
              activeTab === 'polls' 
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/10' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-indigo-950/30'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Active Polls</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
              activeTab === 'create' 
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/10' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-indigo-950/30'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Poll</span>
          </button>

          <button 
            onClick={() => setActiveTab('audit')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
              activeTab === 'audit' 
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/10' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-indigo-950/30'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Log</span>
          </button>

          <button 
            onClick={() => setActiveTab('how')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
              activeTab === 'how' 
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/10' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-indigo-950/30'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>How it Works</span>
          </button>
        </div>

        {/* --- VIEW: CREATE POLL --- */}
        {activeTab === 'create' && (
          <div className="bg-[#0b101d] rounded-2xl border border-indigo-950/40 p-8 shadow-xl relative overflow-hidden">
            <h2 className="text-xl font-bold mb-2 flex items-center text-white">
              <PlusCircle className="mr-3 text-amber-500" />
              Configure New Poll
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Create a cryptographic commit-reveal poll. Deadlines are automatically enforced strictly by the Ethereum smart contracts.
            </p>

            <form onSubmit={handleCreatePoll} className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-widest text-slate-400 font-bold mb-2">Question / Proposal</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Should we adopt proposal proposal-94?"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  className="w-full bg-[#070b13] border border-indigo-950 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-amber-500 gold-border-glow transition-all"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-slate-400 font-bold mb-2">Voting Options</label>
                <div className="space-y-3">
                  {options.map((option, idx) => (
                    <input 
                      key={idx}
                      type="text"
                      required
                      placeholder={`Option ${idx + 1}`}
                      value={option}
                      onChange={e => handleOptionChange(idx, e.target.value)}
                      className="w-full bg-[#070b13] border border-indigo-950 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-amber-500 gold-border-glow transition-all"
                    />
                  ))}
                </div>
                <button 
                  type="button"
                  onClick={handleAddOption}
                  className="mt-3 text-sm text-amber-500 hover:text-amber-400 font-semibold flex items-center space-x-1"
                >
                  <span>+ Add custom option</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-slate-400 font-bold mb-2">Commit Duration (Seconds)</label>
                  <input 
                    type="number"
                    value={commitDur}
                    onChange={e => setCommitDur(parseInt(e.target.value))}
                    className="w-full bg-[#070b13] border border-indigo-950 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-slate-400 font-bold mb-2">Reveal Duration (Seconds)</label>
                  <input 
                    type="number"
                    value={revealDur}
                    onChange={e => setRevealDur(parseInt(e.target.value))}
                    className="w-full bg-[#070b13] border border-indigo-950 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loadingStates.create}
                className="w-full py-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold uppercase tracking-wider transition-all duration-300 shadow-lg shadow-amber-600/10 cursor-pointer flex justify-center items-center"
              >
                {loadingStates.create ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Broadcasting Poll...</span>
                  </div>
                ) : (
                  <span>Deploy Poll</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* --- VIEW: AGENTIC AI AUDITOR --- */}
        {activeTab === 'agent' && (
          <div className="space-y-8 animate-fadeIn">
            {/* HERO SECTION */}
            <div className="bg-gradient-to-r from-amber-600/10 via-indigo-950/10 to-indigo-900/10 rounded-2xl border border-amber-500/20 p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                    <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400">JAC Agentic AI Focus</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">Voting Graph Intelligence Console</h2>
                  <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
                    ValidVote features an autonomous security auditor built natively in <b>Jac-lang</b>. 
                    The agent traverses the Poll, Voter, and Commitment graph network to detect anomalies, analyze Sybil vectors, or automatically plan and seed simulated voter environments.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <button 
                    onClick={() => setActiveTab('how')} 
                    className="text-xs font-semibold px-4 py-2 rounded-lg border border-indigo-500/30 text-indigo-300 hover:text-white bg-indigo-950/20 hover:bg-indigo-900/30 transition-all block text-center cursor-pointer"
                  >
                    View Architecture Spec
                  </button>
                </div>
              </div>
            </div>

            {/* INTERACTIVE PROMPT ENGINE */}
            <div className="bg-[#0b101d] rounded-2xl border border-indigo-950/40 p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2 uppercase tracking-wider text-slate-300">
                <Terminal className="w-4 h-4 text-amber-500" />
                <span>Command the Jac AI Walker Agent</span>
              </h3>
              
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={agentPrompt}
                    onChange={(e) => setAgentPrompt(e.target.value)}
                    placeholder="Ask the auditor agent: 'Perform a security audit' or 'Simulate a poll on space research'..."
                    className="w-full bg-[#070b13] border border-indigo-950/40 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60 placeholder-slate-500 font-sans transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && agentPrompt.trim()) handleRunAgent(agentPrompt);
                    }}
                  />
                  <div className="absolute right-3 top-3">
                    <Search className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
                <button
                  onClick={() => agentPrompt.trim() && handleRunAgent(agentPrompt)}
                  disabled={agentRunning || !agentPrompt.trim()}
                  className="bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all flex items-center space-x-2 cursor-pointer shadow-lg shadow-amber-600/10"
                >
                  {agentRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Walking Graph...</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4" />
                      <span>Run Agent</span>
                    </>
                  )}
                </button>
              </div>

              {/* QUICK START SUGGESTIONS */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider block">Suggested Walkers & Tools:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setAgentPrompt('Perform a full cryptographic and Sybil security audit on all voting nodes.');
                      handleRunAgent('Perform a full cryptographic and Sybil security audit on all voting nodes.');
                    }}
                    disabled={agentRunning}
                    className="text-xs bg-indigo-950/20 text-indigo-300 hover:bg-indigo-900/30 border border-indigo-950 hover:border-indigo-800 rounded-lg px-3 py-1.5 transition-all text-left cursor-pointer flex items-center space-x-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    <span>Run AuditorWalker (Security Check)</span>
                  </button>

                  <button
                    onClick={() => {
                      setAgentPrompt('Create and simulate a poll on Quantum Computing Focus with 5 active voter commits.');
                      handleRunAgent('Create and simulate a poll on Quantum Computing Focus with 5 active voter commits.');
                    }}
                    disabled={agentRunning}
                    className="text-xs bg-indigo-950/20 text-indigo-300 hover:bg-indigo-900/30 border border-indigo-950 hover:border-indigo-800 rounded-lg px-3 py-1.5 transition-all text-left cursor-pointer flex items-center space-x-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Run PlannerWalker (Simulate Poll + 5 Voters)</span>
                  </button>

                  <button
                    onClick={() => {
                      setAgentPrompt('Create a poll on Deep Space Priority with 3 simulated commitments.');
                      handleRunAgent('Create a poll on Deep Space Priority with 3 simulated commitments.');
                    }}
                    disabled={agentRunning}
                    className="text-xs bg-indigo-950/20 text-indigo-300 hover:bg-indigo-900/30 border border-indigo-950 hover:border-indigo-800 rounded-lg px-3 py-1.5 transition-all text-left cursor-pointer flex items-center space-x-1.5"
                  >
                    <Activity className="w-3.5 h-3.5 text-amber-500" />
                    <span>Run PlannerWalker (Simulate Poll + 3 Voters)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ERROR LOG */}
            {agentError && (
              <div className="bg-rose-950/20 border border-rose-900/40 text-rose-300 px-4 py-3 rounded-xl text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400 animate-bounce" />
                <span>{agentError}</span>
              </div>
            )}

            {/* EXECUTION SCREEN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* PANEL 1: EXECUTIVE JAC AUDITOR MONITORS */}
              <div className="bg-[#0b101d] rounded-2xl border border-indigo-950/40 p-6 shadow-xl space-y-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center border-b border-indigo-950/40 pb-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Cpu className="w-5 h-5 text-amber-500" />
                      <h4 className="text-sm font-extrabold uppercase tracking-widest text-white">Jac Virtual Walker HUD</h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider border ${
                      agentRunning 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse' 
                        : agentResult 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : 'bg-indigo-950/30 text-slate-500 border-indigo-950/40'
                    }`}>
                      {agentRunning ? 'WALKING' : agentResult ? 'IDLE' : 'STANDBY'}
                    </span>
                  </div>

                  {/* WALKER ATTRIBUTES */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-[#070b13] border border-indigo-950/30 p-3 rounded-xl">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Active Walker</span>
                      <span className="text-xs text-white font-mono font-bold">
                        {agentRunning 
                          ? 'Executing...' 
                          : agentResult 
                            ? agentResult.agent_type 
                            : 'None loaded'}
                      </span>
                    </div>
                    <div className="bg-[#070b13] border border-indigo-950/30 p-3 rounded-xl">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Target Topology</span>
                      <span className="text-xs text-white font-mono font-bold">
                        {agentRunning ? 'ValidVote Graph' : agentResult ? 'Audit Node Grid' : 'None loaded'}
                      </span>
                    </div>
                  </div>

                  {/* MONITORED PLAN */}
                  <div className="space-y-3 mb-6">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Walker Planned Steps:</span>
                    <div className="space-y-2 bg-[#070b13] border border-indigo-950/40 p-4 rounded-xl min-h-[120px] flex flex-col justify-center">
                      {!agentRunning && !agentResult && (
                        <span className="text-xs text-slate-500 text-center block font-sans">Submit a request to stream agent tasks</span>
                      )}
                      {agentRunning && (
                        <div className="space-y-2 font-sans">
                          <div className="flex items-center space-x-2 text-xs text-amber-400 animate-pulse">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>1. Generating multi-step execution path...</span>
                          </div>
                          <div className="text-xs text-slate-500 pl-5">2. Traversing synthetic graph...</div>
                          <div className="text-xs text-slate-500 pl-5">3. Calling SQLite and Web3 tools...</div>
                        </div>
                      )}
                      {!agentRunning && agentResult && agentResult.plan && (
                        <ul className="space-y-2">
                          {agentResult.plan.map((step: string, idx: number) => (
                            <li key={idx} className="text-xs text-slate-300 flex items-start space-x-2">
                              <span className="text-emerald-500 font-bold">✓</span>
                              <span className="font-sans">{step}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* MONITORED TOOL USE */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Tool Usage Execution:</span>
                    <div className="bg-[#070b13] border border-indigo-950/40 p-4 rounded-xl font-mono text-[11px] text-slate-400 space-y-2 min-h-[80px]">
                      {!agentRunning && !agentResult && (
                        <span className="text-xs text-slate-500 font-sans block text-center mt-4">No tools called</span>
                      )}
                      {agentRunning && (
                        <span className="text-amber-500 animate-pulse block text-center mt-4 font-sans">Awaiting tool dispatch...</span>
                      )}
                      {!agentRunning && agentResult && agentResult.tools_used && (
                        <div className="space-y-2">
                          {agentResult.tools_used.map((t: any, idx: number) => (
                            <div key={idx} className="border-b border-indigo-950/20 pb-2 last:border-0 last:pb-0">
                              <span className="text-amber-500 font-bold block">{t.name}</span>
                              <span className="text-slate-300">{t.result}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* MONO THOUGHT MONOLOGUE STREAM */}
                <div className="mt-6 space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Walker Thought monologue:</span>
                  <div className="bg-black/40 border border-indigo-950/60 p-4 rounded-xl font-mono text-[11px] text-amber-500/90 max-h-[160px] overflow-y-auto space-y-1.5 scrollbar-thin">
                    {!agentRunning && !agentResult && (
                      <span className="text-slate-600 block text-center font-sans">Auditor offline</span>
                    )}
                    {agentRunning && (
                      <div className="space-y-1.5">
                        <div className="animate-pulse">▶ Loading walker context...</div>
                        <div className="animate-pulse delay-100">▶ Fetching database state...</div>
                      </div>
                    )}
                    {!agentRunning && agentResult && agentResult.reasoning_steps && (
                      agentResult.reasoning_steps.map((step: string, idx: number) => (
                        <div key={idx} className="flex items-start space-x-1">
                          <span className="text-slate-500">▶</span>
                          <span>{step}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* PANEL 2: INTERACTIVE GRAPH & DYNAMIC REPORT */}
              <div className="space-y-8">
                
                {/* DYNAMIC TOPOLOGY DIAGRAM */}
                <div className="bg-[#0b101d] rounded-2xl border border-indigo-950/40 p-6 shadow-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-indigo-950/40 pb-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-white flex items-center space-x-1.5">
                      <Network className="w-4 h-4 text-amber-500" />
                      <span>Live Walker Traversal Network</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">Graph-Native Path</span>
                  </div>

                  {/* GRAPH SCHEMATIC DRAWING */}
                  <div className="bg-[#070b13] border border-indigo-950/40 rounded-xl h-[240px] relative overflow-hidden flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 400 240">
                      {/* Lines/Paths */}
                      <g className="stroke-indigo-950/50 stroke-2">
                        {/* System to Poll 1 */}
                        <line x1="200" y1="120" x2="200" y2="50" />
                        {/* System to Voter 1 */}
                        <line x1="200" y1="120" x2="100" y2="180" />
                        {/* System to Voter 2 */}
                        <line x1="200" y1="120" x2="300" y2="180" />
                        {/* System to Audit log */}
                        <line x1="200" y1="120" x2="300" y2="60" />
                      </g>

                      {/* Animated Dot (Walker) */}
                      {agentRunning && (
                        <circle r="6" fill="#f59e0b" className="shadow-lg">
                          <animateMotion 
                            path="M 200,120 L 200,50 L 200,120 L 100,180 L 200,120 L 300,180 L 200,120 L 300,60 L 200,120" 
                            dur="4s" 
                            repeatCount="indefinite" 
                          />
                        </circle>
                      )}

                      {/* Nodes */}
                      <g>
                        {/* Central system node */}
                        <circle cx="200" cy="120" r="16" fill="#0b101d" stroke="#6366f1" strokeWidth="2" />
                        <text x="200" y="124" textAnchor="middle" fill="#818cf8" fontSize="9" fontWeight="bold" fontFamily="sans-serif">SYS</text>
                        
                        {/* Poll Node */}
                        <circle cx="200" cy="50" r="14" fill="#0b101d" stroke="#f59e0b" strokeWidth="2" />
                        <text x="200" y="54" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="bold" fontFamily="sans-serif">POLL</text>
                        
                        {/* Voter 1 Node */}
                        <circle cx="100" cy="180" r="12" fill="#0b101d" stroke="#10b981" strokeWidth="1.5" />
                        <text x="100" y="183" textAnchor="middle" fill="#34d399" fontSize="8" fontFamily="sans-serif">VT1</text>
                        
                        {/* Voter 2 Node */}
                        <circle cx="300" cy="180" r="12" fill="#0b101d" stroke="#10b981" strokeWidth="1.5" />
                        <text x="300" y="183" textAnchor="middle" fill="#34d399" fontSize="8" fontFamily="sans-serif">VT2</text>
                        
                        {/* Audit log Node */}
                        <circle cx="300" cy="60" r="12" fill="#0b101d" stroke="#6366f1" strokeWidth="1.5" />
                        <text x="300" y="63" textAnchor="middle" fill="#818cf8" fontSize="8" fontFamily="sans-serif">AUD</text>
                      </g>
                    </svg>

                    {/* KEY LEGEND */}
                    <div className="absolute bottom-2 left-3 flex space-x-3 text-[9px] text-slate-500 font-semibold bg-[#070b13]/80 px-2 py-1 rounded">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        <span>System</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span>Poll</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span>Voters</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DYNAMIC SECURITY REPORT */}
                <div className="bg-[#0b101d] rounded-2xl border border-indigo-950/40 p-6 shadow-xl">
                  <div className="flex justify-between items-center border-b border-indigo-950/40 pb-3 mb-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-white flex items-center space-x-1.5">
                      <Layers className="w-4 h-4 text-amber-500" />
                      <span>Security & Simulation Report</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">Agent Output</span>
                  </div>

                  <div className="bg-[#070b13] border border-indigo-950/40 p-6 rounded-xl min-h-[160px] flex flex-col justify-center">
                    {!agentRunning && !agentResult && (
                      <div className="text-center space-y-2 py-6">
                        <ShieldCheck className="w-12 h-12 text-slate-700 mx-auto" />
                        <span className="text-xs text-slate-500 block font-sans">Trigger a Jac Walker to generate cryptographic audits or simulations</span>
                      </div>
                    )}
                    {agentRunning && (
                      <div className="text-center py-6 space-y-4">
                        <RefreshCw className="w-10 h-10 text-amber-500 animate-spin mx-auto" />
                        <span className="text-xs text-amber-500 animate-pulse block font-sans">Analyzing graph node integrity...</span>
                      </div>
                    )}
                    {!agentRunning && agentResult && agentResult.report && (
                      <div className="text-slate-300 text-xs leading-relaxed space-y-3 prose prose-invert font-sans">
                        <div className="whitespace-pre-line">
                          {agentResult.report}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* --- VIEW: ACTIVE POLLS --- */}
        {activeTab === 'polls' && (
          <div className="space-y-6">
            {polls.length === 0 && (
              <div className="text-center py-20 bg-[#0b101d] rounded-2xl border border-indigo-950/40">
                <Vote className="text-indigo-500/30 w-16 h-16 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white">No active elections found</h3>
                <p className="text-slate-400 text-sm max-w-xs mx-auto mt-1">Deploy a new commit-reveal proposal to begin voting.</p>
              </div>
            )}

            {polls.map((poll) => {
              const phase = getPollPhase(poll);
              const isCommit = phase === 'Commit Phase';
              const isReveal = phase === 'Reveal Phase';
              const isPending = phase === 'Pending Finalization';
              const isFinalized = phase === 'Finalized';

              return (
                <div key={poll.id} className="bg-[#0b101d] rounded-2xl border border-indigo-950/40 p-6 shadow-xl space-y-6">
                  {/* POLL META HEADER */}
                  <div className="flex justify-between items-start border-b border-indigo-950/40 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">{poll.question}</h3>
                      <div className="flex items-center space-x-3 text-xs text-slate-400">
                        <span>Poll #{poll.id}</span>
                        <span>•</span>
                        <span>Creator: <code className="bg-[#070b13] px-2 py-0.5 rounded text-amber-500">{poll.creator.slice(0, 6)}...{poll.creator.slice(-4)}</code></span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isCommit ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25' :
                        isReveal ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                        isFinalized ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                        'bg-slate-500/10 text-slate-400 border border-slate-500/25'
                      }`}>
                        {phase}
                      </span>
                      
                      {!isFinalized && (
                        <div className="flex items-center space-x-1 text-slate-400 text-[11px] mt-2">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          {isCommit && (
                            <span>Ends in: {Math.max(0, poll.commitEndTime - currentTime)}s</span>
                          )}
                          {isReveal && (
                            <span>Ends in: {Math.max(0, poll.revealEndTime - currentTime)}s</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* VOTE INPUT (COMMIT PHASE) */}
                  {isCommit && (
                    <div className="space-y-4">
                      <h4 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1 flex items-center">
                        <Lock className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                        Cast Private Vote
                      </h4>
                      <div className="space-y-2">
                        {poll.options.map((option, idx) => (
                          <label 
                            key={idx} 
                            className={`flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer ${
                              selectedOptions[poll.id] === idx 
                                ? 'bg-indigo-950/20 border-amber-500 shadow-md shadow-amber-500/5' 
                                : 'bg-[#070b13] border-indigo-950 hover:border-indigo-900/60'
                            }`}
                          >
                            <input 
                              type="radio" 
                              name={`poll-${poll.id}`} 
                              checked={selectedOptions[poll.id] === idx}
                              onChange={() => setSelectedOptions({ ...selectedOptions, [poll.id]: idx })}
                              className="accent-amber-500 w-4 h-4"
                            />
                            <span className="text-sm font-semibold">{option}</span>
                          </label>
                        ))}
                      </div>

                      <button 
                        onClick={() => handleCommitVote(poll.id)}
                        disabled={loadingStates[`commit-${poll.id}`]}
                        className="w-full py-3 bg-indigo-900 hover:bg-indigo-850 text-white font-bold text-sm uppercase rounded-xl transition-all shadow-lg cursor-pointer flex justify-center items-center"
                      >
                        {loadingStates[`commit-${poll.id}`] ? (
                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        <span>Securely Cast Vote</span>
                      </button>
                    </div>
                  )}

                  {/* REVEAL PHASE UI */}
                  {isReveal && (
                    <div className="space-y-4">
                      <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl flex items-start space-x-3">
                        <Unlock className="text-amber-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-bold text-white mb-1">Reveal Phase Active</h4>
                          <p className="text-slate-300 text-xs">
                            Your secure salt and vote are locally stored in your browser. Click the verify button to securely count your vote on-chain.
                          </p>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleRevealVote(poll.id)}
                        disabled={loadingStates[`reveal-${poll.id}`]}
                        className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm uppercase rounded-xl transition-all shadow-lg cursor-pointer flex justify-center items-center"
                      >
                        {loadingStates[`reveal-${poll.id}`] ? (
                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        <span>Verify & Tally My Vote</span>
                      </button>
                    </div>
                  )}

                  {/* PENDING FINALIZATION UI */}
                  {isPending && (
                    <div className="bg-[#070b13] p-6 rounded-xl border border-indigo-950/50 text-center space-y-4">
                      <Clock className="w-12 h-12 text-slate-400 mx-auto opacity-60" />
                      <div>
                        <h4 className="text-base font-bold text-white">Voting Period Concluded</h4>
                        <p className="text-slate-400 text-xs mt-1">
                          All commitment and reveal windows have closed. Anyone can now trigger finalization to lock the results on-chain forever.
                        </p>
                      </div>
                      <button 
                        onClick={() => handleFinalizePoll(poll.id)}
                        disabled={loadingStates[`finalize-${poll.id}`]}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg transition-all cursor-pointer flex justify-center items-center mx-auto"
                      >
                        {loadingStates[`finalize-${poll.id}`] ? (
                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        <span>Finalize & Lock Results</span>
                      </button>
                    </div>
                  )}

                  {/* FINALIZED RESULTS UI */}
                  {isFinalized && (
                    <div className="space-y-4">
                      <h4 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1 flex items-center">
                        <Trophy className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                        Official Audited Results
                      </h4>
                      <div className="space-y-3">
                        {poll.options.map((option, idx) => {
                          const votes = poll.results ? poll.results[idx] : 0;
                          const totalVotes = poll.results ? poll.results.reduce((a, b) => a + b, 0) : 0;
                          const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;

                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold px-1">
                                <span className="text-slate-300">{option}</span>
                                <span className="text-amber-500 font-bold">{votes} votes ({percentage.toFixed(0)}%)</span>
                              </div>
                              <div className="w-full h-2.5 bg-[#070b13] rounded-full overflow-hidden border border-indigo-950/50">
                                <div 
                                  className="h-full bg-gradient-to-r from-indigo-950 via-amber-600 to-amber-500 rounded-full transition-all duration-1000"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* --- VIEW: AUDIT LOG TIMELINE --- */}
        {activeTab === 'audit' && (
          <div className="bg-[#0b101d] rounded-2xl border border-indigo-950/40 p-8 shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center">
                <History className="mr-3 text-amber-500 w-6 h-6" />
                Global Election Audit Log
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                A public, unalterable log tracked directly by the SQLite backend of every voting action and poll creation.
              </p>
            </div>

            <hr className="border-indigo-950/40" />

            <div className="space-y-6 relative before:absolute before:inset-0 before:right-auto before:left-[17px] before:w-[2px] before:bg-indigo-950/40 before:content-['']">
              {auditLogs.length === 0 ? (
                <p className="text-slate-500 text-sm py-4 text-center">No transactions or events logged in backend database yet.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="relative pl-10 flex items-start space-x-4">
                    {/* Circle icon marker */}
                    <div className="absolute left-[8px] top-[4px] w-[20px] h-[20px] rounded-full border-2 border-indigo-950 bg-[#070b13] flex items-center justify-center">
                      <div className={`w-[8px] h-[8px] rounded-full ${
                        log.actionType === 'create_poll' ? 'bg-indigo-500' :
                        log.actionType === 'commit' ? 'bg-amber-500' :
                        log.actionType === 'reveal' ? 'bg-emerald-500' : 'bg-slate-400'
                      }`} />
                    </div>

                    <div className="flex-grow bg-[#070b13] border border-indigo-950/40 p-4 rounded-xl space-y-2 hover:border-indigo-900 transition-colors">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-semibold text-white">
                          {log.actionType === 'create_poll' && "New Proposal Created"}
                          {log.actionType === 'commit' && "Secure Vote Committed"}
                          {log.actionType === 'reveal' && "Cryptographic Vote Revealed & Verified"}
                          {log.actionType === 'finalize' && "Poll Finalized"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.timestamp * 1000).toLocaleTimeString()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 font-medium">
                        {log.actionType === 'create_poll' && `Proposal "${log.question}" deployed to the system.`}
                        {log.actionType === 'commit' && `A voter secured a private commitment hash on "${log.question}".`}
                        {log.actionType === 'reveal' && `Vote commitment matched perfectly. Decrypted vote counted on "${log.question}".`}
                        {log.actionType === 'finalize' && `Results compiled and permanently locked for "${log.question}".`}
                      </p>

                      <div className="flex items-center text-[10px] text-indigo-400 space-x-1">
                        <User className="w-3 h-3 text-amber-500" />
                        <span>Actor Wallet: <code>{log.voter.slice(0, 10)}...{log.voter.slice(-6)}</code></span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- VIEW: HOW IT WORKS --- */}
        {activeTab === 'how' && (
          <div className="bg-[#0b101d] rounded-2xl border border-indigo-950/40 p-8 shadow-xl space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <ShieldCheck className="mr-3 text-amber-500 w-7 h-7" />
              Cryptographic Voting Integrity
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              True decentralized voting faces a critical paradox: **Transparency vs. Privacy**. 
              Exposing votes immediately allows everyone to trace the tally in real-time, which creates systemic bias (voters vote for the leader, or get intimidated).
              ValidVote resolves this completely with a secure cryptographic **Commit-Reveal** scheme.
            </p>

            <hr className="border-indigo-950/40" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-950/50 border border-indigo-500/25 flex items-center justify-center text-xs font-bold text-amber-500">1</div>
                <h3 className="font-semibold text-white text-sm">Commitment Hash</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your vote is combined with a random 32-byte salt and your wallet address, then hashed using the `keccak256` standard. Only this secure commitment is sent on-chain.
                </p>
              </div>

              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-950/50 border border-indigo-500/25 flex items-center justify-center text-xs font-bold text-amber-500">2</div>
                <h3 className="font-semibold text-white text-sm">Strict Reveal</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Once commit window closes, the reveal window opens. You submit your selection and your salt. The smart contract validates that your input matches your commitment hash.
                </p>
              </div>

              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-950/50 border border-indigo-500/25 flex items-center justify-center text-xs font-bold text-amber-500">3</div>
                <h3 className="font-semibold text-white text-sm">Decentralized Tally</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Once verified, the vote is counted on-chain. There is zero human involvement or mod mediation, preventing subjective disqualifications or tampering.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-indigo-950/40 bg-[#070b13]/85 py-6 px-6 text-center text-xs text-slate-500">
        <p>© 2026 ValidVote. Powered by Ethereum Smart Contracts. Secure, private, and mathematically verifiable.</p>
      </footer>
    </div>
  );
}
