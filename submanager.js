import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = '/Users/qu4ntum/Documents/Dev/GitHub/self-kernel';
const LOG_FILE = path.join(REPO_ROOT, 'iteration_log.md');
const REPORT_FILE = path.join(REPO_ROOT, 'submanager_report.md');

// Telemetry state
let lastCommitHash = '';
let activeAgents = 0;
let nextSpawnTriggered = false; // Prevents spamming spawns

function checkActiveAgents() {
    return new Promise((resolve) => {
        // Only count actual claude proxy processes, not the submanager itself
        exec('ps aux | grep "claude_tunnel.sh" | grep -v "grep" | wc -l', (error, stdout) => {
            if (!error) {
                activeAgents = parseInt(stdout.trim(), 10);
            }
            resolve(activeAgents);
        });
    });
}

function checkGit() {
    return new Promise((resolve) => {
        exec('git log -n 1 --oneline', { cwd: REPO_ROOT }, (error, stdout) => {
            if (!error) {
                const currentHash = stdout.trim().split(' ')[0];
                if (currentHash !== lastCommitHash) {
                    lastCommitHash = currentHash;
                }
            }
            resolve();
        });
    });
}

function parseNextTasksFromLog() {
    if (!fs.existsSync(LOG_FILE)) return null;

    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = content.split('\n');

    let inNextSteps = false;
    const pendingTasks = [];

    for (const line of lines) {
        if (line.match(/##.*(Next Steps|Next.*Tasks)/i)) { inNextSteps = true; continue; }
        if (inNextSteps && line.startsWith('## ') && !line.match(/(Next Steps|Next.*Tasks)/i)) break;
        if (inNextSteps && (line.includes('⏳') || line.includes('[ ]'))) {
            pendingTasks.push(line.replace(/^[0-9]+\.\s*/, '').trim());
        }
    }

    return pendingTasks.length > 0 ? pendingTasks : null;
}

function spawnNextCycle(tasks) {
    if (nextSpawnTriggered) return;
    nextSpawnTriggered = true;

    const taskList = tasks.map(t => `- ${t}`).join('\n');
    const prompt = `CRITICAL SAFETY DIRECTIVE: You are working on an ISOLATED prototyping project. DO NOT attempt to read, write, or access any personal files, system configs, or sensitive data outside of the self-kernel directory.

Your new Infinite Iteration assignment. Please execute the following pending tasks based on the iteration_log.md:
${taskList}

Once completed, mark them as '✅' in the iteration_log.md Next Steps section, and generate a new set of '⏳' pending tasks so the Submanager can spawn the next cycle. Proceed autonomously.`;

    // Write the assignment to a temp file
    const promptFile = path.join('/tmp', `swarm_prompt_${Date.now()}.md`);
    fs.writeFileSync(promptFile, prompt);

    console.log(`[Submanager] Spawning new generation for tasks: \n${taskList}`);

    // Launch the new army instance
    const cmd = `nohup zsh -i -c '~/start_claude_tunnel.sh -p "$(cat ${promptFile})" --dangerously-skip-permissions' > /dev/null 2>&1 &`;
    exec(cmd, { cwd: REPO_ROOT }, (error) => {
        if (error) {
            console.error("[Submanager] Failed to spawn new army: ", error);
        } else {
            console.log("[Submanager] New army successfully deployed in the background.");
        }
        // Allow reading again after a generous delay so they can spin up
        setTimeout(() => { nextSpawnTriggered = false; }, 60000);
    });
}

async function runCycle() {
    await checkActiveAgents();
    await checkGit();

    const timestamp = new Date().toISOString();
    let latestLog = "No iteration log found.";
    if (fs.existsSync(LOG_FILE)) {
        const content = fs.readFileSync(LOG_FILE, 'utf8').split('\n');
        latestLog = content.slice(Math.max(content.length - 15, 0)).join('\n');
    }

    const report = `
# 🤖 Infinite Submanager Status Report
**Time:** ${timestamp}
**Active smclaude agents running:** ${activeAgents}
**Latest Git Commit:** ${lastCommitHash}

### Iteration State Tracker:
\`\`\`markdown
${latestLog}
\`\`\`
---`;

    fs.appendFileSync(REPORT_FILE, report + '\n');
    console.log(`[Submanager] Polled at ${timestamp}. Active agents: ${activeAgents}`);

    // INFINITE ORCHESTRATION LOGIC
    // If the current army has finished its processing (active agents hit 0)
    if (activeAgents === 0) {
        console.log(`[Submanager] Swarm is idle. Checking for next assignments...`);
        const pendingTasks = parseNextTasksFromLog();

        if (pendingTasks && pendingTasks.length > 0) {
            spawnNextCycle(pendingTasks);
        } else {
            console.log(`[Submanager] TASK VACUUM DETECTED. No pending tasks in iteration_log.md.`);
            console.log(`[Submanager] Spawning 'Lead Architect' to dream up the next iteration cycle...`);

            const plannerPrompt = `CRITICAL ASSIGNMENT: You are the Lead Architect for this autonomous swarm. 
The current iteration batch is complete. Your mission is to:
1. Analyze the current codebase and the latest entries in iteration_log.md.
2. Identify the logical next steps, architectural improvements, or missing features aligned with the project ideology.
3. Update the '## Next Steps' section in iteration_log.md with a fresh list of 5-10 '⏳' pending tasks.

Once you have updated the log, exit. This will trigger the Submanager to spawn the next worker army.`;

            const plannerPromptFile = path.join('/tmp', `planner_prompt_${Date.now()}.md`);
            fs.writeFileSync(plannerPromptFile, plannerPrompt);

            const cmd = `nohup zsh -i -c '~/start_claude_tunnel.sh -p "$(cat ${plannerPromptFile})" --dangerously-skip-permissions' > /dev/null 2>&1 &`;
            exec(cmd, { cwd: REPO_ROOT }, (err) => {
                if (!err) console.log("[Submanager] Lead Architect deployed. Dreaming in progress...");
                setTimeout(() => { nextSpawnTriggered = false; }, 120000); // Wait 2 mins for planner to finish
            });
        }
    }
}

console.log('Starting Infinite Submanager Agent...');
fs.writeFileSync(REPORT_FILE, '# Self Kernel Infinite Orchestration Log\n\n');

// Run immediately, then poll every 60 seconds (1 min) instead of 3
runCycle();
setInterval(runCycle, 60000);
