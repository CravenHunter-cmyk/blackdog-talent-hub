# BLACKDOG_PROJECT_CONTEXT.md

## 1. Project Overview

- Project name: BlackDog Talent Hub
- Positioning: A platform for global Native multilingual talent resource management, AI data project delivery, model evaluation team scheduling, and operational coordination.
- Target users: AI Labs, model companies, global technology companies, and ByteDance/TikTok-like customers.
- Core value: Demonstrate SpeedX's capabilities in global multilingual talent coverage, project delivery, candidate screening, task management, quality tracking, and customer collaboration.

## 2. Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- App Router / app directory
- Local project path: `/Users/family/Desktop/blackdog-talent-hub`
- GitHub repo: `blackdog-talent-hub`

## 3. Core Modules

- Talent Map: Global multilingual talent map.
- Talent Library: Talent database and searchable talent resources.
- Talent Workbench: Project task workspace.
- Communication Hub: Communication and collaboration center.
- BlackDog Brain: The total brain for turning human needs into AI-powered workflows, workspaces, and personalized operating systems. It has two strategic tracks: Business Brain for enterprise AI model evaluation systems, and Personal Brain for private AI assistants and personalized apps.
- BlackDog Tools: Internal tool center for reusable operational tools, starting with YouTube Speech Link Collector for public YouTube speech-link discovery and CSV export.
- Screening / Intake Forms: Candidate screening and intake forms.
- Quality Distribution: Quality distribution and resource level visibility.
- Language Management Team: PM, Resource Manager, and POC Manager mapped to each language.

## 4. Homepage Requirements

- The homepage must emphasize global Native talent coverage.
- Language should be the core organizing concept. Do not confuse Language with Pool or Region.
- The map should show global coverage on the left, and the detail panel on the right should update based on the selected language.
- The Language Management Team Options section below should visually align with the map area's width.
- Actions should not directly enter candidate detail pages. Candidate details belong inside authenticated modules.
- Do not show hourly rates.
- It is acceptable to show status metrics such as total pool, active talents, and online.
- Customers should see resource capability and project delivery capability, not an internal management backend.

## 5. Design Direction

- The overall experience should be professional, international, and customer-presentation friendly.
- Keep the interface clean, refined, and not overly decorative.
- Current preference: white background, black text, and clean layout.
- Future direction may include natural, warm, earth-tone styling.
- Do not make it look like a generic admin system. It should carry customer-facing presentation value.
- Pages should be suitable for later conversion into business PPTs and customer introduction materials.
- Desktop layouts should use centered responsive containers with a controlled max width. Main content should remain stable from common laptop widths through 2K/4K screens, without horizontal page overflow or unlimited stretching.

## 6. Development Workflow

Before each modification, check:

- `git status --short`

After each modification, check:

- `git status --short`
- `npm run lint`
- `npm run build`
- `git diff`

If `lint` or `build` fails, report the error reason and involved files before expanding the modification scope.

If `git status` shows user changes that have not been confirmed, do not overwrite them. Explain the status first.

After the modification is complete and verified, commit and push only after explicit user confirmation.

## 7. Collaboration Rules

- Codex must read `BLACKDOG_PROJECT_CONTEXT.md` before each modification.
- Do not rewrite pages based on old chat memory.
- Make minimal changes based on the current code.
- Do not break confirmed layouts or modules.
- Do not make large site-wide changes in one pass unless explicitly requested.
- If page structure, copy, or interaction logic is involved, explain the modification scope before editing.
- After finishing changes, explain which files changed, how they were verified, and the local preview URL.

## 8. Current Site Structure

