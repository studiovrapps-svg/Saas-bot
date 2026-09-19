const socketIo = require('socket.io');

let io;

const jwt = require('jsonwebtoken');

module.exports = {
    init: (httpServer) => {
        const allowedOrigins = [
            process.env.FRONTEND_URL || 'http://localhost:5173',
            'http://localhost:3000'
        ];

        io = socketIo(httpServer, {
            cors: {
                origin: function(origin, callback) {
                    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
                        callback(null, true);
                    } else {
                        callback(new Error('Not allowed by CORS'));
                    }
                },
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        // Middleware de Autenticación
        io.use((socket, next) => {
            const token = socket.handshake.auth?.token || socket.handshake.query?.token;
            if (!token) return next(new Error('Autenticación denegada: No token'));

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.user = decoded; // { role: 'tenant', tenant_id: 1 } or { role: 'superadmin' }
                next();
            } catch (error) {
                return next(new Error('Autenticación denegada: Token inválido'));
            }
        });

        io.on('connection', (socket) => {
            console.log('Cliente conectado a WebSocket:', socket.id);

            socket.on('join_tenant_room', (tenant_id) => {
                // Validación de IDOR para Sockets
                if (!tenant_id) return;
                if (socket.user.role !== 'superadmin') {
                    if (!socket.user.tenant_id || socket.user.tenant_id.toString() !== tenant_id.toString()) {
                        console.warn(`Intento de espionaje en socket: ID ${socket.user.tenant_id} intentó unirse a ${tenant_id}`);
                        return;
                    }
                }
                socket.join(`tenant_${tenant_id}`);
                console.log(`Socket ${socket.id} unido a la sala tenant_${tenant_id}`);
            });

            socket.on('disconnect', () => {
                console.log('Cliente desconectado:', socket.id);
            });
        });

        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error("Socket.io no está inicializado!");
        }
        return io;
    }
};
