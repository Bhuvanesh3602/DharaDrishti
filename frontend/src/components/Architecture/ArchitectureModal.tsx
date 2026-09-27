import React from 'react';
import { X, Cpu, Layers, ShieldCheck, Database, ArrowDown, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const ArchitectureModal: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200/60 rounded-[32px] shadow-2xl p-7 overflow-y-auto max-h-[90vh] text-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900 tracking-wide uppercase">
                DHARADRISHTI — SYSTEM ARCHITECTURE & DATA INTEGRITY
              </h3>
              <span className="px-2.5 py-0.5 text-xs font-mono font-black rounded-full bg-[#d4f84c] text-slate-950 uppercase shadow-sm">
                SIH PS 26192
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium uppercase">
              Terrain-Aware Hyperlocal Flash Flood Decision Support System (MHA / NDRF)
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conceptual Pipeline Flow Diagram */}
        <div className="mb-5 p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl text-xs">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-600" />
            END-TO-END INFORMATION PROCESSING PIPELINE
          </h4>

          <div className="flex flex-col items-center space-y-2">
            <div className="grid grid-cols-5 gap-2 w-full text-center font-bold">
              <div className="p-2 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-800 uppercase shadow-sm">
                Rainfall & AWS
              </div>
              <div className="p-2 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-800 uppercase shadow-sm">
                Satellite Soil
              </div>
              <div className="p-2 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-800 uppercase shadow-sm">
                IoT River Stage
              </div>
              <div className="p-2 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-800 uppercase shadow-sm">
                DEM Topography
              </div>
              <div className="p-2 bg-blue-50 text-blue-700 rounded-xl text-[11px] uppercase border border-blue-200 shadow-sm">
                HiFlo-DAT
              </div>
            </div>

            <ArrowDown className="w-4 h-4 text-blue-600" />

            <div className="w-full p-2.5 bg-blue-600 text-white rounded-xl text-center font-black uppercase shadow-md shadow-blue-500/20">
              MULTI-SOURCE SPATIO-TEMPORAL DATA FUSION
            </div>

            <ArrowDown className="w-4 h-4 text-blue-600" />

            <div className="w-full p-2.5 bg-slate-900 text-white rounded-xl text-center shadow-md">
              <span className="font-black uppercase text-white">DIRECTED HYDROLOGICAL DRAINAGE GRAPH</span>
              <div className="text-[10px] text-slate-400 mt-0.5 uppercase font-medium">Topographic elevation slope & upstream-to-downstream physical routing</div>
            </div>

            <ArrowDown className="w-4 h-4 text-blue-600" />

            <div className="grid grid-cols-2 gap-2 w-full text-center">
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm">
                <span className="font-black uppercase text-slate-900">GRAPHSAGE LAYER</span>
                <div className="text-[10px] text-slate-500 font-medium">Spatial neighbor feature aggregation</div>
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm">
                <span className="font-black uppercase text-slate-900">TEMPORAL HORIZON</span>
                <div className="text-[10px] text-slate-500 font-medium">Routing latency (NOW to +3h)</div>
              </div>
            </div>

            <ArrowDown className="w-4 h-4 text-blue-600" />

            <div className="w-full p-2.5 bg-blue-600 text-white rounded-xl text-center shadow-md shadow-blue-500/20">
              <span className="font-black uppercase text-white">RISK & UNCERTAINTY QUANTIFICATION ENGINE</span>
              <div className="text-[10px] text-blue-100 mt-0.5 uppercase font-medium">Sensor-availability-aware confidence score & downstream risk cascade</div>
            </div>

            <ArrowDown className="w-4 h-4 text-blue-600" />

            <div className="grid grid-cols-2 gap-2 w-full text-center">
              <div className="p-2 bg-slate-900 rounded-xl font-black text-white uppercase shadow-sm">
                Hyperlocal GIS Corridor Map
              </div>
              <div className="p-2 bg-slate-900 rounded-xl font-black text-rose-400 uppercase shadow-sm">
                Actionable NDRF CAP Alerts
              </div>
            </div>
          </div>
        </div>

        {/* Scientific Honesty & Dataset Lineage Table */}
        <div className="mb-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            DATASET PROVENANCE & CLASSIFICATION LEDGER (SCIENTIFIC HONESTY)
          </h4>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-mono font-black">
                <tr>
                  <th className="p-2.5">DATASET / SOURCE</th>
                  <th className="p-2.5">CLASSIFICATION</th>
                  <th className="p-2.5">SCOPE & PROVENANCE</th>
                  <th className="p-2.5">HONEST ROLE IN SYSTEM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-900">HiFlo-DAT (Merged & Unmerged)</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                      AUTHENTIC HISTORICAL
                    </span>
                  </td>
                  <td className="p-2.5 text-slate-500">128 flood events (1846–2020) with 309 citations across Upper Beas</td>
                  <td className="p-2.5">Ground-truth validation, spatial calibration, historical event replay</td>
                </tr>

                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-900">Kaggle Flood Risk India</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                      SYNTHETIC BENCHMARK
                    </span>
                  </td>
                  <td className="p-2.5 text-slate-500">10,000 Pan-India uniform random samples</td>
                  <td className="p-2.5">Tabular pipeline validation only. Never passed off as Kullu observations</td>
                </tr>

                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-900">IoT Sensor Controls</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                      SIMULATED REAL-TIME
                    </span>
                  </td>
                  <td className="p-2.5 text-slate-500">Live telemetry sliders (Rainfall, Soil Saturation, Stage)</td>
                  <td className="p-2.5">Interactive live demonstration for evaluators</td>
                </tr>

                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-900">GraphSAGE / Risk Engine</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                      PROTOTYPE GNN PIPELINE
                    </span>
                  </td>
                  <td className="p-2.5 text-slate-500">PyTorch Mean-Aggregator GNN + Deterministic cascade</td>
                  <td className="p-2.5">Transparent explainable decision support (No fake 100% claims)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Operational Disclaimer */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
          <div className="font-black text-slate-900 mb-1 uppercase">OPERATIONAL MANDATE:</div>
          DharaDrishti is designed as an <strong>early-warning decision support system</strong> for incident commanders
          (NDRF, DDMA, District Magistrate). It does not replace ground reconnaissance or statutory evacuation orders,
          but equips decision-makers with upstream-to-downstream visibility and uncertainty metrics.
        </div>

        <div className="flex justify-end mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-black uppercase rounded-full bg-slate-900 hover:bg-slate-800 text-white transition shadow-sm"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
