/**
 * Data Mapper Utility
 * Maps between frontend and backend data formats
 */

/**
 * Map backend doctor to frontend format
 */
export const mapDoctorToFrontend = (doctor) => {
  if (!doctor || typeof doctor !== 'object') {
    return null;
  }
  // Parse education and specializations if they're JSON strings (backend Doctor may not have these)
  let education = doctor.education;
  if (typeof education === 'string') {
    try {
      education = JSON.parse(education);
    } catch {
      education = education.includes(',') ? education.split(',').map(e => e.trim()) : education;
    }
  }
  let specializations = doctor.specializations;
  if (typeof specializations === 'string') {
    try {
      specializations = JSON.parse(specializations);
    } catch {
      specializations = specializations.includes(',') ? specializations.split(',').map(s => s.trim()) : specializations;
    }
  }
  return {
    id: doctor.id,
    name: (doctor.name ?? doctor.doctorName ?? '') || '',
    specialty: doctor.specialty || '',
    subSpecialty: doctor.sub_specialty || doctor.specialty || '',
    qualification: doctor.qualifications || '',
    bio: doctor.bio || null,
    experience: doctor.experience || null,
    education: education || null,
    specializations: specializations || null,
    image: doctor.image_url || '',
    morning: doctor.morning_timings || '',
    evening: doctor.evening_timings || '',
    consultationFee: doctor.consultation_fee != null ? Number(doctor.consultation_fee) : null,
    available: doctor.is_active !== false,
    phone: doctor.phone || null,
    email: doctor.email || null,
    address: doctor.address || null,
  };
};

/**
 * Map frontend doctor to backend format.
 * Uses fallbacks so no field is undefined (JSON.stringify would omit undefined and backend would not update that field).
 */
export const mapDoctorToBackend = (doctor) => {
  if (!doctor || typeof doctor !== 'object') return {};
  // Convert education and specializations arrays to JSON strings if needed
  let education = doctor.education;
  if (Array.isArray(education)) {
    education = JSON.stringify(education);
  }
  let specializations = doctor.specializations;
  if (Array.isArray(specializations)) {
    specializations = JSON.stringify(specializations);
  }
  const consultationFee = doctor.consultationFee != null && doctor.consultationFee !== ''
    ? parseFloat(doctor.consultationFee)
    : null;
  return {
    name: doctor.name ?? '',
    specialty: doctor.specialty ?? '',
    sub_specialty: doctor.subSpecialty || null,
    qualifications: doctor.qualification ?? doctor.qualifications ?? null,
    bio: doctor.bio ?? null,
    experience: doctor.experience ?? null,
    education: education ?? null,
    specializations: specializations ?? null,
    morning_timings: doctor.morning ?? '',
    evening_timings: doctor.evening ?? '',
    image_url: doctor.image ?? null,
    consultation_fee: consultationFee,
    phone: doctor.phone ?? null,
    email: doctor.email ?? null,
    address: doctor.address ?? null,
    is_active: doctor.available !== false,
  };
};

/**
 * Build doctor update payload with only fields the backend accepts (DoctorUpdateRequest).
 * Ensures every key is present with a concrete value so the request body is never missing name/specialty.
 */
export const mapDoctorToBackendUpdatePayload = (doctor) => {
  const full = mapDoctorToBackend(doctor);
  const consultationFee = doctor?.consultationFee != null && doctor?.consultationFee !== ''
    ? parseFloat(doctor.consultationFee)
    : null;
  return {
    name: full.name ?? '',
    specialty: full.specialty ?? '',
    qualifications: full.qualifications ?? null,
    morning_timings: full.morning_timings ?? null,
    evening_timings: full.evening_timings ?? null,
    image_url: full.image_url ?? null,
    consultation_fee: consultationFee,
    is_active: full.is_active,
  };
};

/**
 * Map backend medicine to frontend format
 * Note: This is a simplified mapping - backend structure is more complex
 */
export const mapMedicineToFrontend = (medicine) => {
  return {
    id: medicine.id,
    name: medicine.name,
    category: medicine.schedule_type || 'OTC',
    price: 0, // Price comes from medicine_brand
    discount: 0,
    description: medicine.description || '',
    requiresPrescription: medicine.is_prescription_required || false,
    image: '', // Not in medicine schema
    stock: medicine.is_active !== false,
  };
};

/**
 * Map frontend product to backend medicine format
 */
