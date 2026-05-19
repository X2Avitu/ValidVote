import sqlite3
import json
import os
import time
from typing import List, Dict

DB_PATH = os.path.join(os.path.dirname(__file__), "validvote.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Polls metadata table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS polls (
            id INTEGER PRIMARY KEY,
            question TEXT NOT NULL,
            options TEXT NOT NULL,
            commit_end INTEGER NOT NULL,
            reveal_end INTEGER NOT NULL,
            creator TEXT NOT NULL,
            created_at INTEGER NOT NULL
        )
    """)
    
    # Vote actions (Audit logs)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vote_actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            poll_id INTEGER NOT NULL,
            voter TEXT NOT NULL,
            action_type TEXT NOT NULL,
            timestamp INTEGER NOT NULL
        )
    """)
    
    conn.commit()
    conn.close()

def insert_poll(poll_id: int, question: str, options: List[str], commit_end: int, reveal_end: int, creator: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO polls (id, question, options, commit_end, reveal_end, creator, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (poll_id, question, json.dumps(options), commit_end, reveal_end, creator, int(time.time()))
        )
        conn.commit()
    except sqlite3.IntegrityError:
        # Ignore duplicate insertions if client retries
        pass
    finally:
        conn.close()

def insert_vote_action(poll_id: int, voter: str, action_type: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO vote_actions (poll_id, voter, action_type, timestamp) VALUES (?, ?, ?, ?)",
        (poll_id, voter, action_type, int(time.time()))
    )
    conn.commit()
    conn.close()

def get_polls() -> List[Dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM polls ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    
    polls = []
    for r in rows:
        polls.append({
            "id": r["id"],
            "question": r["question"],
            "options": json.loads(r["options"]),
            "commitEndTime": r["commit_end"],
            "revealEndTime": r["reveal_end"],
            "creator": r["creator"],
            "createdAt": r["created_at"]
        })
    return polls

def get_audit_logs() -> List[Dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Join vote actions and polls to create high-quality descriptive logs
    cursor.execute("""
        SELECT 
            v.id, v.poll_id, v.voter, v.action_type, v.timestamp, p.question
        FROM vote_actions v
        LEFT JOIN polls p ON v.poll_id = p.id
        ORDER BY v.timestamp DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    
    logs = []
    for r in rows:
        logs.append({
            "id": r["id"],
            "pollId": r["poll_id"],
            "question": r["question"] or "Unknown Poll",
            "voter": r["voter"],
            "actionType": r["action_type"],
            "timestamp": r["timestamp"]
        })
    return logs
