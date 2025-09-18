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

**CRITICAL: Code Display Rules**
- ALWAYS wrap ALL code examples in proper markdown code blocks with language specification
- For HTML code requests, use ```html language specification  
- For JavaScript/React code, use ```javascript or ```jsx
- For Python code, use ```python
- NEVER return raw HTML, CSS, or JavaScript without code block wrapping
- When showing code examples, always use the format: ```language followed by the code, then ```

**Markdown Formatting:**
- Use **bold** for emphasis and important terms
- Use *italics* for slight emphasis  
- Use `code` for inline code, variables, and function names
- Use ```language for ALL code blocks (e.g., ```python, ```javascript, ```bash, ```jsx, ```html, ```css)
- Use # ## ### for clear section headers
- Use numbered lists (1. 2. 3.) or bullet points (- or *) for organized information
- Use > for quotes and important notes

**Code Formatting Standards:**
- Always use proper code blocks with language specification
- Format code with proper indentation and spacing (2-4 spaces for indentation)
- Ensure all HTML/JSX tags are properly closed and formatted
- Use proper syntax for all programming languages
- Add clear comments explaining complex logic
- Use descriptive variable and function names
- Include docstrings for functions with Args and Returns
- Separate logical sections with blank lines
- Follow language-specific conventions:
  - PEP 8 for Python (snake_case variables)
  - camelCase for JavaScript/TypeScript
  - Proper JSX syntax for React components
  - Valid HTML structure

**For Web Development Code:**
- Ensure all JSX/HTML tags are properly opened and closed
- Use proper React component structure
- Include all necessary imports
- Use valid CSS syntax
- Ensure proper indentation for nested elements
- Include proper event handlers and state management

**Response Structure:**
- Start with a brief explanation
- Provide complete, well-formatted code examples wrapped in code blocks
- Add explanations for key concepts
- Use clear headings to organize content
- End with summary or next steps when appropriate

**Code Examples Should:**
- Be complete and immediately usable
- Have proper syntax highlighting with language specification
- Include all necessary imports and dependencies
- Use proper indentation (2-4 spaces consistently)
- Include helpful comments
- Follow best practices for the specific language/framework
- Have proper error handling where appropriate

**Important for HTML/JSX:**
- Always close all tags properly
- Use proper nesting and indentation
- Include all required attributes
- Ensure valid syntax
- ALWAYS wrap in ```html or ```jsx code blocks

**Examples of proper formatting:**

For HTML code request:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Example</title>
</head>
<body>
    <input type="text" placeholder="Enter text here">
</body>
</html>
```

For JavaScript code:
```javascript
function example() {
    console.log("Hello World");
}
```

Always provide professional, well-organized, syntactically correct responses that are easy to read and understand."""
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
    try:
        for chunk in model.stream(messages):
            if chunk.content:
                response_text += chunk.content
                try:
                    # Create JSON data with proper escaping
                    data = {
                        'content': response_text,
                        'done': False
                    }
                    # Use json.dumps with separators to avoid extra spaces and ensure_ascii=True for safety
                    json_str = json.dumps(data, separators=(
                        ',', ':'), ensure_ascii=True)
                    # Validate that the JSON is properly formatted before sending
                    # This will raise an exception if JSON is invalid
                    json.loads(json_str)
                    yield f"data: {json_str}\n\n"
                except (json.JSONEncodeError, json.JSONDecodeError) as json_error:
                    # If JSON encoding fails, send a safe error message
                    print(f"JSON encoding error: {json_error}")
                    error_data = {
                        'content': "Error: Content contains invalid characters",
                        'done': True,
                        'error': True
                    }
                    json_str = json.dumps(error_data, separators=(
                        ',', ':'), ensure_ascii=True)
                    yield f"data: {json_str}\n\n"
                    break

        # Save to conversation history only if we completed successfully
        conversation_history.append({"role": "user", "content": user_input})
        conversation_history.append(
            {"role": "assistant", "content": response_text})

        # Send final message
        try:
            final_data = {
                'content': response_text,
                'done': True
            }
            json_str = json.dumps(final_data, separators=(
                ',', ':'), ensure_ascii=True)
            json.loads(json_str)  # Validate JSON
            yield f"data: {json_str}\n\n"
        except (json.JSONEncodeError, json.JSONDecodeError):
            # Fallback final message
            final_data = {
                'content': "Response completed but contained invalid characters",
                'done': True
            }
            json_str = json.dumps(final_data, separators=(
                ',', ':'), ensure_ascii=True)
            yield f"data: {json_str}\n\n"

    except Exception as e:
        # Handle any errors during streaming
        print(f"Streaming error: {e}")
        error_data = {
            'content': f"Error: {str(e)}",
            'done': True,
            'error': True
        }
        json_str = json.dumps(error_data, separators=(
            ',', ':'), ensure_ascii=True)
        yield f"data: {json_str}\n\n"


@app.post("/api/chat/stream")
async def stream_chat(request: ChatRequest):
    """Stream chat responses in real-time"""
    try:
        return StreamingResponse(
            stream_chat_generator(request.message, request.model_name),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
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
