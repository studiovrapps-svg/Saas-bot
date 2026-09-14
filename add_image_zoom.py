import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add zoom state
state_target = r"const \[modalImage, setModalImage\] = useState\(null\);"
state_replacement = """const [modalImage, setModalImage] = useState(null);
    const [imageZoom, setImageZoom] = useState(1);"""
code = re.sub(state_target, state_replacement, code)

# 2. Reset zoom when opening/closing modal
onClick_target = r"onClick=\{\(\) => setModalImage\(msg\.content\)\}"
onClick_replacement = """onClick={() => { setModalImage(msg.content); setImageZoom(1); }}"""
code = re.sub(onClick_target, onClick_replacement, code)

# 3. Modify the modal JSX
modal_target = r"\{/\* Image Modal Lightbox \*/\}.*?onClick=\{\(e\) => e\.stopPropagation\(\)\}\s*/>\s*</div>\s*\)"
modal_replacement = """{/* Image Modal Lightbox */}
      {modalImage && (
          <div 
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
              onClick={() => { setModalImage(null); setImageZoom(1); }}
          >
              <div className="absolute top-6 right-6 flex items-center gap-4 z-50">
                  <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm font-semibold tracking-wider">
                      {(imageZoom * 100).toFixed(0)}%
                  </div>
                  <button 
                      className="text-white hover:text-gray-300 p-2 bg-black/50 rounded-full transition-colors"
                      onClick={(e) => { e.stopPropagation(); setImageZoom(s => Math.min(s + 0.5, 4)); }}
                  >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                  </button>
                  <button 
                      className="text-white hover:text-gray-300 p-2 bg-black/50 rounded-full transition-colors"
                      onClick={(e) => { e.stopPropagation(); setImageZoom(s => Math.max(s - 0.5, 0.5)); }}
                  >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
                  </button>
                  <button 
                      className="text-white hover:text-red-400 p-2 bg-black/50 rounded-full transition-colors ml-4"
                      onClick={() => { setModalImage(null); setImageZoom(1); }}
                  >
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
              </div>
              
              <div 
                  className="w-full h-full overflow-auto flex items-center justify-center custom-scrollbar"
                  onClick={() => { setModalImage(null); setImageZoom(1); }}
              >
                  <img 
                      src={modalImage} 
                      alt="Zoomed" 
                      className="object-contain shadow-2xl transition-transform duration-200" 
                      style={{ transform: `scale(${imageZoom})`, transformOrigin: 'center', cursor: imageZoom >= 4 ? 'zoom-out' : 'zoom-in' }}
                      onClick={(e) => {
                          e.stopPropagation();
                          if (imageZoom >= 4) setImageZoom(1);
                          else setImageZoom(s => Math.min(s + 0.5, 4));
                      }}
                      onWheel={(e) => {
                          e.stopPropagation();
                          if (e.deltaY < 0) setImageZoom(s => Math.min(s + 0.25, 4));
                          else setImageZoom(s => Math.max(s - 0.25, 0.5));
                      }}
                  />
              </div>
          </div>
      )}"""

# We need re.DOTALL to match across newlines
code = re.sub(modal_target, modal_replacement, code, flags=re.DOTALL)

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Zoom features added to modal.")
