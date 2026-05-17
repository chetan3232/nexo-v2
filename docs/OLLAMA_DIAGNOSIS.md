# Ollama API Diagnosis & Troubleshooting Guide

If your web application cannot reach the Ollama model on localhost, follow these steps to isolate and fix the problem.

## 1. Verify Ollama is Running
Ollama serves its API on port `11434` by default.
Run this command in your terminal:
```bash
curl http://localhost:11434/
```
**Expected Response:** `Ollama is running`

## 2. Check API Endpoints
Ensure your code uses the correct base URL:
- **Local Ollama:** `http://localhost:11434/api/generate`
- **Ollama Cloud:** `https://api.ollama.com/v1` (Check your specific provider docs)

## 3. Configure CORS (Cross-Origin Resource Sharing)
Browsers block requests from one port (e.g., 5173/Vite) to another (11434/Ollama) unless explicitly allowed.

### Windows (Setup OLLAMA_ORIGINS)
1. Open **System Environment Variables**.
2. Add a new User Variable:
   - **Variable name:** `OLLAMA_ORIGINS`
   - **Variable value:** `*` (or your specific URL like `http://localhost:5173`)
3. **Restart the Ollama application completely.**

### macOS/Linux
```bash
export OLLAMA_ORIGINS="*"
ollama serve
```

## 4. Network Binding (OLLAMA_HOST)
If accessing from a different machine or a Docker container, set `OLLAMA_HOST` to `0.0.0.0`:
```bash
export OLLAMA_HOST="0.0.0.0"
ollama serve
```

## 5. Verify CORS with Preflight Request (Manual Test)
Run this in terminal to see if the browser will allow the request:
```bash
curl -i -X OPTIONS http://localhost:11434 \
     -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: POST"
```
Look for `Access-Control-Allow-Origin` in the headers.

## 6. Firewall & Port Conflicts
- Ensure Windows Firewall or any Anti-Virus is not blocking port `11434`.
- Ensure no other application is using port `11434`.

---
*Reference: Official Ollama Documentation & Community Guides.*
