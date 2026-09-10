// Catálogo de monedas soportadas.
export const CURRENCIES = [
  { code: 'ARS', label: 'Pesos argentinos (ARS)', locale: 'es-AR', symbol: 'AR$' },
  { code: 'USD', label: 'Dólares (USD)', locale: 'en-US', symbol: 'US$' },
  { code: 'EUR', label: 'Euros (EUR)', locale: 'es-ES', symbol: '€' },
  { code: 'BRL', label: 'Reales (BRL)', locale: 'pt-BR', symbol: 'R$' },
  { code: 'CLP', label: 'Pesos chilenos (CLP)', locale: 'es-CL', symbol: 'CLP$' },
  { code: 'MXN', label: 'Pesos mexicanos (MXN)', locale: 'es-MX', symbol: 'MX$' },
];

export const CUSTOM_PRINTER = 'Otro / Personalizado';

// Consumo promedio durante un print (no peak), en watts.
export const PRINTERS = [
  { model: CUSTOM_PRINTER, watts: null },
  { model: 'Anycubic Kobra 2', watts: 120 },
  { model: 'Anycubic Kobra 3', watts: 130 },
  { model: 'Anycubic Kobra 3 v2', watts: 130 },
  { model: 'Anycubic Kobra Max', watts: 160 },
  { model: 'Artillery Sidewinder X2', watts: 130 },
  { model: 'Bambu Lab A1', watts: 110 },
  { model: 'Bambu Lab A1 mini', watts: 85 },
  { model: 'Bambu Lab P1S', watts: 130 },
  { model: 'Bambu Lab X1 Carbon', watts: 145 },
  { model: 'Creality Ender 3', watts: 110 },
  { model: 'Creality Ender 3 V2', watts: 110 },
  { model: 'Creality Ender 3 S1 Pro', watts: 125 },
  { model: 'Creality K1', watts: 150 },
  { model: 'Creality K1 Max', watts: 175 },
  { model: 'Creality CR-10 Smart', watts: 150 },
  { model: 'Elegoo Neptune 3 Pro', watts: 115 },
  { model: 'Elegoo Neptune 4 Pro', watts: 130 },
  { model: 'Prusa MK3S+', watts: 100 },
  { model: 'Prusa MK4', watts: 105 },
  { model: 'Sovol SV06', watts: 110 },
];

// Multiplicadores sugeridos de margen de ganancia.
export const MULTIPLIERS = [2, 2.5, 3, 3.5, 4, 5];

export const MULTIPLIER_REFERENCES = [
  { value: 2, text: 'Alto volumen / descuento' },
  { value: 2.5, text: 'Volumen medio' },
  { value: 3, text: 'Mayorista' },
  { value: 3.5, text: 'Intermedio' },
  { value: 4, text: 'Minorista' },
  { value: 5, text: 'Llaveros / piezas chicas' },
];

// Recargo aplicado sobre los insumos extra declarados.
export const SUPPLIES_SURCHARGE = 0.3;

// Comisión + costos de publicar en MercadoLibre (editable desde la UI).
export const ML_FEE = 0.264336;

export const DEFAULT_FIXED = {
  filamentPricePerKg: 25000,
  kwhPrice: 140,
  printerModel: CUSTOM_PRINTER,
  printerWatts: 120,
  machineLifeHours: 4320,
  sparePartsCost: 150000,
  errorMarginPct: 5,
};

export const DEFAULT_PIECE = {
  printHours: 12.2,
  extraMinutes: 30,
  filamentGrams: 350,
  extraSupplies: 200,
};

export const DEFAULT_PROFILE = {
  id: 'default',
  name: 'Kobra 3 v2',
  currency: 'ARS',
  fixed: { ...DEFAULT_FIXED },
};
