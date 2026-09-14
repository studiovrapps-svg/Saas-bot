import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Adding autoComplete="off" and autoComplete="new-password"
# First, let's fix the form tag if needed, but fixing the inputs is more direct.
# Replace the inputs in the Meta API block.

target_phone = '<input type="text" value={editData.whatsapp_phone_id || ""} onChange={e => setEditData({...editData, whatsapp_phone_id: e.target.value})} className="w-full font-mono border border-slate-200 p-2.5 mb-4 rounded-lg bg-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm" placeholder="Ej: 10423456789" />'
replacement_phone = '<input type="text" autoComplete="off" data-lpignore="true" data-form-type="other" value={editData.whatsapp_phone_id || ""} onChange={e => setEditData({...editData, whatsapp_phone_id: e.target.value})} className="w-full font-mono border border-slate-200 p-2.5 mb-4 rounded-lg bg-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm" placeholder="Ej: 10423456789" />'

target_token = '<input type="password" value={editData.whatsapp_token || ""} onChange={e => setEditData({...editData, whatsapp_token: e.target.value})} className="w-full font-mono border border-slate-200 p-2.5 rounded-lg bg-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm" placeholder="EAAD... " />'
replacement_token = '<input type="password" autoComplete="new-password" data-lpignore="true" data-form-type="other" value={editData.whatsapp_token || ""} onChange={e => setEditData({...editData, whatsapp_token: e.target.value})} className="w-full font-mono border border-slate-200 p-2.5 rounded-lg bg-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm" placeholder="EAAD... " />'

code = code.replace(target_phone, replacement_phone)
code = code.replace(target_token, replacement_token)

# Also ensure the form itself has autoComplete="off"
target_form = '<form onSubmit={handleEdit}>'
replacement_form = '<form onSubmit={handleEdit} autoComplete="off">'
code = code.replace(target_form, replacement_form)

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Done fixing autofill")
