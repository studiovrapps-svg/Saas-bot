import { io } from 'socket.io-client';
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function ClientDashboard() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
    const { tenantId } = useParams();
  
  useEffect(() => {
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
  }, [tenantId]); // CorrecciÃ³n AuditorÃ­a: activeChat eliminado para evitar socket flooding
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
  const [chatList, setChatList] = useState([]);
  const [chatSearch, setChatSearch] = useState('');
  const [activeChat, setActiveChat] = useState(null);
  const activeChatRef = useRef(activeChat);
  useEffect(() => {
      activeChatRef.current = activeChat;
  }, [activeChat]);
  const [dashboardStats, setDashboardStats] = useState(null);
    const [modalImage, setModalImage] = useState(null);
    const [imageZoom, setImageZoom] = useState(1);
    const [imagePan, setImagePan] = useState({ x: 0, y: 0 });
    const [isDraggingImage, setIsDraggingImage] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const imageDragRef = useRef(false);
  const [chatMessages, setChatMessages] = useState([]);
  
  const [chatLatestOrder, setChatLatestOrder] = useState(null);
  const [showChatOrderDetails, setShowChatOrderDetails] = useState(false);
    const [messageLimit, setMessageLimit] = useState(50);
    const [chatListLimit, setChatListLimit] = useState(50);
    const [orderPage, setOrderPage] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const [orderFilter, setOrderFilter] = useState('pendiente');
    
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
    
    // Observers refs
    const bottomAnchorRef = useRef(null);
    const loadMoreMessagesRef = useRef(null);
    const loadMoreChatsRef = useRef(null);
    
    // Reset button state when switching chats or tabs
    useEffect(() => {
        setShowScrollBottomBtn(false);
    }, [activeChat, activeTab]);

    const handleChatScroll = (e) => {
        // En flex-col-reverse, el scroll visualmente hasta abajo significa que scrollTop estÃ¡ muy cerca de 0.
        // Tolerancia de 20px para evitar que desaparezca por pequeÃ±os mÃ¡rgenes.
        const atBottom = Math.abs(e.target.scrollTop) <= 20;
        setShowScrollBottomBtn(!atBottom);
    };
    // Infinite Scroll Observers
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setMessageLimit(prev => prev + 50);
            }
        }, { root: chatContainerRef.current, rootMargin: "50px", threshold: 0 });
        if (loadMoreMessagesRef.current) observer.observe(loadMoreMessagesRef.current);
        return () => observer.disconnect();
    }, [chatMessages.length]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setChatListLimit(prev => prev + 50);
            }
        }, { rootMargin: "50px", threshold: 0 });
        if (loadMoreChatsRef.current) observer.observe(loadMoreChatsRef.current);
        return () => observer.disconnect();
    }, [chatList.length]);
  const [replyText, setReplyText] = useState("");
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();
  const [formData, setFormData] = useState({ name: '', description: '', price: '' });
  const [imageFile, setImageFile] = useState(null);
  const [editProductId, setEditProductId] = useState(null);

  // Polling para lista de chats
  useEffect(() => {
    let interval;
    if (activeTab === 'inbox') {
      const fetchChats = async () => {
        try {
          const res = await fetch(`${API_URL}/tenant/${tenantId}/chats?limit=${chatListLimit}`);
          const data = await res.json();
          setChatList(Array.isArray(data) ? data : []);
        } catch(e) {}
      };
      fetchChats();
      interval = setInterval(fetchChats, 5000);
    }
    return () => clearInterval(interval);
  }, [activeTab, tenantId, chatListLimit]);

  // Polling para mensajes activos
  useEffect(() => {
    let interval;
    if (activeTab === 'inbox' && activeChat) {
      const fetchMessages = async () => {
        try {
          const res = await fetch(`${API_URL}/tenant/${tenantId}/chats/${activeChat}?limit=${messageLimit}`);
          const data = await res.json();
          setChatMessages(Array.isArray(data) ? data : []);
        } catch(e) {}
      };
      fetchMessages();
      interval = setInterval(fetchMessages, 3000);
    }
    return () => clearInterval(interval);
  }, [activeTab, activeChat, tenantId, messageLimit]);

  useEffect(() => {
      if (activeTab === 'inbox' && activeChat) {
          setShowChatOrderDetails(false); // Reset modal
          fetch(`${API_URL}/tenant/${tenantId}/orders?phone=${encodeURIComponent(activeChat)}&limit=1`)
              .then(res => res.json())
              .then(resData => {
                  const dataArray = Array.isArray(resData) ? resData : (resData.data || []);
                  setChatLatestOrder(dataArray.length > 0 ? dataArray[0] : null);
              })
              .catch(() => setChatLatestOrder(null));
      } else {
          setChatLatestOrder(null);
      }
  }, [activeChat, activeTab, tenantId]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeChat) return;
    const text = replyText;
    setReplyText("");
    
    // Optistic update
    setChatMessages(prev => [...prev, { id: Date.now(), direction: 'outbound', content: text, created_at: new Date().toISOString(), sender_type: 'humano' }]);

    try {
      await fetch(`${API_URL}/tenant/${tenantId}/chats/${activeChat}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text })
      });
    } catch(e) {
      console.error(e);
    }
  };

  const [systemPrompt, setSystemPrompt] = useState("");
  const [faqs, setFaqs] = useState([{ q: '', a: '' }]);
  const [tier1Greeting, setTier1Greeting] = useState("");
  const [businessVertical, setBusinessVertical] = useState("ecommerce");
  const [currency, setCurrency] = useState("Q");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [tier1Menu, setTier1Menu] = useState([]);
  const [savingPrompt, setSavingPrompt] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: null, index: null });
  

      useEffect(() => { 
    if(!localStorage.getItem('token')) navigate('/');
    fetchData(); 

    // Inicializar Facebook SDK para Embedded Signup
    window.fbAsyncInit = function() {
        window.FB.init({
            appId      : '1567518045121608', // REEMPLAZAR CON TU APP ID
            cookie     : true,
            xfbml      : true,
            version    : 'v19.0'
        });
    };
    (function(d, s, id){
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {return;}
        js = d.createElement(s); js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }, [tenantId]);

  const fetchData = async () => {
    try {
      const resP = await fetch(`${API_URL}/productos/${tenantId}`);
      const dataP = await resP.json();
      setProductos(Array.isArray(dataP) ? dataP : []);
      
      const resT = await fetch(`${API_URL}/tenant/${tenantId}`);
      const dataT = await resT.json();
      setTenantInfo(dataT);
      setSystemPrompt(dataT?.system_prompt || "");
      try {
          const parsed = JSON.parse(dataT?.business_rules || "[]");
          setFaqs(Array.isArray(parsed) && parsed.length > 0 ? parsed : [{ q: '', a: '' }]);
      } catch(e) {
          setFaqs([{ q: 'InformaciÃ³n', a: dataT?.business_rules || '' }]);
      }
      setTier1Greeting(dataT?.tier1_greeting || "");
      setBusinessVertical(dataT?.business_vertical || "ecommerce");
      setCurrency(dataT?.currency || "Q");
      setCheckoutMessage(dataT?.checkout_message || "");
      setTier1Menu(dataT?.tier1_menu || []);
    } catch (error) { console.error(error); }
  };

  const handleSaveConfig = async () => {
      setSavingPrompt(true);
      try {
          const validFaqs = faqs.filter(f => f.q.trim() || f.a.trim());
          await fetch(`${API_URL}/tenant/${tenantId}/config`, {
              method: 'PUT', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ system_prompt: systemPrompt, business_rules: JSON.stringify(validFaqs), tier1_greeting: tier1Greeting, tier1_menu: tier1Menu, business_vertical: businessVertical, currency: currency, checkout_message: checkoutMessage })
          });
          alert("ConfiguraciÃ³n de IA guardada.");
      } catch(err) { console.error(err); }
      setSavingPrompt(false);
  };

    const handleImageUploadMenu = async (idx, file) => {
        if (!file) return;
        const formData = new FormData();
        formData.append('image', file);
        
        try {
            const res = await fetch(`${API_URL}/tenant/${tenantId}/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: formData
            });
            const data = await res.json();
            if (res.ok && data.url) {
                let nm = [...tier1Menu];
                nm[idx].image_url = data.url;
                setTier1Menu(nm);
            } else {
                alert("Error subiendo imagen: " + (data.error || ""));
            }
        } catch (e) {
            console.error(e);
            alert("Error subiendo imagen");
        }
    };

  const handleAddMenu = () => {
      if(tier1Menu.length >= 9) return alert("MÃ¡ximo 9 opciones extra (Meta limita a 10 total).");
      setTier1Menu([...tier1Menu, { title: "", response: "" }]);
  };

  const handleFileChange = (e) => { if (e.target.files) setImageFile(e.target.files[0]); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editProductId && !imageFile) return alert("Falta foto");
    setLoading(true);
    const data = new FormData();
    data.append('tenant_id', tenantId);
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', formData.price);
    if (imageFile) data.append('image', imageFile);

    try {
      const endpoint = editProductId ? `${API_URL}/productos/${editProductId}` : `${API_URL}/productos`;
      const method = editProductId ? 'PUT' : 'POST';
      const res = await fetch(endpoint, { method, body: data });
      
      if (res.ok) {
        setShowModal(false); 
        setFormData({ name: '', description: '', price: '' }); 
        setImageFile(null);
        setEditProductId(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
        fetchData();
      }
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const handleEditProduct = (p) => {
      setFormData({ name: p.name, description: p.description, price: p.price });
      setImageFile(null);
      setEditProductId(p.id);
      setShowModal(true);
  };

  const handleDelete = (id) => {
      setDeleteConfirm({ isOpen: true, type: 'producto', index: id });
  };

              
  useEffect(() => {
    if (activeTab === 'pedidos') {
      fetchOrders();
    }
  }, [activeTab, orderPage, orderFilter]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetch(`${API_URL}/tenant/${tenantId}/stats`)
        .then(res => res.json())
        .then(data => setDashboardStats(data))
        .catch(console.error);
    }
  }, [activeTab, tenantId]);

  const fetchOrders = async (showSpinner = true) => {
    if (showSpinner) setLoadingOrders(true);
    try {
      const res = await fetch(`${API_URL}/tenant/${tenantId}/orders?page=${orderPage}&limit=25&status=${orderFilter}`);
      const resData = await res.json();
      if (Array.isArray(resData)) {
        setOrders(resData);
        setTotalOrders(resData.length);
      } else if (resData.data && Array.isArray(resData.data)) {
        setOrders(resData.data);
        setTotalOrders(resData.total || 0);
      } else {
        setOrders([]);
        setTotalOrders(0);
      }
    } catch(e) {
      console.error(e);
      setOrders([]);
    }
    if (showSpinner) setLoadingOrders(false);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    // Optimistic UI Update
    setOrders(prevOrders => prevOrders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    
    try {
      await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      // Silent refresh
      fetchOrders(false);
    } catch(e) {
      console.error(e);
      // Revert/refresh if error
      fetchOrders(false);
    }
  };

  const handleMetaLogin = () => {
        if (!window.FB) {
            alert("âš ï¸ El SDK de Facebook no ha cargado. Revisa tu consola de internet.");
            return;
        }

        setLoading(true);

        try {
            window.FB.init({
                appId      : '1567518045121608',
                cookie     : true,
                xfbml      : true,
                version    : 'v19.0'
            });
        } catch(e) { console.log(e); }

        console.log("Iniciando popup de Meta...");
        window.FB.login((response) => {
            console.log("Respuesta de Meta:", response);
            if (response.authResponse) {
                const accessToken = response.authResponse.code || response.authResponse.accessToken;
                linkWhatsAppAccount(accessToken);
            } else {
                setLoading(false);
                alert('Cancelaste la ventana de Meta o hubo un error de conexiÃ³n.');
            }
        }, {
            config_id: '2203459136878980', // Requerido para Embedded Signup
            response_type: 'code',
            override_default_response_type: true,
            scope: 'whatsapp_business_management,whatsapp_business_messaging',
            extras: { setup: {  } }
        });
    };

    const linkWhatsAppAccount = async (accessToken) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/tenant/${tenantId}/meta-connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken })
            });
            if (res.ok) {
                alert('Â¡WhatsApp conectado con Ã©xito en modo Coexistencia!');
                fetchData();
            } else {
                alert('Error al conectar WhatsApp');
            }
        } catch(e) { console.error(e); }
        setLoading(false);
    };

    const logout = () => { localStorage.clear(); navigate('/'); }

  if (!tenantInfo) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">Cargando tu espacio de trabajo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden relative">
      {/* Sidebar Izquierdo (Modo Claro/Elegante) */}
      {showMobileMenu && <div onClick={() => setShowMobileMenu(false)} className="md:hidden fixed inset-0 bg-gray-900 bg-opacity-50 z-20"></div>}
      <div className={`w-64 bg-white border-r border-gray-200 flex flex-col z-30 absolute inset-y-0 left-0 transform transition-transform duration-300 md:relative md:translate-x-0 ${showMobileMenu ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-3xl font-black tracking-tighter text-gray-900">Dynova</h1>
          <p className="text-gray-500 text-xs mt-1 font-semibold tracking-wider uppercase">Workspace</p>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <div onClick={() => { setActiveTab('dashboard'); setShowMobileMenu(false); }} className={`${activeTab === 'dashboard' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            <span className="font-semibold text-sm">Dashboard</span>
          </div>
          
          {tenantInfo?.features?.inbox && (
            <div onClick={() => { setActiveTab('inbox'); setShowMobileMenu(false); }} className={`${activeTab === 'inbox' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              <span className="font-semibold text-sm">Bandeja de Entrada</span>
            </div>
          )}

          {tenantInfo?.features?.orders !== false && (
            <div onClick={() => { setActiveTab('pedidos'); setShowMobileMenu(false); }} className={`${activeTab === 'pedidos' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              <span className="font-semibold text-sm">Pedidos</span>
            </div>
          )}

          <div onClick={() => { setActiveTab('productos'); setShowMobileMenu(false); }} className={`${activeTab === 'productos' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            <span className="font-semibold text-sm">{businessVertical === 'clinic' ? 'Servicios' : (businessVertical === 'lead_gen' ? 'CatÃ¡logo' : 'Productos')}</span>
          </div>

          {tenantInfo?.features?.campaigns && (
            <div onClick={() => { setActiveTab('campaigns'); setShowMobileMenu(false); }} className={`${activeTab === 'campaigns' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
              <span className="font-semibold text-sm">CampaÃ±as Masivas</span>
            </div>
          )}

          <div onClick={() => { setActiveTab('chatbots'); setShowMobileMenu(false); }} className={`${activeTab === 'chatbots' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            <span className="font-semibold text-sm">Chatbots</span>
          </div>

          <div onClick={() => { setActiveTab('configuracion'); setShowMobileMenu(false); }} className={`${activeTab === 'configuracion' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="font-semibold text-sm">ConfiguraciÃ³n</span>
          </div>

          <div onClick={() => { setActiveTab('afiliados'); setShowMobileMenu(false); }} className={`${activeTab === 'afiliados' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} rounded-lg p-2.5 flex items-center gap-3 cursor-pointer transition`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            <span className="font-semibold text-sm">Afiliados (Partners)</span>
          </div>
            </div>
          <div className="p-4 border-t border-gray-100">
          {localStorage.getItem('role') === 'superadmin' ? (
            <button onClick={() => navigate('/admin')} className="w-full text-left text-gray-900 hover:text-blue-800 hover:bg-gray-100 p-2.5 rounded-lg font-semibold flex items-center gap-3 transition text-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Volver a SÃºper Admin
              </button>
          ) : (
            <button onClick={logout} className="w-full text-left text-gray-500 hover:text-gray-900 hover:bg-gray-50 p-2.5 rounded-lg font-semibold flex items-center gap-3 transition text-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Cerrar SesiÃ³n
            </button>
          )}
        </div>
      </div>

      {/* Contenido Principal (Derecha) */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Navbar Superior */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 z-10">
          <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden mr-2 p-2 text-gray-600 hover:bg-gray-100 rounded-lg"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg></button>
          <div className="flex items-center gap-4">
            
            <h2 className="text-sm font-semibold text-gray-800">{tenantInfo?.name || "Cargando..."}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-bold text-xs">
              {tenantInfo?.name ? tenantInfo.name.charAt(0).toUpperCase() : "U"}
            </div>
          </div>
        </div>

        {/* Ãrea de Trabajo (Scroll) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            
                          {activeTab === 'dashboard' && (
                <div className="space-y-4 mt-1 max-w-5xl mx-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Resumen de Actividad</h2>
                        <p className="text-sm text-gray-500 mt-1">Monitorea el rendimiento de tu bot y tus ventas diarias.</p>
                    </div>
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Tarjeta 1: Ventas */}
                    <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-2 sm:mb-4">
                            <h4 className="text-xs sm:text-sm font-medium text-gray-500 truncate mr-2">Ingresos Totales</h4>
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                            <p className="text-xl sm:text-3xl font-semibold text-gray-900 tracking-tight truncate">Q{dashboardStats?.total_revenue?.toLocaleString('es-GT') || '0'}</p>
                            <p className="text-xs sm:text-xs text-emerald-600 font-medium mt-1 truncate">â†‘ 12% vs mes anterior</p>
                        </div>
                    </div>
                    
                    {/* Tarjeta 2: Pedidos */}
                    <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-2 sm:mb-4">
                            <h4 className="text-xs sm:text-sm font-medium text-gray-500 truncate mr-2">Pedidos Pendientes</h4>
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                        </div>
                        <div>
                            <p className="text-xl sm:text-3xl font-semibold text-gray-900 tracking-tight truncate">{dashboardStats?.pending_orders || '0'}</p>
                            <p className="text-xs sm:text-xs text-gray-400 font-medium mt-1 truncate">Por despachar hoy</p>
                        </div>
                    </div>

                    {/* Tarjeta 3: Chats */}
                    <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-2 sm:mb-4">
                            <h4 className="text-xs sm:text-sm font-medium text-gray-500 truncate mr-2">Total de Chats</h4>
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        </div>
                        <div>
                            <p className="text-xl sm:text-3xl font-semibold text-gray-900 tracking-tight truncate">{dashboardStats?.total_conversations || '0'}</p>
                            <p className="text-xs sm:text-xs text-gray-400 font-medium mt-1 truncate">En el historial</p>
                        </div>
                    </div>

                    {/* Tarjeta 4: Productos */}
                    <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-2 sm:mb-4">
                            <h4 className="text-xs sm:text-sm font-medium text-gray-500 truncate mr-2">CatÃ¡logo Activo</h4>
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        </div>
                        <div>
                            <p className="text-xl sm:text-3xl font-semibold text-gray-900 tracking-tight truncate">{dashboardStats?.total_products || '0'}</p>
                            <p className="text-xs sm:text-xs text-gray-400 font-medium mt-1 truncate">Productos disponibles</p>
                        </div>
                    </div>
                  </div>

                  {/* GrÃ¡fica Area */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] mt-4">
                    <div className="mb-4 flex justify-between items-end">
                        <div>
                            <h3 className="text-base font-medium text-gray-900">Rendimiento</h3>
                            <p className="text-sm text-gray-500 mt-1">Volumen de mensajes y pedidos en los Ãºltimos 7 dÃ­as</p>
                        </div>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[
                                { name: 'Lun', chats: 12, pedidos: 2 },
                                { name: 'Mar', chats: 19, pedidos: 5 },
                                { name: 'MiÃ©', chats: 15, pedidos: 3 },
                                { name: 'Jue', chats: 22, pedidos: 8 },
                                { name: 'Vie', chats: 30, pedidos: 12 },
                                { name: 'SÃ¡b', chats: 45, pedidos: 20 },
                                { name: 'Dom', chats: 40, pedidos: 15 },
                            ]} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                                <defs>
                                    <linearGradient id="colorChats" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorPedidos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '13px'}} />
                                <Area type="monotone" dataKey="chats" stroke="#0f172a" strokeWidth={2} fillOpacity={1} fill="url(#colorChats)" name="Mensajes Recibidos" />
                                <Area type="monotone" dataKey="pedidos" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorPedidos)" name="Pedidos Generados" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}



      {/* SECCIÃ“N CAMPAÃ‘AS MASIVAS */}
      {activeTab === 'campaigns' && tenantInfo && tenantInfo.features?.campaigns && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-indigo-50 to-white px-8 py-6 border-b border-gray-100">
                  <div className="flex items-center gap-3 mb-1">
                      <div className="p-2 bg-indigo-100 text-gray-900 rounded-lg">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
                      </div>
                      <h2 className="text-xl font-bold text-gray-800">CampaÃ±as Masivas (Broadcasts)</h2>
                  </div>
                  <p className="text-sm text-gray-500 ml-12">Dispara plantillas promocionales a toda tu base de datos de WhatsApp.</p>
              </div>

              <div className="p-8">
                  <div className="flex flex-col lg:flex-row gap-8">
                      {/* Left: Input & Action */}
                      <div className="flex-1">
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 h-full flex flex-col justify-center">
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre exacto de la plantilla</label>
                              <input type="text" id="campaignTemplateName" placeholder="Ej: promo_navidad_2026" className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-black focus:border-transparent transition mb-4 text-sm bg-white shadow-sm" />
                              
                              <button onClick={async () => {
                                  const templateName = document.getElementById('campaignTemplateName').value;
                                  if (!templateName) return alert('Debes escribir el nombre de la plantilla.');
                                  if (!confirm('Â¿EstÃ¡s seguro de enviar esta campaÃ±a a toda tu base de datos? Esta acciÃ³n no se puede deshacer.')) return;
                                  
                                  try {
                                      const tId = tenantInfo.id;
                                      const res = await fetch(`${API_URL}/tenant/${tId}/campaigns/send`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ template_name: templateName })
                                      });
                                      const data = await res.json();
                                      if (res.ok) {
                                          alert(data.message);
                                          document.getElementById('campaignTemplateName').value = '';
                                      } else {
                                          alert('Error: ' + data.error);
                                      }
                                  } catch(e) {
                                          alert('Error de conexiÃ³n al servidor.');
                                  }
                              }} className="w-full bg-black hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg shadow-sm transition flex items-center justify-center gap-2 text-sm">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                                  Iniciar EnvÃ­o Masivo
                              </button>
                          </div>
                      </div>

                      {/* Right: Warning / Info */}
                      <div className="flex-[1.2]">
                          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 h-full shadow-sm">
                              <div className="flex items-start gap-3">
                                  <div className="mt-0.5">
                                      <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                  </div>
                                  <div>
                                      <h3 className="font-semibold text-orange-800 text-sm mb-1">Acerca de los costos de envÃ­o</h3>
                                      <p className="text-xs text-orange-700 leading-relaxed mb-3">
                                          Las campaÃ±as masivas de WhatsApp (Broadcasts) tienen un costo por conversaciÃ³n establecido oficialmente por Meta.
                                      </p>
                                      <ul className="text-xs text-orange-700 list-disc list-inside space-y-2">
                                          <li>El costo se cobra de forma directa a la tarjeta vinculada en tu <strong>Meta Business Manager</strong>.</li>
                                          <li>Meta solo te cobrarÃ¡ por los mensajes entregados exitosamente.</li>
                                          <li>Esta plataforma no aplica ninguna comisiÃ³n o recargo sobre tus envÃ­os.</li>
                                      </ul>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

              
              {activeTab === 'pedidos' && (
                <div className="max-w-6xl mx-auto mt-4">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">GestiÃ³n de Pedidos</h2>
                      <p className="text-gray-500 text-sm mt-1">Administra las compras realizadas a travÃ©s del bot.</p>
                    </div>
                    <button onClick={fetchOrders} className="text-sm bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Actualizar
                    </button>
                  </div>

                  {/* Filtros de Pedidos */}
                  <div className="flex space-x-2 border-b border-gray-200 mb-6 overflow-x-auto custom-scrollbar">
                      {[
                          { id: 'pendiente', label: 'Pendientes' },
                          { id: 'en_proceso', label: 'En Proceso' },
                          { id: 'todos', label: 'Todos' },
                          { id: 'completado', label: 'Completados' },
                          { id: 'cancelado', label: 'Cancelados' }
                      ].map(filter => (
                          <button
                              key={filter.id}
                              onClick={() => { setOrderFilter(filter.id); setOrderPage(1); }}
                              className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                                  orderFilter === filter.id 
                                  ? 'border-indigo-500 text-gray-900' 
                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              }`}
                          >
                              {filter.label}
                          </button>
                      ))}
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse hidden md:table">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                                    <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente</th>
                                    <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Resumen</th>
                                    <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">DirecciÃ³n</th>
                                    <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loadingOrders ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">Cargando pedidos...</td></tr>
                                ) : (!orders || orders.length === 0) ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">No hay pedidos aÃºn.</td></tr>
                                ) : orders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition">
                                        <td className="p-4 text-sm text-gray-600 align-top">
                                            {new Date(order.created_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-gray-900 align-top">
                                            <div className="flex items-center gap-2">
                                                <span>{order.customer_phone?.startsWith('+') ? order.customer_phone : `+${order.customer_phone}`}</span>
                                                <button 
                                                    onClick={() => {
                                                        setActiveChat(order.customer_phone);
                                                        setActiveTab('inbox');
                                                    }}
                                                    className="text-green-500 hover:text-green-600 bg-green-50 hover:bg-green-100 p-1.5 rounded-full transition-colors shadow-sm"
                                                    title="Ir al chat"
                                                >
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <ul className="text-sm text-gray-700 space-y-1">
                                                {(() => {
                                                    try {
                                                        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                                                        if (!Array.isArray(items)) return <li className="text-gray-400">Sin items</li>;
                                                        return items.map((i, idx) => (
                                                            <li key={idx} className="flex gap-2"><span className="text-gray-400 font-bold">{i.quantity || i.qty}x</span> <span className="font-medium text-gray-800">{i.product || i.name}</span></li>
                                                        ));
                                                    } catch(e) { return <li className="text-red-400">Error leyendo items</li>; }
                                                })()}
                                            </ul>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 align-top max-w-xs truncate" title={order.delivery_address}>
                                            {order.delivery_address}
                                        </td>
                                        <td className="p-4 align-top">
                                            <select 
                                                value={order.status}
                                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                className={`text-xs font-bold px-2 py-1 rounded-full border-2 outline-none cursor-pointer ${
                                                    order.status === 'pendiente' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                    order.status === 'completado' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    order.status === 'cancelado' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    'bg-blue-50 text-blue-700 border-blue-200'
                                                }`}
                                            >
                                                <option value="pendiente">Pendiente</option>
                                                <option value="en_proceso">En Proceso</option>
                                                <option value="completado">Completado</option>
                                                <option value="cancelado">Cancelado</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {/* Mobile View: Cards */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {loadingOrders ? (
                                <div className="p-8 text-center text-gray-500">Cargando pedidos...</div>
                            ) : (!orders || orders.length === 0) ? (
                                <div className="p-8 text-center text-gray-500">No hay pedidos aÃºn.</div>
                            ) : orders.map(order => (
                                <div key={order.id} className="p-4 bg-white hover:bg-gray-50 transition flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                            <span>{order.customer_phone?.startsWith('+') ? order.customer_phone : `+${order.customer_phone}`}</span>
                                            <button 
                                                onClick={() => {
                                                    setActiveChat(order.customer_phone);
                                                    setActiveTab('inbox');
                                                }}
                                                className="text-green-500 hover:text-green-600 bg-green-50 hover:bg-green-100 p-1 rounded-full transition-colors"
                                                title="Ir al chat"
                                            >
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                                            </button>
                                        </div>
                                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                            {new Date(order.created_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <ul className="text-sm text-gray-700 space-y-1">
                                            {(() => {
                                                try {
                                                    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                                                    if (!Array.isArray(items)) return <li className="text-gray-400">Sin items</li>;
                                                    return items.map((i, idx) => (
                                                        <li key={idx} className="flex gap-2">
                                                            <span className="text-gray-900 font-bold">{i.quantity || i.qty}x</span> 
                                                            <span className="font-medium text-gray-800">{i.product || i.name}</span>
                                                        </li>
                                                    ));
                                                } catch(e) { return <li className="text-red-400">Error leyendo items</li>; }
                                            })()}
                                        </ul>
                                    </div>

                                    <div className="text-sm text-gray-600 flex items-start gap-2">
                                        <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        <span className="break-words">{order.delivery_address}</span>
                                    </div>

                                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</span>
                                        <select 
                                            value={order.status}
                                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                            className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 outline-none cursor-pointer shadow-sm ${
                                                order.status === 'pendiente' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                order.status === 'completado' ? 'bg-green-50 text-green-700 border-green-200' :
                                                order.status === 'cancelado' ? 'bg-red-50 text-red-700 border-red-200' :
                                                'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}
                                        >
                                            <option value="pendiente">Pendiente</option>
                                            <option value="en_proceso">En Proceso</option>
                                            <option value="completado">Completado</option>
                                            <option value="cancelado">Cancelado</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* PaginaciÃ³n ClÃ¡sica */}
                    {totalOrders > 25 && (
                        <div className="flex justify-between items-center px-4 py-3 bg-white rounded-b-xl border border-t-0 border-gray-200 shadow-sm mt-0">
                            <div className="hidden sm:block">
                                <p className="text-sm text-gray-700">
                                    Mostrando del <span className="font-medium">{(orderPage - 1) * 25 + 1}</span> al <span className="font-medium">{Math.min(orderPage * 25, totalOrders)}</span> de <span className="font-medium">{totalOrders}</span> pedidos
                                </p>
                            </div>
                            <div className="flex-1 flex justify-between sm:justify-end gap-2">
                                <button 
                                    onClick={() => setOrderPage(p => Math.max(1, p - 1))}
                                    disabled={orderPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition"
                                >
                                    â† Anterior
                                </button>
                                <span className="inline-flex items-center px-3 py-2 text-sm text-gray-500">
                                    PÃ¡gina {orderPage} de {Math.ceil(totalOrders / 25)}
                                </span>
                                <button 
                                    onClick={() => setOrderPage(p => p + 1)}
                                    disabled={orderPage * 25 >= totalOrders}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition"
                                >
                                    Siguiente â†’
                                </button>
                            </div>
                        </div>
                    )}

                  </div>
                </div>
              )}

              
              {activeTab === 'inbox' && (
                <div className="flex h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-4">
                  {/* Sidebar de Chats */}
                  <div className={`w-full md:w-1/3 border-r border-gray-200 flex-col bg-gray-50 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-gray-200 bg-white">
                        <h3 className="font-bold text-gray-800 text-lg mb-3">Mensajes</h3>
                        <div className="relative">
                            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input 
                                type="text" 
                                placeholder="Buscar chat..." 
                                value={chatSearch}
                                onChange={(e) => setChatSearch(e.target.value)}
                                className="w-full bg-gray-100 text-sm text-gray-700 rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 transition-shadow"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {chatList.length === 0 ? (
                            <p className="text-sm text-gray-500 p-4 text-center">No hay conversaciones recientes.</p>
                        ) : (() => {
                            const filteredChats = chatList.filter(chat => {
                                const searchTerm = chatSearch.toLowerCase();
                                const name = (chat.customer_name || '').toLowerCase();
                                const phone = (chat.customer_phone || '').toLowerCase();
                                return name.includes(searchTerm) || phone.includes(searchTerm);
                            });
                            
                            if (filteredChats.length === 0) {
                                return <p className="text-sm text-gray-500 p-4 text-center">No se encontraron chats.</p>;
                            }
                            
                            return filteredChats.map(chat => {
                            const phoneStr = chat.customer_phone?.startsWith('+') ? chat.customer_phone : `+${chat.customer_phone}`;
                            const name = chat.customer_name || phoneStr;
                            const initial = chat.customer_name ? chat.customer_name.charAt(0).toUpperCase() : '#';
                            return (
                            <div 
                                key={chat.customer_phone} 
                                onClick={() => { setActiveChat(chat.customer_phone); setMessageLimit(50); }}
                                className={`p-4 border-b border-gray-100 cursor-pointer transition flex items-center gap-3 ${activeChat === chat.customer_phone ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-100 border-l-4 border-l-transparent'}`}
                            >
                                <div className="relative w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center flex-shrink-0">
                                      {initial}
                                      {chat.session_status === 'humano' ? (
                                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-orange-400 border-2 border-white rounded-full shadow-sm" title="Requiere atenciÃ³n humana"></span>
                                      ) : (
                                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 border-2 border-white rounded-full shadow-sm" title="Atendido por el Bot"></span>
                                      )}
                                    <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white rounded-full shadow-sm ${chat.session_status === 'humano' ? 'bg-orange-400' : 'bg-blue-500'}`} title={chat.session_status === 'humano' ? 'Requiere atenciÃ³n humana' : 'Atendido por el Bot'}></span>
                                  </div>
                                <div className="overflow-hidden flex-1">
                                    <div className="font-bold text-gray-900 truncate">{name}</div>
                                    <div className="flex justify-between items-center mt-0.5">
                                      {chat.customer_name && <span className="text-[11px] text-gray-400 truncate">{phoneStr}</span>}
                                      <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                                          {new Date(chat.last_activity).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}
                                      </span>
                                    </div>
                                </div>
                            </div>
                            )
                        })})()}
                        {chatList.length >= chatListLimit && (
                            <div ref={loadMoreChatsRef} className="h-10 flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                  </div>

                  {/* Ãrea de Chat */}
                  <div className={`w-full md:w-2/3 flex-col bg-white relative ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
                    {activeChat ? (
                        <>
                            <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center shadow-sm z-10 relative">
                                <div className="flex items-center">
                                    <button onClick={() => setActiveChat(null)} className="md:hidden mr-3 text-gray-500 hover:text-gray-700 bg-gray-100 p-2 rounded-full transition-colors">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mr-3 font-bold">
                                        {chatList.find(c => c.customer_phone === activeChat)?.customer_name ? chatList.find(c => c.customer_phone === activeChat).customer_name.charAt(0).toUpperCase() : '#'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{chatList.find(c => c.customer_phone === activeChat)?.customer_name || `+${activeChat.replace('+', '')}`}</h3>
                                        <p className="text-xs text-green-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> En lÃ­nea (WhatsApp)</p>
                                    </div>
                                </div>
                                
<button 
                                    onClick={async () => {
                                        const currentStatus = chatList.find(c => c.customer_phone === activeChat)?.session_status || 'bot';
const newStatus = currentStatus === 'bot' ? 'humano' : 'bot';
                                        setChatList(prev => prev.map(c => c.customer_phone === activeChat ? { ...c, session_status: newStatus } : c));
                                        await fetch(`${API_URL}/tenant/${tenantId}/chats/${activeChat}/toggle`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ status: newStatus })
                                        });
                                    }}
                                    className={`ml-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-sm transition-all border ${(chatList.find(c => c.customer_phone === activeChat)?.session_status || 'bot') === 'bot' ? 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50' : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'}`}
                                    title="Click para alternar entre control automÃ¡tico y manual"
                                >
                                    {(chatList.find(c => c.customer_phone === activeChat)?.session_status || 'bot') === 'bot' ? (
                                        <>
                                            <span className="rounded-full h-2 w-2 bg-blue-500"></span>
                                            <span>MODO AUTOMÃTICO</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                            <span>RESOLVER TICKET / DESPERTAR BOT</span>
                                        </>
                                    )}
                                </button>

                                {/* Order Context Badge */}
                                {chatLatestOrder && (
                                    <div 
                                        onClick={() => setShowChatOrderDetails(!showChatOrderDetails)}
                                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded-lg transition"
                                    >
                                        <div className="hidden sm:flex flex-col items-end mr-1">
                                            <span className="text-xs text-gray-500 font-medium leading-tight">Ãšltimo Pedido</span>
                                            <span className="text-xs text-gray-400">{new Date(chatLatestOrder.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize flex items-center gap-1.5 shadow-sm border ${
                                            chatLatestOrder.status === 'completado' ? 'bg-green-50 text-green-700 border-green-200' :
                                            chatLatestOrder.status === 'cancelado' ? 'bg-red-50 text-red-700 border-red-200' :
                                            chatLatestOrder.status === 'en_proceso' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                                        }`}>
                                            <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                            <span className="hidden sm:inline">{chatLatestOrder.status.replace('_', ' ')}</span>
                                            <svg className={`w-3.5 h-3.5 opacity-70 transform transition-transform ${showChatOrderDetails ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Mini-Panel de Detalles del Pedido (Modal Flotante) */}
                            {showChatOrderDetails && chatLatestOrder && (
                                <div className="absolute top-20 right-4 left-4 sm:left-auto sm:w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-fade-in">
                                    {/* Modal Header: Title + Status Action + Close */}
                                    <div className="px-5 py-4 flex justify-between items-center border-b border-gray-100 bg-white">
                                        <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                            <svg className="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                            Resumen
                                        </h4>
                                        
                                        <div className="flex items-center gap-3">
                                            {/* Compact Status Selector in Header */}
                                            <div className="relative group">
                                                <select 
                                                    value={chatLatestOrder.status}
                                                    onChange={async (e) => {
                                                        const newStatus = e.target.value;
                                                        setChatLatestOrder({ ...chatLatestOrder, status: newStatus });
                                                        try {
                                                            await fetch(`${API_URL}/orders/${chatLatestOrder.id}/status`, {
                                                                method: 'PUT',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ status: newStatus })
                                                            });
                                                        } catch (err) { console.error(err); }
                                                    }}
                                                    className={`appearance-none text-[11px] font-bold rounded-full border pl-3 pr-7 py-1 cursor-pointer outline-none transition-all ${
                                                        chatLatestOrder.status === 'completado' ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100' :
                                                        chatLatestOrder.status === 'cancelado' ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100' :
                                                        chatLatestOrder.status === 'en_proceso' ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100' :
                                                        'border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                                                    }`}
                                                >
                                                    <option value="pendiente">Pendiente</option>
                                                    <option value="en_proceso">En Proceso</option>
                                                    <option value="completado">Completado</option>
                                                    <option value="cancelado">Cancelado</option>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                                                    <svg className={`w-3.5 h-3.5 ${
                                                        chatLatestOrder.status === 'completado' ? 'text-green-500' :
                                                        chatLatestOrder.status === 'cancelado' ? 'text-red-500' :
                                                        chatLatestOrder.status === 'en_proceso' ? 'text-blue-500' :
                                                        'text-yellow-500'
                                                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                                                    </svg>
                                                </div>
                                            </div>
                                            
                                            <button onClick={() => setShowChatOrderDetails(false)} className="text-gray-400 hover:text-gray-900 transition">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="p-0">
                                        {/* Items Section */}
                                        <div className="p-5 border-b border-gray-50 bg-white">
                                            <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">ArtÃ­culos</h5>
                                            <ul className="space-y-3">
                                                {(() => {
                                                    try {
                                                        const items = typeof chatLatestOrder.items === 'string' ? JSON.parse(chatLatestOrder.items) : chatLatestOrder.items;
                                                        if (!Array.isArray(items) || items.length === 0) return <li className="text-gray-400 italic text-sm">Sin artÃ­culos</li>;
                                                        return items.map((i, idx) => (
                                                            <li key={idx} className="flex justify-between items-start">
                                                                <div className="flex gap-3">
                                                                    <div className="mt-0.5 bg-gray-100 text-gray-500 rounded text-xs font-bold px-1.5 py-0.5 h-max border border-gray-200">
                                                                        x{i.quantity || i.qty || 1}
                                                                    </div>
                                                                    <span className="font-medium text-gray-800 text-sm">{i.product || i.name || 'ArtÃ­culo Desconocido'}</span>
                                                                </div>
                                                            </li>
                                                        ));
                                                    } catch(e) { return <li className="text-red-400 text-sm">Error leyendo items</li>; }
                                                })()}
                                            </ul>
                                        </div>

                                        {/* Address Section */}
                                        <div className="p-5 bg-gray-50">
                                            <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">EnvÃ­o a</h5>
                                            <div className="flex items-start justify-between gap-3 text-sm text-gray-600">
                                                <div className="flex items-start gap-2">
                                                    <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                                    <span className="leading-relaxed">{chatLatestOrder.delivery_address || 'No especificada'}</span>
                                                </div>
                                                {chatLatestOrder.delivery_address && (
                                                    <button 
                                                        onClick={(e) => {
                                                            navigator.clipboard.writeText(chatLatestOrder.delivery_address);
                                                            const btn = e.currentTarget;
                                                            const originalHTML = btn.innerHTML;
                                                            btn.innerHTML = '<svg class="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>';
                                                            btn.classList.add('border-green-300', 'bg-green-50');
                                                            setTimeout(() => {
                                                                btn.innerHTML = originalHTML;
                                                                btn.classList.remove('border-green-300', 'bg-green-50');
                                                            }, 1500);
                                                        }}
                                                        title="Copiar direcciÃ³n"
                                                        className="flex-shrink-0 text-gray-400 hover:text-gray-900 bg-white border border-gray-200 hover:border-indigo-300 rounded-md p-1.5 shadow-sm transition-all focus:outline-none active:scale-95"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div ref={chatContainerRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto p-4 bg-[#e5ddd5] custom-scrollbar flex flex-col-reverse gap-4">
                                <div ref={bottomAnchorRef} className="h-1 flex-shrink-0" />
                                {[...chatMessages].reverse().map(msg => (
                                    <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-xl shadow-sm relative ${(msg.message_type === 'image' || msg.message_type === 'sticker') ? 'p-1' : 'px-4 py-2'} ${msg.direction === 'outbound' ? (msg.sender_type === 'humano' ? 'bg-blue-100 rounded-tr-none border border-blue-200' : 'bg-[#dcf8c6] rounded-tr-none') : 'bg-white rounded-tl-none'}`}>
                                            
                                            {msg.direction === 'outbound' && (
                                                <div className="text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1 opacity-60">
                                                    {msg.sender_type === 'humano' ? (
                                                        <><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>TÃº (Humano)</>
                                                    ) : (
                                                        <><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm8-6a1 1 0 100 2 1 1 0 000-2zm-1 4a1 1 0 00-1 1v4a1 1 0 102 0v-4a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>Bot</>
                                                    )}
                                                </div>
                                            )}

                                              {(msg.message_type === 'image' || msg.message_type === 'sticker') ? (
                                                msg.content && msg.content.startsWith('http') ? (
                                                    <img onClick={() => { setModalImage(msg.content); setImageZoom(1); }} src={msg.content} alt="Imagen" className="rounded-[8px] max-w-full h-auto object-cover max-h-72 block cursor-pointer hover:opacity-95 transition-opacity" />
                                                ) : (msg.content && msg.content.match(/\[(Imagen|Sticker): (https?:\/\/[^\]]+)\]/)) ? (
                                                      <>
                                                          <img onClick={() => { const url = msg.content.match(/\[(Imagen|Sticker): (.*?)\]/)?.[2]; setModalImage(url); setImageZoom(1); }} src={msg.content.match(/\[(Imagen|Sticker): (.*?)\]/)?.[2]} alt="Media Outbound" className={`max-w-full h-auto object-cover block cursor-pointer hover:opacity-95 transition-opacity ${msg.content.includes('[Sticker:') ? 'w-32 h-32 rounded-none bg-transparent' : 'max-h-72 rounded-[8px]'}`} />
                                                          <div className="text-sm px-2 pt-1 pb-2 whitespace-pre-wrap">{
                                                              (() => {
                                                                  const text = msg.content.replace(/\[(Imagen|Sticker): (.*?)\]\n?/, '');
                                                                  if (!text) return null;
                                                                  return text.split(/(\*[^*]+\*)/g).map((part, i) => {
                                                                      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                                                                          return <strong key={i}>{part.slice(1, -1)}</strong>;
                                                                      }
                                                                      return part;
                                                                  });
                                                              })()
                                                          }</div>
                                                      </>
                                                ) : (
                                                    <div className="text-sm text-gray-500 italic">ðŸ–¼ï¸ Imagen enviada</div>
                                                )
                                            ) : msg.message_type === 'audio' ? (
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-gray-900">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"></path></svg>
                                                        <span className="text-xs font-bold uppercase tracking-wider">Audio Transcrito</span>
                                                    </div>
                                                    <p className="text-sm text-gray-800 italic leading-relaxed mt-1">"{msg.content}"</p>
                                                </div>
                                            ) : msg.message_type === 'interactive' ? (
                                                <div className="text-sm font-semibold text-gray-700 bg-white/50 p-2 rounded border border-gray-200 shadow-sm">{msg.content} <span className="text-[10px] block text-gray-500 font-bold uppercase mt-1 opacity-70">(MenÃº Interactivo)</span></div>
                                            ) : (
                                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{
                                                    (() => {
                                                        const text = msg.content;
                                                        if (!text) return null;
                                                        return text.split(/(\*[^*]+\*)/g).map((part, i) => {
                                                            if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                                                                return <strong key={i}>{part.slice(1, -1)}</strong>;
                                                            }
                                                            return part;
                                                        });
                                                    })()
                                                }</p>
                                            )}
                                            <div className="text-[10px] text-gray-400 font-medium text-right mt-1.5 flex justify-end items-center gap-1 opacity-80">
                                                {new Date(msg.created_at).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}
                                                {msg.direction === 'outbound' && (
                                                    msg.delivery_status === 'read' ? (
                                                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l5 5l10 -10" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 12l5 5m5 -5l5 -5" /></svg>
                                                    ) : msg.delivery_status === 'delivered' ? (
                                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l5 5l10 -10" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 12l5 5m5 -5l5 -5" /></svg>
                                                    ) : (
                                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12l5 5l10 -10" /></svg>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {chatMessages.length >= messageLimit && (
                                    <div ref={loadMoreMessagesRef} className="h-10 flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>
                            
                            {showScrollBottomBtn && (
                                <button 
                                    onClick={() => bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth' })}
                                    className="absolute bottom-20 right-6 bg-white text-gray-500 hover:text-gray-700 p-2.5 rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-all z-20 flex items-center justify-center"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                </button>
                            )}

                            {(() => {
                                const lastInboundMessage = chatMessages.slice().reverse().find(m => m.direction === 'inbound');
                                const isWithin24Hours = lastInboundMessage ? (Date.now() - new Date(lastInboundMessage.created_at).getTime() < 24 * 60 * 60 * 1000) : true;
                                
                                const sendQuickAction = async (action, product_id = null) => {
                                    try {
                                        await fetch(`${API_URL}/tenant/${tenantId}/chats/${activeChat}/action`, {
                                            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, product_id })
                                        });
                                        setChatMessages(prev => [...prev, { id: Date.now(), direction: 'outbound', content: action === 'menu' ? 'CatÃ¡logo interactivo enviado.' : (action === 'product' ? 'Producto enviado manualmente.' : action), created_at: new Date().toISOString(), sender_type: 'humano', message_type: 'interactive' }]);
                                    } catch(e) { console.error(e); }
                                };

                                return (
                                    <div className="bg-[#f0f2f5] border-t border-gray-200 z-10 relative flex flex-col">
                                        {!isWithin24Hours && chatMessages.length > 0 && (
                                            <div className="bg-red-50 text-red-600 text-[10px] text-center py-2 font-bold uppercase tracking-wide border-b border-red-100 flex justify-center items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                                                PolÃ­ticas de Meta: Han pasado mÃ¡s de 24 horas desde el Ãºltimo mensaje del cliente.
                                            </div>
                                        )}
                                        <div className="px-4 py-3 flex items-center gap-3">
                                            {/* Store / Catalog Attachment Button */}
                                            <div className="relative">
                                                <button 
                                                    type="button" 
                                                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)} 
                                                    disabled={!isWithin24Hours} 
                                                    title="Acciones RÃ¡pidas"
                                                    className="text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-50 shrink-0"
                                                >
                                                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" /></svg>
                                                </button>
                                                
                                                {showAttachmentMenu && (
                                                    <div className="absolute bottom-12 left-0 bg-white rounded-xl shadow-lg border border-gray-100 p-1.5 w-44 z-50 flex flex-col animate-fade-in-up">
                                                        <button 
                                                            type="button"
                                                            onClick={() => { setShowAttachmentMenu(false); sendQuickAction('menu'); }}
                                                            className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors text-left group"
                                                        >
                                                            <div className="text-gray-500 group-hover:text-blue-500 transition-colors">
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                                                            </div>
                                                            <span className="font-semibold text-[13px] text-gray-700 group-hover:text-gray-900">Enviar MenÃº</span>
                                                        </button>
                                                        
                                                        <button 
                                                            type="button"
                                                            onClick={() => { setShowAttachmentMenu(false); setShowProductPicker(true); }}
                                                            className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors text-left group"
                                                        >
                                                            <div className="text-gray-500 group-hover:text-green-500 transition-colors">
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                                            </div>
                                                            <span className="font-semibold text-[13px] text-gray-700 group-hover:text-gray-900">Enviar Producto</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Chat Form */}
                                            <form onSubmit={handleSendReply} className="flex-1 flex gap-2 bg-white rounded-lg p-1.5 pl-4 shadow-sm items-center border border-gray-200/60">
                                                <input 
                                                    type="text" 
                                                    value={replyText}
                                                    onChange={e => setReplyText(e.target.value)}
                                                    placeholder={isWithin24Hours ? "Escribe un mensaje" : "El chat estÃ¡ bloqueado por Meta (24h)"}
                                                    className="flex-1 outline-none bg-transparent text-sm disabled:opacity-50 text-gray-700 placeholder-gray-400"
                                                    disabled={!isWithin24Hours}
                                                />
                                                <button type="submit" disabled={!replyText.trim() || !isWithin24Hours} className="p-2 text-blue-500 hover:text-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
                                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                );
                            })()}
</>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-8 text-center">
                            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                            <h3 className="text-xl font-bold text-gray-500 mb-2">Bandeja de Entrada</h3>
                            <p className="text-sm max-w-sm">Selecciona una conversaciÃ³n a la izquierda para empezar a chatear o ver el historial del bot.</p>
                        </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'configuracion' && (
                <div className="max-w-4xl mx-auto mt-8">
                  <h2 className="text-3xl font-extrabold text-gray-900 mb-6">ConfiguraciÃ³n</h2>



                  
                  <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Conecta tu WhatsApp Business</h3>
                        <p className="text-gray-600 mb-4 leading-relaxed">Vincula tu nÃºmero de negocio usando la conexiÃ³n oficial de Meta. PodrÃ¡s seguir usando la app de WhatsApp Business en tu celular mientras nuestro bot responde por ti automÃ¡ticamente.</p>
                        
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-left">
                            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2 text-sm">
                                <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                Beneficios de la Coexistencia
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li className="flex gap-2"><span>âœ…</span> Mantienes tu celular conectado.</li>
                                <li className="flex gap-2"><span>âœ…</span> Historial de chats intacto en tu app.</li>
                                <li className="flex gap-2"><span>âœ…</span> Cero riesgo de bloqueos (100% Oficial).</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex-1 w-full flex flex-col justify-center">
                        {tenantInfo && tenantInfo.whatsapp_phone_id ? (
                            <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-xl flex flex-col items-center gap-3 text-center">
                                {tenantInfo.meta_picture ? (
                                    <img src={tenantInfo.meta_picture} alt="WhatsApp Profile" className="w-20 h-20 rounded-full border-4 border-green-200 shadow-sm" />
                                ) : (
                                    <svg className="w-16 h-16 text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                )}
                                <div className="font-bold text-lg">{tenantInfo.meta_name || "Cuenta Conectada"}</div>
                                <div className="text-xs font-mono bg-green-100 text-green-700 px-2 py-1 rounded-md">ID: {tenantInfo.whatsapp_phone_id}</div>
                                <p className="text-sm font-normal mt-2 text-green-700">El bot estÃ¡ activo y escuchando en Coexistencia.</p>
                                <button onClick={() => alert("Para desconectar, hazlo desde tu app de WhatsApp Business en ConfiguraciÃ³n > Herramientas para la empresa > Meta.")} className="mt-2 text-xs underline text-green-600 hover:text-green-800">Â¿CÃ³mo desconectar?</button>
                            </div>
                        ) : (
                            <button onClick={handleMetaLogin} disabled={loading} className={`w-full ${loading ? 'bg-gray-400' : 'bg-[#1877F2] hover:bg-[#166FE5]'} text-white font-bold py-4 px-6 rounded-xl shadow-lg transition flex items-center justify-center gap-3 text-lg`}>
                                {loading ? (
                                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                )}
                                {loading ? 'Abriendo Facebook...' : 'Conectar con Facebook'}
                            </button>
                        )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'afiliados' && (
                  <div className="max-w-5xl mx-auto mt-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-3xl font-extrabold text-gray-900">Programa de Partners</h2>
                            <p className="text-sm text-gray-500 mt-1">Gana comisiones recurrentes por cada cliente que refieras a nuestra plataforma.</p>
                        </div>
                        <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold border border-indigo-200">En ConstrucciÃ³n ðŸš§</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <p className="text-sm font-bold text-gray-500 mb-1">Total Referidos</p>
                            <p className="text-4xl font-extrabold text-gray-900">0</p>
                            <p className="text-xs text-gray-400 mt-2">Negocios activos usando tu cÃ³digo</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <p className="text-sm font-bold text-gray-500 mb-1">Comisiones Pendientes</p>
                            <p className="text-4xl font-extrabold text-amber-500">0.00 USD</p>
                            <p className="text-xs text-gray-400 mt-2">PrÃ³ximo pago a fin de mes</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <p className="text-sm font-bold text-gray-500 mb-1">Total Pagado</p>
                            <p className="text-4xl font-extrabold text-green-500">0.00 USD</p>
                            <p className="text-xs text-gray-400 mt-2">Ganancias histÃ³ricas</p>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm mb-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-0 opacity-50"></div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 relative z-10">Tu Enlace de Afiliado</h3>
                        <p className="text-sm text-gray-600 mb-4 relative z-10">Comparte este enlace con tus prospectos. Si se registran usÃ¡ndolo, recibirÃ¡s una comisiÃ³n mensual mientras mantengan su suscripciÃ³n activa.</p>
                        
                        <div className="flex flex-col md:flex-row gap-3 relative z-10">
                            <input type="text" readOnly value="https://dynova.neofenix.dev/registro?ref=PROXIMAMENTE" className="flex-1 bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none" />
                            <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2.5 px-6 rounded-lg transition-colors cursor-not-allowed">
                                Copiar Enlace
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800">Tus Clientes Referidos</h3>
                        </div>
                        <div className="p-12 text-center flex flex-col items-center justify-center">
                            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            <h4 className="text-gray-500 font-semibold">MÃ³dulo en construcciÃ³n</h4>
                            <p className="text-gray-400 text-sm mt-2 max-w-sm">PrÃ³ximamente podrÃ¡s ver aquÃ­ la lista de negocios que han ingresado con tu enlace y las comisiones generadas.</p>
                        </div>
                    </div>
                  </div>
              )}

              {activeTab === 'productos' && (
              <>
                {/* Cabecera del MÃ³dulo */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                  <div>
                      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <svg className="w-7 h-7 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        Mi CatÃ¡logo Virtual
                      </h1>
                      <p className="text-gray-500 mt-1 text-sm">Administra los productos de tu negocio. Los cambios se reflejan en tiempo real en WhatsApp.</p>
                  </div>
                  <button onClick={() => { setEditProductId(null); setFormData({name:'', description:'', price:''}); setShowModal(true); }} className="mt-4 md:mt-0 w-full md:w-auto bg-black text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center md:justify-start gap-2 text-sm">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                      Nuevo Producto
                  </button>
                </div>
              </>
            )}

      {/* SECCIÃ“N IA (Solo visible si es Nivel 2 o 3) */}
      {activeTab === 'chatbots' && tenantInfo && tenantInfo.bot_tier >= 2 && (
          <div className="mb-10 relative">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Tarjeta 1: Personalidad (Izquierda) */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                      <div className="flex items-center gap-2 mb-1">
                          <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <h2 className="text-lg font-bold text-gray-900">Personalidad del Agente</h2>
                      </div>
                      <p className="text-gray-500 text-xs mb-4">Instrucciones de comportamiento, tono y lÃ­mites.</p>
                      <textarea 
                          value={systemPrompt} 
                          onChange={e => setSystemPrompt(e.target.value)} 
                          className="w-full border border-gray-200 p-4 rounded-lg outline-none focus:ring-1 focus:ring-gray-900 bg-gray-50 resize-y text-gray-700 text-sm font-mono leading-relaxed" 
                          rows="18"
                          placeholder="Instrucciones para el Bot..."
                      ></textarea>
                  </div>

                  {/* Tarjeta 2: Base de Conocimiento (Derecha) */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                      <div className="flex items-center gap-2 mb-1">
                          <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          <h2 className="text-lg font-bold text-gray-900">Base de Conocimiento</h2>
                      </div>
                      <p className="text-gray-500 text-xs mb-5">Agrega preguntas comunes y sus respuestas. La IA nunca inventarÃ¡ datos.</p>
                      
                      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                          {faqs.map((faq, index) => (
                              <div key={index} className="flex flex-col gap-2 bg-white p-4 rounded-lg border border-gray-200 relative group hover:border-gray-400 transition shadow-sm">
                                  <button onClick={() => setDeleteConfirm({ isOpen: true, type: 'faq', index: index })} className="absolute -top-2 -right-2 bg-white border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm" title="Eliminar">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                  
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Pregunta</label>
                                      <input type="text" value={faq.q} onChange={e => { const newFaqs = [...faqs]; newFaqs[index].q = e.target.value; setFaqs(newFaqs); }} className="w-full border-b border-gray-200 pb-1 outline-none focus:border-black bg-transparent text-sm font-medium" placeholder="Ej: Â¿CuÃ¡les son las formas de pago?" />
                                  </div>
                                  
                                  <div className="mt-1">
                                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Respuesta</label>
                                      <textarea value={faq.a} onChange={e => { const newFaqs = [...faqs]; newFaqs[index].a = e.target.value; setFaqs(newFaqs); }} className="w-full border border-gray-200 p-2 rounded-md outline-none focus:border-black bg-gray-50 resize-y text-sm" rows="3" placeholder="Ej: Aceptamos pago contra entrega..."></textarea>
                                  </div>
                              </div>
                          ))}
                          <button onClick={() => setFaqs([...faqs, { q: '', a: '' }])} className="w-full py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 font-semibold hover:bg-gray-50 hover:border-gray-400 transition flex justify-center items-center gap-2 text-sm">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg> AÃ±adir Pregunta
                          </button>
                      </div>
                  </div>
              </div>

              {/* BotÃ³n de Guardar General */}
              <div className="flex justify-center mt-8 sticky bottom-6 z-10">
                  <button onClick={handleSaveConfig} disabled={savingPrompt} className="bg-black text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 transition shadow-xl flex items-center gap-2 transform hover:scale-105 text-sm border border-gray-700">
                      {savingPrompt ? 'Guardando...' : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                          Guardar ConfiguraciÃ³n
                        </>
                      )}
                  </button>
              </div>
          </div>
      )}

      {/* SECCIÃ“N MENÃš RÃGIDO (Solo visible si es Nivel 1) */}
      {activeTab === 'chatbots' && tenantInfo && tenantInfo.bot_tier === 1 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                
                {/* COLUMNA IZQUIERDA: Configuraciones Generales */}
                <div className="flex flex-col gap-6">
                    
                    {/* Tarjeta 1: Tipo de Negocio */}
                    <div className="bg-white/90 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden backdrop-blur-sm">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full blur-3xl opacity-30 -mr-10 -mt-10 pointer-events-none"></div>
                        <h2 className="text-xl font-bold text-gray-800 mb-6 relative z-10">Tipo de Negocio y Formato</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Vertical de Negocio</label>
                                <select value={businessVertical} onChange={e => setBusinessVertical(e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 bg-white shadow-sm transition-shadow">
                                    <option value="ecommerce">Tienda / E-commerce (Carrito)</option>
                                    <option value="clinic">Clínica / Servicios (Citas)</option>
                                    <option value="lead_gen">Generación de Leads (Datos)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Moneda Local</label>
                                <input type="text" value={currency} onChange={e => setCurrency(e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 bg-white shadow-sm transition-shadow" placeholder="Ej: Q, $, MXN" />
                            </div>
                        </div>
                        
                        <div className="mt-5 relative z-10">
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Mensaje de Finalización (Checkout / Despedida)</label>
                            <textarea value={checkoutMessage} onChange={e => setCheckoutMessage(e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 bg-white shadow-sm resize-none transition-shadow" rows="3" placeholder="Ej: Un asesor se contactará para coordinar el pago..."></textarea>
                            <p className="text-xs text-gray-500 mt-2">Texto enviado al finalizar un pedido, agendar cita o recolectar un lead.</p>
                        </div>
                    </div>

                    {/* Tarjeta 2: Mensaje de Saludo */}
                    <div className="bg-white/90 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden backdrop-blur-sm">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-30 -mr-10 -mt-10 pointer-events-none"></div>
                        <h2 className="text-xl font-bold text-gray-800 mb-6 relative z-10">Mensaje de Saludo</h2>
                        <textarea value={tier1Greeting} onChange={e => setTier1Greeting(e.target.value)} className="w-full border border-gray-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm resize-none transition-shadow text-gray-700 relative z-10" rows="4" placeholder="Ej: Hola! Gracias por comunicarte con nosotros..."></textarea>
                        <p className="text-xs text-gray-500 mt-2 relative z-10">Este es el mensaje de bienvenida que se muestra al iniciar una conversación.</p>
                    </div>

                </div>

                {/* COLUMNA DERECHA: Opciones del Menú */}
                <div className="bg-white/90 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden backdrop-blur-sm flex flex-col h-full">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-30 -mr-10 -mt-10 pointer-events-none"></div>
                    
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <h2 className="text-xl font-bold text-gray-800">Configuración de Menú Principal</h2>
                        <button onClick={handleAddMenu} className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-bold transition shadow-sm">+ Añadir Opción</button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 relative z-10">
                        
                        <div className="flex items-center gap-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl shadow-sm">
                            <div className="bg-white p-2.5 rounded-lg shadow-sm">
                                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-indigo-900 text-sm">{businessVertical === 'clinic' ? 'Ver Servicios' : (businessVertical === 'lead_gen' ? 'Catálogo' : 'Ver Productos')}</h3>
                                <p className="text-xs text-indigo-700/80 mt-0.5 font-medium">Opción fija del sistema (abre el catálogo).</p>
                            </div>
                        </div>
                        
                        {tier1Menu.map((m, idx) => (
                            <div key={idx} className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-indigo-300 transition-all relative group">
                                <div className="absolute top-4 right-4 z-10">
                                    <button onClick={() => setDeleteConfirm({ isOpen: true, type: 'menu', index: idx })} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Eliminar opción">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>

                                <div className="flex flex-col gap-4 pr-8">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Título del Botón</label>
                                        <input type="text" value={m.title} maxLength="24" onChange={e => { let nm = [...tier1Menu]; nm[idx].title = e.target.value; setTier1Menu(nm); }} className="w-full border border-gray-200 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50/50 focus:bg-white transition-colors" placeholder="Ej: Formas de pago" />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Respuesta del Bot</label>
                                        <textarea value={m.response} onChange={e => { let nm = [...tier1Menu]; nm[idx].response = e.target.value; setTier1Menu(nm); }} className="w-full border border-gray-200 p-3 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50/50 focus:bg-white resize-none h-24 transition-colors" placeholder="El texto que el bot responderá al tocar este botón..."></textarea>
                                    </div>
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <label className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 cursor-pointer px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            {m.image_url ? 'Cambiar Imagen' : 'Adjuntar Imagen'}
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUploadMenu(idx, e.target.files[0])} />
                                        </label>
                                        {m.image_url && (
                                            <div className="flex items-center gap-2 bg-gray-50 p-1.5 pr-3 rounded-lg border border-gray-200">
                                                <img src={m.image_url} alt="Adjunto" className="w-8 h-8 object-cover rounded-md" />
                                                <button onClick={() => { let nm = [...tier1Menu]; delete nm[idx].image_url; setTier1Menu(nm); }} className="text-gray-400 hover:text-red-500 text-xs font-bold px-2 transition-colors">Quitar</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* CONTROLES DE GUARDADO */}
                    <div className="flex justify-end mt-6 pt-4 border-t border-gray-100 relative z-10">
                        <button onClick={handleSaveConfig} disabled={savingPrompt} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-sm flex items-center gap-2">
                            {savingPrompt ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                    Guardar Cambios
                                </>
                            )}
                        </button>
                    </div>
                </div>
                
            </div>
        )}
      
      {activeTab === 'productos' && (() => {
        const filteredProducts = productos.filter(p => (p.name || '').toLowerCase().includes(productSearch.toLowerCase()) || (p.description || '').toLowerCase().includes(productSearch.toLowerCase()));
        const ITEMS_PER_PAGE = 30;
        const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
        const paginatedProducts = filteredProducts.slice((productPage - 1) * ITEMS_PER_PAGE, productPage * ITEMS_PER_PAGE);

        return (
            <div className="space-y-6">
                {/* Search Bar */}
                {productos.length > 0 && (
                    <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input 
                            type="text" 
                            placeholder="Buscar productos por nombre o descripciÃ³n..." 
                            value={productSearch}
                            onChange={(e) => { setProductSearch(e.target.value); setProductPage(1); }}
                            className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
                        />
                        {productSearch && (
                            <button onClick={() => { setProductSearch(''); setProductPage(1); }} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                    </div>
                )}

                {productos.length === 0 ? (
                    <div className="bg-white p-16 text-center rounded-2xl border-2 border-dashed border-gray-300">
                        <h3 className="text-2xl font-bold text-gray-600 mb-2">CatÃ¡logo vacÃ­o</h3>
                        <p className="text-gray-500">Haz clic en el botÃ³n oscuro para agregar el primer producto a tu tienda virtual.</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-2xl border border-gray-200">
                        <p className="text-gray-500">No se encontraron productos que coincidan con tu bÃºsqueda.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                            {paginatedProducts.map(p => (
                                <div key={p.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 relative group flex flex-col h-full hover:-translate-y-1">
                                    <div className="absolute top-2 right-2 flex gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button onClick={() => handleEditProduct(p)} className="bg-white/90 backdrop-blur-sm text-gray-700 border border-gray-200/50 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-sm hover:bg-white hover:text-gray-900 transition-colors" title="Editar Producto">
                                            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        <button onClick={() => handleDelete(p.id)} className="bg-red-500/90 backdrop-blur-sm text-white w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors" title="Eliminar Producto">
                                            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>

                                    <div 
                                        onClick={() => { if(p.image_url) { setModalImage(p.image_url); setImageZoom(1); } }}
                                        className="relative w-full aspect-square bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-50 cursor-pointer"
                                    >
                                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-700 ease-in-out" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                            <div className="bg-black/30 backdrop-blur-sm p-2 md:p-3 rounded-full text-white shadow-lg">
                                                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3 md:p-4 flex flex-col flex-grow bg-white">
                                        <h3 className="font-bold text-[13px] md:text-[15px] leading-snug text-gray-900 line-clamp-2 pr-4 md:pr-0">{p.name}</h3>
                                        <p className="text-[11px] md:text-sm text-gray-500 mt-1 md:mt-2 line-clamp-2 leading-relaxed flex-grow">{p.description}</p>
                                        <div className="mt-3 md:mt-4 pt-3 flex justify-between items-center border-t border-gray-100">
                                            <span className="text-[15px] md:text-lg font-black text-gray-900 tracking-tight">Q{p.price}</span>
                                            <span className="text-[9px] md:text-xs font-bold uppercase tracking-wider text-green-700 bg-green-50 border border-green-200/50 px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-full">En stock</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-8 pt-4">
                                <button 
                                    onClick={() => setProductPage(p => Math.max(1, p - 1))}
                                    disabled={productPage === 1}
                                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <span className="text-sm font-semibold text-gray-700">
                                    PÃ¡gina {productPage} de {totalPages}
                                </span>
                                <button 
                                    onClick={() => setProductPage(p => Math.min(totalPages, p + 1))}
                                    disabled={productPage === totalPages}
                                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
      })()}

            {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 max-h-[95vh] overflow-y-auto scrollbar-hide" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-6 text-gray-900">{editProductId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                <form onSubmit={handleSubmit}>
                    
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Imagen del Producto</label>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 text-gray-700 hover:file:bg-gray-200" />
                        {formData.image_url && <img src={formData.image_url} alt="preview" className="mt-2 h-20 w-20 object-cover rounded-lg border" />}
                    </div>

                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Nombre del Producto</label>
                    <input type="text" required maxLength="24" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50 mb-5 outline-none focus:border-black focus:ring-1 focus:ring-black transition shadow-sm text-sm" placeholder="Ej: Pizza Familiar" />
                    
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Precio de Venta</label>
                    <div className="relative mb-5">
                        <span className="absolute left-2 top-2 font-bold text-gray-500 text-sm">Q</span>
                        <input type="number" step="0.01" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50 pl-6 outline-none focus:border-black focus:ring-1 focus:ring-black transition shadow-sm text-sm font-medium" placeholder="99.00" />
                    </div>

                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">DescripciÃ³n para WhatsApp</label>
                    <textarea required maxLength="100" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full border border-gray-200 p-3 mb-6 rounded-lg outline-none focus:border-black bg-gray-50 resize-none text-sm" placeholder="Incluye ingredientes y detalles..." rows="3"></textarea>

                    <div className="flex gap-3">
                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-5 py-2.5 bg-gray-100 rounded-xl font-semibold text-gray-700 hover:bg-gray-200 transition text-sm">Cancelar</button>
                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-black text-white rounded-xl font-semibold shadow-md hover:bg-gray-800 transition flex items-center justify-center gap-2 text-sm">
                            {loading ? 'Guardando...' : (editProductId ? 'Guardar Cambios' : 'ðŸš€ Publicar')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* ConfirmaciÃ³n Eliminar */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setDeleteConfirm({ isOpen: false, type: null, index: null })}>
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm border border-gray-100 transform transition-all text-center" onClick={(e) => e.stopPropagation()}>
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-2">Â¿Eliminar {deleteConfirm.type === 'menu' ? 'opciÃ³n' : (deleteConfirm.type === 'faq' ? 'pregunta' : 'producto')}?</h3>
                <p className="text-gray-500 text-sm mb-6 px-2">Esta acciÃ³n no se puede deshacer y se eliminarÃ¡ {deleteConfirm.type === 'producto' ? 'de tu catÃ¡logo de WhatsApp inmediatamente.' : 'de la configuraciÃ³n de tu bot de WhatsApp.'}</p>
                <div className="flex gap-3 w-full">
                    <button onClick={() => setDeleteConfirm({ isOpen: false, type: null, index: null })} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition">Cancelar</button>
                    <button onClick={async () => {
                        if (deleteConfirm.type === 'menu') {
                            let nm = [...tier1Menu]; nm.splice(deleteConfirm.index, 1); setTier1Menu(nm);
                        } else if (deleteConfirm.type === 'faq') {
                            setFaqs(faqs.filter((_, i) => i !== deleteConfirm.index));
                        } else if (deleteConfirm.type === 'producto') {
                            try {
                                await fetch(`${API_URL}/productos/${deleteConfirm.index}`, { method: 'DELETE' });
                                fetchData();
                            } catch(err) { console.error(err); }
                        }
                        setDeleteConfirm({ isOpen: false, type: null, index: null });
                    }} className="flex-1 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 text-white font-bold py-3 rounded-xl transition">SÃ­, eliminar</button>
                </div>
            </div>
        </div>
      )}

          </div>
        </div>
      </div>

      {/* Image Modal Lightbox */}
      {modalImage && (
          <div 
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
              onClick={() => { setModalImage(null); setImageZoom(1); setImagePan({x:0, y:0}); }}
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
                      onClick={(e) => { e.stopPropagation(); setImageZoom(s => { const newZoom = Math.max(s - 0.5, 0.5); if(newZoom <= 1) setImagePan({x:0,y:0}); return newZoom; }); }}
                  >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
                  </button>
                  <button 
                      className="text-white hover:text-red-400 p-2 bg-black/50 rounded-full transition-colors ml-4"
                      onClick={() => { setModalImage(null); setImageZoom(1); setImagePan({x:0, y:0}); }}
                  >
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
              </div>
              
              <div 
                  className={`w-full h-full overflow-hidden flex items-center justify-center ${imageZoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  onMouseDown={(e) => {
                      if (imageZoom > 1) {
                          e.preventDefault();
                          setIsDraggingImage(true);
                          imageDragRef.current = false;
                          setDragStart({ x: e.clientX - imagePan.x, y: e.clientY - imagePan.y });
                      }
                  }}
                  onMouseMove={(e) => {
                      if (isDraggingImage && imageZoom > 1) {
                          imageDragRef.current = true;
                          setImagePan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
                      }
                  }}
                  onMouseUp={() => {
                      setIsDraggingImage(false);
                      setTimeout(() => { imageDragRef.current = false; }, 50);
                  }}
                  onMouseLeave={() => {
                      setIsDraggingImage(false);
                      imageDragRef.current = false;
                  }}
                  onClick={() => { if(!imageDragRef.current) { setModalImage(null); setImageZoom(1); setImagePan({x:0, y:0}); } }}
              >
                  <img 
                      src={modalImage} 
                      alt="Zoomed" 
                      className={`object-contain max-w-[90vw] max-h-[90vh] shadow-xl ${isDraggingImage ? '' : 'transition-transform duration-200'}`}
                      style={{ 
                          transform: `translate(${imagePan.x}px, ${imagePan.y}px) scale(${imageZoom})`, 
                          transformOrigin: 'center'
                      }}
                      onDragStart={(e) => e.preventDefault()}
                      onClick={(e) => {
                          e.stopPropagation();
                          if (imageDragRef.current) return;
                          
                          if (imageZoom >= 4) { setImageZoom(1); setImagePan({x:0, y:0}); }
                          else { setImageZoom(s => Math.min(s + 0.5, 4)); }
                      }}
                      onWheel={(e) => {
                          e.stopPropagation();
                          if (e.deltaY < 0) {
                              setImageZoom(s => Math.min(s + 0.25, 4));
                          } else {
                              setImageZoom(s => {
                                  const newZoom = Math.max(s - 0.25, 0.5);
                                  if (newZoom <= 1) setImagePan({x:0, y:0});
                                  return newZoom;
                              });
                          }
                      }}
                  />
              </div>
          </div>
      )}

{showProductPicker && (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setShowProductPicker(false)}>
        <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Seleccionar Producto</h2>
                <button onClick={() => setShowProductPicker(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            
            <input 
                type="text" 
                placeholder="Buscar producto por nombre..." 
                className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-black transition mb-4 text-sm"
                onChange={(e) => {
                    const term = e.target.value.toLowerCase();
                    const items = document.querySelectorAll('.product-picker-item');
                    let visibleCount = 0;
                    items.forEach(item => {
                        const name = item.getAttribute('data-name').toLowerCase();
                        if (name.includes(term)) {
                            item.style.display = 'flex';
                            visibleCount++;
                        } else {
                            item.style.display = 'none';
                        }
                    });
                    const emptyState = document.getElementById('product-picker-empty');
                    if (emptyState) emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
                }}
            />
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {productos.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No hay productos disponibles.</p>
                ) : (
                    <>
                        <p id="product-picker-empty" className="text-center text-gray-500 py-8" style={{display: 'none'}}>No hay resultados.</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {productos.map(p => (
                                <button 
                                    key={p.id}
                                    className="product-picker-item relative flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-blue-500 hover:shadow-md transition-all text-left group focus:outline-none"
                                    data-name={p.name}
                                    onClick={async () => {
                                        setShowProductPicker(false);
                                        try {
                                            await fetch(`${API_URL}/tenant/${tenantId}/chats/${activeChat}/action`, {
                                                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'product', product_id: p.id })
                                            });
                                            setChatMessages(prev => [...prev, { id: Date.now(), direction: 'outbound', content: `[Imagen: ${p.image_url || ''}]\n*ðŸ“¦ ${p.name}*\n\nðŸ’° Precio: Q${p.price}\n\n${p.description || ''}`.trim(), created_at: new Date().toISOString(), sender_type: 'humano', message_type: p.image_url ? 'image' : 'text' }]);
                                        } catch(e) { console.error(e); }
                                    }}
                                >
                                    <div className="relative w-full h-28 bg-gray-50 flex items-center justify-center overflow-hidden">
                                        {p.image_url ? (
                                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        )}
                                        
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="bg-white text-blue-600 rounded-full p-2.5 shadow-lg transform scale-75 group-hover:scale-100 transition-transform flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3 w-full border-t border-gray-100 bg-white">
                                        <p className="font-bold text-gray-900 truncate text-[13px]">{p.name}</p>
                                        <p className="text-blue-600 font-bold text-xs mt-0.5">Q{p.price}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    </div>
)}

    </div>
  );
}
export default ClientDashboard;
