import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add relative to the chat area container
target_chat_area = r'<div className="w-2/3 flex flex-col bg-white">'
replacement_chat_area = r'<div className="w-2/3 flex flex-col bg-white relative">'
code = code.replace(target_chat_area, replacement_chat_area)

# 2. Add state and refs
target_refs = """    // Observers refs
    const loadMoreMessagesRef = useRef(null);"""
replacement_refs = """    const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
    
    // Observers refs
    const bottomAnchorRef = useRef(null);
    const loadMoreMessagesRef = useRef(null);"""
code = code.replace(target_refs, replacement_refs)

# 3. Add Intersection Observer for the bottom anchor
target_effect = """    // Infinite Scroll Observers
    useEffect(() => {"""
replacement_effect = """    // Scroll to bottom observer
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            // If it's NOT intersecting, it means the user scrolled up
            setShowScrollBottomBtn(!entries[0].isIntersecting);
        }, { threshold: 0 });
        if (bottomAnchorRef.current) observer.observe(bottomAnchorRef.current);
        return () => observer.disconnect();
    }, [activeChat]);

    // Infinite Scroll Observers
    useEffect(() => {"""
code = code.replace(target_effect, replacement_effect)

# 4. Inject the anchor and the button in the JSX
target_jsx = """                            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 bg-[#e5ddd5] custom-scrollbar flex flex-col-reverse gap-4">
                                {[...chatMessages].reverse().map(msg => ("""
replacement_jsx = """                            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 bg-[#e5ddd5] custom-scrollbar flex flex-col-reverse gap-4">
                                <div ref={bottomAnchorRef} className="h-1 flex-shrink-0" />
                                {[...chatMessages].reverse().map(msg => ("""
code = code.replace(target_jsx, replacement_jsx)

target_btn = """                            </div>

                            <div className="p-3 bg-gray-100 border-t border-gray-200">"""
replacement_btn = """                            </div>
                            
                            {showScrollBottomBtn && (
                                <button 
                                    onClick={() => bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth' })}
                                    className="absolute bottom-20 right-6 bg-white text-gray-500 hover:text-gray-700 p-2.5 rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-all z-20 flex items-center justify-center"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                </button>
                            )}

                            <div className="p-3 bg-gray-100 border-t border-gray-200 z-10 relative">"""
code = code.replace(target_btn, replacement_btn)

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Scroll to bottom button added.")
