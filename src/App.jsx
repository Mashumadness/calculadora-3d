import React, { useEffect, useMemo, useState } from 'react';
import {
  CURRENCIES,
  CUSTOM_PRINTER,
  DEFAULT_FIXED,
  DEFAULT_PIECE,
  DEFAULT_PROFILE,
  ML_FEE,
  MULTIPLIERS,
  MULTIPLIER_REFERENCES,
  PRINTERS,
  SUPPLIES_SURCHARGE,
} from './lib/constants.js';
import { calculate, formatMoney } from './lib/calc.js';
import { exportToXlsx } from './lib/export.js';
import { useLocalStorage } from './lib/useLocalStorage.js';
import {
  Card,
  Field,
  Highlight,
  Icon,
  NumberInput,
  Row,
  Select,
  TextInput,
} from './components/ui.jsx';

export default function App() {
  const [profiles, setProfiles] = useLocalStorage('c3d:profiles', [DEFAULT_PROFILE]);
  const [activeProfileId, setActiveProfileId] = useLocalStorage('c3d:activeProfile', DEFAULT_PROFILE.id);
  const [piece, setPiece] = useLocalStorage('c3d:piece', DEFAULT_PIECE);
  const [multiplier, setMultiplier] = useLocalStorage('c3d:multiplier', 3);
  const [mlFeePct, setMlFeePct] = useLocalStorage('c3d:mlFee', ML_FEE * 100);
  const [products, setProducts] = useLocalStorage('c3d:products', []);
  const [productName, setProductName] = useState('');
  const [toast, setToast] = useState(null);

  const activeProfile =
    profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0] ?? DEFAULT_PROFILE;
  const fixed = { ...DEFAULT_FIXED, ...activeProfile.fixed };
  const currency =
    CURRENCIES.find((item) => item.code === activeProfile.currency) ?? CURRENCIES[0];

  const results = useMemo(
    () => calculate({ fixed, piece, multiplier, mlFeePct }),
    [fixed, piece, multiplier, mlFeePct]
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const notify = (message, tone = 'ok') => setToast({ message, tone });

  /* ------------------------------- mutadores ------------------------------ */

  const patchProfile = (patch) =>
    setProfiles((current) =>
      current.map((profile) =>
        profile.id === activeProfile.id ? { ...profile, ...patch } : profile
      )
    );

  const setFixedField = (key, value) =>
    patchProfile({ fixed: { ...fixed, [key]: value } });

  const setPieceField = (key, value) => setPiece((current) => ({ ...current, [key]: value }));

  const handlePrinterChange = (model) => {
    const printer = PRINTERS.find((item) => item.model === model);
    patchProfile({
      fixed: {
        ...fixed,
        printerModel: model,
        printerWatts: printer?.watts ?? fixed.printerWatts,
      },
    });
  };

  const addProfile = () => {
    const name = window.prompt('Nombre del nuevo perfil:', 'Nueva impresora');
    if (!name?.trim()) return;
    const profile = {
      id: `p-${Date.now()}`,
      name: name.trim(),
      currency: activeProfile.currency,
      fixed: { ...fixed },
    };
    setProfiles((current) => [...current, profile]);
    setActiveProfileId(profile.id);
    notify(`Perfil "${profile.name}" creado.`);
  };

  const deleteProfile = () => {
    if (profiles.length <= 1) {
      notify('Tiene que quedar al menos un perfil.', 'warn');
      return;
    }
    if (!window.confirm(`¿Eliminar el perfil "${activeProfile.name}"?`)) return;
    const remaining = profiles.filter((profile) => profile.id !== activeProfile.id);
    setProfiles(remaining);
    setActiveProfileId(remaining[0].id);
    notify('Perfil eliminado.');
  };

  const renameProfile = () => {
    const name = window.prompt('Nuevo nombre del perfil:', activeProfile.name);
    if (!name?.trim()) return;
    patchProfile({ name: name.trim() });
    notify('Perfil actualizado.');
  };

  const saveProduct = () => {
    const name = window.prompt('Nombre del producto:', productName || 'Producto sin nombre');
    if (!name?.trim()) return;
    const product = {
      id: `prod-${Date.now()}`,
      name: name.trim(),
      profileName: activeProfile.name,
      currency: currency.code,
      createdAt: new Date().toISOString(),
      fixed: { ...fixed },
      piece: { ...piece },
      multiplier,
      total: results.total,
      mercadoLibrePrice: results.mercadoLibrePrice,
    };
    setProducts((current) => [...current, product]);
    setProductName(product.name);
    notify(`"${product.name}" guardado en la lista de productos.`);
  };

  const loadProduct = (product) => {
    setPiece({ ...product.piece });
    setMultiplier(product.multiplier);
    setProductName(product.name);
    notify(`"${product.name}" cargado.`);
  };

  const deleteProduct = (id) =>
    setProducts((current) => current.filter((product) => product.id !== id));

  const handleExport = (includeProducts) => {
    try {
      const fileName = exportToXlsx({
        productName: productName || 'Calculo',
        profile: activeProfile,
        currency,
        fixed,
        piece,
        multiplier,
        mlFeePct,
        results,
        products: includeProducts ? products : [],
      });
      notify(`Descargado: ${fileName}`);
    } catch (error) {
      console.error(error);
      notify('No se pudo generar el archivo .xlsx', 'warn');
    }
  };

  const fmt = (value) => formatMoney(value, currency);

  /* --------------------------------- render ------------------------------- */

  return (
    <div className="min-h-screen bg-ink-950 bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(229,56,59,0.10),transparent)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Calculadora <span className="text-brand-500">3D</span>
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              Calculá el costo real de tus impresiones y el precio sugerido de venta.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-excel" onClick={() => handleExport(false)}>
              <Icon name="download" />
              Exportar a XLSX
            </button>
            <button
              className="btn-ghost"
              onClick={() => handleExport(true)}
              disabled={products.length === 0}
              title="Incluye la hoja con todos los productos guardados"
            >
              <Icon name="sheet" />
              Exportar todo ({products.length})
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ----------------------------- Izquierda ---------------------------- */}
          <div className="space-y-6 lg:col-span-2">
            <Card
              title="Perfil"
              actions={
                <div className="flex items-center gap-2">
                  <button className="chip inline-flex items-center gap-1" onClick={addProfile}>
                    <Icon name="plus" className="h-3.5 w-3.5" />
                    Nuevo
                  </button>
                  <button
                    className="rounded-lg p-2 text-brand-500 transition hover:bg-brand-600/15"
                    onClick={deleteProfile}
                    aria-label="Eliminar perfil"
                  >
                    <Icon name="trash" />
                  </button>
                </div>
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Perfil activo">
                  <Select
                    value={activeProfile.id}
                    onChange={setActiveProfileId}
                    options={profiles.map((profile) => ({
                      value: profile.id,
                      label: profile.name,
                    }))}
                  />
                </Field>
                <Field label="Moneda">
                  <Select
                    value={activeProfile.currency}
                    onChange={(code) => patchProfile({ currency: code })}
                    options={CURRENCIES.map((item) => ({ value: item.code, label: item.label }))}
                  />
                </Field>
              </div>
              <button className="btn-primary mt-4 w-full" onClick={renameProfile}>
                <Icon name="refresh" />
                Actualizar perfil
              </button>
            </Card>

            <Card title="Gastos fijos">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={`Precio del filamento (${currency.code}/kg)`}>
                  <NumberInput
                    value={fixed.filamentPricePerKg}
                    onChange={(value) => setFixedField('filamentPricePerKg', value)}
                  />
                </Field>
                <Field label={`Precio del kWh (${currency.code})`}>
                  <NumberInput
                    value={fixed.kwhPrice}
                    onChange={(value) => setFixedField('kwhPrice', value)}
                  />
                </Field>
                <Field
                  label="Modelo de impresora"
                  hint={`Elegí tu modelo y autocompletamos el consumo (W). Si no está en la lista, dejá "${CUSTOM_PRINTER}".`}
                >
                  <Select
                    value={fixed.printerModel}
                    onChange={handlePrinterChange}
                    options={PRINTERS.map((printer) => ({
                      value: printer.model,
                      label: printer.watts ? `${printer.model} — ${printer.watts} W` : printer.model,
                    }))}
                  />
                </Field>
                <Field
                  label="Consumo de la impresora (W)"
                  hint="Consumo promedio durante un print (no peak). Si no lo sabés, ~100 W es un buen default."
                >
                  <NumberInput
                    value={fixed.printerWatts}
                    onChange={(value) => setFixedField('printerWatts', value)}
                  />
                </Field>
                <Field label="Vida útil de la máquina (horas)">
                  <NumberInput
                    value={fixed.machineLifeHours}
                    onChange={(value) => setFixedField('machineLifeHours', value)}
                  />
                </Field>
                <Field label={`Costo de repuestos (${currency.code})`}>
                  <NumberInput
                    value={fixed.sparePartsCost}
                    onChange={(value) => setFixedField('sparePartsCost', value)}
                  />
                </Field>
                <Field label="Margen de error (%)">
                  <NumberInput
                    value={fixed.errorMarginPct}
                    onChange={(value) => setFixedField('errorMarginPct', value)}
                  />
                </Field>
                <Field label="Comisión MercadoLibre (%)">
                  <NumberInput value={mlFeePct} onChange={setMlFeePct} />
                </Field>
              </div>
            </Card>

            <Card title="Pieza">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre del producto">
                  <TextInput
                    value={productName}
                    onChange={setProductName}
                    placeholder="Ej: Maceta hexagonal grande"
                  />
                </Field>
                <Field label="Horas de impresión">
                  <NumberInput
                    value={piece.printHours}
                    onChange={(value) => setPieceField('printHours', value)}
                    step="0.01"
                  />
                </Field>
                <Field label="Minutos adicionales">
                  <NumberInput
                    value={piece.extraMinutes}
                    onChange={(value) => setPieceField('extraMinutes', value)}
                  />
                </Field>
                <Field label="Gramos de filamento">
                  <NumberInput
                    value={piece.filamentGrams}
                    onChange={(value) => setPieceField('filamentGrams', value)}
                  />
                </Field>
                <Field label={`Insumos extra (${currency.code})`}>
                  <NumberInput
                    value={piece.extraSupplies}
                    onChange={(value) => setPieceField('extraSupplies', value)}
                  />
                </Field>
              </div>
              <p className="mt-4 text-xs text-neutral-500">
                Tiempo total de máquina:{' '}
                <span className="font-semibold text-neutral-300">
                  {results.totalHours.toFixed(2)} h
                </span>
              </p>
            </Card>

            {products.length > 0 && (
              <Card title={`Productos guardados (${products.length})`}>
                <ul className="divide-y divide-white/5">
                  {products.map((product) => (
                    <li key={product.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-neutral-500">
                          {product.profileName} · {product.piece.filamentGrams} g ·{' '}
                          {product.piece.printHours} h · x{product.multiplier}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-semibold tabular-nums text-neutral-200">
                          {formatMoney(
                            product.total,
                            CURRENCIES.find((c) => c.code === product.currency) ?? currency
                          )}
                        </span>
                        <button className="chip" onClick={() => loadProduct(product)}>
                          Cargar
                        </button>
                        <button
                          className="rounded-lg p-1.5 text-brand-500 transition hover:bg-brand-600/15"
                          onClick={() => deleteProduct(product.id)}
                          aria-label={`Eliminar ${product.name}`}
                        >
                          <Icon name="trash" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* ------------------------------ Derecha ----------------------------- */}
          <div className="space-y-6">
            <Card title="Margen de ganancia">
              <p className="label">Multiplicador</p>
              <div className="grid grid-cols-3 gap-2">
                {MULTIPLIERS.map((value) => (
                  <button
                    key={value}
                    className={`chip ${Number(multiplier) === value ? 'chip-active' : ''}`}
                    onClick={() => setMultiplier(value)}
                  >
                    x{value}
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <Field
                  label="Personalizado"
                  hint="Si necesitás otro valor, ingresalo acá (ej: 2.8)."
                >
                  <NumberInput value={multiplier} onChange={setMultiplier} step="0.1" min={0} />
                </Field>
              </div>
              <div className="mt-4 rounded-xl border border-white/5 bg-ink-850 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  ✳ Referencias
                </p>
                <ul className="space-y-1 text-xs text-neutral-500">
                  {MULTIPLIER_REFERENCES.map((ref) => (
                    <li key={ref.value}>
                      <span className="font-semibold text-neutral-300">
                        x{ref.value.toFixed(1)}
                      </span>{' '}
                      → {ref.text}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            <Card title="Resultados" accent>
              <Row label="Precio material" value={fmt(results.materialCost)} />
              <Row label="Precio luz" value={fmt(results.energyCost)} />
              <Row label="Desgaste máquina" value={fmt(results.wearCost)} />
              <Row label="Margen de error" value={fmt(results.errorCost)} />
              <div className="my-2 h-px bg-white/5" />
              <Row label="Costo total (sin insumos)" value={fmt(results.totalCost)} strong />
              <Row
                label={`Insumos (+${SUPPLIES_SURCHARGE * 100}%)`}
                value={fmt(results.suppliesCost)}
              />
              <Row label="Ganancia bruta" value={fmt(results.profit)} />
              <div className="mt-4 space-y-3">
                <Highlight label="Total a cobrar" value={fmt(results.total)} />
                <Highlight
                  label="Precio MercadoLibre"
                  value={fmt(results.mercadoLibrePrice)}
                  tone="gold"
                />
              </div>
              <div className="mt-4 space-y-2">
                <button className="btn-ghost w-full" onClick={saveProduct}>
                  <Icon name="save" />
                  Guardar como producto
                </button>
                <button className="btn-excel w-full" onClick={() => handleExport(false)}>
                  <Icon name="download" />
                  Descargar .xlsx
                </button>
              </div>
              <p className="mt-3 text-[11px] leading-snug text-neutral-500">
                El .xlsx incluye todos los datos cargados y los resultados como fórmulas vivas, así
                podés seguir trabajando en Google Sheets.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border px-4 py-3 text-sm shadow-card ${
            toast.tone === 'warn'
              ? 'border-amber-500/40 bg-amber-950 text-amber-200'
              : 'border-emerald-500/40 bg-emerald-950 text-emerald-200'
          }`}
          role="status"
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
