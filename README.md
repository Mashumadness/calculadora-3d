# Calculadora 3D

Calculadora de costos y precio de venta para impresión 3D, con **exportación a `.xlsx`** para seguir trabajando en Google Sheets o Excel.

**Abrir la app:** https://mashumadness.github.io/calculadora-3d/

No hay que instalar nada: se abre en el navegador (celular o compu) y los datos quedan guardados en el dispositivo.

## Cómo se usa

1. En **Gastos fijos** cargá una vez los datos de tu impresora: precio del filamento por kilo, precio del kWh, consumo en watts, vida útil y costo de repuestos.
2. En **Pieza** poné los datos del print: horas, minutos adicionales, gramos de filamento e insumos extra.
3. Elegí el **multiplicador** según el tipo de venta (mayorista, minorista, etc.).
4. Mirá el **Total a cobrar** y el **Precio MercadoLibre**.
5. Apretá **Exportar a XLSX** para bajar la planilla.

Con **Guardar como producto** vas armando tu lista de productos, y con **Exportar todo** bajás una planilla con todos juntos.

## Qué calcula

| Concepto | Fórmula |
| --- | --- |
| Precio material | `precio filamento por kg / 1000 × gramos` |
| Precio luz | `watts / 1000 × horas totales × precio kWh` |
| Desgaste máquina | `costo repuestos / vida útil en horas × horas totales` |
| Margen de error | `(material + luz + desgaste) × margen de error %` |
| Costo total | `material + luz + desgaste + margen de error` |
| Insumos | `insumos extra × 1.30` |
| **Total a cobrar** | `costo total × multiplicador + insumos` |
| **Precio MercadoLibre** | `total a cobrar × (1 + comisión %)` |

`horas totales = horas de impresión + minutos adicionales / 60`

## La planilla exportada

Se descarga como `calculadora-3d_<producto>_<fecha>.xlsx` con tres hojas:

- **Cálculo** — todos los datos cargados (perfil, moneda, gastos fijos, pieza, margen y comisiones) más el desglose de resultados y métricas derivadas.
- **Productos** — una fila por producto guardado, con filtros y encabezado fijo.
- **Referencias** — tabla de multiplicadores y las fórmulas usadas.

Los inputs se guardan como valores y **los resultados como fórmulas vivas** que apuntan a esas celdas. Al abrir el archivo en Google Sheets podés cambiar, por ejemplo, el precio del filamento y todo se recalcula solo.

### Abrir en Google Sheets

Subir el archivo a Google Drive y abrirlo con Google Sheets, o desde Sheets usar *Archivo → Importar*.

## Notas

- Los perfiles, la pieza, el multiplicador y los productos se guardan en el navegador (`localStorage`).
- El selector de impresora autocompleta el consumo en watts; con `Otro / Personalizado` lo cargás a mano.
- La comisión de MercadoLibre es editable desde la UI (default 26,44%).
- Soporta ARS, USD, EUR, BRL, CLP y MXN.

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build de producción en dist/
npm run preview  # sirve el build
```

Stack: React + Vite + Tailwind CSS + SheetJS. El deploy a GitHub Pages es automático en cada push a `main`.
