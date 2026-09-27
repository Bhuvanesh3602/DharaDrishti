import React from 'react';
import { CorridorNode, CorridorEdge, NodeRiskResult, SensorTelemetry } from '../../types';
import { Mountain, TrendingDown, MapPin, Rotate3d } from 'lucide-react';
import { CorridorMap3D } from '../RiskMap/CorridorMap3D';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface Props {
  nodes: CorridorNode[];
  edges: CorridorEdge[];
  riskMap: Record<string, NodeRiskResult>;
  telemetryMap: Record<string, SensorTelemetry>;
  onSelectNode: (nodeId: string) => void;
}

export const TerrainScreen: React.FC<Props> = ({
  nodes,
  edges,
  riskMap,
  telemetryMap,
  onSelectNode
}) => {
  // Sort nodes from upstream elevation down to valley exit
  const sortedNodes = [...nodes].sort((a, b) => b.elevation - a.elevation);

  const profileData = sortedNodes.map(n => ({
    name: n.name.split(' ')[0],
    fullName: n.name,
    elevation: n.elevation,
    slope: n.slope,
    risk: riskMap[n.id]?.riskScore ?? 30,
    id: n.id
  }));

  return (
    <div className="space-y-5">
      {/* Overview Banner */}
      <div className="p-6 bg-white border border-slate-200/60 rounded-[28px] shadow-sm text-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-slate-100 rounded-2xl text-slate-900">
              <Mountain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                TERRAIN, TOPOGRAPHY & FLUVIAL DRAINAGE TOPOLOGY
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Upper Beas Catchment: Elevation gradient, slope stability index, and DEM drainage connectivity
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold px-3.5 py-1 rounded-full bg-[#18191c] text-white uppercase shadow-sm">
            VERTICAL DROP: 1,570 METRES (Solang → Larji)
          </span>
        </div>

        {/* Catchment Elevation Profile Hydro-chart */}
        <div className="p-5 bg-[#f0f1f4] border border-slate-200/80 rounded-[24px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-slate-800" />
              CATCHMENT ELEVATION LONG-PROFILE (UPSTREAM HEADWATERS TO VALLEY EXIT)
            </span>
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">ALTITUDE (METRES AMSL)</span>
          </div>

          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={profileData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b9b6f8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#d4f84c" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontStyle="bold" />
                <YAxis domain={[800, 2600]} stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18191c', borderColor: '#334155', color: '#f8fafc', fontSize: '11px', borderRadius: '16px' }}
                />
                <Area
                  type="monotone"
                  dataKey="elevation"
                  stroke="#b9b6f8"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#elevGrad)"
                  name="Elevation (m)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── High-Fidelity 3D Himalayan Digital Twin Map ── */}
      <div className="p-6 bg-white border border-slate-200/60 rounded-[28px] shadow-sm text-slate-900 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-slate-900 text-[#d4f84c] rounded-2xl">
              <Rotate3d className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                INTERACTIVE 3D HIMALAYAN CANYON & DOWNHILL DRAINAGE DIGITAL TWIN
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Physical 3D topography showing steep elevation drops (Solang 2480m → Larji 910m), gravity surge pulses, and elevated station pillars
              </p>
            </div>
          </div>
        </div>

        <CorridorMap3D
          nodes={nodes}
          edges={edges}
          riskMap={riskMap}
          telemetryMap={telemetryMap}
          selectedNodeId={nodes[0]?.id || 'N05'}
          onSelectNode={onSelectNode}
        />
      </div>

      {/* Corridor Nodes Topographic Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedNodes.map(node => {
          const risk = riskMap[node.id];
          const telemetry = telemetryMap[node.sensorId];

          return (
            <div
              key={node.id}
              onClick={() => onSelectNode(node.id)}
              className="p-5 bg-white border border-slate-200/60 hover:border-slate-400 rounded-[24px] cursor-pointer transition-all shadow-sm hover:shadow-md group text-slate-900"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-black text-slate-900 text-xs uppercase">
                  <MapPin className="w-3.5 h-3.5 text-slate-700" />
                  <span>{node.name}</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black font-mono uppercase ${
                  risk?.level === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                  risk?.level === 'WARNING' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                  risk?.level === 'WATCH' ? 'bg-[#b9b6f8] text-slate-950' :
                  'bg-[#d4f84c] text-slate-950'
                }`}>
                  {risk?.riskScore ?? '--'}/100 ({risk?.level ?? 'NORMAL'})
                </span>
              </div>

              <div className="text-[11px] text-slate-500 mb-2.5 font-medium">
                SUB-BASIN: <strong className="text-slate-800">{node.basin}</strong>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] mb-2 font-mono">
                <div className="p-2.5 bg-[#f0f1f4] rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block uppercase text-[9px] font-bold">ALTITUDE:</span>
                  <span className="text-slate-900 font-black">{node.elevation} m</span>
                </div>
                <div className="p-2.5 bg-[#f0f1f4] rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block uppercase text-[9px] font-bold">SLOPE ANGLE:</span>
                  <span className="text-slate-900 font-black">{node.slope}°</span>
                </div>
                <div className="p-2.5 bg-[#f0f1f4] rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block uppercase text-[9px] font-bold">RIVER STAGE:</span>
                  <span className="text-slate-900 font-black">{telemetry?.waterLevel.toFixed(1) ?? '--'} m</span>
                </div>
                <div className="p-2.5 bg-[#f0f1f4] rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block uppercase text-[9px] font-bold">RAINFALL:</span>
                  <span className="text-slate-900 font-black">{telemetry?.rainfall.toFixed(0) ?? '--'} mm/h</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 font-semibold uppercase">
                <span>UPSTREAM: {node.upstream.length > 0 ? node.upstream.join(', ') : 'HEADWATER'}</span>
                <span className="text-slate-900 font-black group-hover:underline">INSPECT →</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
