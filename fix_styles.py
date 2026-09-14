import re

def fix_styles():
    with open('C:\\Antigravity\\Chatbots\\bot-engine-frontend\\src\\App.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Colors & Palette
    # Replace slate with gray
    content = re.sub(r'slate-', 'gray-', content)
    # Replace indigo with black/gray
    content = re.sub(r'bg-indigo-600', 'bg-black', content)
    content = re.sub(r'text-indigo-500', 'text-gray-900', content)
    content = re.sub(r'text-indigo-600', 'text-gray-900', content)
    content = re.sub(r'focus:border-indigo-500', 'focus:border-black', content)
    content = re.sub(r'focus:ring-indigo-500', 'focus:ring-black', content)
    content = re.sub(r'bg-indigo-50', 'bg-gray-100', content)
    content = re.sub(r'hover:bg-indigo-100', 'hover:bg-gray-200', content)
    # Fix the blue text in the select
    content = re.sub(r'text-blue-600', 'text-gray-900', content)
    content = re.sub(r'hover:text-blue-600', 'hover:text-gray-900', content)
    content = re.sub(r'hover:bg-blue-50', 'hover:bg-gray-100', content)

    # 2. Typography
    # Standardize labels
    content = re.sub(r'text-\[10px\]', 'text-xs', content)
    content = re.sub(r'text-gray-400(.*?)uppercase', r'text-gray-500\1uppercase', content)
    content = re.sub(r'tracking-widest', 'tracking-wider', content)
    # Login title
    content = re.sub(r'text-2xl font-black', 'text-2xl font-bold', content)
    content = re.sub(r'text-xl font-black', 'text-xl font-bold', content)

    # 3. Border radius & Shadows
    content = re.sub(r'rounded-3xl', 'rounded-2xl', content)
    content = re.sub(r'shadow-2xl', 'shadow-xl', content)
    
    # Standardize buttons
    # We'll make most primary buttons rounded-xl and px-5 py-2.5
    content = re.sub(r'rounded-lg(.*?hover:bg-gray-800)', r'rounded-xl\1', content)
    content = re.sub(r'p-3\.5 rounded-xl', 'px-5 py-2.5 rounded-xl', content)
    content = re.sub(r'py-3 bg-black(.*?)rounded-lg', r'px-5 py-2.5 bg-black\1rounded-xl', content)
    content = re.sub(r'py-3 bg-gray-100(.*?)rounded-lg', r'px-5 py-2.5 bg-gray-100\1rounded-xl', content)
    
    # 4. Inputs
    # Make underline inputs into modern full borders
    content = re.sub(r'border-b-2 border-gray-100 py-3 outline-none focus:border-black transition-colors bg-transparent', 'border border-gray-200 p-2.5 rounded-xl bg-gray-50 outline-none focus:border-black focus:ring-1 focus:ring-black transition shadow-sm', content)
    
    content = re.sub(r'border-b border-gray-200 p-2(.*?)outline-none focus:border-black bg-transparent', r'border border-gray-200 p-2.5 rounded-xl bg-gray-50\1outline-none focus:border-black focus:ring-1 focus:ring-black transition shadow-sm', content)

    # The tech inputs (already had border, just need rounded-xl and bg-gray-50 instead of bg-white to match)
    content = re.sub(r'border border-gray-200 p-2\.5(.*?)rounded-lg bg-white', r'border border-gray-200 p-2.5\1rounded-xl bg-gray-50', content)
    
    # Selects
    content = re.sub(r'border border-gray-200 p-3(.*?)rounded-lg outline-none bg-gray-50', r'border border-gray-200 p-2.5\1rounded-xl outline-none bg-gray-50', content)
    content = re.sub(r'border border-gray-200 rounded-lg p-2\.5', 'border border-gray-200 rounded-xl p-2.5', content)
    
    # Textareas
    content = re.sub(r'border border-gray-200 p-3(.*?)rounded-lg outline-none bg-gray-50', r'border border-gray-200 p-2.5\1rounded-xl outline-none bg-gray-50', content)


    with open('C:\\Antigravity\\Chatbots\\bot-engine-frontend\\src\\App_fixed.jsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    fix_styles()