export const mapProductToBackend = (product) => {
  return {
    name: product.name,
    dosage_form: 'Tablet', // Default, should be configurable
    therapeutic_category_id: product.therapeutic_category_id || '', // Need to map category
    is_prescription_required: product.requiresPrescription || false,
    is_controlled: false,
    schedule_type: product.category || 'OTC',
    description: product.description || '',
    is_active: product.stock !== false,
  };
};

/**
 * Map backend appointment to frontend format
 * Backend may send patient_name, patient_phone, doctor_id, doctor_name, appointment_date, appointment_time, etc.
 */
export const mapAppointmentToFrontend = (appointment) => {
  return {
    id: appointment.id,
    patientName: appointment.patient_name ?? appointment.patientName,
    phone: appointment.patient_phone ?? appointment.phone,
    doctorName: appointment.doctor_name ?? appointment.doctor?.name ?? '',
    doctorId: appointment.doctor_id ?? appointment.doctorId,
    message: appointment.message || '',
    status: appointment.status || 'PENDING',
    date: appointment.appointment_date ?? appointment.date,
    time: appointment.appointment_time ?? appointment.time ?? '',
    notes: appointment.notes || '',
  };
};

/**
 * Map frontend appointment to backend format.
 * Only include doctor_id when present (do not send empty string; backend expects UUID or omit for update).
 */
export const mapAppointmentToBackend = (appointment) => {
  if (!appointment || typeof appointment !== 'object') return {};
  const doctorId = appointment.doctorId ?? appointment.doctor_id;
  const date = appointment.date || (appointment.appointment_date ? new Date(appointment.appointment_date).toISOString().slice(0, 10) : null);
  const payload = {
    patient_name: appointment.patientName ?? appointment.patient_name ?? '',
    patient_phone: appointment.phone ?? appointment.patient_phone ?? '',
    appointment_date: date,
    appointment_time: appointment.time ?? appointment.appointment_time ?? '',
    status: appointment.status ?? 'PENDING',
    message: appointment.message ?? '',
    notes: appointment.notes ?? null,
  };
  if (doctorId && String(doctorId).trim()) {
    payload.doctor_id = doctorId;
  }
  return payload;
};

/**
 * Map backend coupon to frontend format
 */
export const mapCouponToFrontend = (coupon) => {
  const discount = coupon.discount_percentage != null
    ? Number(coupon.discount_percentage)
    : Number(coupon.discount);
  return {
    id: coupon.id,
    code: coupon.code,
    discount: Number.isFinite(discount) ? discount : 0,
    expiryDate: coupon.expiry_date || coupon.expiryDate,
    isActive: coupon.is_active !== false,
    firstOrderOnly: coupon.first_order_only === true,
    minOrderAmount: coupon.min_order_amount != null ? Number(coupon.min_order_amount) : null,
  };
};

/**
 * Map frontend coupon to backend format
 */
export const mapCouponToBackend = (coupon) => {
  const payload = {
    code: coupon.code ? coupon.code.toUpperCase().trim() : coupon.code,
    discount_percentage: Number(coupon.discount) || 0,
    expiry_date: coupon.expiryDate || coupon.expiry_date,
    is_active: coupon.isActive !== false,
  };
  if (coupon.firstOrderOnly !== undefined) payload.first_order_only = Boolean(coupon.firstOrderOnly);
  return payload;
};

/**
 * Map backend test booking to frontend format (keeps snake_case for table display, adds test_name)
 */
export const mapTestBookingToFrontend = (booking) => {
  if (!booking || typeof booking !== 'object') return null;
  return {
    id: booking.id,
    test_id: booking.test_id ?? booking.testId,
    test_name: booking.test_name ?? booking.testName ?? '—',
    patient_name: booking.patient_name ?? booking.patientName,
    patient_phone: booking.patient_phone ?? booking.patientPhone,
    booking_date: booking.booking_date ?? booking.bookingDate,
    booking_time: booking.booking_time ?? booking.bookingTime ?? '',
    status: booking.status ?? 'PENDING',
    notes: booking.notes ?? '',
  };
};

/**
 * Map frontend test booking form to backend format
 */
export const mapTestBookingToBackend = (booking) => {
  return {
    test_id: booking.test_id ?? booking.testId,
    patient_name: booking.patient_name ?? booking.patientName,
    patient_phone: booking.patient_phone ?? booking.patientPhone,
    booking_date: booking.booking_date ?? booking.bookingDate,
    booking_time: booking.booking_time ?? booking.bookingTime ?? '',
    status: booking.status ?? 'PENDING',
    notes: booking.notes ?? null,
  };
};
