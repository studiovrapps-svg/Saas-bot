import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

target = """                              ))
                          )}
                </>
            )}"""

replacement = """                              ))
                          )}
                      </div>
                </>
            )}"""

code = code.replace(target, replacement)

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
