# Dayflow AI Assistant API

## Endpoint

`POST /api/ai/chat`

The endpoint accepts a bearer JWT through the existing authentication middleware.

Headers:

```http
Authorization: Bearer <JWT>
Content-Type: application/json
```

Request:

```json
{ "message": "How was my attendance this week?" }
```

Success response:

```json
{ "success": true, "message": "You were present for 3 recorded days this week." }
```

Errors use the same shape. Key status codes: `400` invalid or oversized message, `401` missing/invalid JWT, `403` unauthorized HR request, `429` rate limit, and `503` unavailable AI service.

## Local setup

1. Copy `server/.env.example` to `server/.env` and configure its values.
2. Run `npm install` inside `server`.
3. Run `npm start` inside `server`.

This branch is a general chatbot only. It does not connect to MySQL or retrieve HR records.
