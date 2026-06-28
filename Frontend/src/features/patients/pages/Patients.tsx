import React, { useState } from 'react';
import { useAppStore } from '@/src/store/appStore';
import { usePagination, useNotification } from '@/src/hooks/useApp';
import { PageHeader, StatusBadge, EmptyState, Modal, Drawer, Timeline } from '@/src/components/ui/shared';
import { 
  Plus, Search, SlidersHorizontal, Trash2, Edit2, 
  User, Check, Phone, Mail, MapPin, Eye, Calendar,
  FileText, ArrowRight, ShieldAlert, Heart, X, AlertCircle,
  ChevronLeft, ChevronRight
} from 'lucide-react';

export default function Patients() {
  const patients = useAppStore((state) => state.patients);
  const addPatient = useAppStore((state) => state.addPatient);
  const updatePatient = useAppStore((state) => state.updatePatient);
  const deletePatient = useAppStore((state) => state.deletePatient);
  const pins = useAppStore((state) => state.pins);
  const togglePin = useAppStore((state) => state.togglePin);

  const { triggerToast } = useNotification();

  // Selected patient for details panel
  const [selectedPatId, setSelectedPatId] = useState<string>(patients[0]?.id || '');
  const selectedPatient = patients.find(p => p.id === selectedPatId) || patients[0];

  // Search & Filters states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlood, setSelectedBlood] = useState<string>('All');
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Form modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Form Fields State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '1990-01-01',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    bloodType: 'O+',
    address: '',
    allergiesStr: ''
  });

  const [editData, setEditData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    bloodType: '',
    address: '',
    allergiesStr: ''
  });

  // Filter Logic
  const filteredPatients = patients.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.phone.includes(searchQuery);
    const matchesBlood = selectedBlood === 'All' || p.bloodType === selectedBlood;
    const matchesGender = selectedGender === 'All' || p.gender === selectedGender;
    return matchesSearch && matchesBlood && matchesGender;
  });

  // Pagination hook
  const {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage
  } = usePagination(filteredPatients, 5);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      triggerToast('Validation Error', 'Please complete all required fields.', 'error');
      return;
    }

    addPatient({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      dob: formData.dob,
      gender: formData.gender,
      bloodType: formData.bloodType,
      address: formData.address,
      allergies: formData.allergiesStr ? formData.allergiesStr.split(',').map(s => s.trim()) : [],
      medicalHistory: [],
      documents: []
    });

    triggerToast('Patient Created', `${formData.name} added to central repository.`, 'success');
    setIsCreateOpen(false);
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      dob: '1990-01-01',
      gender: 'Male',
      bloodType: 'O+',
      address: '',
      allergiesStr: ''
    });
  };

  const handleEditClick = (p: typeof patients[0]) => {
    setEditData({
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      dob: p.dob,
      gender: p.gender,
      bloodType: p.bloodType,
      address: p.address,
      allergiesStr: p.allergies.join(', ')
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData.name || !editData.email) {
      triggerToast('Validation Error', 'Please complete all required fields.', 'error');
      return;
    }

    updatePatient(editData.id, {
      name: editData.name,
      email: editData.email,
      phone: editData.phone,
      dob: editData.dob,
      gender: editData.gender,
      bloodType: editData.bloodType,
      address: editData.address,
      allergies: editData.allergiesStr ? editData.allergiesStr.split(',').map(s => s.trim()) : []
    });

    triggerToast('Patient Record Updated', `Successfully refreshed details for ${editData.name}.`, 'success');
    setIsEditOpen(false);
  };

  const handleDeleteClick = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete patient record ${name} (${id})? This action is irreversible.`)) {
      deletePatient(id);
      triggerToast('Patient Archive Purged', `Record for ${name} has been removed.`, 'warning');
      if (selectedPatId === id) {
        setSelectedPatId('');
      }
    }
  };

  // Timeline conversion for the selected patient
  const patientTimelineItems = selectedPatient?.medicalHistory.map(h => ({
    date: h.diagnosedDate,
    title: h.condition,
    category: h.status,
    details: h.notes || 'No notes reported.'
  })) || [];

  return (
    <div className="space-y-6">
      
      {/* 1. Header with Pin toggling */}
      <PageHeader 
        title="Patient Directory"
        description="Comprehensive clinical register of registered patients, diagnostics history archives, and vital indices."
        moduleName="Patients"
        isPinned={pins.includes('Patients')}
        onTogglePin={() => togglePin('Patients')}
        breadcrumbs={[{ label: 'Directory' }, { label: 'Registered Patients', active: true }]}
        actions={
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90"
          >
            <Plus size={14} />
            Add Patient
          </button>
        }
      />

      {/* 2. Directory Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left 2 Columns: Lists, searches, paginations */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filters and search box */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, patient ID, phone..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-hidden focus:border-zinc-300 dark:focus:border-zinc-700"
              />
            </div>
            <button
              onClick={() => setIsFilterOpen(true)}
              className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg flex items-center gap-1.5 text-xs font-semibold"
            >
              <SlidersHorizontal size={14} />
              Filter
              {(selectedBlood !== 'All' || selectedGender !== 'All') && (
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              )}
            </button>
          </div>

          {/* Patient Directory Table */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 font-mono text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    <th className="p-4 font-semibold">Patient Name</th>
                    <th className="p-4 font-semibold">Blood</th>
                    <th className="p-4 font-semibold">Sex</th>
                    <th className="p-4 font-semibold">DOB</th>
                    <th className="p-4 font-semibold">Allergies</th>
                    <th className="p-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {paginatedItems.map((p) => (
                    <tr 
                      key={p.id}
                      onClick={() => setSelectedPatId(p.id)}
                      className={`hover:bg-zinc-50/60 dark:hover:bg-zinc-900/20 cursor-pointer transition-colors ${
                        selectedPatId === p.id ? 'bg-zinc-100/50 dark:bg-zinc-850/20 font-medium' : ''
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 text-xs font-semibold uppercase">
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-950 dark:text-white">{p.name}</div>
                            <div className="text-[10px] text-zinc-400 font-mono">{p.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
                          {p.bloodType}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-zinc-500 dark:text-zinc-400 capitalize">{p.gender}</span>
                      </td>
                      <td className="p-4 text-zinc-500 dark:text-zinc-400 font-mono">
                        {p.dob}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-[120px]">
                          {p.allergies.slice(0, 2).map((a, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded-sm bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-mono border border-rose-500/15">
                              {a}
                            </span>
                          ))}
                          {p.allergies.length > 2 && (
                            <span className="text-[9px] text-zinc-400 font-mono">+{p.allergies.length - 2}</span>
                          )}
                          {p.allergies.length === 0 && <span className="text-zinc-400 italic">None</span>}
                        </div>
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => handleEditClick(p)}
                            title="Edit patient registry profile"
                            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(p.id, p.name)}
                            title="Purge patient medical records"
                            className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-md"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPatients.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8">
                        <EmptyState 
                          title="No patients found" 
                          description="Your search criteria or active filters didn't return any clinical directories." 
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={!hasPrevPage}
                    onClick={prevPage}
                    className="p-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={!hasNextPage}
                    onClick={nextPage}
                    className="p-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Complete Patient Immersive Details Card */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-6">
          {selectedPatient ? (
            <>
              {/* Profile card summary */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-200 font-bold text-lg border border-zinc-200/50 dark:border-zinc-700">
                      {selectedPatient.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-950 dark:text-white">{selectedPatient.name}</h3>
                      <span className="text-[10px] font-mono text-zinc-400">{selectedPatient.id} • blood {selectedPatient.bloodType}</span>
                    </div>
                  </div>
                  <StatusBadge status="ACTIVE" type="success" />
                </div>

                {/* Vitals summary */}
                <div className="grid grid-cols-2 gap-3 py-3 border-y border-zinc-150 dark:border-zinc-800 text-xs font-mono">
                  <div>
                    <span className="text-zinc-400 dark:text-zinc-500 block text-[9px] uppercase">Phone</span>
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">{selectedPatient.phone}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 dark:text-zinc-500 block text-[9px] uppercase">DOB / Age</span>
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">{selectedPatient.dob}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-400 dark:text-zinc-500 block text-[9px] uppercase">Address</span>
                    <span className="text-zinc-700 dark:text-zinc-300 block leading-tight font-sans mt-0.5">{selectedPatient.address}</span>
                  </div>
                </div>
              </div>

              {/* Allergy flags */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-950 dark:text-white uppercase font-mono tracking-wider text-[10px] text-zinc-400">
                  Critical Allergies
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPatient.allergies.map((a, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-mono font-medium">
                      <AlertCircle size={10} />
                      {a}
                    </span>
                  ))}
                  {selectedPatient.allergies.length === 0 && (
                    <span className="text-xs text-zinc-400 italic">No allergies reported.</span>
                  )}
                </div>
              </div>

              {/* Clinical Chronological History Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-950 dark:text-white uppercase font-mono tracking-wider text-[10px] text-zinc-400">
                  Clinical History Timeline
                </h4>
                <Timeline items={patientTimelineItems} />
              </div>

              {/* Document Repository list */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-zinc-950 dark:text-white uppercase font-mono tracking-wider text-[10px] text-zinc-400">
                  Digital Artifact Vault
                </h4>
                <div className="space-y-1.5">
                  {selectedPatient.documents.map((doc) => (
                    <div key={doc.id} className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-zinc-400" />
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[120px]">{doc.name}</p>
                          <span className="text-[9px] text-zinc-400 font-mono block mt-0.5">{doc.size} • {doc.uploadedAt.split(' ')[0]}</span>
                        </div>
                      </div>
                      <a 
                        href="#"
                        onClick={(e) => { e.preventDefault(); alert('Clinical artifact download requested.'); }}
                        className="text-[10px] font-mono text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:underline"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                  {selectedPatient.documents.length === 0 && (
                    <p className="text-xs text-zinc-400 italic">No uploads stored in files vault.</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-xs text-zinc-400 italic">
              Select a patient from the registry.
            </div>
          )}
        </div>
      </div>

      {/* 3. Advanced Filter Drawer */}
      <Drawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Directory Filters"
      >
        <div className="space-y-5 text-xs">
          <div className="space-y-2">
            <span className="font-mono text-zinc-400 uppercase tracking-wider text-[10px]">Blood Type</span>
            <div className="grid grid-cols-4 gap-1.5">
              {['All', 'A+', 'O+', 'B+', 'O-', 'AB+'].map((bt) => (
                <button
                  key={bt}
                  onClick={() => setSelectedBlood(bt)}
                  className={`py-1.5 border rounded-md font-mono ${
                    selectedBlood === bt 
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-semibold' 
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  {bt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="font-mono text-zinc-400 uppercase tracking-wider text-[10px]">Gender Biometrics</span>
            <div className="grid grid-cols-3 gap-1.5">
              {['All', 'Male', 'Female'].map((gen) => (
                <button
                  key={gen}
                  onClick={() => setSelectedGender(gen)}
                  className={`py-1.5 border rounded-md ${
                    selectedGender === gen 
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-semibold' 
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  {gen}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setSelectedBlood('All');
                setSelectedGender('All');
                setIsFilterOpen(false);
              }}
              className="px-3 py-1.5 text-zinc-400 hover:text-zinc-600"
            >
              Reset
            </button>
            <button
              onClick={() => setIsFilterOpen(false)}
              className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-lg font-semibold"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </Drawer>

      {/* 4. Create Patient Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Register Patient Record">
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="block font-semibold">Patient Name *</label>
            <input 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Alexander Sterling"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block font-semibold">Email Contact *</label>
              <input 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="alexander@gmail.com"
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block font-semibold">Phone Contact *</label>
              <input 
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block font-semibold">DOB</label>
              <input 
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block font-semibold">Sex</label>
              <select 
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block font-semibold font-mono">Blood Type</label>
              <select 
                value={formData.bloodType}
                onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 font-mono font-semibold"
              >
                {['A+', 'O+', 'B+', 'AB+', 'A-', 'O-', 'B-', 'AB-'].map(bt => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold">Residential Address</label>
            <input 
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="1024 Emerald Bay Drive, San Francisco, CA"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold flex items-center gap-1.5">
              <span>Allergy Flags</span>
              <span className="text-[10px] text-zinc-400 font-mono">(comma separated)</span>
            </label>
            <input 
              value={formData.allergiesStr}
              onChange={(e) => setFormData({ ...formData, allergiesStr: e.target.value })}
              placeholder="Penicillin, Peanuts"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2 font-mono"
            />
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
              Save Patient Profile
            </button>
          </div>
        </form>
      </Modal>

      {/* 5. Edit Patient Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Modify Patient Profile">
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="block font-semibold">Patient Name *</label>
            <input 
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block font-semibold">Email Contact *</label>
              <input 
                type="email"
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block font-semibold">Phone Contact *</label>
              <input 
                type="tel"
                value={editData.phone}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block font-semibold">DOB</label>
              <input 
                type="date"
                value={editData.dob}
                onChange={(e) => setEditData({ ...editData, dob: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block font-semibold">Sex</label>
              <select 
                value={editData.gender}
                onChange={(e) => setEditData({ ...editData, gender: e.target.value as any })}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block font-semibold font-mono">Blood Type</label>
              <select 
                value={editData.bloodType}
                onChange={(e) => setEditData({ ...editData, bloodType: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 font-mono"
              >
                {['A+', 'O+', 'B+', 'AB+', 'A-', 'O-', 'B-', 'AB-'].map(bt => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold">Residential Address</label>
            <input 
              value={editData.address}
              onChange={(e) => setEditData({ ...editData, address: e.target.value })}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold flex items-center gap-1.5">
              <span>Allergy Flags</span>
              <span className="text-[10px] text-zinc-400 font-mono">(comma separated)</span>
            </label>
            <input 
              value={editData.allergiesStr}
              onChange={(e) => setEditData({ ...editData, allergiesStr: e.target.value })}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2 font-mono"
            />
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
            <button 
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold"
            >
              Update Profile Record
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
