const pool = require('./src/config/db');

const tier1_greeting = '¡Buen día! ????\n\nGracias por comunicarse con CDS Premium.\n\nSoy su asistente virtual. Por favor, seleccione una de las opciones en el menú de abajo para ayudarle rápidamente:';

const tier1_menu = [
  {
    title: 'Quiero comprar ??',
    response: '¡Genial! Para realizar su pedido necesitamos que nos brinde:\n\n1. Su Nombre Completo\n2. Dirección exacta\n3. Producto(s) que desea\n\n¡Recuerde que el envío es GRATIS a todo el país y el pago es CONTRA ENTREGA! ????'
  },
  {
    title: 'Formas de pago ??',
    response: '?? Forma de Pago\n\nEl pago es CONTRA ENTREGA. Paga cuando recibe su producto en la puerta de su casa.'
  },
  {
    title: 'Envío y entrega ??',
    response: '?? Envío\nEl envío es GRATIS a todo el país. ????\n\n?? ¿Cuándo llega?\nCargo expreso toma de 2 a 3 días hábiles en realizar la entrega.\n\n?? Confirmación\nEn cuanto procesemos la guía, le enviamos copia por WhatsApp para que pueda rastrear su pedido.'
  },
  {
    title: 'Promoción del mes ??',
    response: '¡Este mes tenemos descuentos especiales en nuestros productos! Por favor solicite hablar con un asesor para conocer las ofertas vigentes.'
  },
  {
    title: 'Enfermedades ??',
    response: '?? Lista de condiciones que apoyamos:\nAbsceso, Acné, Aftas, Alergia, Alzheimer, Amigdalitis, Ansiedad, Apendicitis, Aterosclerosis, Artritis reumatoide, Artrosis, Asma, Autismo, Bronquitis, Brucelosis, Cálculos renales, Cáncer (colorectal, esófago, gástrico, hígado, lengua, mama, óseo, ovario, pancreático, próstata, pulmón, renal, tiroideo, uterino, vejiga), Candidiasis, Caspa, Chagas, Chikungunya, Ciática, Cirrosis, Cistitis, Colesterol, Colitis, Conjuntivitis, Demencia, Dengue, Depresión, Dermatitis, Diabetes, Diarrea, Disfunción eréctil, Diverticulitis, Dolor de cabeza, Ébola, Enf. autoinmunes, Crohn, Lyme, EPOC, Erupciones, E. Coli, ELA, Esclerosis múltiple, Esquizofrenia, Estomatitis, Fibromialgia, Fibrosis quística, Fiebre tifoidea, Fístula anal, Fracturas, Gastritis, Gastroenteritis, Gingivitis, Gonorrea, Gota, Gripe, Hepatitis, Hernia, Herpes, H. Pylori, Hipertensión, Hipertiroidismo, Hongos, Infecciones, Insuficiencia cardíaca/renal, Leishmaniasis, Leucemia, Liquen, Linfoma, Lupus, Malaria, Meningitis, Metales pesados, Migraña, Mononucleosis, Nefritis, Neumonía, Osteomielitis, Osteoporosis, Otitis, Periodontitis, Picaduras, Pie de atleta, Prostatitis, Psoriasis, Pulmonía, Quemaduras, Quistes, Reflujo, Resfriado, Rinitis, Sarna, Sarcoidosis, SARM, Sjögren, Sinusitis, Staphylococcus, Tumores, Tuberculosis, Trombosis, Uveítis, Úlceras, Vaginosis, Varices, Verrugas, VIH/SIDA, Epstein-Barr, VPH.\n\n?? Esta información es de referencia y no sustituye el diagnóstico médico profesional.'
  },
  {
    title: 'Ser distribuidor ??',
    response: '¡Excelente decisión! Convertirse en distribuidor oficial de CDS Premium tiene grandes beneficios.\n\nPor favor, déjenos su *Nombre Completo* y *Ciudad*, y el encargado le contactará personalmente.'
  },
  {
    title: 'Asesor humano ?????',
    response: '¡Claro que sí! Para agilizar su atención, por favor escriba aquí su *Nombre Completo* y su consulta.\n\nUn asesor humano leerá este chat y le responderá lo más pronto posible.'
  },
  {
    title: 'Cita médica ??',
    response: 'Para agendar una cita con nuestro médico especialista, necesitamos los siguientes datos:\n\n1. Su Nombre completo\n2. Día y hora de su preferencia\n\nPor favor envíelos por aquí y le confirmaremos la disponibilidad.'
  }
];

const business_rules = [
  { q: 'asesor', a: 'Un asesor humano le atenderá pronto. Por favor deje su nombre y consulta.' },
  { q: 'humano', a: 'Le transferiré con un humano. Por favor deje su duda escrita aquí.' },
  { q: 'precio', a: 'Todos nuestros precios están en Quetzales (Q). Puede verlos seleccionando la opción \'Ver productos\' en el menú principal.' },
  { q: 'comprar', a: '¡Genial! Para comprar, necesitamos su Nombre Completo y Dirección exacta. Recuerde que el envío es GRATIS y el pago es CONTRA ENTREGA.' }
];

async function fixTier1() {
  try {
    await pool.query(
      'UPDATE tenants SET bot_tier = 1, tier1_greeting = \, tier1_menu = \, business_rules = \ WHERE id = 3',
      [tier1_greeting, JSON.stringify(tier1_menu), JSON.stringify(business_rules)]
    );
    console.log('Tier 1 Configuration fixed perfectly for CDS Premium 2 (ID: 3)');
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
fixTier1();
