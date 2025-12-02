# Research: Multi-User Authentication System

**Feature**: Multi-User Authentication
**Status**: Complete
**Date**: 2025-12-01

## Decisions

### 1. Authentication Strategy
- **Decision**: Use a hybrid approach supporting both Local (Email/Password) and Google OAuth.
- **Rationale**: Meets the user requirement for flexibility ("support both local users and google ID").
- **Implementation**:
  - **Local**: Handled via `bcrypt` for password hashing and JWT for session management.
  - **Google**: Handled via `passport-google-oauth20` strategy.

### 2. Session Management
- **Decision**: Use HTTP-only cookies for JWT storage (Access Token & Refresh Token).
- **Rationale**: More secure than `localStorage` against XSS attacks.
- **Implementation**:
  - `accessToken`: Short-lived (e.g., 15 min).
  - `refreshToken`: Long-lived (e.g., 7 days), stored in database `refresh_tokens` table.

### 3. Database Schema
- **Decision**: Use existing SQLite schema with `users` and `refresh_tokens` tables.
- **Rationale**: The existing schema in `server/database/schema.sql` already supports `auth_provider` and `google_id` fields, minimizing migration effort.

## Unknowns Resolved

- **Google OAuth Config**: Confirmed `server/src/services/auth/oauth.service.ts` is implemented and expects `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` in `.env`.
- **Backend Readiness**: Confirmed `AuthController` has `register` and `login` methods implemented.
- **Frontend Integration**: Confirmed `AuthContext` exists but needs to be connected to the UI components.

## Alternatives Considered

- **Firebase Auth**: Considered for ease of use, but rejected to maintain self-contained backend architecture and data sovereignty (SQLite).
- **NextAuth.js**: Not applicable as this is a Vite + Express app, not Next.js.
