const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientDashboard.jsx', 'utf8');

// 1. Inject useRef for activeChat
const stateMatch = "const [activeChat, setActiveChat] = useState(null);";
const refInject = `const [activeChat, setActiveChat] = useState(null);
  const activeChatRef = useRef(activeChat);
  useEffect(() => {
      activeChatRef.current = activeChat;
  }, [activeChat]);`;

if (!code.includes("const activeChatRef = useRef")) {
    code = code.replace(stateMatch, refInject);
}

// 2. Fix the socket initialization useEffect
const oldEffect = `  useEffect(() => {
      const socketUrl = API_URL.replace('/api', '');
      const socket = io(socketUrl, { withCredentials: true });
      
      socket.on('connect', () => {
          socket.emit('join_tenant_room', tenantId);
      });
      
      socket.on('new_message', (data) => {
          // Disparar recarga ligera de chats o actualizar estado
          fetchChats();
          if (activeChat && activeChat.user_phone === data.phone) {
              fetchMessages();
          }
      });
      
      socket.on('message_status_update', (data) => {
          fetchChats();
      });

      return () => {
          socket.disconnect();
      };
  }, [tenantId, activeChat]);`;

const newEffect = `  useEffect(() => {
      const socketUrl = API_URL.replace('/api', '');
      const socket = io(socketUrl, { withCredentials: true });
      
      socket.on('connect', () => {
          socket.emit('join_tenant_room', tenantId);
      });
      
      socket.on('new_message', (data) => {
          fetchChats();
          if (activeChatRef.current && activeChatRef.current.user_phone === data.phone) {
              fetchMessages();
          }
      });
      
      socket.on('message_status_update', (data) => {
          fetchChats();
      });

      return () => {
          socket.disconnect();
      };
  }, [tenantId]); // Corrección Auditoría: activeChat eliminado para evitar socket flooding`;

code = code.replace(oldEffect, newEffect);
// Regex fallback just in case
code = code.replace(/useEffect\(\(\) => \{\s*const socketUrl = API_URL\.replace.*?\}, \[tenantId, activeChat\]\);/s, newEffect);

fs.writeFileSync('src/pages/ClientDashboard.jsx', code);
console.log("ClientDashboard.jsx safely patched for React Socket Flooding!");