- `/`: Public-facing homepage / Talent Map display page. It helps customers understand BlackDog Talent Hub's global multilingual resource coverage, active talent status, language management team, and delivery capabilities. The homepage must not directly expose candidate privacy, contact details, resumes, detailed pricing, or hourly rates.
- `/login`: Login entry for internal or protected workspace access.
- `/talent-library`: Talent Library. It manages candidate and talent resources. More detailed talent information can live here, but it should belong to logged-in or internal management scenarios.
- `/blackdog-brain`: BlackDog Brain. It is the primary top-navigation entry after Talent Map and the total brain for turning human needs into AI-powered workflows, workspaces, and personalized operating systems. The homepage should first present two strategic entrances: Business Brain and Personal Brain.
- `/blackdog-brain/business`: Business Brain. It builds AI model evaluation workflows, dedicated workbenches, expert talent operations, quality control, deployment, and model-ready delivery for enterprise clients.
- `/blackdog-brain/business/brain-studio`: Brain Studio. PM and solution designer workspace for interpreting requirements, breaking down model capabilities, designing evaluation methods, drafting rules, defining QC standards, and planning delivery outputs.
- `/blackdog-brain/business/project-lab`: Project Lab. Workspace for converting evaluation logic into executable projects, dedicated workbenches, field/schema structures, pilot batches, calibration rooms, guideline versions, and launch checklists.
- `/blackdog-brain/business/talent-workspace`: Talent Workspace. Evaluator/reviewer execution workspace for talent matching, assignments, guideline reading, calibration training, task workbench, QA feedback, quality scorecards, and workload records.
- `/blackdog-brain/business/workflow-monitor`: Workflow Monitor. Client/PM/delivery visibility layer for project timeline, milestones, production, QC, risks, decisions, client confirmation, and final delivery packages.
- `/blackdog-brain/business/deployment-center`: Deployment Center. Workspace for BlackDog-hosted operations, client-side deployment, API connection, data security settings, export schemas, and handover packages.
- `/blackdog-brain/personal`: Personal Brain. It builds private AI assistants and personalized apps for individuals by turning personal needs, habits, preferences, and privacy boundaries into secure AI-powered life systems.
- `/blackdog-brain/personal/personal-need-studio`: Personal Need Studio. Workspace for understanding personal needs, life scenarios, habits, goals, and privacy boundaries.
- `/blackdog-brain/personal/lifestyle-workflow-builder`: Lifestyle Workflow Builder. Workspace for turning daily life needs into assistant workflows, recommendation logic, reminders, feedback loops, and personal routines.
- `/blackdog-brain/personal/private-app-builder`: Private App Builder. Workspace for generating private AI assistant apps, web apps, or mini app interfaces around individual needs.
- `/blackdog-brain/personal/personal-data-vault`: Personal Data Vault. Workspace for protecting preferences, habits, history, feedback, and permission settings.
- `/blackdog-brain/personal/continuous-optimization`: Continuous Optimization. Workspace for improving private assistants through feedback, behavior patterns, usage review, and personal goal updates.
- Legacy flat routes under `/blackdog-brain/brain-studio`, `/blackdog-brain/project-lab`, `/blackdog-brain/talent-workspace`, `/blackdog-brain/workflow-monitor`, and `/blackdog-brain/deployment-center` may remain as compatibility routes, but the preferred long-term route structure is under `/blackdog-brain/business/...`.
- `/workspace/tools`: BlackDog Tools / 黑狗工具. Internal tool center for reusable BlackDog operational tools. It supports Card View and List View. First active tool: YouTube Speech Link Collector. Coming-soon tools include Talent Lead Parser, Lark Table Helper, and Resource Matcher.
- `/workspace/tools/youtube-speech-link-collector`: YouTube Speech Link Collector / YouTube 语音链接采集器. Database-backed collection task workspace for generating YouTube search keywords by multi-select Language, Domain, and Search Targets; optionally expanding keywords through backend DeepSeek API; running Apify YouTube search batches; deduplicating task-level results; editing status/notes; soft deleting rows; reviewing task history; and exporting task-level CSV. It must not download videos or subtitles, expose API tokens, or contact creators.
- `/work-center`: Work Center / historical AI Diagnosis workspace. It remains an internal workspace route, but BlackDog Brain is the primary navigation concept for the AI model evaluation operating brain.
- `/task-management`: Task Management. It supports project tasks, data tasks, evaluation tasks, and delivery task management.
- `/team-hub`: Team Hub. It supports management of project teams, language owners, PMs, Resource Managers, POC Managers, and related roles.
- `/talent-messages`: Communication Hub / Talent Messages. It supports talent communication, project messages, candidate follow-up, and upstream/downstream communication records.
- `/settings`: Settings. It supports system settings, account settings, permissions, and configuration entry points.

The `/` route is the more customer-facing public page. The other routes are more workspace, internal, or login-protected functional areas. Future development must not place internal candidate privacy information on the homepage by mistake.

Top navigation currently uses this order: Talent Map, BlackDog Brain, BlackDog Tools, BlackDog Talent Museum, Talent Hub, PM Hub, Sourcing Hub, Command, Account/Login. Talent Map must remain first, BlackDog Brain second, and BlackDog Tools third. Navigation names stay visible to logged-out visitors; Talent Map is public, while all other workspace modules require login before showing real business content. Logged-out clicks on protected navigation items may route to the requested workspace path, but the page-level AccessGate must show a single Access Required card instead of rendering the real workspace or a second modal. AI Diagnosis should not appear as a separate top-level navigation item; AI model evaluation diagnosis capabilities are organized under BlackDog Brain.

