import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

broken_str = '               className="w-full border-b border-gray-200 p-2 mb-5 outline-none focus:border-black bg-transparent text-sm" placeholder="Ej: Pizza Familiar" />'

fixed_str = """      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
                <h2 className="text-xl font-bold mb-6 text-gray-900">{editProductId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                <form onSubmit={handleProductSubmit}>
                    
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Imagen del Producto</label>
                        <input type="file" ref={fileInputRef} accept="image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 text-gray-700 hover:file:bg-gray-200" />
                        {formData.image_url && <img src={formData.image_url} alt="preview" className="mt-2 h-20 w-20 object-cover rounded-lg border" />}
                    </div>

                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Nombre del Producto</label>
                    <input type="text" required maxLength="24" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border-b border-gray-200 p-2 mb-5 outline-none focus:border-black bg-transparent text-sm" placeholder="Ej: Pizza Familiar" />"""

code = code.replace(broken_str, fixed_str)

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
