import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

target = """                                                {(() => {
                                                    try {
                                                        const items = JSON.parse(order.items);
                                                        return items.map((i, idx) => (
                                                            <li key={idx} className="flex gap-2"><span className="text-gray-400">{i.quantity}x</span> <span>{i.product}</span></li>
                                                        ));
                                                    } catch(e) { return <li>Error leyendo items</li>; }
                                                })()}"""

replacement = """                                                {(() => {
                                                    try {
                                                        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                                                        if (!Array.isArray(items)) return <li className="text-gray-400">Sin items</li>;
                                                        return items.map((i, idx) => (
                                                            <li key={idx} className="flex gap-2"><span className="text-gray-400 font-bold">{i.quantity || i.qty}x</span> <span className="font-medium text-gray-800">{i.product || i.name}</span></li>
                                                        ));
                                                    } catch(e) { return <li className="text-red-400">Error leyendo items</li>; }
                                                })()}"""

# Fix the double ++
target2 = """+{order.customer_phone}"""
replacement2 = """{order.customer_phone?.startsWith('+') ? order.customer_phone : `+${order.customer_phone}`}"""

if target in code and target2 in code:
    code = code.replace(target, replacement)
    code = code.replace(target2, replacement2)
    with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Frontend orders view fixed.")
else:
    print("Target not found.")
