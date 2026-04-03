'use client';
import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

const PARAMS = {
  boiler: [{key:'ph',label:'pH',min:8.5,max:10.5},{key:'phosphate',label:'Phosphate',min:20,max:60},{key:'sulfite',label:'Sulfite',min:20,max:80},{key:'hardness',label:'Hardness',min:0,max:5},{key:'conductivity',label:'Conductivity',min:0,max:3500},{key:'alkalinity',label:'Alkalinity',min:100,max:700},{key:'tds',label:'TDS',min:0,max:3000},{key:'amine',label:'Amine',min:0,max:10}],
  chilled: [{key:'ph',label:'pH',min:7.5,max:9.5},{key:'conductivity',label:'Conductivity',min:0,max:2000},{key:'inhibitor',label:'Inhibitor',min:50,max:300},{key:'hardness',label:'Hardness',min:0,max:200},{key:'iron',label:'Iron',min:0,max:2},{key:'tds',label:'TDS',min:0,max:2000},{key:'molybdate',label:'Molybdate',min:5,max:30},{key:'bacteria',label:'Bacteria',min:0,max:1000}],
};

function daysAgo(n) { const d = new Date(); d.setDate(d.getDate()-n); return d.toISOString().split('T')[0]; }

export default function TrendsPage() {
  const [entries, setEntries] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [facility, setFacility] = useState('');
  const [system, setSystem] = useState('boiler');
  const [param, setParam] = useState('ph');
  const [range, setRange] = useState('30');

  useEffect(() => {
    Promise.all([
      fetch('/api/entries').then(r => r.json()),
      fetch('/api/facilities').then(r => r.json()),
    ]).then(([ed, fd]) => {
      setEntries(ed.entries || []);
      const facs = fd.facilities || [];
      setFacilities(facs);
      if (facs.length > 0) setFacility(facs[0].id);
      setLoading(false);
    });
  }, []);

  const params = PARAMS[system] || [];
  const currentParam = params.find(p => p.key === param) || params[0];

  const chartData = useMemo(() => {
    const cutoff = daysAgo(parseInt(range));
    return entries.filter(e => e.facilityId === facility && e.system === system && e.date >= cutoff && e.values?.[param] !== undefined)
      .sort((a,b) => new Date(a.createdAt)-new Date(b.createdAt))
      .map(e => ({ date: e.date, value: parseFloat(e.values[param]) }));
  }, [entries, facility, system, param, range]);

  const stats = useMemo(() => {
    if (!chartData.length || !currentParam) return null;
    const vals = chartData.map(d => d.value);
    const oor = vals.filter(v => v < currentParam.min || v > currentParam.max).length;
    return { avg: (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2), min: Math.min(...vals).toFixed(2), max: Math.max(...vals).toFixed(2), oor, compliance: (((vals.length-oor)/vals.length)*100).toFixed(1), count: vals.length };
  }, [chartData, currentParam]);

  return (
    <div className="flex min-h-screen bg-[#F0F9FF]">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Trend Analysis</h1>

        <div className="bg-white rounded-2xl shadow-sm border border-cyan-100 p-4 mb-6 flex flex-wrap gap-3">
          <select value={facility} onChange={e => setFacility(e.target.value)} className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]">
            {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select value={system} onChange={e => { setSystem(e.target.value); setParam(PARAMS[e.target.value][0].key); }} className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]">
            <option value="boiler">🔥 Boiler</option>
            <option value="chilled">❄️ Chilled</option>
          </select>
          <select value={param} onChange={e => setParam(e.target.value)} className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]">
            {params.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <select value={range} onChange={e => setRange(e.target.value)} className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]">
            <option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option><option value="180">6 months</option><option value="365">1 year</option><option value="730">2 years</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-cyan-100 p-6 mb-6">
          {loading || chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400">{loading ? 'Loading...' : 'No data for selected filters'}</div>
          ) : (
            <>
              <div className="font-semibold text-gray-800 mb-4">{currentParam?.label} — {facilities.find(f=>f.id===facility)?.name}</div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{fontSize:11}} />
                  <YAxis tick={{fontSize:11}} />
                  <Tooltip />
                  {currentParam && <>
                    <ReferenceLine y={currentParam.min} stroke="#ef4444" strokeDasharray="5 5" label={{value:`Min ${currentParam.min}`,fill:'#ef4444',fontSize:10}} />
                    <ReferenceLine y={currentParam.max} stroke="#ef4444" strokeDasharray="5 5" label={{value:`Max ${currentParam.max}`,fill:'#ef4444',fontSize:10}} />
                  </>}
                  <Line type="monotone" dataKey="value" stroke="#0891B2" strokeWidth={2} dot={(p) => {
                    const ok = currentParam && p.payload.value >= currentParam.min && p.payload.value <= currentParam.max;
                    return <circle key={p.cx} cx={p.cx} cy={p.cy} r={4} fill={ok?'#16a34a':'#dc2626'} stroke="white" strokeWidth={2} />;
                  }} />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </div>

        {stats && (
          <div className="grid grid-cols-5 gap-4">
            {[['Average',stats.avg],['Minimum',stats.min],['Maximum',stats.max],[`Out of Range`,`${stats.oor}/${stats.count}`,stats.oor>0],[`% Compliant`,`${stats.compliance}%`,parseFloat(stats.compliance)<90]].map(([l,v,warn]) => (
              <div key={l} className="bg-white rounded-2xl p-4 shadow-sm border border-cyan-100 text-center">
                <div className="text-xs text-gray-500 mb-1">{l}</div>
                <div className={`text-xl font-bold ${warn?'text-red-600':'text-gray-800'}`}>{v}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
