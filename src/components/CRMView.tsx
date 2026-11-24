import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, User, Phone, Bell, Calendar, Clock, BarChart3,
  Search, Save, CheckCircle2, AlertCircle, Send, MessageSquare
} from 'lucide-react';
import { Affiliate, Appointment, CRMClient, CRMReminder } from '../types.ts';
import { DataService } from '../services/dataService.ts';

const N8N_BASE = 'https://n8n.bahiago.tech/webhook';

interface Props {
  affiliate: Affiliate;
  onUpdateAffiliate: (updated: Affiliate) => void;
}

type CRMTab = 'global' | 'individual' | 'reminders' | 'charts';

const deriveClientsFromAppointments = (appointments: Appointment[]): CRMClient[] => {
  const clientMap = new Map<string, CRMClient>();
  for (const apt of appointments) {
    const key = apt.clientPhone || apt.clientEmail || apt.clientName;
    if (!clientMap.has(key)) {
      clientMap.set(key, {
        id: `crm-${(apt.clientPhone || apt.clientName).replace(/\W/g, '')}`,
        affiliateId: apt.affiliateId,
        clientName: apt.clientName,
        clientPhone: apt.clientPhone,
        clientEmail: apt.clientEmail,
        serviceHistory: [],
        totalAppointments: 0,
        followupType: 'standard',
        maxRemindersPerMonth: 3,
        remindersSentThisMonth: 0,
        createdAt: apt.createdAt,
        updatedAt: apt.updatedAt,
      });
    }
    const client = clientMap.get(key)!;
    client.serviceHistory.push({
      serviceId: apt.id,
      serviceName: apt.serviceName,
      date: apt.date,
      price: apt.servicePrice,
      appointmentId: apt.id,
    });
    client.totalAppointments += 1;
    if (!client.lastVisit || apt.date > client.lastVisit) {
      client.lastVisit = apt.date;
    }
  }
  return Array.from(clientMap.values());
};

