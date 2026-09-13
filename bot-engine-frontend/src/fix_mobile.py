import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Add showMobileMenu state to dashboards
code = code.replace('function SuperAdminDashboard() {', 'function SuperAdminDashboard() {\n  const [showMobileMenu, setShowMobileMenu] = useState(false);')
code = code.replace('function ClientDashboard() {', 'function ClientDashboard() {\n  const [showMobileMenu, setShowMobileMenu] = useState(false);')

# Make main container relative & overflow-hidden
code = code.replace(
    '<div className="flex h-screen bg-gray-50 font-sans text-gray-900">', 
    '<div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden relative">'
)

# Sidebar responsive classes
code = code.replace(
    '<div className="w-64 bg-white border-r border-gray-200 flex flex-col z-20">',
    '<div className={`w-64 bg-white border-r border-gray-200 flex flex-col z-30 absolute inset-y-0 left-0 transform transition-transform duration-300 md:relative md:translate-x-0 ${showMobileMenu ? "translate-x-0" : "-translate-x-full"}`}>'
)

# Hamburger Button injection
code = code.replace(
    '<div className="flex items-center gap-4">',
    '<button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden mr-2 p-2 text-gray-600 hover:bg-gray-100 rounded-lg"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg></button>\n          <div className="flex items-center gap-4">'
)

# Overlay
code = code.replace(
    '<div className={`w-64 bg-white border-r',
    '{showMobileMenu && <div onClick={() => setShowMobileMenu(false)} className="md:hidden fixed inset-0 bg-gray-900 bg-opacity-50 z-20"></div>}\n      <div className={`w-64 bg-white border-r'
)

# Mobile padding fixes for main content
code = code.replace(
    '<div className="flex-1 overflow-y-auto p-8 bg-gray-50 custom-scrollbar">',
    '<div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 custom-scrollbar">'
)

# Fix header padding
code = code.replace(
    '<div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10">',
    '<div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 z-10">'
)

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
