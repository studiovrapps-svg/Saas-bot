const socketIo = require('socket.io');

let io;

module.exports = {
    init: (httpServer) => {
        io = socketIo(httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || 'http://localhost:5173',
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        io.on('connection', (socket) => {
            console.log('Cliente conectado a WebSocket:', socket.id);

            // El frontend enviará el tenant_id para unirse a una sala privada
            socket.on('join_tenant_room', (tenant_id) => {
                socket.join(`tenant_${tenant_id}`);
                console.log(`Socket \${socket.id} unido a la sala tenant_\${tenant_id}`);
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
