import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Remove the grey button (Admin Panel)
grey_button_pattern = r'\{sessionStorage\.getItem\(\'role\'\) === \'admin\' && \(\s*<Link to="/admin".*?>[\s\S]*?</Link>\s*\)\}'
code = re.sub(grey_button_pattern, '', code)

# 2. Fix the blue button (navigate and text)
# Find: onClick={() => navigate('/dashboard')} ... Volver a Sǧper Admin
code = re.sub(
    r'<button onClick=\{\(\) => navigate\(\'/dashboard\'\)\} className="w-full text-left text-blue-600([^>]+)>\s*<svg[^>]+>[\s\S]*?</svg>\s*Volver a S.*?per Admin\s*</button>',
    r'<button onClick={() => navigate(\'/admin\')} className="w-full text-left text-blue-600\1>\n                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>\n                Volver a Súper Admin\n              </button>',
    code
)

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
