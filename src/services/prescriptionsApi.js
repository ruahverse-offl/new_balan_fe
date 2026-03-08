import { apiGet, apiPost, apiPatch, apiDelete, getAuthToken } from '../utils/apiClient';
import { buildApiUrl } from '../config/api';

/**
 * Upload a prescription file to the backend
 * @param {File} file - The prescription file (image or PDF)
 * @param {string} [customerId] - Optional customer ID
 * @param {string} [orderId] - Optional order ID to link
 * @returns {Promise<Object>} Prescription record from backend
 */
export const uploadPrescription = async (file, customerId = null, orderId = null) => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const formData = new FormData();
  formData.append('file', file);

  const queryParts = [];
  if (customerId) queryParts.push(`customer_id=${encodeURIComponent(customerId)}`);
  if (orderId) queryParts.push(`order_id=${encodeURIComponent(orderId)}`);
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

  const response = await fetch(buildApiUrl(`/prescriptions/upload${queryString}`), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail || 'Failed to upload prescription');
  }

  return response.json();
};

export const getPrescriptions = async (params = {}) => {
  const response = await apiGet('/prescriptions', {
    limit: params.limit || 100,
    offset: params.offset || 0,
    status: params.status,
    search: params.search,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
  });
  return { items: response.items || [], pagination: response.pagination || {} };
};

export const getPrescriptionById = async (id) => {
  return await apiGet(`/prescriptions/${id}`);
};

export const approvePrescription = async (id, notes = '') => {
  const params = notes ? `?notes=${encodeURIComponent(notes)}` : '';
  return await apiPost(`/prescriptions/${id}/approve${params}`, {});
};

export const rejectPrescription = async (id, rejectionReason = '') => {
  const params = `?rejection_reason=${encodeURIComponent(rejectionReason)}`;
  return await apiPost(`/prescriptions/${id}/reject${params}`, {});
};

export const deletePrescription = async (id) => {
  return await apiDelete(`/prescriptions/${id}`);
};
