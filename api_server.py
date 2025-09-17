from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage, SystemMessage, AIMessage

# Load environment variables
load_dotenv(override=True)
api_key = os.getenv("GEMINI_API_KEY")

if api_key:
    print(f"Google API Key exists and begins {api_key[:8]}")
else:
    print("Google API Key not set")

MODEL = "gemini-2.0-flash"
model = ChatGoogleGenerativeAI(model=MODEL, api_key=api_key)

app = FastAPI(title="Chat API", description="Streaming chat API with Gemini")

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

system_message = """You are a helpful AI assistant that provides well-structured, professional responses. Follow these formatting guidelines:

**Markdown Formatting:**
- Use **bold** for emphasis and important terms
- Use *italics* for slight emphasis  
- Use `code` for inline code, variables, and function names
- Use ```language for code blocks (e.g., ```python, ```javascript, ```bash)
- Use # ## ### for clear section headers
- Use numbered lists (1. 2. 3.) or bullet points (- or *) for organized information
- Use > for quotes and important notes

**Code Formatting Standards:**
- Always use proper code blocks with language specification
- Format code with proper indentation and spacing
- Add clear comments explaining complex logic
- Use descriptive variable and function names in snake_case (e.g., user_name, process_data, file_path)
- Include docstrings for functions with Args and Returns
- Separate logical sections with blank lines
- Follow language-specific conventions (PEP 8 for Python, camelCase for JavaScript, etc.)
- IMPORTANT: Use snake_case for all Python variable names (not camelCase)

**Response Structure:**
- Start with a brief explanation
- Provide well-formatted code examples
- Add explanations for key concepts
- Use clear headings to organize content
- End with summary or next steps when appropriate

**Code Examples Should:**
- Be properly indented and formatted
- Include helpful comments
- Use clear, descriptive names
- Follow best practices
- Be immediately usable

Always provide professional, well-organized responses that are easy to read and understand."""
conversation_history = []


class ChatRequest(BaseModel):
    message: str
    model_name: str = MODEL


class ChatResponse(BaseModel):
    message: str
    role: str


def stream_chat_generator(user_input: str, model_name: str):
    global conversation_history

    # Convert previous history to LangChain messages
    lc_history = []
    for h in conversation_history:
        role = h["role"]
        content = h["content"]
        if role == "user":
            lc_history.append(HumanMessage(content=content))
        elif role == "assistant":
            lc_history.append(AIMessage(content=content))
        else:
            lc_history.append(SystemMessage(content=content))

    # Full messages: system + history + current user
    messages = [SystemMessage(content=system_message)] + \
        lc_history + [HumanMessage(content=user_input)]

    # Stream the response from the model
    response_text = ""
    for chunk in model.stream(messages):
        if chunk.content:
            response_text += chunk.content
            # Send as Server-Sent Events format
            yield f"data: {json.dumps({'content': response_text, 'done': False})}\n\n"

    # Save to conversation history
    conversation_history.append({"role": "user", "content": user_input})
    conversation_history.append(
        {"role": "assistant", "content": response_text})

    # Send final message
    yield f"data: {json.dumps({'content': response_text, 'done': True})}\n\n"


@app.post("/api/chat/stream")
async def stream_chat(request: ChatRequest):
    """Stream chat responses in real-time"""
    try:
        return StreamingResponse(
            stream_chat_generator(request.message, request.model_name),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream",
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat/reset")
async def reset_conversation():
    """Reset the conversation history"""
    global conversation_history
    conversation_history = []
    return {"message": "Conversation reset successfully"}


@app.get("/api/chat/history")
async def get_history():
    """Get conversation history"""
    return {"history": conversation_history}


@app.get("/")
async def root():
    return {"message": "Chat API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
