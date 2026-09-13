import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix the extra div
target = """                            )}
                      </div>
                        </div>

                      {/* Vista M"""

replacement = """                            )}
                      </div>

                      {/* Vista M"""

code = code.replace(target, replacement)

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