export const CRMView: React.FC<Props> = ({ affiliate }) => {
  const [activeTab, setActiveTab] = useState<CRMTab>('global');
  const [clients, setClients] = useState<CRMClient[]>([]);
  const [reminders, setReminders] = useState<CRMReminder[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedClient, setSelectedClient] = useState<CRMClient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Reminder form state
  const [remClientId, setRemClientId] = useState('');
  const [remMessage, setRemMessage] = useState('');
  const [remDateTime, setRemDateTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadCRM = async () => {
      const ds = DataService.getInstance();
      const [apts, savedClients, savedReminders] = await Promise.all([
        ds.getAppointments(affiliate.id),
        ds.getCRMClients(affiliate.id),
        ds.getCRMReminders(affiliate.id),
      ]);
      setAppointments(apts);
      setReminders(savedReminders);

      const derived = deriveClientsFromAppointments(apts);
      const mergedMap = new Map<string, CRMClient>();
      derived.forEach(c => mergedMap.set(c.id, c));
      savedClients.forEach(c => {
        const existing = mergedMap.get(c.id);
        mergedMap.set(c.id, existing ? { ...existing, ...c, serviceHistory: existing.serviceHistory } : c);
      });
      const list = Array.from(mergedMap.values());
      setClients(list);
      if (list.length > 0 && !remClientId) {
        setRemClientId(list[0].id);
      }
    };
    loadCRM();
  }, [affiliate.id]);

  const notify = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      c => c.clientName.toLowerCase().includes(q) || (c.clientPhone || '').toLowerCase().includes(q)
    );
  }, [clients, searchQuery]);

  const handleSaveClientProfile = async () => {
    if (!selectedClient) return;
    setIsSaving(true);
    try {
      await DataService.getInstance().saveCRMClient(selectedClient);
      setClients(prev => prev.map(c => c.id === selectedClient.id ? selectedClient : c));
      notify('success', '✅ Perfil del cliente actualizado.');
    } catch {
      notify('error', 'No se pudo guardar el perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === remClientId);
    if (!client || !remMessage.trim()) return;

    if (client.remindersSentThisMonth >= client.maxRemindersPerMonth) {
      notify('error', `Límite anti-invasivo alcanzado para ${client.clientName} (${client.remindersSentThisMonth}/${client.maxRemindersPerMonth} este mes).`);
      return;
    }

    setIsSaving(true);
    const reminder: CRMReminder = {
      id: `rem-${Date.now()}`,
      affiliateId: affiliate.id,
      clientId: client.id,
      clientName: client.clientName,
      clientPhone: client.clientPhone,
      message: remMessage.trim(),
      scheduledAt: remDateTime || new Date().toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    try {
      await DataService.getInstance().saveCRMReminder(reminder);
      fetch(`${N8N_BASE}/crm-recordatorio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliateId: affiliate.id,
          affiliatePhone: affiliate.phone,
          clientName: client.clientName,
          reminderMessage: reminder.message,
          scheduledAt: reminder.scheduledAt,
        }),
      }).catch(() => {});

      const updatedClient = {
        ...client,
        remindersSentThisMonth: client.remindersSentThisMonth + 1,
      };
      await DataService.getInstance().saveCRMClient(updatedClient);
      setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
      setReminders(prev => [reminder, ...prev]);
      setRemMessage('');
      notify('success', '🔔 Recordatorio programado para tu WhatsApp.');
    } catch {
      notify('error', 'Error al programar recordatorio.');
    } finally {
      setIsSaving(false);
    }
  };

  // Chart calculations
  const retentionRate = useMemo(() => {
    if (clients.length === 0) return 0;
    const returning = clients.filter(c => c.totalAppointments > 1).length;
    return Math.round((returning / clients.length) * 100);
  }, [clients]);

  const serviceBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    appointments.forEach(a => {
      counts[a.serviceName] = (counts[a.serviceName] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [appointments]);

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">CRM y Seguimiento WhatsApp</h2>
            <p className="text-xs text-gray-500">Historial global, límites anti-invasivos y recordatorios a tu WhatsApp ({affiliate.phone})</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'global', label: 'Historial Global', icon: <Users className="w-3.5 h-3.5" /> },
            { id: 'individual', label: 'Perfil Individual', icon: <User className="w-3.5 h-3.5" /> },
            { id: 'reminders', label: 'Recordatorios', icon: <Bell className="w-3.5 h-3.5" /> },
            { id: 'charts', label: 'Gráficas', icon: <BarChart3 className="w-3.5 h-3.5" /> },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as CRMTab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === t.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div className={`rounded-xl p-3.5 text-xs font-bold flex items-center gap-2 ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* TAB 1: GLOBAL */}
      {activeTab === 'global' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente por nombre o teléfono..."
              className="w-full bg-transparent text-xs focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] uppercase text-gray-400">
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">Teléfono</th>
                  <th className="py-2.5 px-3">Última Visita</th>
                  <th className="py-2.5 px-3">Citas</th>
                  <th className="py-2.5 px-3">Seguimiento</th>
                  <th className="py-2.5 px-3">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">No hay clientes registrados todavía.</td>
                  </tr>
                ) : filteredClients.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="py-3 px-3 font-bold text-gray-900">{c.clientName}</td>
                    <td className="py-3 px-3 text-gray-600">{c.clientPhone}</td>
                    <td className="py-3 px-3 text-gray-600">{c.lastVisit || '—'}</td>
                    <td className="py-3 px-3 font-bold text-indigo-600">{c.totalAppointments}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">
                        {c.followupType} ({c.remindersSentThisMonth}/{c.maxRemindersPerMonth})
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => { setSelectedClient(c); setActiveTab('individual'); }}
                        className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-[11px] font-bold"
                      >
                        Ver Perfil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INDIVIDUAL */}
      {activeTab === 'individual' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
          {!selectedClient ? (
            <p className="text-sm text-gray-500">Selecciona un cliente en el Historial Global para ver y editar su seguimiento.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedClient.clientName}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> {selectedClient.clientPhone} • {selectedClient.totalAppointments} citas registradas
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                  Recordatorios este mes: {selectedClient.remindersSentThisMonth} / {selectedClient.maxRemindersPerMonth}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Seguimiento (Anti-invasivo)</label>
                  <select
                    value={selectedClient.followupType}
                    onChange={e => setSelectedClient({ ...selectedClient, followupType: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs bg-white"
                  >
                    <option value="standard">Estándar (Seguimiento regular)</option>
                    <option value="vip">VIP (Atención prioritaria)</option>
                    <option value="minimal">Mínimo (Solo recordatorios esenciales)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Límite de recordatorios al mes ({selectedClient.maxRemindersPerMonth})
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={selectedClient.maxRemindersPerMonth}
                    onChange={e => setSelectedClient({ ...selectedClient, maxRemindersPerMonth: Number(e.target.value) })}
                    className="w-full mt-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Notas Privadas del Afiliado</label>
                <textarea
                  value={selectedClient.notes || ''}
                  onChange={e => setSelectedClient({ ...selectedClient, notes: e.target.value })}
                  rows={3}
                  placeholder="Preferencias, alergias, fechas clave..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                />
              </div>

              <button
                onClick={handleSaveClientProfile}
                disabled={isSaving}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Guardar Configuración CRM
              </button>

              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">Historial de Servicios</h4>
                <div className="space-y-2">
                  {selectedClient.serviceHistory.map((h, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 text-xs">
                      <span className="font-semibold text-gray-800">{h.serviceName}</span>
                      <span className="text-gray-500">{h.date} {h.price ? `• $${h.price} MXN` : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: REMINDERS */}
      {activeTab === 'reminders' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleCreateReminder} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" /> Programar Recordatorio a tu WhatsApp
            </h3>
            <p className="text-xs text-gray-500">
              Recibirás este recordatorio directamente en tu WhatsApp ({affiliate.phone}) para dar seguimiento oportuno sin invadir al cliente.
            </p>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Cliente</label>
              <select
                value={remClientId}
                onChange={e => setRemClientId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.clientName} ({c.remindersSentThisMonth}/{c.maxRemindersPerMonth} este mes)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Fecha y Hora</label>
              <input
                type="datetime-local"
                value={remDateTime}
                onChange={e => setRemDateTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mensaje del Recordatorio</label>
              <textarea
                value={remMessage}
                onChange={e => setRemMessage(e.target.value)}
                rows={3}
                required
                placeholder="Ej. Contactar para ofrecer cita de seguimiento mensual..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
              />
            </div>
            <button
              type="submit"
              disabled={isSaving || clients.length === 0}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" /> Programar Recordatorio WhatsApp
            </button>
          </form>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-gray-900">Recordatorios Programados ({reminders.length})</h3>
            {reminders.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No hay recordatorios programados.</p>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto">
                {reminders.map(r => (
                  <div key={r.id} className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-gray-900">{r.clientName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>{r.status}</span>
                    </div>
                    <p className="text-xs text-gray-600">{r.message}</p>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(r.scheduledAt).toLocaleString('es-MX')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CHARTS */}
      {activeTab === 'charts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <p className="text-xs text-gray-500 font-semibold">Clientes Únicos</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{clients.length}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <p className="text-xs text-gray-500 font-semibold">Tasa de Retención</p>
              <p className="text-3xl font-extrabold text-emerald-600 mt-1">{retentionRate}%</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <p className="text-xs text-gray-500 font-semibold">Recordatorios Programados</p>
              <p className="text-3xl font-extrabold text-indigo-600 mt-1">{reminders.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-gray-900">Servicios Más Demandados</h3>
            {serviceBreakdown.length === 0 ? (
              <p className="text-xs text-gray-400">Sin datos suficientes aún.</p>
            ) : (
              <div className="space-y-2.5">
                {serviceBreakdown.map(([name, count]) => {
                  const max = serviceBreakdown[0][1] || 1;
                  const pct = Math.round((count / max) * 100);
                  return (
                    <div key={name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-gray-800">{name}</span>
                        <span className="font-bold text-gray-600">{count} citas</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
