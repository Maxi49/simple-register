import type {
  Alumno,
  AppDataSnapshot,
  Donacion,
  Familia,
  Joven,
  Ropa,
  RopaTemporada,
} from '@/db/database';

const xlsx: any = require('xlsx');

export type ExportSnapshot = {
  ropa: Ropa[];
  jovenes: Joven[];
  alumnos: Alumno[];
  familias: Familia[];
  donaciones: Donacion[];
};

const SHEET_NAMES = {
  ropa: 'Ropa',
  jovenes: 'Jovenes',
  alumnos: 'Alumnos',
  familias: 'Familias',
  donaciones: 'Donaciones',
} as const;

const normaliseRecord = (row: Record<string, unknown>) => {
  const normalised: Record<string, unknown> = {};
  Object.entries(row).forEach(([key, value]) => {
    normalised[key.toLowerCase()] = value;
  });
  return normalised;
};

const toNumber = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toId = (value: unknown) => {
  const parsed = toNumber(value);
  if (parsed === null) {
    return undefined;
  }
  const rounded = Math.trunc(parsed);
  return rounded > 0 ? rounded : undefined;
};

const toText = (value: unknown) => value === null || value === undefined ? '' : String(value).trim();

type RopaSnapshotRow = AppDataSnapshot['ropa'][number];
type PersonSnapshotRow = AppDataSnapshot['jovenes'][number];
type FamiliaSnapshotRow = AppDataSnapshot['familias'][number];
type DonacionSnapshotRow = AppDataSnapshot['donaciones'][number];

const readSheet = (workbook: any, name: string): Record<string, unknown>[] => {
  const sheet = workbook.Sheets[name];
  if (!sheet) {
    return [];
  }
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: null }) as Record<string, unknown>[];
  return rows.map(normaliseRecord);
};

export const parseSnapshotFromExcel = (base64: string): AppDataSnapshot => {
  const workbook = xlsx.read(base64, { type: 'base64' });

  const ropa: RopaSnapshotRow[] = [];
  for (const row of readSheet(workbook, SHEET_NAMES.ropa)) {
    const cantidad = toNumber(row.cantidad);
    if (cantidad === null) {
      continue;
    }
    const tipoRaw = toText(row.tipo).toLowerCase();
    const tipo: RopaTemporada = tipoRaw === 'verano' ? 'verano' : 'invierno';
    const talle = toText(row.talle);
    if (!talle) {
      continue;
    }
    ropa.push({
      id: toId(row.id),
      cantidad,
      tipo,
      talle,
    });
  }

  const parsePersonSheet = (name: string): PersonSnapshotRow[] => {
    const result: PersonSnapshotRow[] = [];
    for (const row of readSheet(workbook, name)) {
      const nombre = toText(row.nombre);
      const apellido = toText(row.apellido);
      if (!nombre || !apellido) {
        continue;
      }
      result.push({
        id: toId(row.id),
        nombre,
        apellido,
      });
    }
    return result;
  };

  const jovenes = parsePersonSheet(SHEET_NAMES.jovenes);
  const alumnos = parsePersonSheet(SHEET_NAMES.alumnos);
  const parseFamiliaSheet = (): FamiliaSnapshotRow[] => {
    const result: FamiliaSnapshotRow[] = [];
    for (const row of readSheet(workbook, SHEET_NAMES.familias)) {
      const apellido = toText(row.apellido);
      const miembros = toNumber(row.miembros);
      if (!apellido || miembros === null) {
        continue;
      }
      result.push({
        id: toId(row.id),
        apellido,
        miembros,
      });
    }
    return result;
  };
  const familias = parseFamiliaSheet();

  const donaciones: DonacionSnapshotRow[] = [];
  for (const row of readSheet(workbook, SHEET_NAMES.donaciones)) {
    const tipo = toText(row.tipo);
    const cantidad = toNumber(row.cantidad);
    if (!tipo || cantidad === null) {
      continue;
    }
    donaciones.push({
      id: toId(row.id),
      tipo,
      cantidad,
    });
  }

  return { ropa, jovenes, alumnos, familias, donaciones };
};
const toSheet = <T extends Record<string, unknown>>(data: T[], headers: string[]) => {
  if (data.length === 0) {
    return xlsx.utils.aoa_to_sheet([headers]);
  }
  const ordered = data.map(item => {
    const result: Record<string, unknown> = {};
    headers.forEach(header => {
      result[header] = item[header];
    });
    return result;
  });
  return xlsx.utils.json_to_sheet(ordered, { header: headers });
};

export const buildExcelFromSnapshot = (snapshot: ExportSnapshot): string => {
  const workbook = xlsx.utils.book_new();

  xlsx.utils.book_append_sheet(
    workbook,
    toSheet(
      snapshot.ropa.map(item => ({
        id: item.id,
        cantidad: item.cantidad,
        tipo: item.tipo,
        talle: item.talle,
      })),
      ['id', 'cantidad', 'tipo', 'talle']
    ),
    SHEET_NAMES.ropa
  );

  const mapPersonSheet = (data: { id: number; nombre: string; apellido: string }[]) =>
    toSheet(
      data.map(item => ({
        id: item.id,
        nombre: item.nombre,
        apellido: item.apellido,
      })),
      ['id', 'nombre', 'apellido']
    );

  xlsx.utils.book_append_sheet(
    workbook,
    mapPersonSheet(snapshot.jovenes),
    SHEET_NAMES.jovenes
  );
  xlsx.utils.book_append_sheet(
    workbook,
    mapPersonSheet(snapshot.alumnos),
    SHEET_NAMES.alumnos
  );
  xlsx.utils.book_append_sheet(
    workbook,
    toSheet(
      snapshot.familias.map(item => ({
        id: item.id,
        apellido: item.apellido,
        miembros: item.miembros,
      })),
      ['id', 'apellido', 'miembros']
    ),
    SHEET_NAMES.familias
  );

  xlsx.utils.book_append_sheet(
    workbook,
    toSheet(
      snapshot.donaciones.map(item => ({
        id: item.id,
        tipo: item.tipo,
        cantidad: item.cantidad,
      })),
      ['id', 'tipo', 'cantidad']
    ),
    SHEET_NAMES.donaciones
  );

  return xlsx.write(workbook, { type: 'base64', bookType: 'xlsx' });
};

export const EXCEL_TEMPLATE_INFO = {
  sheetNames: SHEET_NAMES,
  columns: {
    ropa: ['id', 'cantidad', 'tipo', 'talle'],
    jovenes: ['id', 'nombre', 'apellido'],
    alumnos: ['id', 'nombre', 'apellido'],
    familias: ['id', 'apellido', 'miembros'],
    donaciones: ['id', 'tipo', 'cantidad'],
  },
};

