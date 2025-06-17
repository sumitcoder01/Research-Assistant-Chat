# 🤖 Research Assistant — Chat

A modern, AI-powered research assistant frontend built using **React (TypeScript)**, **Tailwind CSS**, and **Three.js** for enhanced visuals.  
Integrates seamlessly with the Automated Research Assistant API.

---

## 🚀 Features

- 🧠 Chat with AI using top LLM providers (OpenAI, Anthropic, DeepSeek, Gemini)
- 📂 Upload PDFs, DOCX, or images for contextual AI research
- 🧵 Persistent chat sessions (stored in browser)
- 🪄 Markdown & code block rendering
- 🧮 Model & provider selection dropdowns
- 📜 Session-based message history
- 🎨 Beautiful, animated background (via Three.js)
- ⚡ Clean, fast, responsive UI with Tailwind CSS

---

## 🖥️ Demo

> Preview the Application:  
> 🔗 [https://research-assistant-chat.lovable.app](https://research-assistant-chat.lovable.app)

---

## 🧰 Tech Stack

| Tech             | Description                      |
|------------------|----------------------------------|
| React (TypeScript) | Core frontend framework        |
| Tailwind CSS     | Styling                          |
| Three.js         | Background animation / visuals   |
| localStorage     | Session persistence              |
| Axios / Fetch    | API communication                |

---

## 📦 Installation

```bash
git clone https://github.com/sumitcoder01/Research-Assistant-Chat.git
cd Research-Assistant-Chat

# Install dependencies
npm install

# Run development server
npm run dev
````

> Ensure Node.js ≥ 18.x and npm ≥ 9.x are installed.

---

## ⚙️ Environment Setup

Create a `.env` file with:

```env
VITE_BACKEND_BASE_URL= backend url
```

---

## 🧑‍💻 Folder Structure

```bash
src/
│
├── components/        # Reusable UI components (chat bubble, input, dropdowns)
├── pages/             # App pages (Home.tsx, NotFound.tsx)
├── hooks/             # Custom React hooks
├── services/          # API service (axios wrappers)
├── store/             # Zustand or context-based state
├── utils/             # Utility functions (date, storage)
├── assets/            # Icons, images, backgrounds
└── App.tsx            # Main app entry
```

---

## 🔌 API Endpoints

| Feature                | Endpoint                                    |
| ---------------------- | ------------------------------------------- |
| ✅ Check Status         | `GET /`                                     |
| 🆕 Create Session      | `POST /api/v1/sessions`                     |
| 🧠 Submit Query        | `POST /api/v1/query`                        |
| 📜 Get Session History | `GET /api/v1/sessions/{session_id}/history` |
| 📂 Upload Documents    | `POST /api/v1/documents/upload`             |

---

## 📚 Usage Guide

### 🧵 Chat Sessions

* Max 10 stored in localStorage
* Newest shown first
* Create via `+` icon (custom name) or on sending first message (default name)

### 💬 Message Input

* Send message by pressing `Enter`
* Attach files via 📎 icon
* Select models and providers from dropdowns

### 📦 Supported LLM Providers

| Provider  | Models                             |
| --------- | ---------------------------------- |
| openai    | `gpt-4o`, `gpt-4`, `gpt-3.5-turbo` |
| anthropic | `claude-3-opus`, `claude-3-sonnet` |
| deepseek  | `deepseek-coder`, `deepseek-chat`  |
| gemini    | `gemini-2.0-flash`, `gemini-2.0-pro` |

---

## 🌈 Screenshots (Coming Soon)

| Chat Interface              | Model Dropdown & Uploads     |
| --------------------------- | ---------------------------- |
| ![](./screenshots/chat.png) | ![](./screenshots/tools.png) |

---

## 🧪 Testing (optional)

```bash
npm run test
```

> Unit + integration testing using Vitest / React Testing Library (if enabled)

---

## 🧑‍🤝‍🧑 Contributing

```bash
# Fork the repo
# Create your feature branch
git checkout -b feat/your-feature

# Commit your changes
git commit -m "✨ Add your feature"

# Push and create PR
git push origin feat/your-feature
```
