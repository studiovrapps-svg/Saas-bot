import json

log_path = r"C:\Users\Usuario\.gemini\antigravity\brain\3449f412-4c9e-4b22-a013-66efb0800035\.system_generated\logs\transcript_full.jsonl"

found_content = ""
with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        if 'content' in data and data['type'] == 'PLANNER_RESPONSE':
            # Not in planner response, in tool output!
            pass
        if 'tool_responses' in data or 'output' in data.get('content', ''):
            if 'bot-engine-frontend\\src\\App.jsx:1370:export default App;' in data.get('content', ''):
                found_content = data['content']
                break

with open('recover_app.txt', 'w', encoding='utf-8') as f:
    f.write(found_content)
print("Searched transcript for App.jsx snippet.")
