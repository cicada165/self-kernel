---
name: Autonomous Swarm Framework
description: An orchestration skill to deploy an infinite loop of autonomous smclaude subagents to execute project iterations.
---

# Autonomous Swarm Framework

This skill allows you to apply the "Infinite Orchestrator" framework to any project repository. It converts a standard AI coding assistant into a continuously looping, self-managed army of background workers that map tasks from an `iteration_log.md` file and execute them until completion.

## How It Works
1. **The Log**: The framework relies on an `iteration_log.md` file in the root of your project. This acts as the central brain and to-do list for the swarm.
2. **The Agents**: We use `smclaude` (Claude Code tunneled via proxy with `--dangerously-skip-permissions`) as the worker drones.
3. **The Orchestrator**: A lightweight Node.js script (`submanager.js`) continuously runs in the background. It monitors the active agent count. When the count hits `0`, it parses the `iteration_log.md` for pending tasks (marked by `⏳` or `[ ]` under a 'Next Steps' heading), compiles a prompt, and automatically spawns the next wave of `smclaude` background instances to tackle them.

## Installation / Usage

To apply this framework to a new project:

### 1. Initialize the Iteration Log
Create an `iteration_log.md` in the root of your project. It MUST contain a section called `## Next Steps` with your initial tasks marked as pending.

\`\`\`markdown
## Next Steps
1. ⏳ Implement the database schema.
2. ⏳ Build the Express.js API routes.
3. ⏳ Create the React frontend dashboard.
\`\`\`

### 2. Copy the Orchestrator
Copy the `submanager.js` script (provided below) into the root of your project. Ensure the `REPO_ROOT` variable is updated to match the absolute path of your current project.

### 3. Start the Infinite Loop
Launch the orchestrator in the background using `nohup`. It will immediately detect the 0 active agents, parse your log, and spawn the swarm.

\`\`\`bash
nohup node submanager.js > /tmp/submanager_stdout.log 2>&1 &
\`\`\`

You can monitor the swarm's activity by reading the automatically generated `submanager_report.md` in your project root, or by tailing the temporary stdout log.

### To Stop the Swarm
The orchestrator will run infinitely unless there are no more `⏳` pending tasks. To forcefully halt the cycle, simply kill the Node process:
\`\`\`bash
kill $(pgrep -f "submanager.js")
\`\`\`

---

## Required: `submanager.js` Script

Save this script as `submanager.js` in your project root. 
*Note: Ensure you update `REPO_ROOT` to your project's absolute path.*

\`\`\`javascript
import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// UPDATE THIS FOR YOUR SPECIFIC PROJECT:
const REPO_ROOT = process.cwd(); 

const LOG_FILE = path.join(REPO_ROOT, 'iteration_log.md');
const REPORT_FILE = path.join(REPO_ROOT, 'submanager_report.md');

let lastCommitHash = '';
let activeAgents = 0;
let nextSpawnTriggered = false;

function checkActiveAgents() {
  return new Promise((resolve) => {
    exec('ps aux | grep "claude_tunnel.sh" | grep -v "grep" | wc -l', (error, stdout) => {
      if (!error) activeAgents = parseInt(stdout.trim(), 10);
      resolve(activeAgents);
    });
  });
}

function checkGit() {
  return new Promise((resolve) => {
    exec('git log -n 1 --oneline', { cwd: REPO_ROOT }, (error, stdout) => {
      if (!error) {
        const currentHash = stdout.trim().split(' ')[0];
        if (currentHash !== lastCommitHash) lastCommitHash = currentHash;
      }
      resolve();
    });
  });
}

function parseNextTasksFromLog() {
  if (!fs.existsSync(LOG_FILE)) return null;
  const lines = fs.readFileSync(LOG_FILE, 'utf8').split('\\n');
  let inNextSteps = false;
  const pendingTasks = [];
  
  for (const line of lines) {
    if (line.includes('## Next Steps')) { inNextSteps = true; continue; }
    if (inNextSteps && line.startsWith('## ') && !line.includes('Next Steps')) break;
    if (inNextSteps && (line.includes('⏳') || line.includes('[ ]'))) {
      pendingTasks.push(line.replace(/^[0-9]+\\.\\s*/, '').trim());
    }
  }
  return pendingTasks.length > 0 ? pendingTasks : null;
}

function spawnNextCycle(tasks) {
  if (nextSpawnTriggered) return;
  nextSpawnTriggered = true;
  
  const taskList = tasks.map(t => \`- \${t}\`).join('\\n');
  const prompt = \`CRITICAL SAFETY DIRECTIVE: You are working on an ISOLATED prototyping project. DO NOT attempt to read, write, or access any personal files, system configs, or sensitive data outside of \${REPO_ROOT}.

Your new Infinite Iteration assignment. Please execute the following pending tasks based on the iteration_log.md:
\${taskList}

Once completed, mark them as '✅' in the iteration_log.md Next Steps section, and generate a new set of '⏳' pending tasks so the Submanager can spawn the next cycle. Proceed autonomously.\`;

  const promptFile = path.join('/tmp', \`swarm_prompt_\${Date.now()}.md\`);
  fs.writeFileSync(promptFile, prompt);
  
  const cmd = \`nohup zsh -i -c '~/start_claude_tunnel.sh -p "$(cat \${promptFile})" --dangerously-skip-permissions' > /dev/null 2>&1 &\`;
  exec(cmd, { cwd: REPO_ROOT }, (err) => {
    if (err) console.error("[Submanager] Failed to spawn:", err);
    setTimeout(() => { nextSpawnTriggered = false; }, 60000); 
  });
}

async function runCycle() {
  await checkActiveAgents();
  await checkGit();
  
  const timestamp = new Date().toISOString();
  let latestLog = "No iteration log found.";
  if (fs.existsSync(LOG_FILE)) {
      const content = fs.readFileSync(LOG_FILE, 'utf8').split('\\n');
      latestLog = content.slice(Math.max(content.length - 15, 0)).join('\\n');
  }

  const report = \`# 🤖 Infinite Submanager Status Report
**Time:** \${timestamp}
**Active smclaude agents:** \${activeAgents}
**Latest Git Commit:** \${lastCommitHash}
### Iteration State Tracker:
\\\`\\\`\\\`markdown
\${latestLog}
\\\`\\\`\\\`
---\\n\`;
  
  fs.appendFileSync(REPORT_FILE, report);
  
  if (activeAgents === 0) {
      const pendingTasks = parseNextTasksFromLog();
      if (pendingTasks && pendingTasks.length > 0) {
          spawnNextCycle(pendingTasks);
      }
  }
}

if (!fs.existsSync(REPORT_FILE)) fs.writeFileSync(REPORT_FILE, '# Log\\n\\n');

runCycle();
setInterval(runCycle, 60000);
\`\`\`
