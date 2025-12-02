# Tasks: Multi-User Authentication System

**Input**: Design documents from `/specs/001-multi-user-auth/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Verify backend dependencies in `server/package.json` (passport, bcrypt, jsonwebtoken)
- [ ] T002 Verify frontend dependencies in `package.json` (axios, lucide-react)

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Ensure database schema in `server/database/schema.sql` is applied to `server/database/swaz.db`
- [ ] T004 Verify `server/src/database/repositories/UserRepository.ts` implements `findByEmail`, `createUser`, `findByGoogleId`, `updateUser`
- [ ] T005 Verify `server/src/services/auth/password.service.ts` and `server/src/services/auth/jwt.service.ts` are implemented

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Local User Authentication (Priority: P1) 🎯 MVP

**Goal**: A user wants to create an account and log in using their email and password so they can access personalized features.

**Independent Test**: Can be tested by registering a new user via the modal and verifying successful login without Google services.

### Implementation for User Story 1

- [ ] T006 [US1] Implement `register` logic in `server/src/controllers/auth.controller.ts`
- [ ] T007 [US1] Implement `login` logic in `server/src/controllers/auth.controller.ts`
- [ ] T008 [US1] Define routes in `server/src/routes/auth.routes.ts`
- [ ] T009 [P] [US1] Implement `RegisterForm` component in `components/auth/RegisterForm.tsx`
- [ ] T010 [P] [US1] Implement `LoginForm` component in `components/auth/LoginForm.tsx`
- [ ] T011 [US1] Update `AuthModal` in `components/auth/AuthModal.tsx` to switch between forms
- [ ] T012 [US1] Update `AuthContext` in `contexts/AuthContext.tsx` to handle `login` and `register` API calls
- [ ] T013 [US1] Update `Header` in `components/Header.tsx` to open `AuthModal`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Google OAuth Authentication (Priority: P1)

**Goal**: A user wants to log in using their existing Google account for convenience and faster access.

**Independent Test**: Can be tested by clicking the "Continue with Google" button and verifying the OAuth flow completes successfully.

### Implementation for User Story 2

- [ ] T014 [US2] Configure `passport-google-oauth20` in `server/src/services/auth/oauth.service.ts`
- [ ] T015 [US2] Implement `googleCallback` in `server/src/controllers/auth.controller.ts`
- [ ] T016 [US2] Add Google routes to `server/src/routes/auth.routes.ts`
- [ ] T017 [P] [US2] Implement `GoogleOAuthButton` in `components/auth/GoogleOAuthButton.tsx`
- [ ] T018 [US2] Add `GoogleOAuthButton` to `AuthModal` in `components/auth/AuthModal.tsx`

**Checkpoint**: At this point, User Story 2 should be fully functional and testable independently

---

## Phase 5: User Story 3 - Session Management & Logout (Priority: P1)

**Goal**: A user wants to securely log out of their account when finished, and have their session persist while using the app.

**Independent Test**: Can be tested by logging in, refreshing the page (session persistence), and then clicking logout.

### Implementation for User Story 3

- [ ] T019 [US3] Implement `logout` and `refresh` in `server/src/controllers/auth.controller.ts`
- [ ] T020 [US3] Add logout/refresh routes to `server/src/routes/auth.routes.ts`
- [ ] T021 [US3] Update `AuthContext` in `contexts/AuthContext.tsx` to handle `logout` and session check on load
- [ ] T022 [US3] Update `Header` in `components/Header.tsx` to show User Menu with Logout option when authenticated

**Checkpoint**: At this point, User Story 3 should be fully functional and testable independently

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements, UI polish, and edge case handling

- [ ] T023 Add error handling and validation feedback to forms in `components/auth/LoginForm.tsx` and `RegisterForm.tsx`
- [ ] T024 Ensure responsive design for Auth Modal in `components/auth/AuthModal.tsx`

## Dependencies

1. **User Story 1** depends on **Foundational Phase**
2. **User Story 2** depends on **Foundational Phase** (can be parallel with US1)
3. **User Story 3** depends on **User Story 1** (needs login to test logout)

## Parallel Execution Opportunities

- **Frontend/Backend Split**: T009/T010 (Frontend Forms) can be built while T006/T007 (Backend Logic) are being implemented.
- **Story Parallelism**: User Story 2 (Google Auth) can be implemented in parallel with User Story 1 (Local Auth) as they touch different controller methods and components.

## Implementation Strategy

1. **MVP First**: Focus on User Story 1 (Local Auth) to get the basic flow working.
2. **Incremental Delivery**: Deliver each story as a complete slice (Backend + Frontend).
3. **Security**: Ensure HTTP-only cookies are working correctly from the start (Phase 2/3).
