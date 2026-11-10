import React, { useState } from 'react';
import { HospitalBranch, EmergencyCodeConfig } from '../domain/types';
import { AlertTriangle, ShieldAlert, PhoneCall, Info, X } from 'lucide-react';

interface EmergencyCodeBannerProps {
  branch: HospitalBranch;
  onBroadcastDrill?: (code: string) => void;
}

export const EmergencyCodeBanner: React.FC<EmergencyCodeBannerProps> = ({ branch, onBroadcastDrill }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedCode, setSelectedCode] = useState<EmergencyCodeConfig | null>(null);

  const emergencyCodes = branch.emergencyCodesConfig || [];

  return (
    <>
      <div className="bg-slate-900 border-b border-slate-800 text-slate-100 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-slate-200">
            {branch.name} — Rapid Emergency Response:
          </span>
          <span className="text-amber-400 font-mono flex items-center gap-1 font-medium">
            <PhoneCall className="w-3 h-3 inline" /> {branch.emergencyPhone || '1066'}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-slate-400 font-medium hidden sm:inline">Active Protocols:</span>
          {emergencyCodes.map((ec) => (
            <button
              key={ec.code}
              type="button"
              onClick={() => {
                setSelectedCode(ec);
                setShowModal(true);
              }}
              className="px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition-transform hover:scale-105 cursor-pointer shadow-xs"
              style={{
                backgroundColor: ec.color,
                color: '#FFFFFF',
              }}
              title={`${ec.name} - Click for protocols`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white opacity-90 inline-block"></span>
              {ec.code}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setSelectedCode(emergencyCodes[0]);
              setShowModal(true);
            }}
            className="text-slate-300 hover:text-white underline text-[11px] flex items-center gap-0.5 ml-1"
          >
            <Info className="w-3 h-3" /> Details
          </button>
        </div>
      </div>

      {showModal && selectedCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden text-slate-900 animate-in fade-in duration-150">
            <div
              className="px-6 py-4 text-white flex items-center justify-between"
              style={{ backgroundColor: selectedCode.color }}
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-white" />
                <div>
                  <h3 className="font-bold text-lg leading-tight">{selectedCode.code} Protocol</h3>
                  <p className="text-xs text-white/90 font-medium">{selectedCode.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white hover:bg-black/10 p-1.5 rounded-lg transition"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Branch Location
                </span>
                <p className="font-medium text-slate-800">{branch.name} ({branch.city})</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Trigger Condition & Meaning
                </span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {selectedCode.description}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Designated Emergency Response Team
                </span>
                <p className="text-slate-800 font-medium bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/80 text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  {selectedCode.responseTeam}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Priority Level: <strong className="text-slate-800">{selectedCode.priority}</strong>
                </span>
                <div className="flex gap-2">
                  {onBroadcastDrill && (
                    <button
                      type="button"
                      onClick={() => {
                        onBroadcastDrill(selectedCode.code);
                        setShowModal(false);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
                    >
                      Simulate Drill
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

