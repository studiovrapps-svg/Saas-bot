import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add state for the image modal
state_target = r"const \[activeChat, setActiveChat\] = useState\(null\);"
state_replacement = """const [activeChat, setActiveChat] = useState(null);
    const [modalImage, setModalImage] = useState(null);"""
code = re.sub(state_target, state_replacement, code)

# 2. Add cursor-pointer and onClick to the image
img_target = r"<img src=\{msg\.content\} alt=\"Imagen\" className=\"rounded-\[8px\] max-w-full h-auto object-cover max-h-72 block\" />"
img_replacement = """<img onClick={() => setModalImage(msg.content)} src={msg.content} alt="Imagen" className="rounded-[8px] max-w-full h-auto object-cover max-h-72 block cursor-pointer hover:opacity-95 transition-opacity" />"""
code = re.sub(img_target, img_replacement, code)

# 3. Add the modal JSX at the very end of the App component (before the final closing tag)
# The App component typically ends with:
#                 </div>
#             )}
#         </div>
#     );
# }

modal_jsx = """
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
}"""

# Find the end of the return statement
end_target = r"        </div>\s*\);\s*}\s*export default App;\s*$"
end_replacement = modal_jsx + "\nexport default App;\n"
code = re.sub(end_target, end_replacement, code)

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Image modal added to App.jsx.")
