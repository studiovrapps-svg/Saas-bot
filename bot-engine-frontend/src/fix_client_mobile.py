import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Fix "Nuevo Producto" button (make it full width on mobile)
code = re.sub(
    r'className="mt-4 md:mt-0 bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 font-semibold shadow-sm transition flex items-center gap-2 text-sm"',
    'className="mt-4 md:mt-0 w-full md:w-auto bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 font-semibold shadow-sm transition flex items-center justify-center md:justify-start gap-2 text-sm"',
    code
)

# 2. Fix Edit/Delete buttons on product cards (They were hidden on mobile because of hover state)
code = re.sub(
    r'className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition z-10"',
    'className="absolute top-2 right-2 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition z-10"',
    code
)

# 3. Truncate long tenant names in the header so they don't squish everything
code = re.sub(
    r'className="font-bold text-gray-800">\{tenantInfo \? tenantInfo\.name : \'Cargando...\'\}</span>',
    'className="font-bold text-gray-800 truncate max-w-[100px] md:max-w-none">{tenantInfo ? tenantInfo.name : \'Cargando...\'}</span>',
    code
)

# 4. Make product image height shorter on mobile to not take up the whole screen
code = re.sub(
    r'className="relative h-48 bg-gray-100 flex items-center justify-center overflow-hidden"',
    'className="relative h-36 md:h-48 bg-gray-100 flex items-center justify-center overflow-hidden shrink-0"',
    code
)

# 5. Fix "Nuevo" buttons for other tabs just in case (like "Guardar Configuracion")
# We already targeted the specific Nuevo Producto button, but let's make sure the save config buttons aren't squished.
# The "Guardar" buttons are usually flex-end. It's fine.

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
