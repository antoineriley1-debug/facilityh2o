'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

function getSession() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find(c => c.trim().startsWith('facilityh2o_session='));
  if (!raw) return null;
  try { return JSON.parse(atob(decodeURIComponent(raw.split('=')[1]))); } catch { return null; }
}

function timeSince(iso) {
  if (!iso) return 'Never';
  const h = Math.floor((Date.now() - new Date(iso)) / 3600000);
  if (h < 1) return '< 1h ago';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function DashboardPage() {
  const [session, setSession] = useState(null);
  const [entries, setEntries] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = getSession();
    setSession(s);
    Promise.all([
      fetch('/api/entries').then(r => r.json()),
      fetch('/api/alerts').then(r => r.json()).catch(() => ({ alerts: [] })),
      fetch('/api/facilities').then(r => r.json()).catch(() => ({ facilities: [] })),
    ]).then(([ed, ad, fd]) => {
      setEntries(ed.entries || []);
      setAlerts(ad.alerts || []);
      setFacilities(fd.facilities || []);
      setLoading(false);
    });
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayEntries = entries.filter(e => e.date === today);
  const openAlerts = alerts.filter(a => !a.acknowledged);

  const getLastEntry = (facilityId) =>
    entries.filter(e => e.facilityId === facilityId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  const getLastPH = (facilityId, system) =>
    entries.filter(e => e.facilityId === facilityId && e.system === system)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]?.values?.ph;

  const getFacilityAlerts = (facilityId) => openAlerts.filter(a => a.facilityId === facilityId);

  const pHColor = (ph, system) => {
    if (ph == null) return 'text-gray-400';
    const [min, max] = system === 'boiler' ? [8.5, 10.5] : [7.5, 9.5];
    return ph >= min && ph <= max ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="flex min-h-screen bg-[#F0F9FF]">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            {session?.name && `Welcome, ${session.name.split(' ')[0]} · `}
            {facilities.length} facilit{facilities.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-cyan-100">
            <div className="text-3xl font-bold text-[#0891B2]">{todayEntries.length}</div>
            <div className="text-sm text-gray-500 mt-1">Entries Today</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-cyan-100">
            <div className="text-3xl font-bold text-gray-700">{entries.length}</div>
            <div className="text-sm text-gray-500 mt-1">Total Entries</div>
          </div>
          <div className={`bg-white rounded-2xl p-5 shadow-sm border ${openAlerts.length > 0 ? 'border-red-200' : 'border-cyan-100'}`}>
            <div className={`text-3xl font-bold ${openAlerts.length > 0 ? 'text-red-600' : 'text-green-600'}`}>{openAlerts.length}</div>
            <div className="text-sm text-gray-500 mt-1">Open Alerts</div>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading...</div>
        ) : facilities.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-cyan-100">
            <div className="text-5xl mb-4">🏢</div>
            <h3 className="font-bold text-gray-900 text-xl mb-2">No facilities yet</h3>
            <p className="text-gray-500 mb-6">Add your first facility to start logging water chemistry.</p>
            <Link href="/settings" className="bg-[#0891B2] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#0E7490] transition">
              Add Facility →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {facilities.map(f => {
              const last = getLastEntry(f.id);
              const boilerPH = getLastPH(f.id, 'boiler');
              const chilledPH = getLastPH(f.id, 'chilled');
              const facAlerts = getFacilityAlerts(f.id);
              const overdue = !last || (Date.now() - new Date(last.createdAt)) > 12 * 3600000;

              return (
                <div key={f.id} className={`bg-white rounded-2xl p-5 shadow-sm border hover:shadow-md transition-shadow ${overdue ? 'border-orange-200' : 'border-cyan-100'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-gray-900">{f.name}</div>
                      {f.address && <div className="text-xs text-gray-400 mt-0.5">{f.address}</div>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {facAlerts.length > 0 && (
                        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{facAlerts.length}⚠️</span>
                      )}
                      <span className={`text-xs ${overdue ? 'text-orange-500' : 'text-green-600'}`}>
                        {overdue ? '⚠️ Overdue' : '✅ Current'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <div className="text-xs text-gray-400">Boiler pH</div>
                      <div className={`font-bold text-lg ${pHColor(boilerPH, 'boiler')}`}>{boilerPH ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Chilled pH</div>
                      <div className={`font-bold text-lg ${pHColor(chilledPH, 'chilled')}`}>{chilledPH ?? '—'}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400">Last: {timeSince(last?.createdAt)}</span>
                    <Link href={`/entry?facility=${f.id}`} className="text-xs bg-[#0891B2] text-white px-3 py-1.5 rounded-lg hover:bg-[#0E7490] transition">
                      + Entry
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