BlackDog Brain now has two strategic tracks:

1. Business Brain: builds AI model evaluation workflows, workbenches, talent operations, QC, deployment, and model-ready delivery for enterprise clients.
2. Personal Brain: builds private AI assistants and personalized apps for individuals, turning personal needs into secure AI-powered life systems.

BlackDog Tools is an internal workspace area. The YouTube Speech Link Collector now uses the database task model as the primary path: task -> search batch -> deduplicated YouTube results -> result matches -> export records. Browser localStorage key `blackdog_youtube_speech_results` remains only as a legacy local-results compatibility area and should not be the primary path for new searches. Backend API keys for DeepSeek and Apify must only be read from server-side environment variables.

BlackDog Tools database direction: use Drizzle ORM with Neon serverless driver. Database schema lives in `src/db/schema.ts`, database client lives in `src/db/index.ts`, and Drizzle config lives in `drizzle.config.ts`. The first database tables are `tool_tasks`, `tool_search_batches`, `youtube_results`, `youtube_result_matches`, and `tool_exports`.

BlackDog platform auth direction: `src/lib/auth/blackdogAuth.ts` is the shared server-side user adapter for BlackDog Tools. Production / preview access requires a valid `blackdog_session` httpOnly cookie backed by `blackdog_sessions`, `blackdog_accounts`, and `blackdog_tool_permissions`; unauthenticated requests should return `401`. Development may still use the header adapter or dev fallback for smoke testing, but production must not trust spoofable headers or localStorage snapshots as an identity source. `src/lib/tools/youtubeAuth.ts` must reuse this BlackDog user adapter rather than maintaining a separate identity source. The canonical YouTube tool id is `youtube_speech_link_collector`; admin users pass automatically, while reviewer/member users require explicit tool access.

BlackDog product UI should be English-only by default. Avoid bilingual labels, Chinese UI copy, verbose helper text, and marketing-style explanations in workspace tools.

YouTube Speech Link Collector keyword generation must treat multi-select Language, Domain, and Search Target as separate Cartesian-product groups. Do not merge multiple domains or targets into a single keyword. Each keyword should carry language, domain, searchTarget, and groupKey metadata. Exports should show task-level unique videos with aggregated matched languages, matched domains, matched search targets, and matched keywords. Preferred Video Quality is a task/export preference only; the current tool collects links and does not download videos or force YouTube playback quality.

## 9. Local Development

- Project path: `/Users/family/Desktop/blackdog-talent-hub`
- Local dev command: `npm run dev`
- Default local URL: `http://localhost:3000`
- If port `3000` is occupied, Next.js may automatically use another port, for example `http://localhost:3001`.
- Current observed local URL: `http://localhost:3001`

## 10. Validation Commands

Before modification:

- `git status --short`

After modification:

- `git status --short`
- `npm run lint`
- `npm run build`

When reviewing changes:

- `git diff`

Rules:

- If `lint` or `build` fails, report the error reason and involved files. Do not continue expanding the modification scope without clarifying the issue.
- If `git status` shows user changes that have not been confirmed, do not overwrite them. Explain the status first.
- Unless the user explicitly asks, do not automatically commit or push.

## 11. Context Maintenance Rules

`BLACKDOG_PROJECT_CONTEXT.md` is the long-term source of truth for this project. Any important change that affects the following areas should update this file in the same work cycle:

1. Page structure changes, such as adding, deleting, or renaming routes or core modules.
2. Business logic changes, such as changes to field definitions for Talent Pool, Active Talents, Online, Region, Language, Quality Distribution, Team Roles, and related concepts.
3. Public / Internal boundary changes, such as which information can be shown on the homepage and which information must remain inside the logged-in workspace.
4. Design principle changes, such as brand style, page layout principles, customer presentation approach, or visual direction adjustments.
5. Development workflow changes, such as startup commands, validation commands, deployment methods, or Git workflow changes.

## 12. Collaboration Workflow with ChatGPT and Codex

When the user requests a website change:

1. Read `BLACKDOG_PROJECT_CONTEXT.md` first.
2. Inspect the current code structure and current page implementation.
3. Understand the user's screenshot and requirement.
4. Judge whether the request is reasonable based on product logic, page role, and public/internal boundary.
5. Modify only the necessary files.
6. Preserve approved content, layout logic, business terminology, and existing routes unless the user explicitly asks to change them.
7. Run validation commands.
8. Report changed files, what was changed, what was preserved, validation result, and whether `BLACKDOG_PROJECT_CONTEXT.md` needs to be updated.
9. Do not commit or push unless the user explicitly approves.

