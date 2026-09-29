import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  Calendar as CalendarIcon,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Filter,
  ArrowUpRight,
  Wallet,
  ShieldCheck,
  Download,
  CreditCard,
  Layers,
  Sparkles
} from 'lucide-react';
import { Appointment } from '../types';

export type AccountStatusFilter = 'all' | 'confirmed' | 'completed' | 'pending' | 'cancelled';
export type DateRangeFilter = 'september_2026' | 'last_14_days' | 'next_14_days' | 'all_time';

interface Props {
  appointments: Appointment[];
  affiliateName: string;
  monthlyMessagesLimit?: number;
}

export const AffiliateAnalyticsCharts: React.FC<Props> = ({
  appointments,
  affiliateName
}) => {
  const [statusFilter, setStatusFilter] = useState<AccountStatusFilter>('all');
  const [rangeFilter, setRangeFilter] = useState<DateRangeFilter>('september_2026');
  const [chartViewMode, setChartViewMode] = useState<'appointments' | 'revenue'>('appointments');

  // Base date reference (September 2026)
  const referenceDateStr = '2026-09-22';

  // 1. Filter appointments by selected date range
  const rangeFilteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (rangeFilter === 'all_time') return true;

      const aptDate = apt.date; // YYYY-MM-DD
      if (rangeFilter === 'september_2026') {
        return aptDate.startsWith('2026-09');
      }
      if (rangeFilter === 'last_14_days') {
        // Between Sept 08 and Sept 22
        return aptDate >= '2026-09-08' && aptDate <= referenceDateStr;
      }
      if (rangeFilter === 'next_14_days') {
        // Between Sept 22 and Oct 06
        return aptDate >= referenceDateStr && aptDate <= '2026-10-06';
      }
      return true;
    });
  }, [appointments, rangeFilter]);

  // 2. Filter by Account Status (Estado de Cuenta)
  const filteredAppointments = useMemo(() => {
    if (statusFilter === 'all') return rangeFilteredAppointments;
    return rangeFilteredAppointments.filter((apt) => apt.status === statusFilter);
  }, [rangeFilteredAppointments, statusFilter]);

  // 3. Overall Financial and Appointment KPIs
  const financialSummary = useMemo(() => {
    let totalGrossBilled = 0;
    let totalPaidCollected = 0;
    let totalPendingAmount = 0;
    let totalRefunded = 0;
    let totalRetainedCompensations = 0;

    rangeFilteredAppointments.forEach((apt) => {
      const price = apt.paidAmount || apt.servicePrice || 0;
      totalGrossBilled += price;

      if (apt.status === 'completed' || (apt.status === 'confirmed' && apt.paymentStatus === 'paid')) {
        totalPaidCollected += price;
      } else if (apt.status === 'pending') {
        totalPendingAmount += price;
      } else if (apt.status === 'cancelled') {
        // Under our anti-drop policy: cancellation with >24h refunds 50% and clinic retains 50%
        const refund = apt.refundAmount || price * 0.5;
        const retained = price - refund;
        totalRefunded += refund;
        totalRetainedCompensations += retained;
        totalPaidCollected += retained;
      }
    });

    // Projected Monthly Income:
    // Current collected + confirmed future bookings in the month + daily run-rate projection
    const daysInMonth = 30;
    const currentDayOfMonth = 22; // Sept 22, 2026
    const dailyAverage = totalPaidCollected > 0 ? totalPaidCollected / currentDayOfMonth : 0;
    const projectedRunRate = dailyAverage * daysInMonth;

    // Direct future scheduled confirmed bookings
    const futureConfirmedRevenue = rangeFilteredAppointments
      .filter((a) => a.date > referenceDateStr && a.status === 'confirmed')
      .reduce((sum, a) => sum + (a.paidAmount || a.servicePrice || 0), 0);

    const projectedMonthlyTotal = Math.max(
      totalPaidCollected + futureConfirmedRevenue,
      Math.round(projectedRunRate)
    );

    // Selected filter specific metrics
    const filteredCount = filteredAppointments.length;
    const filteredRevenue = filteredAppointments.reduce((sum, apt) => {
      if (apt.status === 'cancelled') {
        return sum + (apt.paidAmount - (apt.refundAmount || apt.paidAmount * 0.5));
      }
      return sum + (apt.paidAmount || apt.servicePrice || 0);
    }, 0);

    const averageTicket = filteredCount > 0 ? Math.round(filteredRevenue / filteredCount) : 0;

    return {
      totalGrossBilled,
      totalPaidCollected,
      totalPendingAmount,
      totalRefunded,
      totalRetainedCompensations,
      projectedMonthlyTotal,
      projectedRunRate: Math.round(projectedRunRate),
      filteredCount,
      filteredRevenue,
      averageTicket
    };
  }, [rangeFilteredAppointments, filteredAppointments]);

  // 4. Daily Appointments Trend Dataset (Recharts format)
  const dailyTrendData = useMemo(() => {
    // Collect all unique dates from rangeFilteredAppointments
    const dateMap = new Map<
      string,
      {
        dateKey: string;
        dateLabel: string;
        total: number;
        completed: number;
        confirmed: number;
        pending: number;
        cancelled: number;
        revenue: number;
      }
    >();

    // Seed dates for September to ensure smooth curve
    const seedDates = [
      '2026-09-15',
      '2026-09-16',
      '2026-09-17',
      '2026-09-18',
      '2026-09-19',
      '2026-09-20',
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
      '2026-09-24',
      '2026-09-25',
      '2026-09-26',
      '2026-09-28'
    ];

    seedDates.forEach((d) => {
      const parts = d.split('-');
      const day = parts[2];
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const monthStr = months[parseInt(parts[1], 10) - 1];
      dateMap.set(d, {
        dateKey: d,
        dateLabel: `${day} ${monthStr}`,
        total: 0,
        completed: 0,
        confirmed: 0,
        pending: 0,
        cancelled: 0,
        revenue: 0
      });
    });

    // Populate with filtered appointments
    filteredAppointments.forEach((apt) => {
      if (!apt.date) return;
      let entry = dateMap.get(apt.date);
      if (!entry) {
        const parts = apt.date.split('-');
        const day = parts[2] || apt.date;
        entry = {
          dateKey: apt.date,
          dateLabel: `${day} Sep`,
          total: 0,
          completed: 0,
          confirmed: 0,
          pending: 0,
          cancelled: 0,
          revenue: 0
        };
        dateMap.set(apt.date, entry);
      }

      entry.total += 1;
      if (apt.status === 'completed') entry.completed += 1;
      if (apt.status === 'confirmed') entry.confirmed += 1;
      if (apt.status === 'pending') entry.pending += 1;
      if (apt.status === 'cancelled') entry.cancelled += 1;

      const amt =
        apt.status === 'cancelled'
          ? apt.paidAmount - (apt.refundAmount || apt.paidAmount * 0.5)
          : apt.paidAmount || apt.servicePrice || 0;
      entry.revenue += amt;
    });

    return Array.from(dateMap.values()).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  }, [filteredAppointments]);

  // 5. Projected Weekly and Monthly Revenue Data (Recharts format)
  const projectedRevenueChartData = useMemo(() => {
    // 4 Weeks of the month + Final Proj
    return [
      {
        period: 'Sem 1 (1-7)',
        cobrado: 2600,
        proyectado: 2600,
        citas: 4,
        acumulado: 2600
      },
      {
        period: 'Sem 2 (8-14)',
        cobrado: 3250,
        proyectado: 3250,
        citas: 5,
        acumulado: 5850
      },
      {
        period: 'Sem 3 (15-21)',
        cobrado: 4400,
        proyectado: 4400,
        citas: 6,
        acumulado: 10250
      },
      {
        period: 'Sem 4 (22-28)',
        cobrado: 2850,
        proyectado: 4750, // Citas ya agendadas y en curso
        citas: 5,
        acumulado: 15000
      },
      {
        period: 'Cierre Proyectado',
        cobrado: 0,
        proyectado: 3800, // Estimación últimos días
        citas: 4,
        acumulado: 18800
      }
    ];
  }, []);

  // 6. Payment method distribution for the filtered appointments
  const paymentMethodData = useMemo(() => {
    const methods: Record<string, number> = {
      mercadopago: 0,
      tarjeta: 0,
      spei: 0
    };

    filteredAppointments.forEach((apt) => {
      const m = apt.paymentMethod || 'tarjeta';
      methods[m] = (methods[m] || 0) + (apt.paidAmount || apt.servicePrice || 0);
    });

    return [
      { name: 'Mercado Pago', value: methods.mercadopago, color: '#009ee3' },
      { name: 'Tarjeta Débito/Crédito', value: methods.tarjeta, color: '#10b981' },
      { name: 'SPEI Interbancario', value: methods.spei, color: '#6366f1' }
    ].filter((item) => item.value > 0);
  }, [filteredAppointments]);

  // Status counts for pills
  const statusCounts = useMemo(() => {
    const counts = {
      all: rangeFilteredAppointments.length,
      confirmed: 0,
      completed: 0,
      pending: 0,
      cancelled: 0
    };

    rangeFilteredAppointments.forEach((apt) => {
      if (apt.status in counts) {
        counts[apt.status as keyof typeof counts] += 1;
      }
    });

    return counts;
  }, [rangeFilteredAppointments]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Filter Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Métricas en Vivo</span>
              </span>
              <span className="text-xs text-slate-500 font-medium">{affiliateName}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Tendencia de Citas e Ingreso Mensual Proyectado
            </h2>
            <p className="text-xs text-slate-600">
              Analítica dinámica con estados de cuenta transaccionales y cobro 100% anticipado.
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center space-x-2 shrink-0">
            <CalendarIcon className="w-4 h-4 text-slate-500" />
            <select
              id="analytics-range-selector"
              value={rangeFilter}
              onChange={(e) => setRangeFilter(e.target.value as DateRangeFilter)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="september_2026">Mes en Curso (Septiembre 2026)</option>
              <option value="last_14_days">Últimos 14 Días</option>
              <option value="next_14_days">Próximos 14 Días (Proyección)</option>
              <option value="all_time">Todo el Historial</option>
            </select>
          </div>
        </div>

        {/* ACCOUNT STATUS FILTERS (Estados de Cuenta) */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-xs font-bold text-slate-700">Estado de Cuenta:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="filter-status-all"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Todos los Estados</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  statusFilter === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {statusCounts.all}
              </span>
            </button>

            <button
              id="filter-status-confirmed"
              onClick={() => setStatusFilter('confirmed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                statusFilter === 'confirmed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Confirmadas (Pagadas)</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  statusFilter === 'confirmed' ? 'bg-emerald-800 text-white' : 'bg-emerald-200/80 text-emerald-900'
                }`}
              >
                {statusCounts.confirmed}
              </span>
            </button>

            <button
              id="filter-status-completed"
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                statusFilter === 'completed'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200/60'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />
              <span>Completadas</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  statusFilter === 'completed' ? 'bg-sky-800 text-white' : 'bg-sky-200/80 text-sky-900'
                }`}
              >
                {statusCounts.completed}
              </span>
            </button>

            <button
              id="filter-status-pending"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Pendientes</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  statusFilter === 'pending' ? 'bg-amber-700 text-white' : 'bg-amber-200/80 text-amber-900'
                }`}
              >
                {statusCounts.pending}
              </span>
            </button>

            <button
              id="filter-status-cancelled"
              onClick={() => setStatusFilter('cancelled')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                statusFilter === 'cancelled'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
              }`}
            >
              <XCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>Canceladas</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  statusFilter === 'cancelled' ? 'bg-rose-800 text-white' : 'bg-rose-200/80 text-rose-900'
                }`}
              >
                {statusCounts.cancelled}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Financial & Account Statement Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ingreso Proyectado Fin de Mes */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-300 text-xs">
            <span>Ingreso Proyectado Mes</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            ${financialSummary.projectedMonthlyTotal.toLocaleString('es-MX')}
            <span className="text-xs font-normal text-slate-300 ml-1">MXN</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-300 mt-2 pt-2 border-t border-slate-700">
            <span>Run-rate diario:</span>
            <span className="font-mono text-emerald-300 font-bold">
              ${financialSummary.projectedRunRate.toLocaleString('es-MX')} MXN/mes
            </span>
          </div>
        </div>

        {/* KPI 2: Ingreso Cobrado 100% Anticipado */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-700 text-xs">
            <span>Ingreso Cobrado Efectivo</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ${financialSummary.totalPaidCollected.toLocaleString('es-MX')}
            <span className="text-xs font-normal text-slate-500 ml-1">MXN</span>
          </div>
          <div className="flex items-center space-x-1 text-[11px] text-emerald-700 font-medium mt-2 pt-2 border-t border-slate-100">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cobro 100% anticipado disponible</span>
          </div>
        </div>

        {/* KPI 3: Volumen del Estado de Cuenta Seleccionado */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-700 text-xs">
            <span>Volumen Filtrado</span>
            <Layers className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ${financialSummary.filteredRevenue.toLocaleString('es-MX')}
            <span className="text-xs font-normal text-slate-500 ml-1">MXN</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-600 mt-2 pt-2 border-t border-slate-100">
            <span>Citas en este estado:</span>
            <span className="font-bold text-slate-900">{financialSummary.filteredCount} citas</span>
          </div>
        </div>

        {/* KPI 4: Ticket Promedio por Cita */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-700 text-xs">
            <span>Ticket Promedio por Cita</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ${financialSummary.averageTicket.toLocaleString('es-MX')}
            <span className="text-xs font-normal text-slate-500 ml-1">MXN</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-600 mt-2 pt-2 border-t border-slate-100">
            <span>Retención anticaída:</span>
            <span className="font-bold text-emerald-700">
              +${financialSummary.totalRetainedCompensations.toLocaleString('es-MX')} MXN
            </span>
          </div>
        </div>
      </div>

      {/* CHARTS GRID (RECHARTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHART 1: Tendencia de Citas Agendadas por Día (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 text-sm">
                  Tendencia de Citas Agendadas por Día
                </h3>
                <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md">
                  {statusFilter === 'all'
                    ? 'Todos los estados'
                    : `Filtrado: ${statusFilter.toUpperCase()}`}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Número diario de citas agendadas según el estado de cuenta seleccionado.
              </p>
            </div>

            {/* Toggle Mode: Appointments count vs Revenue */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setChartViewMode('appointments')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  chartViewMode === 'appointments'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Citas / Día
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('revenue')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  chartViewMode === 'revenue'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ingreso ($) / Día
              </button>
            </div>
          </div>

          {/* Recharts Area/Bar Chart Container */}
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartViewMode === 'appointments' ? (
                <AreaChart
                  data={dailyTrendData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-800 space-y-1">
                            <div className="font-bold text-emerald-400 border-b border-slate-700 pb-1">
                              {data.dateLabel} ({data.dateKey})
                            </div>
                            <div className="flex justify-between gap-4 text-slate-300 pt-0.5">
                              <span>Total Citas:</span>
                              <span className="font-bold text-white">{data.total}</span>
                            </div>
                            <div className="flex justify-between gap-4 text-sky-400">
                              <span>Completadas:</span>
                              <span className="font-bold">{data.completed}</span>
                            </div>
                            <div className="flex justify-between gap-4 text-emerald-400">
                              <span>Confirmadas:</span>
                              <span className="font-bold">{data.confirmed}</span>
                            </div>
                            {data.pending > 0 && (
                              <div className="flex justify-between gap-4 text-amber-400">
                                <span>Pendientes:</span>
                                <span className="font-bold">{data.pending}</span>
                              </div>
                            )}
                            {data.cancelled > 0 && (
                              <div className="flex justify-between gap-4 text-rose-400">
                                <span>Canceladas:</span>
                                <span className="font-bold">{data.cancelled}</span>
                              </div>
                            )}
                            <div className="flex justify-between gap-4 text-slate-300 border-t border-slate-800 pt-1 text-[11px]">
                              <span>Monto del Día:</span>
                              <span className="font-bold text-emerald-400">
                                ${data.revenue.toLocaleString('es-MX')} MXN
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Citas Agendadas"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    dot={{ r: 3, fill: '#10b981' }}
                    activeDot={{ r: 6, stroke: '#059669', strokeWidth: 2 }}
                  />
                  {statusFilter === 'all' && (
                    <Area
                      type="monotone"
                      dataKey="completed"
                      name="Completadas"
                      stroke="#0284c7"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCompleted)"
                      dot={{ r: 2, fill: '#0284c7' }}
                    />
                  )}
                </AreaChart>
              ) : (
                <BarChart
                  data={dailyTrendData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-800 space-y-1">
                            <div className="font-bold text-emerald-400">{data.dateLabel}</div>
                            <div className="text-slate-300">
                              Ingreso del Día: <strong className="text-white">${data.revenue} MXN</strong>
                            </div>
                            <div className="text-slate-400 text-[11px]">
                              Citas registradas: {data.total}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    name="Ingreso ($ MXN)"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Proyección Mensual de Ingresos Acumulada */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Ingreso Mensual Proyectado
              </h3>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Proyección al cierre de mes basada en citas agendadas y ritmo de cobro.
            </p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={projectedRevenueChartData}
                margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-800 space-y-1">
                          <div className="font-bold text-emerald-400">{item.period}</div>
                          {item.cobrado > 0 && (
                            <div className="flex justify-between gap-3 text-slate-300">
                              <span>Cobrado:</span>
                              <span className="font-bold text-emerald-400">
                                ${item.cobrado.toLocaleString('es-MX')} MXN
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between gap-3 text-slate-300">
                            <span>Proyección:</span>
                            <span className="font-bold text-white">
                              ${item.proyectado.toLocaleString('es-MX')} MXN
                            </span>
                          </div>
                          <div className="flex justify-between gap-3 text-sky-400 pt-1 border-t border-slate-800">
                            <span>Acumulado:</span>
                            <span className="font-bold">
                              ${item.acumulado.toLocaleString('es-MX')} MXN
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="proyectado"
                  name="Ingreso Proyectado"
                  fill="#0ea5e9"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="cobrado"
                  name="Cobrado Anticipado"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-700">
              <span>Meta mensual estimada:</span>
              <span className="font-bold text-slate-900">$20,000 MXN</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round((financialSummary.projectedMonthlyTotal / 20000) * 100))}%`
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>
                {Math.round((financialSummary.projectedMonthlyTotal / 20000) * 100)}% alcanzado
              </span>
              <span className="text-emerald-700 font-semibold">
                Faltan ${(Math.max(0, 20000 - financialSummary.projectedMonthlyTotal)).toLocaleString('es-MX')} MXN
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Estado de Cuenta Detallado (Transactions Breakdown) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Detalle de Transacciones del Estado de Cuenta
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Mostrando {filteredAppointments.length} movimientos filtrados por estado:{' '}
              <strong className="text-slate-900">
                {statusFilter === 'all' ? 'Todos' : statusFilter.toUpperCase()}
              </strong>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">Total de este extracto:</span>
            <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
              ${financialSummary.filteredRevenue.toLocaleString('es-MX')} MXN
            </span>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px] bg-slate-50">
                <th className="p-3 rounded-l-xl">Folio Cita</th>
                <th className="p-3">Fecha & Hora</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Servicio</th>
                <th className="p-3">Método Pago</th>
                <th className="p-3">Estado de Cuenta</th>
                <th className="p-3 text-right rounded-r-xl">Monto Neto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                    No se encontraron transacciones para el estado de cuenta seleccionado.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => {
                  const isCancelled = apt.status === 'cancelled';
                  const retainedAmt = isCancelled
                    ? apt.paidAmount - (apt.refundAmount || apt.paidAmount * 0.5)
                    : apt.paidAmount;

                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-emerald-800">
                        #{apt.id}
                      </td>
                      <td className="p-3 text-slate-700 whitespace-nowrap">
                        {apt.date} · {apt.time} hrs
                      </td>
                      <td className="p-3 text-slate-900 font-medium">
                        <div>{apt.clientName}</div>
                        <div className="text-[11px] text-slate-500">{apt.clientPhone}</div>
                      </td>
                      <td className="p-3 text-slate-700">
                        {apt.serviceName}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          <CreditCard className="w-3 h-3 text-slate-500" />
                          <span>{apt.paymentMethod || 'Mercado Pago'}</span>
                        </span>
                      </td>
                      <td className="p-3">
                        {apt.status === 'confirmed' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Confirmada (Pagada)</span>
                          </span>
                        )}
                        {apt.status === 'completed' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-900">
                            <CheckCircle2 className="w-3 h-3 text-sky-600" />
                            <span>Completada</span>
                          </span>
                        )}
                        {apt.status === 'pending' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>Pendiente</span>
                          </span>
                        )}
                        {apt.status === 'cancelled' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Cancelada (Retención 50%)</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        <div>${retainedAmt.toLocaleString('es-MX')} MXN</div>
                        {isCancelled && (
                          <div className="text-[10px] text-rose-600 font-normal">
                            Reembolso: -${(apt.refundAmount || 325)} MXN
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
