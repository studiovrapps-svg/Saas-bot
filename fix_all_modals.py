import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

def inject_onclick_all(content, condition_text, outer_setter):
    parts = content.split(condition_text)
    if len(parts) < 2:
        return content
        
    for i in range(1, len(parts)):
        # Only process if we can find the modal markup in this chunk
        chunk = parts[i]
        
        outer_div = re.search(r'<div className="fixed inset-0[^>]+>', chunk)
        if outer_div:
            old_outer = outer_div.group(0)
            if 'onClick=' not in old_outer:
                new_outer = old_outer.replace('>', f' onClick={{() => {outer_setter}(false)}}>')
                chunk = chunk.replace(old_outer, new_outer, 1)
                
                # Now find the first bg-white div inside it
                inner_div = re.search(r'<div className="bg-white[^>]+>', chunk)
                if inner_div:
                    old_inner = inner_div.group(0)
                    if 'onClick=' not in old_inner:
                        new_inner = old_inner.replace('>', ' onClick={(e) => e.stopPropagation()}>')
                        chunk = chunk.replace(old_inner, new_inner, 1)
        
        parts[i] = chunk
    
    return condition_text.join(parts)

# 1. Registrar Cliente SaaS Modal AND Nuevo Producto Modal (both use showModal)
code = inject_onclick_all(code, '{showModal && (', 'setShowModal')

# 2. Configuración Técnica Modal
code = inject_onclick_all(code, '{showEditModal && editData && (', 'setShowEditModal')

# 3. Plantillas Modal
code = inject_onclick_all(code, '{showTemplateModal && (', 'setShowTemplateModal')

# 4. Eliminar Confirmación Modal
# The condition is {deleteConfirm.isOpen && (
def inject_delete_modal(content):
    parts = content.split('{deleteConfirm.isOpen && (')
    if len(parts) < 2:
        return content
    
    chunk = parts[1]
    outer_div = re.search(r'<div className="fixed inset-0[^>]+>', chunk)
    if outer_div:
        old_outer = outer_div.group(0)
        if 'onClick=' not in old_outer:
            new_outer = old_outer.replace('>', f' onClick={{() => setDeleteConfirm({{ isOpen: false, type: null, index: null }})}}>')
            chunk = chunk.replace(old_outer, new_outer, 1)
            
            # Now find the first bg-white div inside it
            inner_div = re.search(r'<div className="bg-white[^>]+>', chunk)
            if inner_div:
                old_inner = inner_div.group(0)
                if 'onClick=' not in old_inner:
                    new_inner = old_inner.replace('>', ' onClick={(e) => e.stopPropagation()}>')
                    chunk = chunk.replace(old_inner, new_inner, 1)
    
    parts[1] = chunk
    return '{deleteConfirm.isOpen && ('.join(parts)

code = inject_delete_modal(code)

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Applied generic modal fixes to ALL modals")
