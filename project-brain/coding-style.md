# Coding Style Guidelines & UI Standards

Guidelines for keeping files clean, compliant, and standard.

## 1. Type Safety
- **Strict TypeScript:** No `any` declarations inside agent files or modules. Explicitly define return objects and model schemas.
- **Component Interfaces:** Define props at top of components files.

## 2. Naming Standards
- **Components:** PascalCase (e.g. `ChatPanel.tsx`).
- **Hooks & Stores:** camelCase (e.g. `useProjectStore.ts`).
- **Services & Utils:** camelCase (e.g. `geminiService.ts`).

## 3. UI Guidelines
- **Theme Mode:** Support standard dark background `#09090b` with gray borders and text-indigo branding.
- **Animations:** Use `framer-motion` for transitions (e.g. `initial={{ opacity: 0 }}`).
- **Scrollbars:** Use custom styling scrollbars inside layouts.
