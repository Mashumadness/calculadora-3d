import { SUPPLIES_SURCHARGE } from './constants.js';

/** Convierte cualquier entrada de formulario a número seguro. */
export function toNumber(value) {
  if (value === '' || value === null || value === undefined) return 0;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Calcula el costo real de una impresión y el precio sugerido de venta.
 *
 * Desglose:
 *   material   = precioFilamentoPorKg / 1000 * gramos
 *   luz        = watts / 1000 * horasTotales * precioKwh
 *   desgaste   = costoRepuestos / vidaUtilHoras * horasTotales
 *   error      = (material + luz + desgaste) * margenError%
 *   costoTotal = material + luz + desgaste + error         (sin insumos)
 *   insumos    = insumosExtra * (1 + recargo)
 *   total      = costoTotal * multiplicador + insumos
 *   ml         = total * (1 + comisionML%)
 */
export function calculate({ fixed, piece, multiplier, mlFeePct }) {
  const filamentPricePerKg = toNumber(fixed.filamentPricePerKg);
  const kwhPrice = toNumber(fixed.kwhPrice);
  const printerWatts = toNumber(fixed.printerWatts);
  const machineLifeHours = toNumber(fixed.machineLifeHours);
  const sparePartsCost = toNumber(fixed.sparePartsCost);
  const errorMarginPct = toNumber(fixed.errorMarginPct);

  const printHours = toNumber(piece.printHours);
  const extraMinutes = toNumber(piece.extraMinutes);
  const filamentGrams = toNumber(piece.filamentGrams);
  const extraSupplies = toNumber(piece.extraSupplies);

  const totalHours = printHours + extraMinutes / 60;

  const materialCost = (filamentPricePerKg / 1000) * filamentGrams;
  const energyCost = (printerWatts / 1000) * totalHours * kwhPrice;
  const wearCost = machineLifeHours > 0 ? (sparePartsCost / machineLifeHours) * totalHours : 0;

  const baseCost = materialCost + energyCost + wearCost;
  const errorCost = baseCost * (errorMarginPct / 100);

  const totalCost = baseCost + errorCost;
  const suppliesCost = extraSupplies * (1 + SUPPLIES_SURCHARGE);

  const safeMultiplier = toNumber(multiplier) || 1;
  const total = totalCost * safeMultiplier + suppliesCost;
  const mercadoLibrePrice = total * (1 + toNumber(mlFeePct) / 100);

  const profit = total - totalCost - suppliesCost;

  return {
    totalHours,
    materialCost,
    energyCost,
    wearCost,
    errorCost,
    baseCost,
    totalCost,
    suppliesCost,
    total,
    mercadoLibrePrice,
    profit,
    multiplier: safeMultiplier,
    kwhConsumed: (printerWatts / 1000) * totalHours,
    wearPerHour: machineLifeHours > 0 ? sparePartsCost / machineLifeHours : 0,
    costPerGram: filamentPricePerKg / 1000,
  };
}

/** Formatea un importe con el símbolo y la localización de la moneda elegida. */
export function formatMoney(amount, currency) {
  const value = Number.isFinite(amount) ? amount : 0;
  return `${currency.symbol} ${value.toLocaleString(currency.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
