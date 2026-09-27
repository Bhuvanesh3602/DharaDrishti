import React from 'react';
import { CorridorNode, SensorTelemetry, NodeRiskResult } from '../../types';
import { X, MapPin, Activity, ArrowUpRight, ArrowDownRight, Layers, ShieldCheck, HelpCircle, CloudRain, Droplets, Gauge, Mountain, AlertTriangle } from 'lucide-react';

interface Props {
  node: CorridorNode;
  telemetry: SensorTelemetry;
  risk: NodeRiskResult;
  allNodes: CorridorNode[];
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
}

function riskBadgeClass(level: string) {
  if (level === 'CRITICAL') return 'bg-rose-600 text-white';
  if (level === 'WARNING') return 'bg-amber-500 text-white';
  if (level === 'WATCH') return 'bg-[#b9b6f8] text-slate-950';
  return 'bg-[#d4f84c] text-slate-950';
}

function getContributingFactors(risk: NodeRiskResult, telemetry: SensorTelemetry): string[] {
  const factors: string[] = [];
  if (telemetry.rainfall >= 80) factors.push('Extreme rainfall');
  else if (telemetry.rainfall >= 50) factors.push('Heavy rainfall');
  if (telemetry.soilMoisture >= 80) factors.push('High soil saturation');
  if (telemetry.waterLevel >= 3.5) factors.push('Elevated river stage (near flood level)');
  if (telemetry.slopeInstability >= 70) factors.push('High slope instability (debris risk)');
  if (risk.factors.upstreamInfluence >= 8) factors.push('Upstream accumulation / high inflow');
  if (!telemetry.isOnline) factors.push('Sensor offline (reduced confidence)');
  if (factors.length === 0) factors.push('Baseline conditions — low risk');
  return factors;
}

