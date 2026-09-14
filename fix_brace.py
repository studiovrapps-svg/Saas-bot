import re

with open('bot-engine-backend/index.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Remove the extra closing brace that was injected before `} else if (tenant.bot_tier >= 2) {`
code = code.replace('            } // end tier 1\n} else if', '} else if')

with open('bot-engine-backend/index.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
