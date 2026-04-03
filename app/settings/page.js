'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';

function getSession() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find(c => c.trim().startsWith('facilityh2o_session='));
  if (!raw) return null;
  try { return JSON.parse(atob(decodeURIComponent(raw.split('=')[1]))); } catch { return null; }
}

const PLAN_LABELS = { starter: 'Starter — $49/mo', professional: 'Professional — $149/mo', enterprise: 'Enterprise — $299/mo' };

export default function SettingsPage() {
  const [session, setSession] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [showAddFacility, setShowAddFacility] = useState(false);
  const [newFacility, setNewFacility] = useState({ name: '', address: '', code: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    setSession(getSession());
    fetch('/api/facilities').then(r => r.json()).then(d => setFacilities(d.facilities || []));
  }, []);

  const addFacility = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/facilities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFacility),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      setFacilities(prev => [...prev, data.facility]);
      setNewFacility({ name: '', address: '', code: '' });
      setShowAddFacility(false);
      setMsg({ type: 'success', text: 'Facility added.' });
    } else {
      setMsg({ type: 'error', text: data.error });
    }
  };

  const handleUpgrade = async (plan) => {
    setUpgrading(true);
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    setUpgrading(false);
    if (data.url) window.location.href = data.url;
    else setMsg({ type: 'error', text: data.error || 'Billing unavailable.' });
  };

  return (
    <div className="flex min-h-screen bg-[#F0F9FF]">
      <Sidebar />
      <main className="flex-1 p-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

        {msg && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {msg.text}
          </div>
        )}

        {/* Account info */}
        <div className="bg-white rounded-2xl shadow-sm border border-cyan-100 p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">Account</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400 mb-0.5">Name</div>
              <div className="font-medium text-gray-800">{session?.name}</div>
            </div>
            <div>
              <div className="text-gray-400 mb-0.5">Role</div>
              <div className="font-medium text-gray-800 capitalize">{session?.role}</div>
            </div>
          </div>
        </div>

        {/* Billing */}
        <div className="bg-white rounded-2xl shadow-sm border border-cyan-100 p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">Billing & Plan</h2>
          <div className="text-sm text-gray-600 mb-4">
            Current plan: <span className="font-semibold text-[#0891B2]">Free Trial</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {['starter', 'professional', 'enterprise'].map(plan => (
              <button key={plan} onClick={() => handleUpgrade(plan)} disabled={upgrading} className="border border-[#0891B2] text-[#0891B2] text-sm px-3 py-2 rounded-xl hover:bg-cyan-50 transition disabled:opacity-50 capitalize font-medium">
                {plan === 'starter' ? 'Starter $49' : plan === 'professional' ? 'Pro $149' : 'Enterprise $299'}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">Billing powered by Stripe. Cancel anytime.</p>
        </div>

        {/* Facilities */}
        <div className="bg-white rounded-2xl shadow-sm border border-cyan-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Facilities</h2>
            <button onClick={() => setShowAddFacility(!showAddFacility)} className="text-sm bg-[#0891B2] text-white px-4 py-2 rounded-xl hover:bg-[#0E7490] transition">
              {showAddFacility ? '✕ Cancel' : '+ Add Facility'}
            </button>
          </div>

          {showAddFacility && (
            <form onSubmit={addFacility} className="bg-cyan-50 rounded-xl p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Facility Name *</label>
                  <input type="text" required value={newFacility.name} onChange={e => setNewFacility(p => ({ ...p, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]" placeholder="Main Campus" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Code</label>
                  <input type="text" value={newFacility.code} onChange={e => setNewFacility(p => ({ ...p, code: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]" placeholder="MC" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                <input type="text" value={newFacility.address} onChange={e => setNewFacility(p => ({ ...p, address: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]" placeholder="123 Main St, City, ST 00000" />
              </div>
              <button type="submit" disabled={saving} className="bg-[#0891B2] text-white text-sm px-5 py-2 rounded-lg font-medium hover:bg-[#0E7490] transition disabled:opacity-60">
                {saving ? 'Saving...' : 'Add Facility'}
              </button>
            </form>
          )}

          {facilities.length === 0 ? (
            <div className="text-sm text-gray-400 py-4 text-center">No facilities added yet.</div>
          ) : (
            <div className="space-y-2">
              {facilities.map(f => (
                <div key={f.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl text-sm">
                  <div>
                    <span className="font-medium text-gray-800">{f.name}</span>
                    {f.code && <span className="text-gray-400 ml-2 text-xs">({f.code})</span>}
                    {f.address && <div className="text-xs text-gray-400 mt-0.5">📍 {f.address}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
