# Project: [Project Name]

## Rules for Claude (Always Follow)

### Session Start
- Always read CONTEXT.md at the start of every session for current project state.
- Read ROADMAP.md if the task relates to future plans or phases.
- Read RECENT.md if it exists, for conversation context from the last session.

### GitHub Safety
- Always commit working code before starting edits.
- If a change may break existing functionality, create a new branch.
- Write clear, descriptive commit messages.

### Preserve Functionality
- Do not remove or alter working features unless explicitly instructed.
- If a change risks regression, stop and explain before proceeding.

### Code Changes
- Keep changes incremental and well-commented.
- Highlight what was added, removed, or updated.

### Verification
- After edits, run tests or basic checks.
- Report any errors or warnings.

### CONTEXT.md Maintenance
- When something significant changes, update CONTEXT.md in place.
- Do not append a session log. Rewrite the affected sections instead.

### General
- Treat GitHub as the single source of truth.
- All steps must be safe, reversible, and transparent.
- **Never start or restart the server.** Don't run `npm run dev`, `node server/index.ts`, or any command that binds to port 5000. The Replit Workflow manages the server — not Claude Code.
- **Edit files only.** Make code changes to files but don't try to run or serve the app. Replit handles hot-reloading for frontend changes automatically.
- **Don't use Docker or virtual environments.** Replit uses Nix.
- **Don't modify `package.json`, `vite.config.ts`, or `drizzle.config.ts`** unless intentional — these are managed by the Replit environment.
