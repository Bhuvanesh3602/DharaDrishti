import React, { useState } from 'react';
import { EmergencyAlert, RiskLevel } from '../../types';
import { ShieldAlert, AlertTriangle, CheckCircle2, Clock, MapPin, Radio, Shield, ExternalLink, Siren, CheckSquare, Eye, ArrowDownRight, Info } from 'lucide-react';

interface Props {
  alerts: EmergencyAlert[];
  onSelectNode: (nodeId: string) => void;
}

const DOWNSTREAM_MAP: Record<string, string[]> = {
  'N01': ['Manali', 'Naggar', 'Raison', 'Kullu'],
  'N02': ['Manali', 'Naggar', 'Raison', 'Kullu'],
  'N03': ['Naggar', 'Raison', 'Kullu', 'Bhuntar'],
  'N04': ['Raison', 'Kullu', 'Bhuntar'],
  'N05': ['Kullu', 'Bhuntar', 'Bajaura', 'Larji'],
  'N06': ['Bhuntar', 'Bajaura', 'Larji'],
  'N07': ['Bhuntar', 'Bajaura', 'Larji'],
  'N08': ['Bhuntar', 'Bajaura'],
  'N09': ['Bhuntar', 'Bajaura', 'Larji'],
  'N10': ['Bajaura', 'Larji'],
  'N11': ['Larji'],
  'N12': [],
};

