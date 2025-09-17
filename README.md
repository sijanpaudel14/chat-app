# AI Chat Assistant 🤖

A beautiful, modern chat application built with Next.js and FastAPI, powered by Google's Gemini AI.

## Features ✨

- **Real-time streaming**: Messages stream in real-time as the AI responds
- **Beautiful UI**: Modern, responsive design with dark/light mode support
- **Conversation history**: Maintains context throughout your conversation
- **Mobile responsive**: Works perfectly on all device sizes
- **Reset functionality**: Clear conversation history anytime
- **TypeScript**: Fully typed for better development experience

## Tech Stack 🛠️

### Frontend

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons

### Backend

- **FastAPI** - Modern Python web framework
- **LangChain** - AI/LLM integration
- **Google Gemini AI** - Powerful language model
- **Server-Sent Events** - Real-time streaming

## Quick Start 🚀

### Prerequisites

- Python 3.8+
- Node.js 18+
- Google Gemini API key

### 1. Clone and Setup

```bash
git clone <your-repo>
cd chat-app
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Easy Start (Recommended)

Run the automated start script:

```bash
./start.sh
```

This will:

- Create a Python virtual environment
- Install all dependencies
- Start the FastAPI backend (port 8000)
- Start the Next.js frontend (port 3000)

### 4. Manual Start (Alternative)

#### Backend

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
python api_server.py
```

#### Frontend

```bash
# Navigate to frontend directory
cd chatapp

# Install dependencies
npm install

# Start development server
npm run dev
```

## Usage 💬

1. Open your browser to `http://localhost:3000`
2. Start chatting with the AI assistant
3. Use the reset button to clear conversation history
4. Toggle between light and dark modes
5. Enjoy real-time streaming responses!

## API Endpoints 🔌

- `POST /api/chat/stream` - Stream chat responses
- `POST /api/chat/reset` - Reset conversation history
- `GET /api/chat/history` - Get conversation history
- `GET /` - Health check

## Project Structure 📁

```
chat-app/
├── api_server.py           # FastAPI backend
├── stream_chat.py          # Original chat logic
├── requirements.txt        # Python dependencies
├── start.sh               # Easy start script
├── .env                   # Environment variables
└── chatapp/               # Next.js frontend
    ├── src/
    │   └── app/
    │       ├── components/
    │       │   └── ChatInterface.tsx
    │       ├── globals.css
    │       ├── layout.tsx
    │       └── page.tsx
    ├── package.json
    └── ...
```

## Customization 🎨

### Styling

- Modify `chatapp/src/app/globals.css` for global styles
- Update Tailwind classes in `ChatInterface.tsx` for component styling

### AI Model

- Change the `MODEL` variable in `api_server.py` to use different Gemini models
- Modify the `system_message` to change AI behavior

### UI Components

- Add new features to `ChatInterface.tsx`
- Customize colors, animations, and layout

## Troubleshooting 🔧

### Common Issues

1. **API Key Error**: Make sure your `.env` file contains a valid `GEMINI_API_KEY`
2. **Port Conflicts**: Change ports in the respective config files if 3000 or 8000 are in use
3. **CORS Issues**: The backend is configured to allow all origins for development

### Logs

- Backend logs: Check terminal running `api_server.py`
- Frontend logs: Check browser developer console

## Contributing 🤝

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License 📄

This project is open source and available under the [MIT License](LICENSE).

---

**Enjoy chatting with your AI assistant!** 🎉
