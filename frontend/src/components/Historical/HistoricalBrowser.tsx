import React, { useState, useMemo } from 'react';
import { HistoricalFloodEvent } from '../../types';
import { History, Play, Search, Filter, AlertTriangle, BookOpen, MapPin, Calendar, Users } from 'lucide-react';
import sourcesData from '../../data/hiflo_sources_kullu.json';

interface Props {
  events: HistoricalFloodEvent[];
  onReplayEvent: (event: HistoricalFloodEvent) => void;
  onSelectNode: (nodeId: string) => void;
}

export const HistoricalBrowser: React.FC<Props> = ({
  events,
  onReplayEvent,
  onSelectNode
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [processFilter, setProcessFilter] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState<HistoricalFloodEvent | null>(events[0] || null);

  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      const matchSearch =
        ev.settlement.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.river.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.year.toString().includes(searchTerm);

      const matchProcess =
        processFilter === 'ALL' ||
        ev.processType.toLowerCase().includes(processFilter.toLowerCase());

      return matchSearch && matchProcess;
    });
  }, [events, searchTerm, processFilter]);

  // Major historical events for quick-replay badges
  const benchmarkEvents = [
    { label: '1995 Beas Super-Flood', year: '1995', loc: 'Kullu Valley' },
    { label: '2003 Flash Flood', year: '2003', loc: 'Parbati / Kasol' },
    { label: '2018 Cloudburst Outbreak', year: '2018', loc: 'Manali / Raison' }
  ];

  return (
    <div className="bg-white border border-slate-200/60 rounded-[28px] p-6 shadow-sm text-slate-900">
      {/* ── HEADER IN CAPS ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-900">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                HIFLO-DAT HISTORICAL FLOOD ARCHIVE & REPLAY
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#d4f84c] text-slate-950 uppercase shadow-sm">
                128 VERIFIED EVENTS (1846–2020)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Peer-reviewed database of extreme hydrometeorological events in the Upper Beas Catchment
            </p>
          </div>
        </div>

        <span className="text-xs text-slate-500 font-mono font-bold uppercase">
          SHOWING {filteredEvents.length} OF {events.length} HISTORICAL RECORDS
        </span>
      </div>

      {/* Quick Benchmark Replay Pills */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase text-slate-600">BENCHMARK EVENTS REPLAY:</span>
        {benchmarkEvents.map((bm, i) => {
          const target = events.find(e => e.year === bm.year) || events[0];
          return (
            <button
              key={i}
              onClick={() => {
                setSelectedEvent(target);
                onReplayEvent(target);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-[#18191c] hover:bg-black text-white transition uppercase shadow-sm"
            >
              <Play className="w-3 h-3 fill-[#d4f84c] text-[#d4f84c]" />
              <span>{bm.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        <div className="sm:col-span-2 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by settlement (e.g. Raison, Manali, Mohal), river, or year..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-full pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={processFilter}
          onChange={e => setProcessFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-xs text-slate-800 font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">ALL PROCESS TYPES</option>
          <option value="Flash">FLASH FLOODS (FF)</option>
          <option value="River">RIVER FLOODS (RF)</option>
          <option value="Landslide">LANDSLIDE / DEBRIS FLOW</option>
          <option value="Unspecified">UNSPECIFIED / OTHER</option>
        </select>
      </div>

      {/* Main Content: Split List and Detail/Replay Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Events Table / List */}
        <div className="lg:col-span-2 overflow-y-auto max-h-[380px] border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-mono font-black">
              <tr>
                <th className="p-2.5">YEAR / DATE</th>
                <th className="p-2.5">SETTLEMENT</th>
                <th className="p-2.5">RIVER / STREAM</th>
                <th className="p-2.5">TYPE</th>
                <th className="p-2.5 text-right">CASUALTIES</th>
                <th className="p-2.5 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredEvents.map(ev => {
                const isSelected = selectedEvent?.id === ev.id;
                return (
                  <tr
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/80 text-slate-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <td className="p-2.5 font-mono text-[11px] text-blue-600 whitespace-nowrap">
                      {ev.dateStr}
                    </td>
                    <td className="p-2.5 font-bold text-slate-900 truncate max-w-[140px]">
                      {ev.settlement}
                    </td>
                    <td className="p-2.5 text-slate-500 truncate max-w-[120px]">
                      {ev.river}
                    </td>
                    <td className="p-2.5 text-[11px]">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
                        {ev.processType.split(' ')[0]}
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-mono font-black text-slate-900">
                      {ev.fatalities > 0 ? `${ev.fatalities} fatal` : '0 reported'}
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedEvent(ev);
                          onReplayEvent(ev);
                        }}
                        className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1 mx-auto shadow-sm"
                      >
                        <Play className="w-2.5 h-2.5 fill-white" />
                        REPLAY
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right Col: Selected Event Deep Inspector & Replay Controls */}
        <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex flex-col justify-between">
          {selectedEvent ? (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black text-blue-600 uppercase">
                    EVENT #{selectedEvent.eventNumber}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Lat: {selectedEvent.lat.toFixed(4)} | Lon: {selectedEvent.lon.toFixed(4)}
                  </span>
                </div>
                <h4 className="text-base font-black text-slate-900 mt-1 uppercase">
                  {selectedEvent.settlement}
                </h4>
                <div className="text-xs text-slate-500 mt-0.5 font-medium">
                  RIVER: <strong className="text-slate-800">{selectedEvent.river}</strong> ({selectedEvent.year})
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">PROCESS</span>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedEvent.processType}</div>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">RAINFALL</span>
                  <div className="font-bold text-slate-900 mt-0.5 font-mono">
                    {selectedEvent.rainfallMm > 0 ? `${selectedEvent.rainfallMm} mm` : 'Empirical Proxy'}
                  </div>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">FATALITIES</span>
                  <div className="font-bold text-slate-900 mt-0.5 font-mono">
                    {selectedEvent.fatalities} reported
                  </div>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">TOTAL AFFECTED</span>
                  <div className="font-bold text-slate-900 mt-0.5 font-mono">
                    {selectedEvent.totalAffected} persons
                  </div>
                </div>
              </div>

              {selectedEvent.notes && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-700">
                  <span className="font-black text-slate-900 uppercase block mb-1">ARCHIVAL IMPACT NOTES:</span>
                  <p className="leading-relaxed line-clamp-4">{selectedEvent.notes}</p>
                </div>
              )}

              <button
                onClick={() => onReplayEvent(selectedEvent)}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-black uppercase rounded-full bg-[#18191c] hover:bg-black text-white shadow-md transition"
              >
                <Play className="w-3.5 h-3.5 fill-[#d4f84c] text-[#d4f84c]" />
                <span>REPLAY CONDITIONS IN GRAPH SIMULATION</span>
              </button>
            </div>
          ) : (
            <div className="text-center p-8 text-slate-400 text-xs font-semibold uppercase">
              SELECT AN EVENT FROM THE HISTORICAL REGISTRY TO VIEW DETAILS AND REPLAY.
            </div>
          )}

          {/* Citation Info */}
          <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-500 flex items-center gap-1.5 font-medium">
            <BookOpen className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>CROSS-REFERENCED WITH 309 PRIMARY NEWSPAPER & GEOLOGICAL SURVEY RECORDS.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
