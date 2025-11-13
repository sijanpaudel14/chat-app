import requests
import json


def test_chat():
    url = "http://localhost:8000/api/chat/stream"
    data = {
        "message": "What is communication",
        "model_name": "gemini-2.0-flash"
    }

    print("Sending request to chat API...")
    print(f"Question: {data['message']}\n")
    print("Response:")
    print("-" * 80)

    try:
        response = requests.post(url, json=data, stream=True)

        if response.status_code == 200:
            full_response = ""
            for line in response.iter_lines():
                if line:
                    line_str = line.decode('utf-8')
                    if line_str.startswith('data: '):
                        # Remove 'data: ' prefix
                        json_data = json.loads(line_str[6:])
                        full_response = json_data.get('content', '')
                        if json_data.get('done', False):
                            break

            print(full_response)
            print("-" * 80)
            print("\n✅ Test successful!")
        else:
            print(f"❌ Error: Status code {response.status_code}")
            print(response.text)

    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    test_chat()
