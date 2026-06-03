import api from '../lib/axios';

// Fungsi untuk memanggil endpoint ubah password
export const changePassword = async (oldPassword, newPassword) => {
  try {
    const response = await api.put('/users/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Gagal mengubah password');
  }
};