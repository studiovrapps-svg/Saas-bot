module.exports = {
    VERTICALS: {
        ECOMMERCE: 'ecommerce',
        CLINIC: 'clinic',
        LEAD_GEN: 'lead_gen'
    },
    // Tiempos (Timeouts)
    HANDOFF_SILENCE_DURATION_MS: 2 * 60 * 60 * 1000, // 2 horas de silencio del bot cuando se pasa a humano

    // Precios de IA (Groq / Gemini) por token
    AI_PRICING: {
        PROMPT_TOKENS_PER_MILLION: 0.075,
        COMPLETION_TOKENS_PER_MILLION: 0.30
    },

    // NLP (Natural Language Processing) básico
    KEYWORDS: {
        GREETINGS: ['hola', 'menu', 'menú', 'inicio', 'buenas', 'buenos', 'saludos', 'ayuda', 'ola'],
        ESCAPE_FLOW: ['cancelar', 'menu', 'salir', 'volver', 'reiniciar'],
        HANDOFF_REQUEST: ['asesor', 'humano']
    },

    // Respuestas quemadas (Bot Copy)
    COPY: {
        HANDOFF_INITIATED: "🧑‍💻 *Conectando con un asesor...*\n\nHe notificado a nuestro equipo. Un asesor humano leerá este chat y te responderá a la brevedad. (El bot se pausará temporalmente).",
        FALLBACK_MISUNDERSTOOD: "No te comprendí muy bien 😅. Para ayudarte rápido, por favor selecciona una de nuestras opciones:",
        AUDIO_ERROR: "[Error transcribiendo audio]",
        IMAGE_ERROR: "[Error descargando imagen]",
        STICKER_REJECTED: "¡Qué buen sticker! 😄 Pero por ahora soy un bot y solo puedo entender mensajes de texto o respuestas de los botones. Por favor usa texto para continuar.",
        ORDER_SUCCESS: "🎉 *¡Pedido registrado con éxito!*"
    }
};
