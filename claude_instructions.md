# Self Kernel — Claude Code Iteration Instructions

You are an autonomous instance of Claude Code (`smclaude`). Your task is to continuously iterate on the `self-kernel` prototype based on the ideology below.
Your manager (an AI Agent) will check in on you.

## Iteration Rules

1. **Autonomy & Continuity:**
   - Iterate on the codebase to progressively realize the features described in the Ideology Framework.
   - Do not ask for user confirmation unless absolutely necessary.
   - You must track your progress and decisions in `iteration_log.md` (create it if it doesn't exist). Update it after every significant architectural change.

2. **White-Box Principle:**
   - All data must remain in human-readable JSON inside `data/`.
   - Ensure the structure remains strictly editable by the user.

3. **Core Enhancements Expected in Next Iterations:**
   - Implement deeper context tracking (Cognitive Stages, Intent Trajectories) that map to the dashboard.
   - Expand the MCP interface (`server/routes/mcp.js`) to provide Intent Proxies and Strategy Governance.
   - Build out relationship mappings between Intents and Persons to show how thoughts are shaped by interactions.

---

## 理念框架 / Ideology Framework (Context)

一、时代背景重述（Why now）
背景一：从生态视角看 —— AI 正在变成“个人级操作系统”
以 Claude 推出的 co-work / tool orchestration 为代表，当前 AI 平台已经不再只是“聊天模型”，而是正在演化为：
任务编排器（Task Orchestrator）
能力聚合器（Tools / Knowledge / Executors）
上下文调度中枢（Context & State Manager）

背景二：从入口视角看 —— AI 眼镜只是“表象”，服务模式才是本质
AI 不再是“被询问后才出现的工具”，而是与人的感知、意图、认知节奏持续同步的系统。
它必然要求一个长期、连续、可进化的 Personal Intelligence 核心。

背景三：从落地视角看 —— “上下文断层”阻碍了AI走向大众市场
只有将上下游解耦，才能带来爆发。Self Kernel 定位于上游的“大脑”（负责无感的个人数据采集与意图建模），而 Openclaw 等执行框架定位于下游的“双手”（负责调度操作）。

二、核心推断（What must exist）
推断一：PI 是一种“人人都有一个”的 MCP Server
长期存在、高度人格化。
它不是“工具”，而是：AI OS 中的“个人核心进程”。

推断二：PI 的数据模式必须是“白盒 + 可治理”的
数据归用户、白盒、可编辑。
结构化优先：意图、决策、偏好、约束、长期目标、认知模式。

推断三：PI 的服务模式是“实时、独占、持续演化的”
也是 PI 面向“LLM / Agent / App”的服务接口，提供统一的个人上下文、意图与认知状态。

推断四：PI 的生态立场是“彻底中立、全面兼容”
成为个人身份、意图与认知连续性的唯一来源。

推断五：从“静态知识库”向“动态执行内核”的跨越
Kernel 作为“权限与安全哨岗”，记录“成功路径” (RAT - Retrieval-Augmented Trajectory)。

推断六：24/7 自主状态下的“意图代理（Intent Proxy）”与策略治理
白盒化的策略集，确保人机之间的认知不脱节。

**Ultimate Goal:**
Our end goal is to allow all users, regardless of whether they know how to code or vibe code, to be able to use AI and the power of OpenClaw. We are building a system that creates a digital copy of the person; the model lives and learns with the human, requiring minimum effort to build automations in OpenClaw. The system will provide recommendations and help based on the data naturally collected via the system.


三、核心抽象
Person（人）：自己、他人
Intent / Idea（意图 / 思想方向）
Relation（关系）：人 ↔ 人、人 ↔ 事情、事情 ↔ 事情、思想 ↔ 思想

---

**Now, please begin your iteration on the codebase. Start by reviewing the current structure in `server/`, `client/`, and `database/`, mapping it to the framework, and writing your first iteration plan in `iteration_log.md`. Then execute.**
