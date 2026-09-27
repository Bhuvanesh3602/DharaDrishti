import React from 'react';
import { CorridorNode, SensorTelemetry, NodeRiskResult } from '../../types';
import { generateForecastSeries } from '../../services/riskEngine';
import { Clock, TrendingUp, ShieldAlert, BarChart3, AlertTriangle } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface Props {
  node: CorridorNode;
  telemetry: SensorTelemetry;
  risk: NodeRiskResult;
}

export const ForecastPanel: React.FC<Props> = ({ node, telemetry, risk }) => {
  const forecastSeries = generateForecastSeries(node, risk, telemetry);

  const chartData = forecastSeries.map(item => ({
    time: item.timeOffset,
    risk: item.riskScore,
    rain: item.rainfallMm,
    waterLevel: item.waterLevelM,
    conf: item.confidence,
    upperBound: Math.min(100, Math.round(item.riskScore + (100 - item.confidence) * 0.4)),
    lowerBound: Math.max(0, Math.round(item.riskScore - (100 - item.confidence) * 0.4))
  }));

  return (
    <div className="bg-white border border-slate-200/60 rounded-[28px] p-6 shadow-sm text-slate-900">
      {/* ── HEADER IN CAPS ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-900">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              PHYSICAL-INFORMED SPATIO-TEMPORAL SURGE FORECAST
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Projections for {node.name} ({node.river}) based on upstream rainfall routing and catchment saturation
            </p>
          </div>
        </div>

        <span className="px-3.5 py-1 text-xs font-mono font-bold rounded-full bg-[#18191c] text-white uppercase shadow-sm">
          HORIZON: 3-HOUR FLASH FLOOD WINDOW
        </span>
      </div>

      {/* Forecast Step Cards: NOW, +1h, +2h, +3h */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-5">
        {forecastSeries.map((step, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-[22px] border transition-all ${
              step.level === 'CRITICAL'
                ? 'bg-rose-50/70 border-rose-300 shadow-sm'
                : step.level === 'WARNING'
                ? 'bg-amber-50/70 border-amber-300 shadow-sm'
                : step.level === 'WATCH'
                ? 'bg-slate-50 border-slate-200'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase">
              <span className="text-slate-900 font-bold">{step.timeOffset}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase shadow-sm ${
                step.level === 'CRITICAL' ? 'bg-rose-600 text-white' :
                step.level === 'WARNING' ? 'bg-amber-500 text-white' :
                step.level === 'WATCH' ? 'bg-[#b9b6f8] text-slate-950' :
                'bg-[#d4f84c] text-slate-950'
              }`}>
                {step.level}
              </span>
            </div>

            <div className={`text-2xl font-mono font-black mt-2 ${
              step.level === 'CRITICAL' ? 'text-rose-600' :
              step.level === 'WARNING' ? 'text-amber-600' :
              'text-slate-900'
            }`}>
              {step.riskScore}
              <span className="text-xs text-slate-400 font-normal"> / 100</span>
            </div>

            <div className="text-[10px] text-slate-600 mt-3 space-y-1 font-medium border-t border-slate-200/60 pt-2">
              <div className="flex justify-between">
                <span className="text-slate-400 uppercase text-[9px] font-bold">RAINFALL:</span>
                <span className="text-slate-900 font-mono font-black">{step.rainfallMm} mm/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 uppercase text-[9px] font-bold">STAGE:</span>
                <span className="text-slate-900 font-mono font-black">{step.waterLevelM} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 uppercase text-[9px] font-bold">CONFIDENCE:</span>
                <span className="text-slate-900 font-mono font-black">{step.confidence}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid: Hydrograph & Probabilistic Risk Bounds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Risk Trend Chart with Uncertainty Envelope */}
        <div className="p-5 bg-[#f0f1f4] border border-slate-200/80 rounded-[24px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-slate-800" />
              PROJECTED RISK SCORE & UNCERTAINTY ENVELOPE (90% CI)
            </span>
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">0-100 SCORE</span>
          </div>

          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b9b6f8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#b9b6f8" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} fontStyle="bold" />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18191c', borderColor: '#334155', color: '#f8fafc', fontSize: '11px', borderRadius: '14px' }}
                />
                <Area type="monotone" dataKey="risk" stroke="#18191c" strokeWidth={3} fillOpacity={1} fill="url(#riskGrad)" name="Risk Score" />
                <Area type="monotone" dataKey="upperBound" stroke="#f43f5e" strokeDasharray="4 4" fillOpacity={0} name="Upper Uncertainty Bound" />
                <Area type="monotone" dataKey="lowerBound" stroke="#10b981" strokeDasharray="4 4" fillOpacity={0} name="Lower Bound" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fluvial Rainfall & Stage Forecast with Lime & Lavender Bars */}
        <div className="p-5 bg-[#f0f1f4] border border-slate-200/80 rounded-[24px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-slate-800" />
              PROJECTED PRECIPITATION & RIVER STAGE
            </span>
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">RAIN (MM/H) / STAGE (M)</span>
          </div>

          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} fontStyle="bold" />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18191c', borderColor: '#334155', color: '#f8fafc', fontSize: '11px', borderRadius: '14px' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="rain" fill="#d4f84c" name="Rainfall (mm/h)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="waterLevel" fill="#b9b6f8" name="Water Stage (m)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Primary Influencing Drivers */}
      <div className="mt-4 p-4 bg-[#f0f1f4] border border-slate-200/80 rounded-[20px] text-xs flex flex-wrap items-center justify-between gap-2 text-slate-700">
        <div className="flex items-center gap-2">
          <span className="font-black uppercase text-[10px] text-slate-500">LEADING CAUSAL DRIVER:</span>
          <span className="px-3 py-1 rounded-full bg-[#18191c] text-white font-mono font-bold text-[10px] uppercase shadow-sm">
            {telemetry.rainfall > 60 ? 'Intense Local Convection (Cloudburst)' : 'Monsoon Streamflow Influx'}
          </span>
        </div>
        <div className="text-[11px] text-slate-600 font-bold uppercase">
          SECONDARY DRIVER: SOIL ANTECEDENT SATURATION ({telemetry.soilMoisture.toFixed(0)}%)
        </div>
      </div>
    </div>
  );
};
