import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix the missing closing div for SuperAdminDashboard
# We find this:
target = """        )}
      </div>
    );
  }

function ClientDashboard() {"""

replacement = """        )}
        </div>
      </div>
    );
  }

function ClientDashboard() {"""

code = code.replace(target, replacement)

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
