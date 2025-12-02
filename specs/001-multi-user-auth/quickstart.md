# Quickstart: Multi-User Authentication

## Prerequisites

1.  **Google Cloud Console Project**:
    - Create a project at [console.cloud.google.com](https://console.cloud.google.com).
    - Enable "Google+ API" or "Google People API".
    - Configure OAuth Consent Screen.
    - Create OAuth 2.0 Credentials (Client ID & Secret).
    - Add Authorized Redirect URI: `http://localhost:3001/api/auth/google/callback`.

2.  **Environment Variables**:
    - Add the following to your `.env` file (or `server/.env`):
      ```env
      GOOGLE_CLIENT_ID=your_client_id
      GOOGLE_CLIENT_SECRET=your_client_secret
      GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
      JWT_SECRET=your_jwt_secret_key
      ```

## Running the Feature

1.  **Start the Backend**:
    ```bash
    cd server
    npm run dev
    ```

2.  **Start the Frontend**:
    ```bash
    npm run dev
    ```

3.  **Verify**:
    - Open `http://localhost:5173`.
    - Click "Login" in the header.
    - Try registering a new account.
    - Try logging in with Google.
