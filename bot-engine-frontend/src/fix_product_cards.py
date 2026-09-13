import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Change grid to keep 1 column on mobile (so we can use full-width horizontal cards)
code = re.sub(
    r'<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">',
    '<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">',
    code
)

# 2. Change the card container from flex-col to flex-row on mobile
code = re.sub(
    r'className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300 relative group flex flex-col"',
    'className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300 relative group flex flex-row md:flex-col h-32 md:h-auto"',
    code
)

# 3. Change image container width/height
code = re.sub(
    r'className="relative h-36 md:h-48 bg-gray-100 flex items-center justify-center overflow-hidden shrink-0"',
    'className="relative w-32 md:w-full h-full md:h-48 bg-gray-100 flex items-center justify-center overflow-hidden shrink-0"',
    code
)

# 4. Change the text container padding and spacing
code = re.sub(
    r'<div className="p-5 flex flex-col flex-grow">',
    '<div className="p-3 md:p-5 flex flex-col flex-grow min-w-0">',
    code
)

# 5. Fix description height on mobile (hide it or make it small) so it fits in the 32px height
code = re.sub(
    r'<p className="text-sm text-gray-500 mt-2 line-clamp-2 h-10">\{p\.description\}</p>',
    '<p className="text-xs md:text-sm text-gray-500 mt-1 md:mt-2 line-clamp-1 md:line-clamp-2 h-auto md:h-10">{p.description}</p>',
    code
)

# 6. Fix price row spacing
code = re.sub(
    r'<div className="mt-auto pt-4 flex justify-between items-center border-t mt-4 border-gray-100">',
    '<div className="mt-auto pt-2 md:pt-4 flex justify-between items-center border-t md:mt-4 border-gray-100">',
    code
)

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
