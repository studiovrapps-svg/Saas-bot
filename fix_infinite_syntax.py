import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Remove the broken line
broken_target = r"\{orders\.length >= orderListLimit && <div ref=\{loadMoreOrdersRef\} className=\\\"h-16 flex items-center justify-center\\\"><div className=\\\"w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin\\\"></div></div>\}\n"
code = re.sub(broken_target, "", code)

# 2. Add the proper spinner at the end of the pedidos tab
# Wait, let's find the end of the pedidos tab. 
# Or just put it inside the orders list container.
orders_end_target = """                                </div>
                            ))}
                        </div>
                    </div>
                </div>
              )}"""

orders_end_replacement = """                                </div>
                            ))}
                        </div>
                        {orders.length >= orderListLimit && (
                            <div ref={loadMoreOrdersRef} className="h-16 flex items-center justify-center w-full">
                                <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                </div>
              )}"""
code = code.replace(orders_end_target, orders_end_replacement)


# 3. Check if chatList was broken by escaped quotes
chatlist_target = r"\{chatList\.length >= chatListLimit && <div ref=\{loadMoreChatsRef\} className=\\\"h-10 flex items-center justify-center\\\"><div className=\\\"w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin\\\"></div></div>\}"
chatlist_replacement = """{chatList.length >= chatListLimit && (
                                <div ref={loadMoreChatsRef} className="h-10 flex items-center justify-center">
                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                                </div>
                            )}"""
code = re.sub(chatlist_target, chatlist_replacement, code)

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Syntax fixed and observers placed properly.")
