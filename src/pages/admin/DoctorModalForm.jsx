import React from 'react';
import { Sun, Moon } from 'lucide-react';
import TimeInput from '../../components/common/TimeInput';
import './DoctorsTab.css';

/** Initial state for add / reset — keep in sync with Admin `doctorForm` usage */
export const INITIAL_DOCTOR_FORM = {
    name: '',
    specialty: '',
    subSpecialty: '',
    qualification: '',
    bio: '',
    experience: '',
    education: '',
    specializations: '',
    morning: '',
    evening: '',
    morningStart: '',
    morningEnd: '',
    eveningStart: '',
    eveningEnd: '',
    consultationFee: '',
    phone: '',
    email: '',
    address: '',
    image: '',
    available: true,
};

/**
 * Doctor add/edit fields for the admin modal (Manage Doctors).
 */
const DoctorModalForm = ({ doctorForm, setDoctorForm }) => {
    const educationVal = Array.isArray(doctorForm.education)
        ? doctorForm.education.join(', ')
        : doctorForm.education ?? '';
    const specVal = Array.isArray(doctorForm.specializations)
        ? doctorForm.specializations.join(', ')
        : doctorForm.specializations ?? '';

    return (
        <>
            <section className="doctor-modal-section">
                <h4 className="doctor-modal-section-title">Profile</h4>
                <div className="form-group">
                    <label htmlFor="doc-name">Doctor name *</label>
                    <input
                        id="doc-name"
                        type="text"
                        required
                        value={doctorForm.name}
                        onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                        placeholder="e.g. Dr. A. Kumar"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="doc-specialty">Specialization *</label>
                    <input
                        id="doc-specialty"
                        type="text"
                        required
                        value={doctorForm.specialty}
                        onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })}
                        placeholder="e.g. General Physician"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="doc-subspecialty">Sub-specialty</label>
                    <input
                        id="doc-subspecialty"
                        type="text"
                        value={doctorForm.subSpecialty}
                        onChange={(e) => setDoctorForm({ ...doctorForm, subSpecialty: e.target.value })}
                        placeholder="Optional"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="doc-qual">Qualifications</label>
                    <input
                        id="doc-qual"
                        type="text"
                        value={doctorForm.qualification}
                        onChange={(e) => setDoctorForm({ ...doctorForm, qualification: e.target.value })}
                        placeholder="e.g. MBBS, MD"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="doc-bio">About / biography *</label>
                    <textarea
                        id="doc-bio"
                        rows={4}
                        required
                        value={doctorForm.bio}
                        onChange={(e) => setDoctorForm({ ...doctorForm, bio: e.target.value })}
                        placeholder="Shown on the website specialist profile"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="doc-exp">Experience</label>
                    <textarea
                        id="doc-exp"
                        rows={2}
                        value={doctorForm.experience}
                        onChange={(e) => setDoctorForm({ ...doctorForm, experience: e.target.value })}
                        placeholder="Years and focus areas"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="doc-edu">Education</label>
                    <input
                        id="doc-edu"
                        type="text"
                        value={educationVal}
                        onChange={(e) => setDoctorForm({ ...doctorForm, education: e.target.value })}
                        placeholder="Comma-separated"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="doc-specs">Specializations (text)</label>
                    <input
                        id="doc-specs"
                        type="text"
                        value={specVal}
                        onChange={(e) => setDoctorForm({ ...doctorForm, specializations: e.target.value })}
                        placeholder="Comma-separated"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="doc-image">Photo URL</label>
                    <input
                        id="doc-image"
                        type="url"
                        value={doctorForm.image ?? ''}
                        onChange={(e) => setDoctorForm({ ...doctorForm, image: e.target.value })}
                        placeholder="https://…"
                    />
                    <small className="doctor-modal-hint">Optional image URL for clinic listing</small>
                </div>
                <div className="form-group form-group-checkbox doctor-modal-checkbox">
                    <input
                        type="checkbox"
                        id="doc-active"
                        checked={doctorForm.available !== false}
                        onChange={(e) => setDoctorForm({ ...doctorForm, available: e.target.checked })}
                    />
                    <label htmlFor="doc-active">Active (visible for appointments / website)</label>
                </div>
            </section>

            <section className="doctor-modal-section">
                <h4 className="doctor-modal-section-title">Consultation hours</h4>
                <p className="doctor-time-section-lead">Set optional morning and evening windows (24-hour picker). Leave both empty to skip a slot.</p>
                <div className="form-group doctor-time-group">
                    <div className="doctor-time-slot doctor-time-slot--morning" role="group" aria-label="Morning consultation window">
                        <div className="doctor-time-slot__head">
                            <Sun className="doctor-time-slot__icon" size={20} strokeWidth={2} aria-hidden />
                            <span>Morning</span>
                        </div>
                        <div className="doctor-time-slot__row">
                            <div className="doctor-time-field">
                                <label className="doctor-time-field__label" htmlFor="doc-morning-start">
                                    From
                                </label>
                                <TimeInput
                                    id="doc-morning-start"
                                    value={doctorForm.morningStart || ''}
                                    onChange={(v) => setDoctorForm({ ...doctorForm, morningStart: v })}
                                    aria-label="Morning start time"
                                />
                            </div>
                            <span className="doctor-time-slot__arrow" aria-hidden>
                                →
                            </span>
                            <div className="doctor-time-field">
                                <label className="doctor-time-field__label" htmlFor="doc-morning-end">
                                    To
                                </label>
                                <TimeInput
                                    id="doc-morning-end"
                                    value={doctorForm.morningEnd || ''}
                                    onChange={(v) => setDoctorForm({ ...doctorForm, morningEnd: v })}
                                    aria-label="Morning end time"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="form-group doctor-time-group">
                    <div className="doctor-time-slot doctor-time-slot--evening" role="group" aria-label="Evening consultation window">
                        <div className="doctor-time-slot__head">
                            <Moon className="doctor-time-slot__icon" size={20} strokeWidth={2} aria-hidden />
                            <span>Evening</span>
                        </div>
                        <div className="doctor-time-slot__row">
                            <div className="doctor-time-field">
                                <label className="doctor-time-field__label" htmlFor="doc-evening-start">
                                    From
                                </label>
                                <TimeInput
                                    id="doc-evening-start"
                                    value={doctorForm.eveningStart || ''}
                                    onChange={(v) => setDoctorForm({ ...doctorForm, eveningStart: v })}
                                    aria-label="Evening start time"
                                />
                            </div>
                            <span className="doctor-time-slot__arrow" aria-hidden>
                                →
                            </span>
                            <div className="doctor-time-field">
                                <label className="doctor-time-field__label" htmlFor="doc-evening-end">
                                    To
                                </label>
                                <TimeInput
                                    id="doc-evening-end"
                                    value={doctorForm.eveningEnd || ''}
                                    onChange={(v) => setDoctorForm({ ...doctorForm, eveningEnd: v })}
                                    aria-label="Evening end time"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="doc-fee">Consultation fee (₹)</label>
                    <input
                        id="doc-fee"
                        type="number"
                        step="0.01"
                        min="0"
                        value={doctorForm.consultationFee}
                        onChange={(e) => setDoctorForm({ ...doctorForm, consultationFee: e.target.value })}
                        placeholder="e.g. 500"
                    />
                </div>
            </section>

            <section className="doctor-modal-section">
                <h4 className="doctor-modal-section-title">Contact</h4>
                <div className="form-group">
                    <label htmlFor="doc-phone">Phone</label>
                    <input
                        id="doc-phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        maxLength={20}
                        title="Optional. 10-digit Indian mobile (6–9…), with or without +91"
                        value={doctorForm.phone}
                        onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                        placeholder="+91 9876543210"
                    />
                    <small className="doctor-modal-hint">Optional. 10-digit mobile starting with 6–9; spaces and +91 are fine.</small>
                </div>
                <div className="form-group">
                    <label htmlFor="doc-email">Email</label>
                    <input
                        id="doc-email"
                        type="email"
                        value={doctorForm.email}
                        onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                        placeholder="doctor@example.com"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="doc-address">Address</label>
                    <textarea
                        id="doc-address"
                        rows={3}
                        value={doctorForm.address}
                        onChange={(e) => setDoctorForm({ ...doctorForm, address: e.target.value })}
                        placeholder="Clinic address"
                    />
                </div>
            </section>
        </>
    );
};

export default DoctorModalForm;
