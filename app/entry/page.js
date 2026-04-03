'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

const BOILER = [
  { key: 'ph', label: 'pH', unit: '', min: 8.5, max: 10.5 },
  { key: 'phosphate', label: 'Phosphate', unit: 'ppm', min: 20, max: 60 },
  { key: 'sulfite', label: 'Sulfite', unit: 'ppm', min: 20, max: 80 },
  { key: 'hardness', label: 'Hardness', unit: 'ppm', min: 0, max: 5 },
  { key: 'conductivity', label: 'Conductivity', unit: 'µS/cm', min: 0, max: 3500 },
  { key: 'alkalinity', label: 'Alkalinity', unit: 'ppm', min: 100, max: 700 },
  { key: 'tds', label: 'TDS', unit: 'ppm', min: 0, max: 3000 },
  { key: 'amine', label: 'Amine', unit: 'ppm', min: 0, max: 10 },
];
const CHILLED = [
  { key: 'ph', label: 'pH', unit: '', min: 7.5, max: 9.5 },
  { key: 'conductivity', label: 'Conductivity', unit: 'µS/cm', min: 0, max: 2000 },
  { key: 'inhibitor', label: 'Inhibitor', unit: 'ppm', min: 50, max: 300 },
  { key: 'hardness', label: 'Hardness', unit: 'ppm', min: 0, max: 200 },
  { key: 'iron', label: 'Iron', unit: 'ppm', min: 0, max: 2 },
  { key: 'tds', label: 'TDS', unit: 'ppm', min: 0, max: 2000 },
  { key: 'molybdate', label: 'Molybdate', unit: 'ppm', min: 5, max: 30 },
  { key: 'bacteria', label: 'Bacteria', unit: 'CFU/mL', min: 0, max: 1000 },
];

function getSession() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find(c => c.trim().startsWith('facilityh2o_session='));
  if (!raw) return null;
  try { return JSON.parse(atob(decodeURIComponent(raw.split('=')[1]))); } catch { return null; }
}

function EntryForm() {
  const searchParams = useSearchParams();
  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  const [facilities, setFacilities] = useState([]);
  const [facilityId, setFacilityId] = useState(searchParams.get('facility') || '');
  const [system, setSystem] = useState('boiler');
  const [shift, setShift] = useState('Day');
  const [date, setDate] = useState(today);
  const [time, setTime] = useState(nowTime);
  const [testerName, setTesterName] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [values, setValues] = useState({});
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const s = getSession();
    if (s) setOperatorName(s.name);
    fetch('/api/facilities').then(r => r.json()).then(d => setFacilities(d.facilities || []));
  }, []);

  const fields = system === 'boiler' ? BOILER : CHILLED;
  const allFilled = facilityId && operatorName && testerName && time && fields.every(f => values[f.key] !== undefined && values[f.key] !== '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilityId, system, shift, date, time, testerName, operatorName, values, notes }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setValues({});
        setNotes('');
        setTimeout(() => setSuccess(false), 4000);
      } else setError(data.error || 'Failed to save.');
    } catch { setError('Network error.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="flex min-h-screen bg-[#F0F9FF]">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">New Chemistry Entry</h1>
          <p className="text-gray-500 text-sm mb-8">Log a water chemistry reading for your shift</p>

          {success && <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl mb-6 font-medium">✅ Entry saved successfully!</div>}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-cyan-100 p-6 space-y-6">
            {/* Facility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Facility</label>
              <select value={facilityId} onChange={e => setFacilityId(e.target.value)} required className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]">
                <option value="">Select facility...</option>
                {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>

            {/* System + Shift + Date */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">System</label>
                {[['boiler', '🔥 Boiler'], ['chilled', '❄️ Chilled']].map(([v, l]) => (
                  <label key={v} className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input type="radio" name="system" value={v} checked={system === v} onChange={() => { setSystem(v); setValues({}); }} className="accent-[#0891B2]" />
                    <span className="text-sm">{l}</span>
                  </label>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Shift</label>
                {['Day', 'Evening', 'Night'].map(s => (
                  <label key={s} className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input type="radio" name="shift" value={s} checked={shift === s} onChange={() => setShift(s)} className="accent-[#0891B2]" />
                    <span className="text-sm">{s}</span>
                  </label>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} max={today} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]" />
              </div>
            </div>

            {/* Time + Tester */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Time of Reading</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)} required className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tester Name</label>
                <input type="text" value={testerName} onChange={e => setTesterName(e.target.value)} required placeholder="Who ran the test" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]" />
              </div>
            </div>

            {/* Logged by */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Logged By</label>
              <input type="text" value={operatorName} onChange={e => setOperatorName(e.target.value)} required className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]" />
            </div>

            {/* Chemistry fields */}
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-3">{system === 'boiler' ? '🔥 Boiler' : '❄️ Chilled'} Chemistry Values</div>
              <div className="grid grid-cols-2 gap-3">
                {fields.map(f => {
                  const val = values[f.key] ?? '';
                  const n = parseFloat(val);
                  const inRange = val !== '' ? (!isNaN(n) && n >= f.min && n <= f.max) : null;
                  return (
                    <div key={f.key}>
                      <label className="flex items-center justify-between text-xs font-medium text-gray-600 mb-1">
                        <span>{f.label}{f.unit ? ` (${f.unit})` : ''}</span>
                        <span className="text-gray-400">{f.min}–{f.max}</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number" step="any" value={val} required placeholder="—"
                          onChange={e => setValues(p => ({ ...p, [f.key]: e.target.value }))}
                          className={`flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2] ${inRange === null ? 'border-gray-300' : inRange ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'}`}
                        />
                        <span className="w-5 text-center">{inRange === null ? '' : inRange ? '🟢' : '🔴'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Observations, corrective actions..." className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2] resize-none" />
            </div>

            <button type="submit" disabled={!allFilled || submitting} className="w-full bg-[#0891B2] hover:bg-[#0E7490] text-white font-semibold py-3 rounded-xl text-sm transition disabled:opacity-40">
              {submitting ? 'Saving...' : 'Submit Entry'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function EntryPage() {
  return <Suspense fallback={null}><EntryForm /></Suspense>;
}
