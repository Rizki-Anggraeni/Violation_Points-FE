'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, ChevronLeft, ChevronRight, Plus, Edit, Trash2, Shield } from 'lucide-react';
import api from '../../../lib/axios';

export default function ViolationRulesPage() {
  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // State untuk Paginasi
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25; // Sesuai permintaan (25 nomor per halaman)

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/violation-rules');
      // Urutkan berdasarkan Kategori (Ringan -> Sedang -> Berat) atau Poin
      const sortedData = response.data.sort((a, b) => a.points - b.points);
      setRules(sortedData);
    } catch (error) {
      console.error('Error fetching violation rules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Logika Pencarian & Filter
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset kembali ke halaman 1 saat mencari
  };

  const filteredRules = rules.filter(rule => 
    rule.violation_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rule.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Logika Paginasi
  const totalPages = Math.ceil(filteredRules.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRules.slice(indexOfFirstItem, indexOfLastItem);

  // Styling dinamis untuk Badge Kategori
  const getCategoryBadge = (category) => {
    switch (category) {
      case 'Ringan': 
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Sedang': 
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Berat': 
      case 'Pelanggaran Berat':
      case 'Tindakan Kriminal & Kekerasan':
      case 'Asusila & Pornografi':
        return 'bg-red-100 text-red-700 border-red-200';
      default: 
        return 'bg-indigo-100 text-indigo-700 border-indigo-200'; // Default (misal: Prestasi/Pengurang Poin)
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header & Aksi */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Aturan Pelanggaran</h1>
            <p className="text-slate-500 text-sm mt-1">Daftar jenis pelanggaran, kategori, dan bobot poin.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-800" />
            <input 
              type="text" 
              placeholder="Cari nama pelanggaran..." 
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
          </div>
          <button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Tambah Aturan
          </button>
        </div>
      </div>

      {/* Tabel Data */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-150">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th className="px-6 py-4 font-semibold w-16 text-center">No</th>
                <th className="px-6 py-4 font-semibold">Nama Pelanggaran</th>
                <th className="px-6 py-4 font-semibold">Kategori</th>
                <th className="px-6 py-4 font-semibold text-center w-24">Poin</th>
                <th className="px-6 py-4 font-semibold text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                      <p className="text-slate-500 font-medium">Memuat data aturan...</p>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((rule, index) => (
                  <tr key={rule._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-center font-medium text-slate-400">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {rule.violation_name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getCategoryBadge(rule.category)}`}>
                        {rule.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-bold ${rule.points < 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {rule.points > 0 ? `+${rule.points}` : rule.points}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Hapus">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Tidak ada data aturan pelanggaran yang ditemukan.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Paginasi */}
        {!isLoading && filteredRules.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Menampilkan <span className="font-medium text-slate-800">{indexOfFirstItem + 1}</span> hingga <span className="font-medium text-slate-800">{Math.min(indexOfLastItem, filteredRules.length)}</span> dari <span className="font-medium text-slate-800">{filteredRules.length}</span> aturan
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-slate-700 px-2">
                Hal {currentPage} / {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}