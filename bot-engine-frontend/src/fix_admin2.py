import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# We will inject a mobile header right inside the flex-1 area for SuperAdminDashboard
# Let's find exactly this block in SuperAdminDashboard:
#         <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
#           <div className="max-w-7xl mx-auto">

target_str = """        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">"""

replacement_str = """        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <div className="md:hidden h-16 bg-white border-b border-gray-200 flex items-center px-4 z-10 shrink-0">
            <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <span className="font-bold text-gray-900">SaaS Bot Admin</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto">"""

code = code.replace(target_str, replacement_str)

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
