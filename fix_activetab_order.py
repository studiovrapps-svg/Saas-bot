import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# I will extract the useEffects and move them below activeTab
pattern = re.compile(r'(  // Auto-scroll al último mensaje.*?)(  const \[showModal, setShowModal\] = useState\(false\);)', re.DOTALL)
match = pattern.search(code)

if match:
    useEffects_block = match.group(1)
    
    # Remove from original location
    code = code.replace(useEffects_block, "")
    
    # Insert after activeTab definition
    insert_point = "const [activeTab, setActiveTab] = useState('productos');\n"
    code = code.replace(insert_point, insert_point + "\n" + useEffects_block)
    
    with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Fixed order of activeTab and useEffects")
else:
    print("Could not find the block")
