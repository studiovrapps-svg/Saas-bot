import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

target = """      </div>
    </div>
  );
}

function App() {"""

replacement = """      </div>

      {/* Image Modal Lightbox */}
      {modalImage && (
          <div 
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
              onClick={() => setModalImage(null)}
          >
              <button 
                  className="absolute top-6 right-6 text-white hover:text-gray-300 p-2"
                  onClick={() => setModalImage(null)}
              >
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
              </button>
              <img 
                  src={modalImage} 
                  alt="Zoomed" 
                  className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
                  onClick={(e) => e.stopPropagation()} 
              />
          </div>
      )}
    </div>
  );
}

function App() {"""

if target in code:
    code = code.replace(target, replacement)
    with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Modal JSX injected successfully.")
else:
    print("Target not found for Modal JSX injection.")
