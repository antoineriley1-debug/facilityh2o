'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';

const BOILER_F = [{key:'ph',label:'pH',min:8.5,max:10.5},{key:'phosphate',label:'Phosphate',min:20,max:60},{key:'sulfite',label:'Sulfite',min:20,max:80},{key:'hardness',label:'Hardness',min:0,max:5},{key:'conductivity',label:'Conductivity',min:0,max:3500},{key:'alkalinity',label:'Alkalinity',min:100,max:700},{key:'tds',label:'TDS',min:0,max:3000},{key:'amine',label:'Amine',min:0,max:10}];
const CHILLED_F = [{key:'ph',label:'pH',min:7.5,max:9.5},{key:'conductivity',label:'Conductivity',min:0,max:2000},{key:'inhibitor',label:'Inhibitor',min:50,max:300},{key:'hardness',label:'Hardness',min:0,max:200},{key:'iron',label:'Iron',min:0,max:2},{key:'tds',label:'TDS',min:0,max:2000},{key:'molybdate',label:'Molybdate',min:5,max:30},{key:'bacteria',label:'Bacteria',min:0,max:1000}];

export default function HistoryPage() {
  const [entries, setEntries] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [filterFacility, setFilterFacility] = useState('');
  const [filterSystem, setFilterSystem] = useState('');
  const [filterShift, setFilterShift] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/entries').then(r => r.json()),
      fetch('/api/facilities').then(r => r.json()),
    ]).then(([ed, fd]) => {
      setEntries(ed.entries || []);
      setFacilities(fd.facilities || []);
      setLoading(false);
    });
  }, []);

  const facName = id => facilities.find(f => f.id === id)?.name || id;
  const countOOR = e => {
    const fields = e.system === 'boiler' ? BOILER_F : CHILLED_F;
    return fields.filter(f => { const v = parseFloat(e.values?.[f.key]); return !isNaN(v) && (v < f.min || v > f.max); }).length;
  };

  const filtered = entries
    .filter(e => !filterFacility || e.facilityId === filterFacility)
    .filter(e => !filterSystem || e.system === filterSystem)
    .filter(e => !filterShift || e.shift === filterShift);

  const exportCSV = () => {
    const rows = [['Date','Time','Shift','Facility','System','Tester','Logged By','pH','OOR','Notes']];
    filtered.forEach(e => rows.push([e.date,e.time||'',e.shift,facName(e.facilityId),e.system,e.testerName||'',e.operatorName,e.values?.ph??'',countOOR(e),e.notes||'']));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = `history-${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  return (
    <div className="flex min-h-screen bg-[#F0F9FF]">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div><h1 className="text-2xl font-bold text-gray-900">Entry History</h1><p className="text-gray-500 text-sm mt-1">{filtered.length} entries</p></div>
          <button onClick={exportCSV} className="bg-[#164E63] text-white text-sm px-4 py-2 rounded-xl hover:bg-[#0E7490] transition">⬇️ Export CSV</button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-cyan-100 p-4 mb-6 flex flex-wrap gap-3">
          <select value={filterFacility} onChange={e => setFilterFacility(e.target.value)} className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]">
            <option value="">All Facilities</option>
            {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select value={filterSystem} onChange={e => setFilterSystem(e.target.value)} className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]">
            <option value="">All Systems</option>
            <option value="boiler">🔥 Boiler</option>
            <option value="chilled">❄️ Chilled</option>
          </select>
          <select value={filterShift} onChange={e => setFilterShift(e.target.value)} className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]">
            <option value="">All Shifts</option>
            <option>Day</option><option>Evening</option><option>Night</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-cyan-100 overflow-hidden">
          {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : filtered.length === 0 ? <div className="p-8 text-center text-gray-400">No entries found.</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>{['Date','Time','Shift','Facility','System','Tester','Logged By','pH','OOR',''].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(e => {
                    const oor = countOOR(e);
                    const isExp = expanded === e.id;
                    const fields = e.system === 'boiler' ? BOILER_F : CHILLED_F;
                    return (
                      <>
                        <tr key={e.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                          <td className="px-4 py-3 text-gray-700">{e.date}</td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-500">{e.time||'—'}</td>
                          <td className="px-4 py-3 text-gray-600">{e.shift}</td>
                          <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">{facName(e.facilityId)}</td>
                          <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${e.system==='boiler'?'bg-orange-100 text-orange-700':'bg-blue-100 text-blue-700'}`}>{e.system==='boiler'?'🔥 Boiler':'❄️ Chilled'}</span></td>
                          <td className="px-4 py-3 text-gray-700">{e.testerName||'—'}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{e.operatorName}</td>
                          <td className="px-4 py-3 font-semibold"><span className={parseFloat(e.values?.ph)>=7.5&&parseFloat(e.values?.ph)<=10.5?'text-green-600':'text-red-600'}>{e.values?.ph??'—'}</span></td>
                          <td className="px-4 py-3">{oor>0?<span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{oor} OOR</span>:<span className="text-xs text-green-600">✅ OK</span>}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{isExp?'▲':'▼'}</td>
                        </tr>
                        {isExp && (
                          <tr key={`${e.id}-exp`} className="bg-gray-50">
                            <td colSpan={10} className="px-6 py-4">
                              <div className="grid grid-cols-4 gap-2 mb-2">
                                {fields.map(f => {
                                  const val = e.values?.[f.key]; const n = parseFloat(val); const ok = !isNaN(n)&&n>=f.min&&n<=f.max;
                                  return <div key={f.key} className={`p-2 rounded-lg text-xs border ${ok?'bg-green-50 border-green-200':'bg-red-50 border-red-200'}`}><div className="text-gray-500">{f.label}</div><div className={`font-bold mt-0.5 ${ok?'text-green-700':'text-red-700'}`}>{val??'—'} {ok?'🟢':'🔴'}</div></div>;
                                })}
                              </div>
                              {e.notes && <div className="text-xs text-gray-600 bg-white rounded-lg px-3 py-2 border"><span className="font-medium">Notes:</span> {e.notes}</div>}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
