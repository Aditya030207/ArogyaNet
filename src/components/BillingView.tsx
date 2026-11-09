import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Trash2,
  Building2,
} from 'lucide-react';
import { PatientBill, BillItem } from '../domain/types';
import { hmsStore } from '../services/store';

export const BillingView: React.FC = () => {
  const state = hmsStore.getState();
  const currentBranch = state.branches.find((b) => b.id === state.currentBranchId);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState<string>(
    state.bills[0]?.id || ''
  );

  const [targetPatientId, setTargetPatientId] = useState(state.patients[0]?.id || '');
  const [billItems, setBillItems] = useState<BillItem[]>([
    {
      id: 'BI-1',
      description: 'Specialist Clinical Consultation Fee',
      category: 'Consultation',
      amount: 1200,
    },
    {
      id: 'BI-2',
      description: 'Standard Diagnostic Panel & ECG',
      category: 'Procedure',
      amount: 800,
    },
  ]);

  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PatientBill['paymentMethod']>('UPI');

  const selectedBill = state.bills.find((b) => b.id === selectedBillId);

  const totalCalculated = billItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);

  const handleAddItemRow = () => {
    setBillItems([
      ...billItems,
      {
        id: `BI-${Date.now()}`,
        description: '',
        category: 'Laboratory',
        amount: 500,
      },
    ]);
  };

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = state.patients.find((p) => p.id === targetPatientId);
    if (!patient || billItems.length === 0) return;

    const newBill = hmsStore.createBill({
      patientId: patient.id,
      patientName: patient.fullName,
      branchId: state.currentBranchId,
      branchName: currentBranch?.name || 'ArogyaNet',
      items: billItems,
      totalAmount: totalCalculated,
      paidAmount: 0,
      balanceAmount: totalCalculated,
      paymentStatus: 'Unpaid',
    });

    setSelectedBillId(newBill.id);
    setShowCreateModal(false);
  };

  const handleCollectPayment = () => {
    if (!selectedBill) return;
    hmsStore.recordBillPayment(selectedBill.id, paymentMethod);
    setShowPayModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            Hospital Accounts & Patient Billing Portal
          </h2>
          <p className="text-xs text-slate-500">
            Segregated Administrative Revenue Management • Receipts • Payment Tracking
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Generate Patient Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">Invoices & Bills</h3>
            <span className="text-xs text-slate-500 font-semibold">{state.bills.length} Invoices</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {state.bills.map((bill) => {
              const isSelected = bill.id === selectedBillId;
              return (
                <div
                  key={bill.id}
                  onClick={() => setSelectedBillId(bill.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-slate-900">{bill.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        bill.paymentStatus === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {bill.paymentStatus}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-800">{bill.patientName}</p>
                  <div className="flex items-center justify-between text-xs text-slate-600 mt-2">
                    <span className="font-bold text-slate-900">₹{bill.totalAmount.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(bill.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedBill ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 text-slate-900">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-700" />
                    <h3 className="font-bold text-lg text-slate-900">{selectedBill.branchName}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official Hospital Service Invoice • ArogyaNet Systems
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Invoice ID: <strong className="font-mono text-blue-700">{selectedBill.id}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase inline-block ${
                      selectedBill.paymentStatus === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Payment Status: {selectedBill.paymentStatus}
                  </span>
                  {selectedBill.receiptNumber && (
                    <span className="text-xs font-mono text-slate-500 block mt-1">
                      Receipt #: {selectedBill.receiptNumber}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">PATIENT</span>
                  <strong className="text-slate-800">{selectedBill.patientName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">PATIENT ID</span>
                  <strong className="font-mono text-blue-700">{selectedBill.patientId}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">DATE</span>
                  <strong className="text-slate-800">
                    {new Date(selectedBill.createdAt).toLocaleDateString('en-IN')}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">MODE</span>
                  <strong className="text-slate-800">{selectedBill.paymentMethod || 'Pending'}</strong>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-2">
                  Line Items & Charges
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-3.5 py-2">Item Description</th>
                        <th className="px-3.5 py-2">Category</th>
                        <th className="px-3.5 py-2 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedBill.items.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50/50">
                          <td className="px-3.5 py-2.5 font-medium text-slate-800">{item.description}</td>
                          <td className="px-3.5 py-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-900">
                            ₹{item.amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan={2} className="px-3.5 py-2.5 text-right text-slate-700">
                          Total Amount Payable:
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono text-base text-slate-900">
                          ₹{selectedBill.totalAmount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                      {selectedBill.paidAmount > 0 && (
                        <tr>
                          <td colSpan={2} className="px-3.5 py-2 text-right text-emerald-700">
                            Amount Paid:
                          </td>
                          <td className="px-3.5 py-2 text-right font-mono text-emerald-800">
                            ₹{selectedBill.paidAmount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      )}
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-400">
                  Billing staff authorized under ArogyaNet financial compliance
                </span>

                <div className="flex items-center gap-2">
                  {selectedBill.paymentStatus !== 'Paid' && (
                    <button
                      type="button"
                      onClick={() => setShowPayModal(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <CreditCard className="w-4 h-4" />
                      Collect Payment (₹{selectedBill.totalAmount})
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    Print Receipt
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
              Select an invoice from the left panel to inspect details.
            </div>
          )}
        </div>
      </div>

      {showPayModal && selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-slate-900 animate-in fade-in duration-150 space-y-4">
            <h3 className="font-bold text-base">Collect Payment for Invoice {selectedBill.id}</h3>
            <p className="text-xs text-slate-500">
              Total to collect: <strong className="text-base text-slate-900">₹{selectedBill.totalAmount}</strong>
            </p>

            <div>
              <label className="block text-slate-700 font-semibold text-xs mb-1">
                Payment Channel *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
              >
                <option value="UPI">UPI (BHIM / GooglePay / PhonePe / Paytm)</option>
                <option value="Card">Debit / Credit Card POS</option>
                <option value="Cash">Cash at Hospital Accounts Counter</option>
                <option value="Insurance">TPA Cashless Health Insurance</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="px-4 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCollectPayment}
                className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
              >
                Confirm Collection & Issue Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900 animate-in fade-in duration-150">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between border-b border-emerald-900">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-white" />
                <h3 className="font-bold text-base">Generate Patient Hospital Bill</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-white/80 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Patient *</label>
                <select
                  value={targetPatientId}
                  onChange={(e) => setTargetPatientId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                >
                  {state.patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-xs text-slate-700">Line Items & Services</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Service Charge
                  </button>
                </div>

                <div className="space-y-2">
                  {billItems.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center gap-2"
                    >
                      <input
                        type="text"
                        required
                        placeholder="Description (e.g. Inpatient Ward Charge / Lab Test)"
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...billItems];
                          updated[idx].description = e.target.value;
                          setBillItems(updated);
                        }}
                        className="flex-1 min-w-[160px] px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                      />

                      <select
                        value={item.category}
                        onChange={(e) => {
                          const updated = [...billItems];
                          updated[idx].category = e.target.value as any;
                          setBillItems(updated);
                        }}
                        className="px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                      >
                        <option value="Consultation">Consultation</option>
                        <option value="Laboratory">Laboratory</option>
                        <option value="Radiology">Radiology</option>
                        <option value="Pharmacy">Pharmacy</option>
                        <option value="Procedure">Procedure</option>
                        <option value="Bed Charge">Bed Charge</option>
                      </select>

                      <input
                        type="number"
                        min={0}
                        required
                        placeholder="Amount"
                        value={item.amount}
                        onChange={(e) => {
                          const updated = [...billItems];
                          updated[idx].amount = Number(e.target.value);
                          setBillItems(updated);
                        }}
                        className="w-24 px-2 py-1 border border-slate-300 rounded text-xs bg-white font-mono"
                      />

                      {billItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setBillItems(billItems.filter((_, i) => i !== idx))}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-right text-xs font-bold text-slate-800">
                  Total Payable: <span className="font-mono text-base text-emerald-800">₹{totalCalculated}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

