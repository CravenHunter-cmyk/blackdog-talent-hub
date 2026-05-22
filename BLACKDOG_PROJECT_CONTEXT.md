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
- BlackDog Brain: AI assistant and intelligent analysis.
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

## 6. Development Workflow

Before each modification, check:

- `git status`
- `npm run lint`
- `npm run build`

After each modification, check:

- `npm run lint`
- `npm run build`
- `git diff`

After the modification is complete and verified, commit and push only after confirmation.

## 7. Collaboration Rules

- Codex must read `BLACKDOG_PROJECT_CONTEXT.md` before each modification.
- Do not rewrite pages based on old chat memory.
- Make minimal changes based on the current code.
- Do not break confirmed layouts or modules.
- Do not make large site-wide changes in one pass unless explicitly requested.
- If page structure, copy, or interaction logic is involved, explain the modification scope before editing.
- After finishing changes, explain which files changed, how they were verified, and the local preview URL.