export const AlertCenter: React.FC<Props> = ({ alerts, onSelectNode }) => {
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
  const [expandedEvidence, setExpandedEvidence] = useState<Set<string>>(new Set());
  const [expandedDownstream, setExpandedDownstream] = useState<Set<string>>(new Set());

  const criticalCount = alerts.filter(a => a.level === 'CRITICAL').length;
  const warningCount = alerts.filter(a => a.level === 'WARNING').length;

  const toggleAck = (id: string) => {
    setAcknowledgedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleEvidence = (id: string) => {
    setExpandedEvidence(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleDownstream = (id: string) => {
    setExpandedDownstream(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-[28px] p-6 shadow-sm text-slate-900">
      {/* ── HEADER ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
            criticalCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-900'
          }`}>
            <Siren className={`w-4 h-4 ${criticalCount > 0 ? 'animate-bounce' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                NDRF EMERGENCY ALERT DISPATCH (CAP PROTOCOL)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-[#d4f84c] text-slate-950 uppercase shadow-sm">
                NDRF / SDMA
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Automated CAP bulletins for disaster management — verify independently before operational response
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-bold">
          <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-[11px] uppercase shadow-sm">
            {criticalCount} CRITICAL
          </span>
          <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-[11px] uppercase shadow-sm">
            {warningCount} WARNING
          </span>
        </div>
      </div>

      {/* ── ALERT FEED ── */}
      {alerts.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-[24px] border border-slate-200/80">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2 opacity-90" />
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">ALL CLEAR — NO ACTIVE EMERGENCIES</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto font-medium">
            All sub-catchments along the Upper Beas River corridor are operating within standard seasonal limits.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map(alert => {
            const isCrit = alert.level === 'CRITICAL';
            const isAcknowledged = acknowledgedIds.has(alert.id);
            const showEvidence = expandedEvidence.has(alert.id);
            const showDownstream = expandedDownstream.has(alert.id);
            const downstreamLocs = DOWNSTREAM_MAP[alert.targetNodeId] || [];

            return (
              <div
                key={alert.id}
                className={`rounded-2xl border transition-all ${
                  isAcknowledged
                    ? 'bg-slate-50/60 border-slate-200 opacity-70'
                    : isCrit
                    ? 'bg-rose-50/40 border-rose-200 shadow-sm'
                    : 'bg-amber-50/40 border-amber-200 shadow-sm'
                }`}
              >
                {/* ── Alert Header ── */}
                <div className="flex flex-wrap items-start justify-between gap-2 px-4 pt-4 pb-3 border-b border-slate-200/60">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`px-2.5 py-0.5 text-xs font-black font-mono rounded-full uppercase text-white shadow-sm shrink-0 ${
                      isCrit ? 'bg-rose-600' : 'bg-amber-500'
                    }`}>
                      {alert.level}
                    </span>
                    <h4 className="text-sm font-black text-slate-900 tracking-tight uppercase truncate">
                      {alert.headline}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <strong className="text-slate-800">{alert.timestamp}</strong>
                    </span>
                    {isAcknowledged && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-black text-[10px] uppercase">
                        <CheckSquare className="w-3 h-3" /> ACKNOWLEDGED
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Body: Core Data Grid ── */}
                <div className="px-4 py-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-xs">
                    {/* Impact Zone */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold uppercase text-[10px]">IMPACT ZONE:</span>
                        <span className="font-bold text-slate-900">{alert.locationName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold uppercase text-[10px]">RISK SCORE:</span>
                        <span className="font-mono font-black text-rose-600">{alert.riskScore} / 100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold uppercase text-[10px]">CONFIDENCE:</span>
                        <span className="font-mono font-black text-blue-600">{alert.confidence}%</span>
                      </div>
                    </div>

                    {/* CAP Details */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold uppercase text-[10px]">EST. LEAD TIME:</span>
                        <span className="font-mono font-black text-slate-900 text-[11px]">{alert.leadTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold uppercase text-[10px]">CAP URGENCY:</span>
                        <span className="font-bold text-slate-900 uppercase">{alert.capUrgency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold uppercase text-[10px]">CAP CERTAINTY:</span>
                        <span className="font-bold text-slate-900 uppercase">{alert.capCertainty}</span>
                      </div>
                    </div>

                    {/* Causal Triggers */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                      <span className="text-slate-700 text-[10px] uppercase font-bold tracking-wider">CAUSAL TRIGGERS:</span>
                      <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5 mt-1 font-medium">
                        {alert.factors.slice(0, 3).map((f, i) => (
                          <li key={i} className="truncate">{f}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* ── Recommended Action ── */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-start gap-2.5 text-xs mb-3">
                    <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black text-slate-900 uppercase tracking-wider text-[10px]">
                        ACTION:
                      </span>
                      <p className="text-slate-600 font-medium text-[11px] mt-0.5 leading-relaxed">
                        {alert.recommendedAction}
                      </p>
                      <p className="text-[10px] text-amber-700 mt-1 font-medium">
                        ⚠ Verify with independent observations before initiating emergency response.
                      </p>
                    </div>
                  </div>

                  {/* ── Expandable: Evidence ── */}
                  {showEvidence && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-3 text-xs">
                      <div className="font-black uppercase text-slate-800 text-[10px] mb-2 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-blue-600" /> EVIDENCE SUMMARY
                      </div>
                      <div className="space-y-1 text-[11px] text-slate-700 font-medium">
                        <div className="flex justify-between"><span>Model output (risk score):</span><strong>{alert.riskScore}/100</strong></div>
                        <div className="flex justify-between"><span>Confidence (spatial coverage):</span><strong>{alert.confidence}%</strong></div>
                        <div className="flex justify-between"><span>Data source:</span><strong>GraphSAGE GNN + IoT Telemetry (simulated)</strong></div>
                        <div className="flex justify-between"><span>CAP severity:</span><strong>{alert.capSeverity}</strong></div>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2 italic">
                        This is a prototype demonstration. All values are computed from simulated sensor inputs.
                      </p>
                    </div>
                  )}

                  {/* ── Expandable: Downstream ── */}
                  {showDownstream && downstreamLocs.length > 0 && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-3 text-xs">
                      <div className="font-black uppercase text-slate-800 text-[10px] mb-2 flex items-center gap-1.5">
                        <ArrowDownRight className="w-3.5 h-3.5 text-slate-700" /> DOWNSTREAM LOCATIONS AT ELEVATED RISK
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {downstreamLocs.map((loc, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                            {loc}
                          </span>
                        ))}
                      </div>
                      <div className="text-[10px] font-bold text-slate-700 uppercase">
                        {downstreamLocs.length} downstream location{downstreamLocs.length !== 1 ? 's' : ''} at elevated risk — Nearest: <strong>{downstreamLocs[0]}</strong>
                      </div>
                      <p className="text-[9px] text-slate-500 mt-1 italic">
                        Propagation path is estimated / demonstration only. Not an operational flood forecast.
                      </p>
                    </div>
                  )}

                  {/* ── Action Button Row ── */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => toggleAck(alert.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition shadow-sm ${
                        isAcknowledged
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-[#18191c] text-white hover:bg-black'
                      }`}
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      {isAcknowledged ? 'ACKNOWLEDGED' : 'ACKNOWLEDGE'}
                    </button>

                    <button
                      onClick={() => toggleEvidence(alert.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition shadow-sm border ${
                        showEvidence
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {showEvidence ? 'HIDE EVIDENCE' : 'VIEW EVIDENCE'}
                    </button>

                    {downstreamLocs.length > 0 && (
                      <button
                        onClick={() => toggleDownstream(alert.id)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition shadow-sm border ${
                          showDownstream
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        VIEW DOWNSTREAM ({downstreamLocs.length})
                      </button>
                    )}

                    <button
                      onClick={() => onSelectNode(alert.targetNodeId)}
                      className="ml-auto flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-transparent hover:border-blue-100"
                    >
                      INSPECT STATION
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
