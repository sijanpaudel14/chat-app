# imports

import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage, SystemMessage, AIMessage

# Load environment variables in a file called .env
# Print the key prefixes to help with any debugging

load_dotenv(override=True)
api_key = os.getenv("GEMINI_API_KEY")

if api_key:
    print(f"Google API Key exists and begins {api_key[:8]}")
else:
    print("Google API Key not set")

MODEL = "gemini-2.0-flash"
model = ChatGoogleGenerativeAI(model=MODEL, api_key=api_key)

system_message = "You are a helpful assistant"

conversation_history = []  
def stream_chat(user_input, model_name):
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
    messages = [SystemMessage(content=system_message)] + lc_history + [HumanMessage(content=user_input)]
    print(f"{messages}\n\n\n")

    # Stream the response from the model
    response_text = ""
    for chunk in model.stream(messages):
        if chunk.content:
            response_text += chunk.content
            yield response_text

    # Save to conversation history for next prompt
    conversation_history.append({"role": "user", "content": user_input})
    conversation_history.append({"role": "assistant", "content": response_text})
    print(f"{conversation_history}\n\n\n")

def reset_conversation():
    global conversation_history
    conversation_history = []
    return ""
