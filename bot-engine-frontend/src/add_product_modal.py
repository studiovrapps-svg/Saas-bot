import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Replace handleDelete in ClientDashboard
old_handle_delete = """  const handleDelete = async (id) => {
      if(!window.confirm("¿Seguro que deseas eliminar este producto? Se borrará de WhatsApp inmediatamente.")) return;
      try {
          await fetch(`${API_URL}/productos/${id}`, { method: 'DELETE' });
          fetchData();
      } catch(err) { console.error(err); }
  };"""

new_handle_delete = """  const handleDelete = (id) => {
      setDeleteConfirm({ isOpen: true, type: 'producto', index: id });
  };"""

code = code.replace(old_handle_delete, new_handle_delete)

# 2. Update the modal logic to handle 'producto' deletion
old_modal_button = """                    <button onClick={() => {
                        if (deleteConfirm.type === 'menu') {
                            let nm = [...tier1Menu]; nm.splice(deleteConfirm.index, 1); setTier1Menu(nm);
                        } else if (deleteConfirm.type === 'faq') {
                            setFaqs(faqs.filter((_, i) => i !== deleteConfirm.index));
                        }
                        setDeleteConfirm({ isOpen: false, type: null, index: null });
                    }} className="flex-1 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 text-white font-bold py-3 rounded-xl transition">Sí, eliminar</button>"""

new_modal_button = """                    <button onClick={async () => {
                        if (deleteConfirm.type === 'menu') {
                            let nm = [...tier1Menu]; nm.splice(deleteConfirm.index, 1); setTier1Menu(nm);
                        } else if (deleteConfirm.type === 'faq') {
                            setFaqs(faqs.filter((_, i) => i !== deleteConfirm.index));
                        } else if (deleteConfirm.type === 'producto') {
                            try {
                                await fetch(`${API_URL}/productos/${deleteConfirm.index}`, { method: 'DELETE' });
                                fetchData();
                            } catch(err) { console.error(err); }
                        }
                        setDeleteConfirm({ isOpen: false, type: null, index: null });
                    }} className="flex-1 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 text-white font-bold py-3 rounded-xl transition">Sí, eliminar</button>"""

code = code.replace(old_modal_button, new_modal_button)

# 3. Update the modal title to include 'producto'
code = code.replace(
    "<h3 className=\"text-xl font-extrabold text-gray-900 mb-2\">¿Eliminar {deleteConfirm.type === 'menu' ? 'opción' : 'pregunta'}?</h3>",
    "<h3 className=\"text-xl font-extrabold text-gray-900 mb-2\">¿Eliminar {deleteConfirm.type === 'menu' ? 'opción' : (deleteConfirm.type === 'faq' ? 'pregunta' : 'producto')}?</h3>"
)

# 4. Update the modal text to include WhatsApp immediately
old_text = "Esta acción no se puede deshacer y se eliminará de la configuración de tu bot de WhatsApp."
new_text = "Esta acción no se puede deshacer y se eliminará {deleteConfirm.type === 'producto' ? 'de tu catálogo de WhatsApp inmediatamente.' : 'de la configuración de tu bot de WhatsApp.'}"

code = code.replace(
    f'<p className="text-gray-500 text-sm mb-6 px-2">{old_text}</p>',
    f'<p className="text-gray-500 text-sm mb-6 px-2">{{{new_text}}}</p>'
)

# Wait, `{new_text}` syntax in regex needs to be exact. Let's do a direct replace.
code = code.replace(
    '<p className="text-gray-500 text-sm mb-6 px-2">Esta acción no se puede deshacer y se eliminará de la configuración de tu bot de WhatsApp.</p>',
    '<p className="text-gray-500 text-sm mb-6 px-2">Esta acción no se puede deshacer y se eliminará {deleteConfirm.type === \'producto\' ? \'de tu catálogo de WhatsApp inmediatamente\' : \'de la configuración de tu bot de WhatsApp\'}.</p>'
)

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
