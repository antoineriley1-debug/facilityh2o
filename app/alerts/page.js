'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('unacknowledged');

  useEffect(() => {
    Promise.all([
      fetch('/api/alerts').then(r => r.json()),
      fetch('/api/facilities').then(r => r.json()),
    ]).then(([ad, fd]) => {
      setAlerts(ad.alerts || []);
      setFacilities(fd.facilities || []);
      setLoading(false);
    });
  }, []);

  const facName = id => facilities.find(f => f.id === id)?.name || id;

  const acknowledge = async (id) => {
    await fetch('/api/alerts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  const filtered = alerts.filter(a => filter === 'all' ? true : filter === 'acknowledged' ? a.acknowledged : !a.acknowledged);
  const unreadCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <div className="flex min-h-screen bg-[#F0F9FF]">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">⚠️ Alerts</h1>
          <p className="text-gray-500 text-sm mt-1">{unreadCount} open · {alerts.length} total</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-cyan-100 p-4 mb-6 flex gap-3">
          {[['unacknowledged','Open'],['acknowledged','Reviewed'],['all','All']].map(([val,label]) => (
            <button key={val} onClick={() => setFilter(val)} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${filter===val?'bg-[#0891B2] text-white':'text-gray-600 hover:bg-gray-100'}`}>{label}</button>
          ))}
        </div>

        <div className="space-y-3">
          {loading ? <div className="bg-white rounded-2xl p-8 text-center text-gray-400">Loading...</div> :
           filtered.length === 0 ? <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm border border-cyan-100">{filter==='unacknowledged'?'✅ No open alerts':'No alerts found.'}</div> :
           filtered.map(a => (
            <div key={a.id} className={`bg-white rounded-2xl shadow-sm border p-5 ${a.acknowledged?'border-gray-100 opacity-60':'border-red-200'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">{facName(a.facilityId)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.system==='boiler'?'bg-orange-100 text-orange-700':'bg-blue-100 text-blue-700'}`}>{a.system==='boiler'?'🔥 Boiler':'❄️ Chilled'}</span>
                    <span className="text-xs text-gray-500">{a.shift} · {a.date}</span>
                  </div>
                  <div className="text-sm text-gray-500 mb-3">Tester: <span className="font-medium text-gray-700">{a.testerName || a.operatorName}</span></div>
                  <div className="flex flex-wrap gap-2">
                    {(a.outOfRange||[]).map(oor => (
                      <div key={oor.param} className="bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 text-xs">
                        <span className="font-semibold text-red-700">{oor.label}</span>
                        <span className="text-red-500 ml-1">{oor.value} (range: {oor.min}–{oor.max})</span>
                      </div>
                    ))}
                  </div>
                </div>
                {!a.acknowledged && (
                  <button onClick={() => acknowledge(a.id)} className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-2 rounded-xl transition">✓ Acknowledge</button>
                )}
                {a.acknowledged && <span className="text-xs text-green-600 font-medium flex-shrink-0">✅ Reviewed</span>}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
