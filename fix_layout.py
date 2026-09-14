import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Extract the entire campaigns block
start_str = "{activeTab === 'campaigns' && tenantInfo && tenantInfo.features?.campaigns && ("
end_str = "      )}\n\n"

# First find it
campaign_block_pattern = re.compile(r"(\s*\{\/\* SECCIÓN CAMPAÑAS MASIVAS \*\/\}\s*)?" + re.escape(start_str) + r".*?" + re.escape("      )}\n"), re.DOTALL)
match = campaign_block_pattern.search(code)

if match:
    campaign_code = match.group(0)
    # Remove it from its current position
    code = code.replace(campaign_code, "")
    
    # We want to place it right after the dashboard tab or orders tab. 
    # Let's search for the end of the Dashboard tab.
    dashboard_end = "Bienvenido a tu Dashboard</h3>\n                    <p className=\"text-gray-500\">Aquí pronto verás estadísticas de tus chatbots y ventas.</p>\n                </div>\n              )}\n"
    
    if dashboard_end in code:
        code = code.replace(dashboard_end, dashboard_end + "\n" + campaign_code)
        
        with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
            f.write(code)
        print("Moved campaigns block inside the main content area.")
    else:
        # Fallback: place it after activeTab === 'pedidos'
        pedidos_str = "{activeTab === 'pedidos' && ("
        if pedidos_str in code:
            code = code.replace(pedidos_str, campaign_code + "\n              " + pedidos_str)
            with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
                f.write(code)
            print("Moved campaigns block before pedidos tab.")
        else:
            print("Could not find insertion points.")
else:
    print("Could not find the campaign block to move.")
