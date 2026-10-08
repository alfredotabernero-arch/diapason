import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarX, ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Segmented from '../components/ui/Segmented.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import AppointmentCard from '../components/agenda/AppointmentCard.jsx';
import { useStore } from '../store/StoreContext.jsx';
import { instrumentStyle } from '../utils/constants.js';
import {
  addDays, addMonths, formatLong, formatShort, formatHours, fromISO, isoWeekday, monthLabel,
  startOfMonth, startOfWeek, todayISO, WEEKDAYS, WEEKDAYS_SHORT,
} from '../utils/dates.js';
import { agendaForDate as appointmentsForDate } from '../utils/selectors.js';

const VIEWS = [
  { value: 'dia', label: 'Día' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mes' },
];

export default function Agenda() {
  const { state } = useStore();
  const [params, setParams] = useSearchParams();
  const view = params.get('vista') || 'dia';
  const date = params.get('fecha') || todayISO();
  const today = todayISO();

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => next.set(k, v));
    setParams(next, { replace: true });
  };

  const step = (dir) => {
    if (view === 'dia') update({ fecha: addDays(date, dir) });
    else if (view === 'semana') update({ fecha: addDays(date, dir * 7) });
    else update({ fecha: addMonths(date, dir) });
  };

  const weekStart = startOfWeek(date);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const title =
    view === 'dia' ? formatLong(date)
      : view === 'semana' ? `${formatShort(weekStart)} – ${formatShort(addDays(weekStart, 6))}`
        : monthLabel(date);

  return (
    <>
      <PageHeader title="Agenda" subtitle={state.settings.school} />
      <Segmented options={VIEWS} value={view} onChange={(v) => update({ vista: v })} />

      <div className="mt-3 flex items-center gap-2">
        <button className="btn-secondary !p-2.5" onClick={() => step(-1)} aria-label="Anterior"><ChevronLeft size={18} /></button>
        <p className="flex-1 text-center font-semibold text-ink-700">{title}</p>
        <button className="btn-secondary !p-2.5" onClick={() => step(1)} aria-label="Siguiente"><ChevronRight size={18} /></button>
        {date !== today && <button className="btn-secondary !px-3 !py-2.5" onClick={() => update({ fecha: today })}>Hoy</button>}
      </div>

      <div key={`${view}-${view === 'mes' ? date.slice(0, 7) : view === 'semana' ? weekStart : date}`} className="mt-4 animate-fade-up">
        {view === 'dia' && <DayView state={state} date={date} weekDays={weekDays} onPick={(d) => update({ fecha: d })} />}
        {view === 'semana' && <WeekView state={state} weekDays={weekDays} onPick={(d) => update({ fecha: d, vista: 'dia' })} />}
        {view === 'mes' && <MonthView state={state} date={date} onPick={(d) => update({ fecha: d })} />}
      </div>
    </>
  );
}

