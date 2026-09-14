import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

target = """  const logout = () => { sessionStorage.clear(); navigate('/'); }

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden relative">
      {/* Sidebar Izquierdo (Modo Claro/Elegante) */}"""

loading_state = """  const logout = () => { sessionStorage.clear(); navigate('/'); }

  if (!tenantInfo) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">Cargando tu espacio de trabajo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden relative">
      {/* Sidebar Izquierdo (Modo Claro/Elegante) */}"""

if target in code:
    code = code.replace(target, loading_state, 1)
    with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Loading state safely inserted.")
else:
    print("Target not found.")
