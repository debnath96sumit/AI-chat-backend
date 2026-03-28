# 🤖 AI Chat — Backend

A scalable, production-ready backend for an AI chat application built with **NestJS + TypeScript**. Supports multiple AI providers with real-time streaming, full user authentication lifecycle, and persistent chat history — all Dockerized and ready to deploy.

Pairs with the [AI-Chat-Frontend](https://github.com/debnath96sumit/AI-Chat-Frontend) repository.


---

## ✨ Features

- **Multi-Provider AI Support** — Direct REST API integration with Groq, Google Gemini, and Hugging Face Inference
- **Real-time Streaming** — Server-Sent Events (SSE) to stream AI token responses to the frontend
- **JWT Authentication** — Secure access and refresh token-based auth
- **User Management** — Register, login, profile management
- **Forgot & Reset Password** — Full password recovery flow with email notifications
- **Chat Persistence** — Chat sessions and message history stored in MongoDB
- **Email Templates** — Transactional emails via EJS templates (password reset, welcome, etc.)
- **Dockerized** — Fully containerized with Docker and Docker Compose
- **File Processing** - Added file upload support in that chat section
- **Subscription** - Added subscription tier to manage token usage lmit and file upload limit

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS (TypeScript) |
| Database | MongoDB (Mongoose) |
| Authentication | JWT (Access + Refresh Tokens) |
| AI Providers | Groq, Google Gemini, Hugging Face Inference |
| Streaming | Server-Sent Events (SSE) |
| Email | Nodemailer + EJS Templates |
| Containerization | Docker + Docker Compose |
| Testing | Jest (Unit + E2E) |

---

## 📁 Project Structure

```
src/
├── auth/        
├── common/      
├── helpers/     
├── modules/     

views/
└── email-templates/    # EJS email templates (password reset, welcome, etc.)

test/                   # E2E tests
```

---

## 🔌 API Overview

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login and receive JWT tokens |
| `POST` | `/auth/refresh` | Refresh access token |
| `POST` | `/auth/forgot-password` | Send password reset email |
| `POST` | `/auth/reset-password` | Reset password with token |

### Chat
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/chat/session` | Create a new chat session |
| `GET` | `/chat/sessions` | Get all sessions for a user |
| `GET` | `/chat/session/:id` | Get messages in a session |
| `POST` | `/chat/message` | Send a message and stream AI response |
| `DELETE` | `/chat/session/:id` | Delete a chat session |


---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- Docker & Docker Compose
- MongoDB instance (local or Atlas)
- API keys for Groq, Gemini, and/or Hugging Face
- Redis

### Installation

```bash
# Clone the repository
git clone https://github.com/debnath96sumit/AI-chat-backend.git
cd AI-chat-backend

# Install dependencies
npm install
```

### Environment Variables

```bash
cp .env.example .env
```

```env
OPEN_AI_API_KEY=
HF_TOKEN=
GEMINI_API_KEY=
GROQ_API_KEY=
NODE_ENV=development
PORT=

MONGO_URI=
DB_DATABASE=

FRONTEND_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

JWT_SECRET=
SALT_ROUND=10
JWT_ACCESS_EXPIRES_IN=
JWT_REFRESH_EXPIRES_IN=
JWT_REFRESH_EXPIRES_IN_REMEMBER=

MAIL_HOST=
MAIL_PORT=
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM_NAME=
MAIL_FROM_ADDRESS=

REDIS_HOST=redis
REDIS_PORT=6379

GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/v1/auth/github/callback
FRONTEND_URL=http://localhost:5173

```

### Running Locally

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run start:prod
```

### Running with Docker

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build

# Stop services
docker-compose down
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## 🎨 Frontend

This backend is designed to work with the **AI-Chat-Frontend** — a React + Vite application that provides the chat UI.

👉 [View the frontend repository](https://github.com/debnath96sumit/AI-Chat-Frontend)

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to check the [issues page](https://github.com/debnath96sumit/AI-chat-backend/issues).

---

## 👨‍💻 Author

**Sumit Debnath**

- LinkedIn: [linkedin.com/in/sumit-debnath-2214a6144](https://linkedin.com/in/sumit-debnath-2214a6144)
- GitHub: [@debnath96sumit](https://github.com/debnath96sumit)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).