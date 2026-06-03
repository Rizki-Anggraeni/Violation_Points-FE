import React, { useState } from 'react';
import { changePassword } from '../services/userService';

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      return setError('Password baru dan konfirmasi password tidak cocok');
    }

    setLoading(true);
    try {
      const res = await changePassword(oldPassword, newPassword);
      setMessage(res.message || 'Password berhasil diubah');
      
      // Kosongkan form setelah berhasil
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2 w-full mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-slate-800 text-center">Ubah Password</h2>
      
      {message && <div className="p-3 mb-4 text-sm font-medium text-green-700 bg-green-100 rounded-lg">{message}</div>}
      {error && <div className="p-3 mb-4 text-sm font-medium text-red-700 bg-red-100 rounded-lg">{error}</div>}
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700">Password Lama</label>
          <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" placeholder="Masukkan password lama" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700">Password Baru</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" placeholder="Masukkan password baru" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700">Konfirmasi Password Baru</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" placeholder="Ulangi password baru" />
        </div>
        
        <button type="submit" disabled={loading} className="mt-4 p-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-70 transition-colors flex items-center justify-center">
          {loading ? 'Menyimpan...' : 'Simpan Password'}
        </button>
      </form>
    </div>
  );
}