export const NodeDetailModal: React.FC<Props> = ({
  node,
  telemetry,
  risk,
  allNodes,
  onClose,
  onSelectNode
}) => {
  const upstreamNodes = allNodes.filter(n => node.upstream.includes(n.id));
  const downstreamNodes = allNodes.filter(n => node.downstream.includes(n.id));
  const contributingFactors = getContributingFactors(risk, telemetry);
  const upstreamCount = upstreamNodes.length;
  const upstreamContribution = risk.factors.upstreamInfluence >= 8 ? 'HIGH' : risk.factors.upstreamInfluence >= 4 ? 'MODERATE' : 'LOW';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200/60 rounded-[32px] shadow-2xl p-7 overflow-y-auto max-h-[90vh] text-slate-900">

        {/* ── Modal Header ── */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900 tracking-wide uppercase">
                {node.name.toUpperCase()}
              </h3>
              <span className={`px-2.5 py-0.5 text-xs font-black rounded-full uppercase shadow-sm ${riskBadgeClass(risk.level)}`}>
                {risk.level}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium uppercase">
              {node.basin} | {node.river} | {node.elevation}M | SLOPE {node.slope}°
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════
            WHY IS THIS LOCATION AT RISK? (REQUIREMENT 5)
            ══════════════════════════════════════════════════════════ */}
        <div className={`mb-4 p-4 rounded-2xl border ${
          risk.level === 'CRITICAL'
            ? 'bg-rose-50/60 border-rose-200'
            : risk.level === 'WARNING'
            ? 'bg-amber-50/60 border-amber-200'
            : risk.level === 'WATCH'
            ? 'bg-blue-50/60 border-blue-200'
            : 'bg-emerald-50/60 border-emerald-200'
        }`}>
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
            WHY IS THIS LOCATION AT RISK?
          </h4>

          {/* Sensor values that drive the risk */}
          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-slate-700">
                <CloudRain className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="font-semibold">Rainfall intensity</span>
              </div>
              <span className={`font-mono font-black ${telemetry.rainfall >= 80 ? 'text-rose-600' : 'text-slate-900'}`}>
                {telemetry.rainfall.toFixed(0)} mm/h
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-slate-700">
                <Droplets className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                <span className="font-semibold">Soil saturation</span>
              </div>
              <span className={`font-mono font-black ${telemetry.soilMoisture >= 80 ? 'text-rose-600' : 'text-slate-900'}`}>
                {telemetry.soilMoisture.toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-slate-700">
                <Gauge className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                <span className="font-semibold">River stage</span>
              </div>
              <span className={`font-mono font-black ${telemetry.waterLevel >= 3.5 ? 'text-rose-600' : 'text-slate-900'}`}>
                {telemetry.waterLevel.toFixed(1)} m
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-slate-700">
                <Mountain className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="font-semibold">Slope instability</span>
              </div>
              <span className={`font-mono font-black ${telemetry.slopeInstability >= 70 ? 'text-rose-600' : 'text-slate-900'}`}>
                {telemetry.slopeInstability.toFixed(0)} / 100
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-slate-700">
                <ArrowUpRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="font-semibold">Upstream contribution</span>
              </div>
              <span className={`font-black uppercase text-xs ${
                upstreamContribution === 'HIGH' ? 'text-rose-600' :
                upstreamContribution === 'MODERATE' ? 'text-amber-600' : 'text-emerald-600'
              }`}>{upstreamContribution}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-slate-700">
                <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="font-semibold">Drainage connectivity</span>
              </div>
              <span className="font-black text-slate-900">{upstreamCount} upstream node{upstreamCount !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Risk summary row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200/60">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-slate-500">RISK LEVEL</span>
              <span className={`px-2.5 py-0.5 text-xs font-black rounded-full uppercase ${riskBadgeClass(risk.level)}`}>
                {risk.level}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-slate-500">MODEL OUTPUT</span>
              <span className="font-mono font-black text-slate-900">{risk.riskScore}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-slate-500">CONFIDENCE</span>
              <span className="font-mono font-black text-blue-600">{risk.confidence}%</span>
            </div>
          </div>

          {/* Contributing factors */}
          <div className="mt-3 pt-2 border-t border-slate-200/60">
            <span className="text-[10px] font-black uppercase text-slate-500 block mb-1.5">CONTRIBUTING FACTORS</span>
            <ul className="space-y-1">
              {contributingFactors.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-[11px] text-slate-700 font-medium">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    risk.level === 'CRITICAL' ? 'bg-rose-500' :
                    risk.level === 'WARNING' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Risk & Confidence Overview ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] uppercase font-bold text-slate-400">RISK SCORE</span>
            <div className="text-2xl font-mono font-black text-rose-600 mt-0.5">
              {risk.riskScore}<span className="text-xs text-slate-400 font-normal">/100</span>
            </div>
            {risk.riskDelta !== 0 && (
              <span className="text-[10px] font-bold text-slate-500">
                {risk.riskDelta > 0 ? `+${risk.riskDelta}` : risk.riskDelta} from baseline
              </span>
            )}
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] uppercase font-bold text-slate-400">CONFIDENCE</span>
            <div className="text-2xl font-mono font-black text-blue-600 mt-0.5">
              {risk.confidence}%
            </div>
            <span className="text-[10px] text-slate-500">
              {telemetry.isOnline ? 'Sensor Online' : '⚠ Sensor Offline'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] uppercase font-bold text-slate-400">RAINFALL</span>
            <div className="text-2xl font-mono font-black text-slate-900 mt-0.5">
              {telemetry.rainfall.toFixed(0)} <span className="text-xs text-slate-400 font-normal">mm/h</span>
            </div>
            <span className="text-[10px] text-slate-500">Station {node.sensorId}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] uppercase font-bold text-slate-400">POPULATION</span>
            <div className="text-2xl font-mono font-black text-slate-900 mt-0.5">
              {(node.population).toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500">Direct Catchment</span>
          </div>
        </div>

        {/* ── Environmental Factor Bars ── */}
        <div className="mb-4 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2.5 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            FACTOR CONTRIBUTIONS (GraphSAGE MODEL WEIGHTS)
          </h4>
          <div className="space-y-2.5 text-xs">
            {[
              { label: 'Precipitation (35%)', val: risk.factors.rainfallContribution, max: 35, color: 'bg-sky-500' },
              { label: 'Soil Saturation (25%)', val: risk.factors.soilContribution, max: 25, color: 'bg-violet-500' },
              { label: 'River Stage (20%)', val: risk.factors.waterLevelContribution, max: 20, color: 'bg-cyan-500' },
              { label: 'Slope Instability (10%)', val: risk.factors.slopeContribution, max: 10, color: 'bg-amber-500' },
              { label: 'Upstream Influence (10%)', val: risk.factors.upstreamInfluence, max: 15, color: 'bg-indigo-500' },
            ].map(({ label, val, max, color }) => (
              <div key={label}>
                <div className="flex justify-between text-slate-700 mb-1 font-semibold">
                  <span>{label}</span>
                  <span className={`font-mono ${color.replace('bg-', 'text-')}`}>{val}/{max} pts</span>
                </div>
                <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                  <div className={`${color} h-full rounded-full`} style={{ width: `${Math.min(100, (val / max) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Upstream / Downstream Connectivity ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1 mb-2">
              <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
              UPSTREAM CATCHMENTS
            </span>
            {upstreamNodes.length > 0 ? (
              <div className="space-y-1.5">
                {upstreamNodes.map(up => (
                  <button
                    key={up.id}
                    onClick={() => onSelectNode(up.id)}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-white hover:border-blue-500 border border-slate-200 text-left transition shadow-sm"
                  >
                    <span className="text-xs font-bold text-slate-800">{up.name}</span>
                    <span className="text-[10px] text-blue-600 font-mono font-bold">{up.elevation}m ↑</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic font-medium">Headwaters node — no upstream in corridor.</div>
            )}
          </div>

          <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1 mb-2">
              <ArrowDownRight className="w-3.5 h-3.5 text-slate-700" />
              DOWNSTREAM RECIPIENTS
            </span>
            {downstreamNodes.length > 0 ? (
              <div className="space-y-1.5">
                {downstreamNodes.map(down => (
                  <button
                    key={down.id}
                    onClick={() => onSelectNode(down.id)}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-white hover:border-blue-500 border border-slate-200 text-left transition shadow-sm"
                  >
                    <span className="text-xs font-bold text-slate-800">{down.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono font-bold">{down.elevation}m ↓</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic font-medium">Corridor terminus (Larji Reservoir Inflow).</div>
            )}
          </div>
        </div>

        {/* ── Causal Traceability Chain ── */}
        <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-xl text-xs text-slate-800 mb-4">
          <h4 className="font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            CAUSAL TRACEABILITY CHAIN (GraphSAGE PIPELINE)
          </h4>
          <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed font-medium">
            {risk.reasoning.map((item, idx) => (
              <li key={idx}><span className="text-slate-800 font-bold">{item}</span></li>
            ))}
            <li>Upstream neighbors passed aggregated feature vectors via directed drainage graph edges.</li>
            <li>GraphSAGE transformed concatenated local + neighbor representations through learned weights.</li>
            <li>Composite risk score normalized to {risk.riskScore}/100 (confidence: {risk.confidence}%).</li>
            {downstreamNodes.length > 0 && (
              <li>Residual risk propagated downstream to {downstreamNodes.map(d => d.name).join(', ')}.</li>
            )}
          </ol>
        </div>

        {/* ── Footer ── */}
        <div className="flex justify-end mt-2 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-black uppercase rounded-full bg-slate-900 hover:bg-slate-800 text-white transition shadow-sm"
          >
            CLOSE INSPECTOR
          </button>
        </div>
      </div>
    </div>
  );
};
