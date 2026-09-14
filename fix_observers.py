import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

target_messages = """    // Infinite Scroll Observers
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setMessageLimit(prev => prev + 50);
            }
        }, { threshold: 0.1 });
        if (loadMoreMessagesRef.current) observer.observe(loadMoreMessagesRef.current);
        return () => observer.disconnect();
    }, [chatMessages.length]);"""

replacement_messages = """    // Infinite Scroll Observers
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setMessageLimit(prev => prev + 50);
            }
        }, { root: chatContainerRef.current, rootMargin: "50px", threshold: 0 });
        if (loadMoreMessagesRef.current) observer.observe(loadMoreMessagesRef.current);
        return () => observer.disconnect();
    }, [chatMessages.length]);"""

code = code.replace(target_messages, replacement_messages)

target_chats = """    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setChatListLimit(prev => prev + 50);
            }
        }, { threshold: 0.1 });
        if (loadMoreChatsRef.current) observer.observe(loadMoreChatsRef.current);
        return () => observer.disconnect();
    }, [chatList.length]);"""

replacement_chats = """    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setChatListLimit(prev => prev + 50);
            }
        }, { rootMargin: "50px", threshold: 0 });
        if (loadMoreChatsRef.current) observer.observe(loadMoreChatsRef.current);
        return () => observer.disconnect();
    }, [chatList.length]);"""
code = code.replace(target_chats, replacement_chats)


target_orders = """    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setOrderListLimit(prev => prev + 50);
            }
        }, { threshold: 0.1 });
        if (loadMoreOrdersRef.current) observer.observe(loadMoreOrdersRef.current);
        return () => observer.disconnect();
    }, [orders.length]);"""

replacement_orders = """    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setOrderListLimit(prev => prev + 50);
            }
        }, { rootMargin: "50px", threshold: 0 });
        if (loadMoreOrdersRef.current) observer.observe(loadMoreOrdersRef.current);
        return () => observer.disconnect();
    }, [orders.length]);"""
code = code.replace(target_orders, replacement_orders)

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Observer configurations updated.")
