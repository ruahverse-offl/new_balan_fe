import { apiPostFormData } from '../utils/apiClient';

/**
 * Upload a prescription file (image or PDF). Requires login.
 * @param {File} file
 * @returns {Promise<{ filename: string, stored_as: string, url: string, file_size: number, file_type: string }>}
 */
export const uploadPrescriptionFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', 'prescription');
  return apiPostFormData('/upload', formData);
};

/**
 * Upload a medicine product image (image/* only). Requires login + MEDICINE_CREATE flow.
 * @param {File} file
 * @returns {Promise<{ stored_as: string, url: string, ... }>}
 */
export const uploadMedicineImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', 'medicine');
  return apiPostFormData('/upload', formData);
};
