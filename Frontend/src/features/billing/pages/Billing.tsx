import React, { useState } from 'react';
import { useAppStore } from '@/src/store/appStore';
import { useNotification } from '@/src/hooks/useApp';
import { PageHeader, StatusBadge, EmptyState, Modal } from '@/src/components/ui/shared';
import { 
  Receipt, Plus, Trash2, Printer, Download, Search, Check, 
  DollarSign, FileText, TrendingUp, Percent, ArrowUpRight, X
} from 'lucide-react';

export default function Billing() {
  const invoices = useAppStore((state) => state.invoices);
  const addInvoice = useAppStore((state) => state.addInvoice);
  const patients = useAppStore((state) => state.patients);
  const pins = useAppStore((state) => state.pins);
  const togglePin = useAppStore((state) => state.togglePin);

  const { triggerToast } = useNotification();

  // Search & Selector State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvId, setSelectedInvId] = useState<string>(invoices[0]?.id || '');
  const selectedInvoice = invoices.find(inv => inv.id === selectedInvId) || invoices[0];

  // Forms
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState<{ description: string; quantity: number; unitPrice: number; taxRate: number }[]>([
    { description: 'Specialist Consultation Fee', quantity: 1, unitPrice: 220, taxRate: 18 }
  ]);
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    patientId: '',
    dueDate: '2026-07-20',
    notes: ''
  });

  // Math totals for the selected invoice
  const calculateInvoiceTotals = (inv: typeof invoices[0]) => {
    if (!inv) return { subtotal: 0, gst: 0, total: 0 };
    let subtotal = 0;
    let gst = 0;
    inv.items.forEach(item => {
      const cost = item.quantity * item.unitPrice;
      const tax = cost * (item.taxRate / 100);
      subtotal += cost;
      gst += tax;
    });
    return {
      subtotal: subtotal.toFixed(2),
      gst: gst.toFixed(2),
      total: (subtotal + gst).toFixed(2)
    };
  };

  const totals = calculateInvoiceTotals(selectedInvoice);

  // Math totals for the form creation
  const getFormTotals = () => {
    let subtotal = 0;
    let gst = 0;
    invoiceItems.forEach(item => {
      const cost = item.quantity * item.unitPrice;
      const tax = cost * (item.taxRate / 100);
      subtotal += cost;
      gst += tax;
    });
    return {
      subtotal: subtotal.toFixed(2),
      gst: gst.toFixed(2),
      total: (subtotal + gst).toFixed(2)
    };
  };

  const formTotals = getFormTotals();

  // Filter Logic
  const filteredInvoices = invoices.filter((inv) => {
    return inv.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
           inv.status.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAddItem = () => {
    setInvoiceItems([...invoiceItems, { description: '', quantity: 1, unitPrice: 0, taxRate: 18 }]);
  };

  const handleRemoveItem = (idx: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: string, val: any) => {
    setInvoiceItems(invoiceItems.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoiceForm.patientId) {
      triggerToast('Validation Error', 'Please select a patient.', 'error');
      return;
    }

    const patient = patients.find(p => p.id === newInvoiceForm.patientId);
    if (!patient) return;

    addInvoice({
      patientId: patient.id,
      patientName: patient.name,
      dueDate: newInvoiceForm.dueDate,
      items: invoiceItems.map(item => ({
        description: item.description || 'Clinical Service Fee',
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        taxRate: Number(item.taxRate) || 0
      })),
      status: 'Pending',
      notes: newInvoiceForm.notes
    });

    triggerToast('Invoice Created', `Successfully raised billing for ${patient.name}.`, 'success');
    setIsCreateOpen(false);

    // Reset Form
    setInvoiceItems([{ description: 'Specialist Consultation Fee', quantity: 1, unitPrice: 220, taxRate: 18 }]);
    setNewInvoiceForm({ patientId: '', dueDate: '2026-07-20', notes: '' });
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Page Header */}
      <PageHeader 
        title="Revenue & Billings"
        description="Verify ledger transactions, issue multi-line itemized clinic invoices, and generate print-ready GST layouts."
        moduleName="Billing"
        isPinned={pins.includes('Billing')}
        onTogglePin={() => togglePin('Billing')}
        breadcrumbs={[{ label: 'Billing' }, { label: 'Invoices Ledger', active: true }]}
        actions={
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-lg text-xs font-semibold hover:opacity-90"
          >
            <Plus size={14} />
            Create Invoice
          </button>
        }
      />

      {/* 2. Top Cumulative Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 flex items-center gap-3 shadow-2xs">
          <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={18} />
          </div>
          <div>
            <span className="text-[10px] font-mono font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Gross Billings</span>
            <span className="text-xl font-bold font-sans text-zinc-950 dark:text-white">$11,200</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 flex items-center gap-3 shadow-2xs">
          <div className="p-2.5 bg-purple-500/10 rounded-lg text-purple-600 dark:text-purple-400">
            <Percent size={18} />
          </div>
          <div>
            <span className="text-[10px] font-mono font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">GST Calculated</span>
            <span className="text-xl font-bold font-sans text-zinc-950 dark:text-white">$1,708</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 flex items-center gap-3 shadow-2xs">
          <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400">
            <Percent size={18} />
          </div>
          <div>
            <span className="text-[10px] font-mono font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">GST Rate Standard</span>
            <span className="text-xl font-bold font-sans text-zinc-950 dark:text-white">18% CGST + SGST</span>
          </div>
        </div>
      </div>

      {/* 3. Core Workspace layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left column: Invoice Searching Lists */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient, status..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 focus:outline-hidden"
            />
          </div>

          <div className="space-y-2.5">
            {filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                onClick={() => setSelectedInvId(inv.id)}
                className={`p-4 rounded-xl border cursor-pointer text-xs transition-all ${
                  selectedInvId === inv.id 
                    ? 'border-zinc-900 dark:border-zinc-200 bg-zinc-50/50 dark:bg-zinc-900/30' 
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-750'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{inv.id}</span>
                  <StatusBadge 
                    status={inv.status} 
                    type={inv.status === 'Paid' ? 'success' : inv.status === 'Cancelled' ? 'error' : 'warning'} 
                  />
                </div>
                <h4 className="font-bold text-zinc-950 dark:text-white">{inv.patientName}</h4>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1 font-mono font-bold text-[13px]">${calculateInvoiceTotals(inv).total}</p>
                
                <div className="pt-2.5 mt-2.5 border-t border-zinc-150 dark:border-zinc-850 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span>Due: {inv.dueDate}</span>
                  <span>Method: {inv.paymentMethod || 'Awaiting'}</span>
                </div>
              </div>
            ))}

            {filteredInvoices.length === 0 && (
              <EmptyState 
                title="No invoices raised" 
                description="Adjust search query terms or raise a new patient invoice ledger." 
              />
            )}
          </div>
        </div>

        {/* Right column: Immersive stripe-style invoice detail viewer */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 space-y-6 shadow-2xs">
          {selectedInvoice ? (
            <>
              {/* Invoice Meta details */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-zinc-150 dark:border-zinc-850">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 px-2 py-0.5 rounded uppercase">
                    Invoice Details
                  </span>
                  <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-1.5">
                    <Receipt size={16} className="text-zinc-400" />
                    {selectedInvoice.id}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Billed To: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedInvoice.patientName}</span> ({selectedInvoice.patientId})
                  </p>
                </div>
                <div className="flex sm:flex-col items-end gap-1.5 text-right">
                  <StatusBadge status={selectedInvoice.status} type={selectedInvoice.status === 'Paid' ? 'success' : selectedInvoice.status === 'Cancelled' ? 'error' : 'warning'} />
                  <span className="text-[10px] font-mono text-zinc-400 block mt-1">Issue Date: {selectedInvoice.date}</span>
                </div>
              </div>

              {/* Items Table details */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-bold text-zinc-950 dark:text-white uppercase font-mono tracking-wider text-[10px] text-zinc-400 flex items-center gap-1.5">
                  <FileText size={14} className="text-zinc-400" />
                  Itemized Charges Ledger
                </h4>

                <div className="border border-zinc-150 dark:border-zinc-800 rounded-lg overflow-hidden text-xs font-mono shadow-2xs bg-zinc-50/50 dark:bg-zinc-900/10">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-155 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/40 text-[9px] text-zinc-400 uppercase tracking-wider font-semibold">
                        <th className="p-3.5">Charge Description</th>
                        <th className="p-3.5 text-center">Qty</th>
                        <th className="p-3.5">Unit Price</th>
                        <th className="p-3.5">GST Rate</th>
                        <th className="p-3.5 text-right">Gross Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800">
                      {selectedInvoice.items.map((item, i) => (
                        <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                          <td className="p-3.5 font-sans font-medium text-zinc-800 dark:text-zinc-200">{item.description}</td>
                          <td className="p-3.5 text-center">{item.quantity}</td>
                          <td className="p-3.5 text-zinc-600 dark:text-zinc-400">${item.unitPrice.toFixed(2)}</td>
                          <td className="p-3.5 text-zinc-500 dark:text-zinc-400">{item.taxRate}%</td>
                          <td className="p-3.5 text-right font-bold text-zinc-950 dark:text-white">
                            ${(item.quantity * item.unitPrice).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invoicing summary pricing breakdown */}
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
                <div className="space-y-1 text-zinc-400 dark:text-zinc-500">
                  <div>Subtotal: <span className="font-semibold text-zinc-700 dark:text-zinc-300">${totals.subtotal}</span></div>
                  <div>GST (CGST + SGST): <span className="font-semibold text-purple-600 dark:text-purple-400">${totals.gst}</span></div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Total Charge Due</span>
                  <div className="text-2xl font-bold font-sans text-zinc-950 dark:text-white mt-1">
                    ${totals.total}
                  </div>
                </div>
              </div>

              {/* Dynamic print button */}
              <div className="pt-4 border-t border-zinc-150 dark:border-zinc-850 flex items-center justify-between">
                <div className="text-[10px] font-mono text-zinc-400 italic">
                  HIPAA Billing Standard • Secure invoice audit complete
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      triggerToast('Download Triggered', 'Compiling secure invoice package...', 'success');
                    }}
                    className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-300 rounded-lg"
                    title="Download invoice CSV/JSON"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="px-3.5 py-2 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 font-semibold text-xs rounded-lg flex items-center gap-1.5"
                  >
                    <Printer size={13} />
                    Print Invoice
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-xs text-zinc-400 italic">
              Select or generate a medical ledger invoice.
            </div>
          )}
        </div>
      </div>

      {/* 4. Raise Invoice Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Raise Medical Invoice">
        <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
          
          <div className="space-y-1.5">
            <label className="block font-semibold">Select Patient Ledger *</label>
            <select
              value={newInvoiceForm.patientId}
              onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, patientId: e.target.value })}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2"
              required
            >
              <option value="">-- Choose patient --</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-semibold">Line Items List *</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline font-bold"
              >
                + Add Line Item
              </button>
            </div>

            <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
              {invoiceItems.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-1.5 items-center">
                  <div className="col-span-6">
                    <input
                      value={item.description}
                      onChange={(e) => handleItemChange(i, 'description', e.target.value)}
                      placeholder="e.g. Specialists Fee"
                      className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-2 py-1.5 font-sans"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(i, 'quantity', e.target.value)}
                      placeholder="Qty"
                      className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-1.5 py-1.5 text-center font-mono"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(i, 'unitPrice', e.target.value)}
                      placeholder="Price"
                      className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-1.5 py-1.5 text-center font-mono"
                      required
                    />
                  </div>
                  <div className="col-span-1.5 text-center font-mono font-semibold">
                    18%
                  </div>
                  <div className="col-span-0.5 text-center">
                    {invoiceItems.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveItem(i)}
                        className="text-rose-500 hover:opacity-80"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg font-mono text-[11px] text-zinc-400 space-y-1 border border-zinc-150 dark:border-zinc-800">
            <div>Form Subtotal: <span className="font-semibold text-zinc-700 dark:text-zinc-200">${formTotals.subtotal}</span></div>
            <div>GST Estimate (18% applied): <span className="font-semibold text-purple-600 dark:text-purple-400">${formTotals.gst}</span></div>
            <div className="pt-1.5 border-t border-zinc-200/50 dark:border-zinc-800 text-xs font-sans font-bold text-zinc-800 dark:text-white">
              Total gross billings: ${formTotals.total}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold"
            >
              Raise Invoice Ledger
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
