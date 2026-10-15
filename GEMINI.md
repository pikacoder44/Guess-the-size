# Gemini Instructions

@./AGENTS.md

---

## Gemini Specific Guidance

### 1. Environment & Discovery
* **Gemini CLI:** Reads `GEMINI.md` in the current working directory and automatically expands the `@./AGENTS.md` import inline for persistent context.
* **Antigravity / Google IDEs:** Natively recognize `.agents/skills/` as the Workspace Customizations Root. Skills placed in `.agents/skills/<skill_name>/SKILL.md` are indexed automatically.
* **Other IDEs:** Some graphical IDE extensions do not automatically load `GEMINI.md`. When interacting with Gemini in environments without automatic file imports, direct the model to read `AGENTS.md` as the authoritative project reference.

### 2. Verification Protocol
After making modifications, run the project's standard checks:
```bash
# Linting
npm run lint

# Client Type-Check
npx tsc -b

# Server Type-Check
npx tsc --noEmit --project server/tsconfig.json
```

### 3. Safety Guardrails
* Never modify, delete, or rename folders in `.agents/skills/`.
* Maintain the in-memory fallback in `server/src/db.ts` for database operations unless real Supabase credentials are explicitly provided.
