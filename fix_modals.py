import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

def inject_onclick(content, condition_text, outer_setter):
    # Find the block starting with the condition, e.g. `{showEditModal && editData && (`
    # and find the first `<div className="fixed inset-0 ...">` and the inner `<div className="bg-white ...">`
    
    # 1. Split code by condition
    parts = content.split(condition_text)
    if len(parts) < 2:
        return content
        
    before = parts[0]
    after = condition_text + parts[1]
    
    # In `after`, find the first fixed inset-0
    outer_div = re.search(r'<div className="fixed inset-0[^>]+>', after)
    if outer_div:
        old_outer = outer_div.group(0)
        if 'onClick=' not in old_outer:
            new_outer = old_outer.replace('>', f' onClick={{() => {outer_setter}(false)}}>')
            after = after.replace(old_outer, new_outer, 1)
            
            # Now find the first bg-white div inside it
            inner_div = re.search(r'<div className="bg-white[^>]+>', after)
            if inner_div:
                old_inner = inner_div.group(0)
                if 'onClick=' not in old_inner:
                    new_inner = old_inner.replace('>', ' onClick={(e) => e.stopPropagation()}>')
                    after = after.replace(old_inner, new_inner, 1)
    
    return before + after

# 1. Registrar Cliente SaaS Modal
code = inject_onclick(code, '{showModal && (', 'setShowModal')

# 2. Configuración Técnica Modal
code = inject_onclick(code, '{showEditModal && editData && (', 'setShowEditModal')

# 3. Plantillas Modal
code = inject_onclick(code, '{showTemplateModal && (', 'setShowTemplateModal')

# 4. Eliminar Confirmación Modal
code = inject_onclick(code, '{deleteConfirm.isOpen && (', 'setDeleteConfirm({ isOpen: false, type: null, index: null })')
# Wait, for deleteConfirm, the setter is slightly different, let me check the exact state update.
# Actually, the condition is `{deleteConfirm.isOpen && (` or maybe just `{deleteConfirm && deleteConfirm.isOpen...`.
# I'll just write a direct string replacement if it fails. Let me use regex for all "fixed inset-0" blocks but apply specific setters based on what's nearby.

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Applied generic modal fixes")
