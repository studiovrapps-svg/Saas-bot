import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

bad_double_check = '<svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7M5 19l4-4M19 13l-4 4" /></svg>'
good_blue_double_check = '<svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l5 5l10 -10" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 12l5 5m5 -5l5 -5" /></svg>'

bad_gray_double_check = '<svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7M5 19l4-4M19 13l-4 4" /></svg>'
good_gray_double_check = '<svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l5 5l10 -10" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 12l5 5m5 -5l5 -5" /></svg>'

bad_single_check = '<svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>'
good_single_check = '<svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12l5 5l10 -10" /></svg>'

code = code.replace(bad_double_check, good_blue_double_check)
code = code.replace(bad_gray_double_check, good_gray_double_check)
code = code.replace(bad_single_check, good_single_check)

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Checkmarks fixed.")
