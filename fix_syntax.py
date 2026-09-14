import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

target = """                  />
              </div>
          </div>
      )}}
    </div>
  );
}"""

replacement = """                  />
              </div>
          </div>
      )}
    </div>
  );
}"""

if target in code:
    code = code.replace(target, replacement)
    with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Syntax error fixed.")
else:
    print("Target not found. Let me try a generic replacement.")
    # Generic replacement just in case spaces differ
    import re
    code = re.sub(r"\}\}\s*</div>\s*\);\s*\}", r"}\n    </div>\n  );\n}", code)
    with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Generic syntax error fixed.")