function WeekStrip({ state, weekDays, selected, onPick }) {
  const today = todayISO();
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {weekDays.map((d, i) => {
        const count = appointmentsForDate(state, d).length;
        const active = d === selected;
        return (
          <button
            key={d}
            onClick={() => onPick(d)}
            className={`flex flex-col items-center rounded-2xl py-2 transition-all duration-200 ${
              active ? 'bg-ink-800 text-white shadow-lift scale-105' : 'bg-white text-ink-600 border border-ink-100 hover:border-ink-300'
            }`}
          >
            <span className={`text-[11px] font-semibold ${active ? 'text-brass-300' : 'text-ink-300'}`}>{WEEKDAYS_SHORT[i]}</span>
            <span className={`font-display text-xl leading-tight ${d === today && !active ? 'text-brass-500' : ''}`}>{fromISO(d).getDate()}</span>
            <span className="flex h-1.5 gap-0.5">
              {Array.from({ length: Math.min(count, 4) }).map((_, k) => (
                <span key={k} className={`h-1 w-1 rounded-full ${active ? 'bg-white/70' : 'bg-ink-300'}`} />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function DayView({ state, date, weekDays, onPick }) {
  const appts = appointmentsForDate(state, date);
  const minutes = appts.reduce((n, a) => n + a.duration, 0);
  return (
    <>
      <WeekStrip state={state} weekDays={weekDays} selected={date} onPick={onPick} />
      <div className="mt-4 mb-2 flex items-baseline justify-between">
        <h2 className="section-title">{WEEKDAYS[isoWeekday(date) - 1]}</h2>
        <p className="text-sm text-ink-400">{appts.length} clases · {formatHours(minutes)}</p>
      </div>
      {appts.length ? (
        <ol className="relative space-y-2.5 border-l-2 border-dashed border-ink-100 pl-3 ml-1">
          {appts.map((a, i) => (
            <li key={a.key} className="relative">
              <span className="absolute -left-[1.15rem] top-6 h-2.5 w-2.5 rounded-full border-2 border-paper bg-brass-400" />
              <AppointmentCard appt={a} delay={i * 40} />
            </li>
          ))}
        </ol>
      ) : (
        <div className="card"><EmptyState icon={CalendarX} title="Sin clases este día" text="El horario se genera a partir del horario semanal de cada alumno." /></div>
      )}
    </>
  );
}

function WeekView({ state, weekDays, onPick }) {
  const today = todayISO();
  const days = weekDays.map((d) => ({ d, appts: appointmentsForDate(state, d) }));
  const total = days.reduce((n, x) => n + x.appts.length, 0);
  const minutes = days.reduce((n, x) => n + x.appts.reduce((m, a) => m + a.duration, 0), 0);
  return (
    <>
      <p className="mb-3 text-sm text-ink-400">{total} clases esta semana · {formatHours(minutes)} de docencia</p>
      <div className="space-y-4 xl:grid xl:grid-cols-7 xl:gap-2 xl:space-y-0">
        {days.map(({ d, appts }) => (
          <section key={d} className="min-w-0 xl:rounded-2xl xl:bg-white/50 xl:p-1.5">
            <button onClick={() => onPick(d)} className="mb-1.5 flex w-full items-baseline gap-2 text-left">
              <span className={`font-display text-xl ${d === today ? 'text-brass-500' : 'text-ink-900'}`}><span className="xl:hidden">{WEEKDAYS[isoWeekday(d) - 1]}</span><span className="hidden xl:inline">{WEEKDAYS[isoWeekday(d) - 1].slice(0, 3)}</span></span>
              <span className="text-sm text-ink-400">{formatShort(d)}</span>
              {d === today && <span className="chip bg-brass-50 text-brass-600 xl:hidden">Hoy</span>}
              <span className="ml-auto text-xs text-ink-300">{appts.length || '—'}</span>
            </button>
            {appts.length ? (
              <div className="space-y-1.5">{appts.map((a) => <AppointmentCard key={a.key} appt={a} compact />)}</div>
            ) : (
              <p className="rounded-2xl border border-dashed border-ink-100 px-4 py-2.5 text-sm text-ink-300 xl:px-2 xl:text-xs">Sin clases</p>
            )}
          </section>
        ))}
      </div>
    </>
  );
}

function MonthView({ state, date, onPick }) {
  const today = todayISO();
  const first = startOfMonth(date);
  const gridStart = startOfWeek(first);
  const month = first.slice(0, 7);
  const cells = useMemo(
    () => Array.from({ length: 42 }, (_, i) => {
      const d = addDays(gridStart, i);
      return { d, appts: appointmentsForDate(state, d) };
    }),
    [gridStart, state]
  );
  const rows = cells.slice(35).every((c) => !c.d.startsWith(month)) ? cells.slice(0, 35) : cells;
  const selected = appointmentsForDate(state, date);
  const monthCount = cells.filter((c) => c.d.startsWith(month)).reduce((n, c) => n + c.appts.length, 0);

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-6">
      <div>
      <div className="card p-3">
        <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-ink-300 mb-1">
          {WEEKDAYS_SHORT.map((w) => <span key={w}>{w}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {rows.map(({ d, appts }) => {
            const inMonth = d.startsWith(month);
            const active = d === date;
            return (
              <button
                key={d}
                onClick={() => onPick(d)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-all duration-150 ${
                  active ? 'bg-ink-800 text-white shadow-lift' : inMonth ? 'hover:bg-ink-50 text-ink-700' : 'text-ink-200'
                } ${d === today && !active ? 'ring-2 ring-brass-300' : ''}`}
              >
                <span className="font-semibold tabular-nums">{fromISO(d).getDate()}</span>
                {appts.length > 0 && (
                  <span className="mt-0.5 flex gap-0.5">
                    {appts.slice(0, 3).map((a) => (
                      <span key={a.key} className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-white/80' : a.isGroup ? 'bg-violet-400' : instrumentStyle(a.student.instrument).dot}`} />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-ink-300">{monthCount} clases programadas en {monthLabel(date).toLowerCase()}</p>
      </div>
      <div>
      <h2 className="section-title mt-4 mb-2 lg:mt-0">{formatLong(date)}</h2>
      {selected.length ? (
        <div className="space-y-2">{selected.map((a, i) => <AppointmentCard key={a.key} appt={a} delay={i * 40} />)}</div>
      ) : (
        <p className="rounded-2xl border border-dashed border-ink-100 px-4 py-3 text-sm text-ink-300">Sin clases este día</p>
      )}
      </div>
    </div>
  );
}
