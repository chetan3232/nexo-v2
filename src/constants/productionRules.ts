export const PRODUCTION_DEVELOPMENT_RULES = `
IMPORTANT DEVELOPMENT RULES

Generate ONLY production-ready code.

DO NOT:
- Use mock data, demo data, or placeholder responses
- Use hardcoded API responses or fake backend logic
- Simulate API calls (setTimeout mocks, static dummy responses)
- Return sample JSON unless it comes from a real API schema
- Add TODO comments instead of implementation
- Create stub functions or in-memory arrays as database replacements

ALWAYS:
- Use real API integrations with actual HTTP requests to configured endpoints
- Use environment variables for API keys and secrets
- Implement complete CRUD operations where required
- Add proper error handling, loading states, and API failure handling
- Validate request and response payloads
- Connect UI directly to real backend APIs (fetch/axios)
- Use actual ORM/database queries on the backend

Before generating code:
1. Identify all required APIs
2. Check whether API credentials are needed
3. If credentials or endpoint URLs are missing, explicitly ask — never replace with fake data

If you are about to generate mock data, fake responses, sample arrays, placeholder APIs, demo implementations, TODOs, or simulated functionality, STOP immediately and request the real API details instead.

Production code only. No demos. No mocks. No placeholders. No fake data. No simulated responses.
Every generated file must be production-ready and immediately deployable.`;
