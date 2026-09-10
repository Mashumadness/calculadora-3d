import * as XLSX from 'xlsx';
import { MULTIPLIER_REFERENCES, SUPPLIES_SURCHARGE } from './constants.js';
import { calculate, toNumber } from './calc.js';

/* -------------------------------------------------------------------------- */
/* Helpers de celdas                                                          */
/* -------------------------------------------------------------------------- */

const MONEY_FMT = '#,##0.00';
const NUM_FMT = '#,##0.00';

const text = (value) => ({ v: value ?? '', t: 's' });
const num = (value, z = NUM_FMT) => ({ v: toNumber(value), t: 'n', z });
const money = (value) => num(value, MONEY_FMT);

/**
 * Celda con fórmula viva. SheetJS descarta las fórmulas que no traen un valor
 * cacheado, así que siempre guardamos el resultado ya calculado junto a `f`.
 * Google Sheets recalcula la fórmula al abrir el archivo.
 */
const formula = (f, cachedValue, z = MONEY_FMT) => ({
  t: 'n',
  v: toNumber(cachedValue),
  f,
  z,
});

function sanitizeFileName(name) {
  return (
    String(name || 'calculo')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_ ]/g, '')
      .trim()
      .replace(/\s+/g, '-') || 'calculo'
  );
}

function timestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(
    date.getHours()
  )}${pad(date.getMinutes())}`;
}

const safeDiv = (numerator, denominator) =>
  toNumber(denominator) > 0 ? toNumber(numerator) / toNumber(denominator) : 0;

/* -------------------------------------------------------------------------- */
/* Hoja principal: Cálculo                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Construye la hoja de detalle. Los inputs se escriben como valores y los
 * resultados como fórmulas que apuntan a esos inputs, así el archivo sigue
 * siendo editable en Google Sheets sin perder el cálculo.
 */
function buildDetailSheet({
  productName,
  profile,
  currency,
  fixed,
  piece,
  multiplier,
  mlFeePct,
  results,
}) {
  const cur = currency.code;
  const rows = [];
  const add = (cells) => rows.push(cells);

  // --- Encabezado
  add([text('CALCULADORA 3D')]);
  add([text('Detalle del cálculo de costos y precio sugerido')]);
  add([]);
  add([text('Producto'), text(productName || 'Sin nombre')]);
  add([text('Perfil'), text(profile.name)]);
  add([text('Moneda'), text(currency.label)]);
  add([text('Exportado'), text(new Date().toLocaleString(currency.locale))]);
  add([]);

  // --- Gastos fijos
  add([text('GASTOS FIJOS')]);
  const rFilament = rows.length + 1;
  add([text(`Precio del filamento (${cur}/kg)`), money(fixed.filamentPricePerKg)]);
  const rKwh = rows.length + 1;
  add([text(`Precio del kWh (${cur})`), money(fixed.kwhPrice)]);
  add([text('Modelo de impresora'), text(fixed.printerModel)]);
  const rWatts = rows.length + 1;
  add([text('Consumo de la impresora (W)'), num(fixed.printerWatts, '#,##0')]);
  const rLife = rows.length + 1;
  add([text('Vida útil de la máquina (horas)'), num(fixed.machineLifeHours, '#,##0')]);
  const rSpare = rows.length + 1;
  add([text(`Costo de repuestos (${cur})`), money(fixed.sparePartsCost)]);
  const rError = rows.length + 1;
  add([text('Margen de error (%)'), num(fixed.errorMarginPct, 'General')]);
  add([]);

  // --- Pieza
  add([text('PIEZA')]);
  const rHours = rows.length + 1;
  add([text('Horas de impresión'), num(piece.printHours, '0.00')]);
  const rMinutes = rows.length + 1;
  add([text('Minutos adicionales'), num(piece.extraMinutes, '#,##0')]);
  const rGrams = rows.length + 1;
  add([text('Gramos de filamento'), num(piece.filamentGrams, 'General')]);
  const rSupplies = rows.length + 1;
  add([text(`Insumos extra (${cur})`), money(piece.extraSupplies)]);
  const rTotalHours = rows.length + 1;
  add([
    text('Horas totales de máquina'),
    formula(`B${rHours}+B${rMinutes}/60`, results.totalHours, '0.00'),
  ]);
  add([]);

  // --- Margen y comisiones
  add([text('MARGEN Y COMISIONES')]);
  const rMultiplier = rows.length + 1;
  add([text('Multiplicador de ganancia'), num(multiplier, 'General')]);
  const rSurcharge = rows.length + 1;
  add([text('Recargo sobre insumos (%)'), num(SUPPLIES_SURCHARGE * 100, 'General')]);
  const rMlFee = rows.length + 1;
  add([text('Comisión MercadoLibre (%)'), num(mlFeePct, 'General')]);
  add([]);

  // --- Resultados (fórmulas vivas con valor cacheado)
  add([text('RESULTADOS'), text(`Importes en ${cur}`)]);
  const rMaterial = rows.length + 1;
  add([
    text('Precio material'),
    formula(`B${rFilament}/1000*B${rGrams}`, results.materialCost),
  ]);
  const rEnergy = rows.length + 1;
  add([
    text('Precio luz'),
    formula(`B${rWatts}/1000*B${rTotalHours}*B${rKwh}`, results.energyCost),
  ]);
  const rWear = rows.length + 1;
  add([
    text('Desgaste máquina'),
    formula(`IF(B${rLife}>0,B${rSpare}/B${rLife}*B${rTotalHours},0)`, results.wearCost),
  ]);
  const rBase = rows.length + 1;
  add([
    text('Subtotal costo directo'),
    formula(`SUM(B${rMaterial}:B${rWear})`, results.baseCost),
  ]);
  const rErrorCost = rows.length + 1;
  add([
    text('Margen de error'),
    formula(`B${rBase}*B${rError}/100`, results.errorCost),
  ]);
  const rTotalCost = rows.length + 1;
  add([
    text('Costo total (sin insumos)'),
    formula(`B${rBase}+B${rErrorCost}`, results.totalCost),
  ]);
  const rSuppliesCost = rows.length + 1;
  add([
    text(`Insumos (+${SUPPLIES_SURCHARGE * 100}%)`),
    formula(`B${rSupplies}*(1+B${rSurcharge}/100)`, results.suppliesCost),
  ]);
  const rProfit = rows.length + 1;
  add([
    text('Ganancia bruta'),
    formula(`B${rTotalCost}*B${rMultiplier}-B${rTotalCost}`, results.profit),
  ]);
  const rTotal = rows.length + 1;
  add([
    text('TOTAL A COBRAR'),
    formula(`B${rTotalCost}*B${rMultiplier}+B${rSuppliesCost}`, results.total),
  ]);
  const rMl = rows.length + 1;
  add([
    text('PRECIO MERCADOLIBRE'),
    formula(`B${rTotal}*(1+B${rMlFee}/100)`, results.mercadoLibrePrice),
  ]);
  add([]);

  // --- Métricas derivadas
  add([text('MÉTRICAS')]);
  add([
    text(`Costo por gramo de filamento (${cur})`),
    formula(`B${rFilament}/1000`, results.costPerGram, '#,##0.0000'),
  ]);
  add([
    text('kWh consumidos'),
    formula(`B${rWatts}/1000*B${rTotalHours}`, results.kwhConsumed, '0.000'),
  ]);
  add([
    text(`Desgaste por hora (${cur})`),
    formula(`IF(B${rLife}>0,B${rSpare}/B${rLife},0)`, results.wearPerHour),
  ]);
  add([
    text(`Costo total por hora (${cur})`),
    formula(
      `IF(B${rTotalHours}>0,B${rTotalCost}/B${rTotalHours},0)`,
      safeDiv(results.totalCost, results.totalHours)
    ),
  ]);
  add([
    text(`Precio de venta por gramo (${cur})`),
    formula(
      `IF(B${rGrams}>0,B${rTotal}/B${rGrams},0)`,
      safeDiv(results.total, piece.filamentGrams)
    ),
  ]);
  const realCost = results.totalCost + results.suppliesCost;
  add([
    text('Markup real sobre costo (%)'),
    formula(
      `IF(B${rTotalCost}+B${rSuppliesCost}>0,(B${rTotal}/(B${rTotalCost}+B${rSuppliesCost})-1)*100,0)`,
      realCost > 0 ? (results.total / realCost - 1) * 100 : 0,
      '0.00'
    ),
  ]);
  add([]);
  add([text('Nota'), text('Los resultados son fórmulas vivas: editá los inputs y se recalculan.')]);

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = [{ wch: 38 }, { wch: 22 }];
  return sheet;
}

/* -------------------------------------------------------------------------- */
/* Hoja de productos guardados                                                */
/* -------------------------------------------------------------------------- */

const PRODUCT_HEADERS = [
  'Producto',
  'Perfil',
  'Moneda',
  'Fecha',
  'Filamento /kg',
  'kWh',
  'Impresora',
  'Watts',
  'Vida útil (h)',
  'Repuestos',
  'Error (%)',
  'Horas',
  'Min. extra',
  'Gramos',
  'Insumos',
  'Multiplicador',
  'Horas totales',
  'Material',
  'Luz',
  'Desgaste',
  'Margen error',
  'Costo total',
  'Insumos c/recargo',
  'TOTAL A COBRAR',
  'Precio MercadoLibre',
];

function buildProductsSheet(products, mlFeePct) {
  const rows = [PRODUCT_HEADERS.map(text)];
  const feeRate = toNumber(mlFeePct) / 100;

  products.forEach((product, index) => {
    const r = index + 2; // fila real en la planilla
    const fixed = product.fixed ?? {};
    const piece = product.piece ?? {};
    const computed = calculate({ fixed, piece, multiplier: product.multiplier, mlFeePct });

    rows.push([
      text(product.name),
      text(product.profileName),
      text(product.currency),
      text(product.createdAt ? new Date(product.createdAt).toLocaleString() : ''),
      money(fixed.filamentPricePerKg),
      money(fixed.kwhPrice),
      text(fixed.printerModel),
      num(fixed.printerWatts, '#,##0'),
      num(fixed.machineLifeHours, '#,##0'),
      money(fixed.sparePartsCost),
      num(fixed.errorMarginPct, 'General'),
      num(piece.printHours, '0.00'),
      num(piece.extraMinutes, '#,##0'),
      num(piece.filamentGrams, 'General'),
      money(piece.extraSupplies),
      num(product.multiplier, 'General'),
      formula(`L${r}+M${r}/60`, computed.totalHours, '0.00'),
      formula(`E${r}/1000*N${r}`, computed.materialCost),
      formula(`H${r}/1000*Q${r}*F${r}`, computed.energyCost),
      formula(`IF(I${r}>0,J${r}/I${r}*Q${r},0)`, computed.wearCost),
      formula(`SUM(R${r}:T${r})*K${r}/100`, computed.errorCost),
      formula(`SUM(R${r}:U${r})`, computed.totalCost),
      formula(`O${r}*(1+${SUPPLIES_SURCHARGE})`, computed.suppliesCost),
      formula(`V${r}*P${r}+W${r}`, computed.total),
      formula(`X${r}*(1+${feeRate})`, computed.mercadoLibrePrice),
    ]);
  });

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = PRODUCT_HEADERS.map((header, index) => ({
    wch: index === 0 ? 26 : Math.max(12, header.length + 2),
  }));
  sheet['!autofilter'] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: Math.max(products.length, 1), c: PRODUCT_HEADERS.length - 1 },
    }),
  };
  sheet['!freeze'] = { xSplit: 1, ySplit: 1 };
  return sheet;
}

/* -------------------------------------------------------------------------- */
/* Hoja de referencias                                                        */
/* -------------------------------------------------------------------------- */

function buildReferenceSheet() {
  const rows = [
    [text('REFERENCIAS DE MULTIPLICADOR')],
    [text('Multiplicador'), text('Uso sugerido')],
    ...MULTIPLIER_REFERENCES.map((ref) => [num(ref.value, '0.0'), text(ref.text)]),
    [],
    [text('FÓRMULAS UTILIZADAS')],
    [text('Material'), text('precio filamento por kg / 1000 × gramos')],
    [text('Luz'), text('watts / 1000 × horas totales × precio kWh')],
    [text('Desgaste'), text('costo de repuestos / vida útil en horas × horas totales')],
    [text('Margen de error'), text('(material + luz + desgaste) × margen de error %')],
    [text('Costo total'), text('material + luz + desgaste + margen de error')],
    [text('Insumos'), text(`insumos extra × (1 + ${SUPPLIES_SURCHARGE * 100}%)`)],
    [text('Total a cobrar'), text('costo total × multiplicador + insumos')],
    [text('Precio MercadoLibre'), text('total a cobrar × (1 + comisión %)')],
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = [{ wch: 22 }, { wch: 58 }];
  return sheet;
}

/* -------------------------------------------------------------------------- */
/* API pública                                                                */
/* -------------------------------------------------------------------------- */

/** Exporta el cálculo actual (y opcionalmente los productos guardados) a .xlsx. */
export function exportToXlsx(payload) {
  const { productName, products = [], mlFeePct } = payload;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, buildDetailSheet(payload), 'Cálculo');
  if (products.length > 0) {
    XLSX.utils.book_append_sheet(workbook, buildProductsSheet(products, mlFeePct), 'Productos');
  }
  XLSX.utils.book_append_sheet(workbook, buildReferenceSheet(), 'Referencias');

  workbook.Props = {
    Title: `Calculadora 3D — ${productName || 'Cálculo'}`,
    Subject: 'Costos de impresión 3D',
    Author: 'Calculadora 3D',
    CreatedDate: new Date(),
  };

  const fileName = `calculadora-3d_${sanitizeFileName(productName)}_${timestamp()}.xlsx`;
  // writeFile dispara la descarga en el navegador.
  XLSX.writeFile(workbook, fileName, { bookType: 'xlsx', compression: true });
  return fileName;
}
