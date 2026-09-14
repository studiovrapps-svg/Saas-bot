import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

target = """)})}
                    </div>
                  </div>"""

replacement = """)})}
                        {chatList.length >= chatListLimit && (
                            <div ref={loadMoreChatsRef} className="h-10 flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                  </div>"""

code = code.replace(target, replacement)

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("chatList observer injected.")
