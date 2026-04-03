export const CHEMISTRY_RANGES = {
  boiler: {
    ph:           { min: 8.5,  max: 10.5, label: 'pH',           unit: '' },
    phosphate:    { min: 20,   max: 60,   label: 'Phosphate',    unit: 'ppm' },
    sulfite:      { min: 20,   max: 80,   label: 'Sulfite',      unit: 'ppm' },
    hardness:     { min: 0,    max: 5,    label: 'Hardness',     unit: 'ppm' },
    conductivity: { min: 0,    max: 3500, label: 'Conductivity', unit: 'µS/cm' },
    alkalinity:   { min: 100,  max: 700,  label: 'Alkalinity',   unit: 'ppm' },
    tds:          { min: 0,    max: 3000, label: 'TDS',          unit: 'ppm' },
    amine:        { min: 0,    max: 10,   label: 'Amine',        unit: 'ppm' },
  },
  chilled: {
    ph:           { min: 7.5,  max: 9.5,  label: 'pH',           unit: '' },
    conductivity: { min: 0,    max: 2000, label: 'Conductivity', unit: 'µS/cm' },
    inhibitor:    { min: 50,   max: 300,  label: 'Inhibitor',    unit: 'ppm' },
    hardness:     { min: 0,    max: 200,  label: 'Hardness',     unit: 'ppm' },
    iron:         { min: 0,    max: 2,    label: 'Iron',         unit: 'ppm' },
    tds:          { min: 0,    max: 2000, label: 'TDS',          unit: 'ppm' },
    molybdate:    { min: 5,    max: 30,   label: 'Molybdate',    unit: 'ppm' },
    bacteria:     { min: 0,    max: 1000, label: 'Bacteria',     unit: 'CFU/mL' },
  },
};

export function checkReadings(systemType, readings) {
  const ranges = CHEMISTRY_RANGES[systemType];
  if (!ranges) return [];
  const outOfRange = [];
  for (const [param, range] of Object.entries(ranges)) {
    const value = readings[param];
    if (value === undefined || value === null || value === '') continue;
    const num = parseFloat(value);
    if (isNaN(num)) continue;
    if (num < range.min || num > range.max) {
      outOfRange.push({
        parameter: param,
        value: num,
        min: range.min,
        max: range.max,
        label: range.label,
        unit: range.unit,
      });
    }
  }
  return outOfRange;
}

export function getStatusColor(systemType, param, value) {
  const ranges = CHEMISTRY_RANGES[systemType];
  if (!ranges || !ranges[param]) return 'text-gray-600';
  const { min, max } = ranges[param];
  const num = parseFloat(value);
  if (isNaN(num)) return 'text-gray-400';
  if (num < min || num > max) return 'text-red-600 font-semibold';
  return 'text-green-700';
}