ChatGPT can help reason about product direction and generate complete Codex instructions. Codex should rely on this context file plus the current codebase, not old chat history.

## Change Log

### 2026-05-22

- Confirmed `BLACKDOG_PROJECT_CONTEXT.md` as the long-term source of truth for BlackDog Talent Hub.
- Confirmed actual project path: `/Users/family/Desktop/blackdog-talent-hub`.
- Confirmed current routes include public homepage and multiple workspace/internal modules.
- Added local development, validation, and context maintenance rules.
- Established collaboration workflow: ChatGPT helps reason and generate complete Codex instructions; Codex reads project context and code before making changes.
- No page code changes.
- Added first desktop responsive guidance: centered page shell, controlled large-screen max width, stable Workflow Diagram canvas scaling, and no page-wide horizontal overflow target for mainstream laptop, desktop, projection, and large-screen viewports.

### 2026-05-24

- Upgraded the former Delivery Hub / Work Center positioning into AI Diagnosis / AI Capability Diagnosis.
- Confirmed `/work-center` remains the route for the first AI Diagnosis implementation; no `/ai-diagnosis` route has been added yet.
- Established the first-level AI Diagnosis module loop: Brain Studio -> Project Lab -> Talent Workspace -> Diagnosis Flow -> Deployment Center.
- Confirmed Talent Workspace should emphasize evaluator/reviewer execution, guideline support, QA feedback, quality scorecards, and workload records rather than simple talent display.
- Repositioned BlackDog Brain as the top-level operating brain for AI model evaluation projects.
- Confirmed top navigation should show BlackDog Brain after Talent Map and should not show AI Diagnosis as a separate navigation entry.
- Added `/blackdog-brain` hub plus five subroutes: Brain Studio, Project Lab, Talent Workspace, Workflow Monitor, and Deployment Center.
- Confirmed BlackDog Brain expresses the full loop from client requirement to evaluation workflow, workbench, talent collaboration, quality control, delivery visibility, deployment, and reusable assets.
- Upgraded BlackDog Brain from a single enterprise evaluation brain into the total BlackDog brain with two strategic tracks: Business Brain and Personal Brain.
- Added the preferred nested route structure for Business Brain under `/blackdog-brain/business/...`.
- Added Personal Brain under `/blackdog-brain/personal` with five modules: Personal Need Studio, Lifestyle Workflow Builder, Private App Builder, Personal Data Vault, and Continuous Optimization.
- Added Personal Brain example direction: Private Outfit Assistant as one example of private AI life systems, without limiting Personal Brain to fashion use cases.

### 2026-05-26

- Added BlackDog Tools / 黑狗工具 as an internal tool center under `/workspace/tools`.
- Added the first active tool: YouTube Speech Link Collector / YouTube 语音链接采集器 under `/workspace/tools/youtube-speech-link-collector`.
- Added keyword-generation structure: rule-based keyword maps, backend DeepSeek keyword expansion, deduped final keywords, and manual keyword editing.
- Added backend YouTube search adapter for Apify YouTube Scraper. API tokens remain server-side only.
- Confirmed first-version local browser result persistence used localStorage key `blackdog_youtube_speech_results`, with CSV export for selected or retained rows.
- Confirmed the tool does not download videos, download subtitles, contact creators, or judge speaker nativeness/audio quality in this MVP.
- Updated YouTube Speech Link Collector search targeting from single Speech Type to multi-select Search Targets / Define the Search Target, while preserving backward compatibility for old `speechType` data.
- Added the first BlackDog Tools database foundation using Drizzle ORM and Neon serverless driver.
- Upgraded YouTube Speech Link Collector into a database-backed collection task workspace with Task Workspace, Task History, multi-select Language/Domain/Search Targets, task-level target counts, batch target counts, batch history, merged summary, database results, PATCH/DELETE result actions, task export, and legacy localStorage compatibility.
- Cleaned BlackDog Tools and YouTube Speech Link Collector UI to English-only labels and moved BlackDog Tools directly after BlackDog Brain in the top navigation.
- Fixed YouTube keyword generation to produce per-combination keyword groups, preserve keyword classification metadata through batches, aggregate classifications in task results and CSV exports, and add Preferred Video Quality as an export preference.
