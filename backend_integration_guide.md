# Backend & MongoDB Integration Guide

The **Aura Youth** platform now has a complete **Node.js/Express** backend with **MongoDB** for persisting user accounts and session history.

## 🚀 How to Run the Backend
1.  **Change into the server directory**: `cd server`
2.  **Start the server**: `npm run dev` (or `npm start`)

> [!IMPORTANT]
> Ensure **MongoDB** is running locally at `mongodb://localhost:27017/aura-youth`.

---

## 🛠 Features Implemented

### 1. Account Persistence
*   **Registration**: Create a unique profile using your name, email, and password.
*   **Security**: Passwords are **hashed using bcryptjs** before being stored.
*   **JWT Auth**: Sessions are managed with a **JSON Web Token** saved to `localStorage`.

### 2. Activity History
*   **Mood Persistence**: After every mood check, your "vibe" is saved to your account.
*   **Mudra Timeline**: Completed Mudra and Exercise sessions are automatically added to your **"Personal Journey"** timeline.
*   **Data Retrieval**: Upon login, the Dashboard fetches your unique history and displays your most recent activities.

### 3. Personalized Dashboard
*   We replaced the "Friend" placeholder with your actual name: **"Yo, [Name]! 🤙"**.
*   The **"Personal Journey"** timeline now shows your actual training dates and results.

---

## 📡 API Reference
| Endpoint | Method | Data Fields |
| :--- | :--- | :--- |
| `/api/auth/register` | `POST` | `name`, `email`, `password` |
| `/api/auth/login` | `POST` | `email`, `password` |
| `/api/records` | `GET` | *(Requires Bearer Token)* |
| `/api/records` | `POST` | `type` ('mood', 'mudra', 'exercise'), `data` |

---
**Your "Aura Youth" experience is now truly your own!**
