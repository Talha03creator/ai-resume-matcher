<div align="center">

# ✨ AI Resume Matcher & Job Analyzer

### _Land your dream job with AI-powered resume intelligence_

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-Powered-8E75B2?logo=google&logoColor=white)](https://ai.google.dev/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)

<br />

> **Smart resume analysis meets generative AI.** Upload your resume, paste a job description, and get instant match scores, skills gap analysis, and an ATS-optimized rewrite — all in seconds.

</div>

---

## 📖 About

**AI Resume Matcher** is a full-stack web application that uses Google's Gemini AI to intelligently compare resumes against job descriptions. Unlike simple keyword-matching tools, it understands context, synonyms, and industry nuances to provide actionable feedback.

### Who is this for?

- 🎓 **Job seekers** who want to tailor their resume to specific roles
- 💼 **Career changers** who need to identify and bridge skills gaps
- 📝 **Students & fresh graduates** preparing for their first applications
- 🚀 **Professionals** aiming to optimize their resume for ATS systems

---

## 🚀 Features

| Feature | Description |
|---|---|
| **📊 Match Score** | Get a percentage-based compatibility score between your resume and any job description |
| **🎯 Skills Analysis** | See matching skills highlighted and missing skills identified at a glance |
| **📈 Section Scoring** | Detailed breakdown across Skills, Experience, Education, and Impact categories |
| **💡 AI Suggestions** | Receive personalized improvement tips, resume suggestions, and template recommendations |
| **✍️ Resume Rewrite** | One-click ATS-optimized resume rewrite powered by Gemini AI — the killer feature |
| **📁 File Upload** | Supports PDF, DOCX, and TXT resume uploads with automatic text extraction |
| **🌙 Dark Mode UI** | Sleek, modern glassmorphic interface with smooth animations |
| **🌐 Multi-Language** | Built-in internationalization support |
| **📋 ATS Checklist** | Get a checklist of items to review before submitting your application |

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS 4, Framer Motion, Recharts, Lucide Icons |
| **Backend** | Node.js, Express.js, TypeScript |
| **AI Engine** | Google Gemini AI (2.5 Flash Lite → 2.5 Flash → 2.0 Flash Lite fallback chain) |
| **File Parsing** | `pdf-parse` (PDF), `mammoth` (DOCX), native (TXT) |
| **Build Tool** | Vite 6 |
| **Deployment** | Vercel |

---

## ⚙️ Installation

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A free **Gemini API Key** — [Get one here](https://aistudio.google.com/apikey)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Talha03creator/ai-resume-matcher.git
cd ai-resume-matcher

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Then edit .env and add your Gemini API key

# 4. Start the development server
npm run dev
```

The app will be running at **http://localhost:3000** 🎉

---

## 🔐 Environment Variables

Create a `.env` file in the root directory with:

```env
# Required
GEMINI_API_KEY=your_api_key_here

# Optional
PORT=3000
NODE_ENV=development
```

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Your Google Gemini API key |
| `PORT` | ❌ No | Server port (default: `3000`) |
| `NODE_ENV` | ❌ No | Environment mode (default: `development`) |

> **⚠️ Never commit your `.env` file.** It's already included in `.gitignore`.

---

## 📂 Project Structure

```
ai-resume-matcher/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── BackgroundMesh.tsx
│   │   ├── CustomCursor.tsx
│   │   ├── LanguageSwitcher.tsx
│   │   ├── ShimmerButton.tsx
│   │   ├── Spotlight.tsx
│   │   ├── Tooltip.tsx
│   │   └── Typewriter.tsx
│   ├── context/          # React Context providers
│   │   ├── I18nContext.tsx
│   │   └── OnboardingContext.tsx
│   ├── hooks/            # Custom React hooks
│   │   └── useUndoRedo.ts
│   ├── lib/              # Utilities
│   │   └── utils.ts
│   ├── services/         # API service layer
│   │   └── ai.ts
│   ├── App.tsx           # Main application component
│   ├── main.tsx          # React entry point
│   └── index.css         # Global styles
├── server.ts             # Express backend + AI integration
├── index.html            # HTML entry point
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
├── package.json          # Dependencies & scripts
├── .env.example          # Environment variable template
├── .gitignore            # Git ignore rules
└── README.md             # You are here!
```

---

## 🌐 Deployment

This project is designed for seamless deployment on **Vercel**:

1. Push your code to GitHub
2. Import the repository in [Vercel Dashboard](https://vercel.com/new)
3. Add your environment variables in Vercel's project settings:
   - `GEMINI_API_KEY` → your API key
4. Deploy — Vercel auto-detects the Vite + Express setup

### Build Command

```bash
npm run build
```

### Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Type-check with TypeScript |

---

## 📸 Screenshots

<!-- Add your screenshots here -->

> _Screenshots coming soon — the app features a stunning dark glassmorphic UI with smooth animations, tabbed analysis results, interactive charts, and a one-click resume rewrite experience._

---

## 🎯 Future Improvements

- [ ] **Multi-AI Support** — Toggle between Gemini, OpenAI, and Claude for analysis
- [ ] **Resume Download** — Export rewritten resumes as formatted PDF documents
- [ ] **User Accounts** — Save analysis history and track improvement over time
- [ ] **Batch Analysis** — Compare one resume against multiple job descriptions
- [ ] **LinkedIn Integration** — Import resume data directly from LinkedIn profiles
- [ ] **Interview Prep** — AI-generated interview questions based on the job description

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by [Talha](https://github.com/Talha03creator)**

⭐ _If you found this useful, consider giving it a star!_ ⭐

</div>
