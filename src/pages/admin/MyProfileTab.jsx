import React, { useState, useEffect } from 'react';
import { User, Lock, Shield, Save, Mail, Phone, Loader2, CheckCircle, AlertCircle, Calendar, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { changePassword } from '../../services/authApi';
import { getUserById } from '../../services/usersApi';

const sectionCardStyle = {
    background: '#fff',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid var(--gray-100)',
    marginBottom: '1.5rem',
};

const sectionTitleStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '1.25rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid var(--gray-100)',
};

const fieldGroupStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1rem',
};

const fieldLabelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--gray-500)',
    marginBottom: '0.4rem',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
};

const inputStyle = {
    width: '100%',
    padding: '0.65rem 0.85rem',
    borderRadius: '8px',
    border: '1.5px solid var(--gray-100)',
    fontSize: '0.95rem',
    color: '#1a1a2e',
    background: 'var(--gray-50)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none',
    boxSizing: 'border-box',
};

const inputFocusStyle = {
    borderColor: 'var(--primary)',
    boxShadow: '0 0 0 3px var(--primary-light)',
    background: '#fff',
};

const saveBtnStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.6rem 1.5rem',
    background: 'var(--primary)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s, transform 0.1s',
};

const readOnlyFieldStyle = {
    padding: '0.65rem 0.85rem',
    borderRadius: '8px',
    border: '1.5px solid var(--gray-100)',
    fontSize: '0.95rem',
    color: '#1a1a2e',
    background: 'var(--gray-50)',
    boxSizing: 'border-box',
};

const messageStyle = (type) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.6rem 1rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '500',
    marginTop: '0.75rem',
    background: type === 'success' ? '#ecfdf5' : '#fef2f2',
    color: type === 'success' ? '#065f46' : '#991b1b',
    border: type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca',
});

const MyProfileTab = ({ user }) => {
    const { updateUser } = useAuth();

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        full_name: '',
        email: '',
        mobile_number: '',
    });
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });
    const [focusedField, setFocusedField] = useState(null);

    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
    });
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Account info from API (is_active, created_at not in login response)
    const [accountInfo, setAccountInfo] = useState({ is_active: undefined, created_at: undefined });

    // Populate form and account info from user + full profile when needed
    useEffect(() => {
        if (!user) return;
        const phone = user.mobile_number || user.phone || '';
        setProfileForm({
            full_name: user.full_name || user.name || '',
            email: user.email || '',
            mobile_number: phone,
        });
        if (user.is_active !== undefined) setAccountInfo((prev) => ({ ...prev, is_active: user.is_active }));
        if (user.created_at) setAccountInfo((prev) => ({ ...prev, created_at: user.created_at }));

        if (!user.id) return;
        const needProfile = phone === '' || user.is_active === undefined || !user.created_at;
        if (!needProfile) return;
        let cancelled = false;
        getUserById(user.id)
            .then((profile) => {
                if (cancelled || !profile) return;
                const dbPhone = profile.mobile_number || profile.phone || '';
                setProfileForm((prev) => ({
                    ...prev,
                    full_name: profile.full_name || profile.name || prev.full_name,
                    email: profile.email || prev.email,
                    mobile_number: dbPhone || prev.mobile_number,
                }));
                setAccountInfo({
                    is_active: profile.is_active,
                    created_at: profile.created_at,
                });
            })
            .catch(() => { /* ignore */ });
        return () => { cancelled = true; };
    }, [user?.id, user?.full_name, user?.name, user?.email, user?.mobile_number, user?.phone, user?.is_active, user?.created_at]);

    const handleProfileChange = (field, value) => {
        setProfileForm((prev) => ({ ...prev, [field]: value }));
        if (profileMessage.text) setProfileMessage({ text: '', type: '' });
    };

    const handleSaveProfile = async () => {
        setProfileSaving(true);
        setProfileMessage({ text: '', type: '' });

        try {
            const result = await updateUser({
                full_name: profileForm.full_name,
                email: profileForm.email,
                mobile_number: profileForm.mobile_number,
            });

            if (result.success) {
                setProfileMessage({ text: 'Profile updated successfully!', type: 'success' });
            } else {
                setProfileMessage({ text: result.message || 'Failed to update profile.', type: 'error' });
            }
        } catch (error) {
            setProfileMessage({ text: error.message || 'An unexpected error occurred.', type: 'error' });
        } finally {
            setProfileSaving(false);
        }
    };

    const handlePasswordChange = (field, value) => {
        setPasswordForm((prev) => ({ ...prev, [field]: value }));
        if (passwordMessage.text) setPasswordMessage({ text: '', type: '' });
    };

    const handleChangePassword = async () => {
        if (!passwordForm.currentPassword || !passwordForm.newPassword) {
            setPasswordMessage({ text: 'Both fields are required.', type: 'error' });
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            setPasswordMessage({ text: 'New password must be at least 6 characters.', type: 'error' });
            return;
        }

        setPasswordSaving(true);
        setPasswordMessage({ text: '', type: '' });

        try {
            await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
            setPasswordMessage({ text: 'Password changed successfully!', type: 'success' });
            setPasswordForm({ currentPassword: '', newPassword: '' });
        } catch (error) {
            setPasswordMessage({ text: error.message || 'Failed to change password.', type: 'error' });
        } finally {
            setPasswordSaving(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    const roleName = user?.backendRole || user?.role || 'N/A';
    const accountStatus = accountInfo.is_active !== undefined ? (accountInfo.is_active ? 'Active' : 'Inactive') : 'N/A';
    const memberSince = formatDate(accountInfo.created_at ?? user?.created_at);

    return (
        <div className="animate-slide-up" style={{ maxWidth: '800px' }}>
            {/* Profile Info Section */}
            <div style={sectionCardStyle}>
                <div style={sectionTitleStyle}>
                    <User size={20} style={{ color: 'var(--primary)' }} />
                    Profile Information
                </div>
                <div style={fieldGroupStyle}>
                    <div>
                        <label style={fieldLabelStyle}>
                            <User size={13} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={profileForm.full_name}
                            onChange={(e) => handleProfileChange('full_name', e.target.value)}
                            onFocus={() => setFocusedField('full_name')}
                            onBlur={() => setFocusedField(null)}
                            style={{
                                ...inputStyle,
                                ...(focusedField === 'full_name' ? inputFocusStyle : {}),
                            }}
                            placeholder="Enter your full name"
                        />
                    </div>
                    <div>
                        <label style={fieldLabelStyle}>
                            <Mail size={13} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={profileForm.email}
                            onChange={(e) => handleProfileChange('email', e.target.value)}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            style={{
                                ...inputStyle,
                                ...(focusedField === 'email' ? inputFocusStyle : {}),
                            }}
                            placeholder="Enter your email"
                        />
                    </div>
                    <div>
                        <label style={fieldLabelStyle}>
                            <Phone size={13} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            value={profileForm.mobile_number}
                            onChange={(e) => handleProfileChange('mobile_number', e.target.value)}
                            onFocus={() => setFocusedField('mobile_number')}
                            onBlur={() => setFocusedField(null)}
                            style={{
                                ...inputStyle,
                                ...(focusedField === 'mobile_number' ? inputFocusStyle : {}),
                            }}
                            placeholder="Enter your phone number"
                        />
                    </div>
                </div>
                <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={handleSaveProfile}
                        disabled={profileSaving}
                        style={{
                            ...saveBtnStyle,
                            opacity: profileSaving ? 0.7 : 1,
                            cursor: profileSaving ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {profileSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                        {profileSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
                {profileMessage.text && (
                    <div style={messageStyle(profileMessage.type)}>
                        {profileMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        {profileMessage.text}
                    </div>
                )}
            </div>

            {/* Change Password Section */}
            <div style={sectionCardStyle}>
                <div style={sectionTitleStyle}>
                    <Lock size={20} style={{ color: 'var(--primary)' }} />
                    Change Password
                </div>
                <div style={fieldGroupStyle}>
                    <div>
                        <label style={fieldLabelStyle}>Current Password</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}>
                            <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                value={passwordForm.currentPassword}
                                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                                onFocus={() => setFocusedField('currentPassword')}
                                onBlur={() => setFocusedField(null)}
                                style={{
                                    ...inputStyle,
                                    paddingRight: '2.5rem',
                                    ...(focusedField === 'currentPassword' ? inputFocusStyle : {}),
                                }}
                                placeholder="Type current password"
                                aria-label="Current password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword((s) => !s)}
                                title={showCurrentPassword ? 'Hide password' : 'Show password'}
                                aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                                style={{
                                    position: 'absolute',
                                    right: '0.5rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    padding: '0.25rem',
                                    cursor: 'pointer',
                                    color: 'var(--admin-text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label style={fieldLabelStyle}>New Password</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}>
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                value={passwordForm.newPassword}
                                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                onFocus={() => setFocusedField('newPassword')}
                                onBlur={() => setFocusedField(null)}
                                style={{
                                    ...inputStyle,
                                    paddingRight: '2.5rem',
                                    ...(focusedField === 'newPassword' ? inputFocusStyle : {}),
                                }}
                                placeholder="Type new password (min. 6 characters)"
                                aria-label="New password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword((s) => !s)}
                                title={showNewPassword ? 'Hide password' : 'Show password'}
                                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                                style={{
                                    position: 'absolute',
                                    right: '0.5rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    padding: '0.25rem',
                                    cursor: 'pointer',
                                    color: 'var(--admin-text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
                <div style={{ marginTop: '1.25rem' }}>
                    <button
                        onClick={handleChangePassword}
                        disabled={passwordSaving}
                        style={{
                            ...saveBtnStyle,
                            opacity: passwordSaving ? 0.7 : 1,
                            cursor: passwordSaving ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {passwordSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Lock size={16} />}
                        {passwordSaving ? 'Changing...' : 'Change Password'}
                    </button>
                </div>
                {passwordMessage.text && (
                    <div style={messageStyle(passwordMessage.type)}>
                        {passwordMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        {passwordMessage.text}
                    </div>
                )}
            </div>

            {/* Account Info Section (Read-only) */}
            <div style={sectionCardStyle}>
                <div style={sectionTitleStyle}>
                    <Shield size={20} style={{ color: 'var(--primary)' }} />
                    Account Information
                </div>
                <div style={fieldGroupStyle}>
                    <div>
                        <label style={fieldLabelStyle}>
                            <Shield size={13} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                            Role
                        </label>
                        <div style={readOnlyFieldStyle}>
                            <span style={{
                                display: 'inline-block',
                                padding: '0.15rem 0.6rem',
                                borderRadius: '6px',
                                background: 'var(--primary-light)',
                                color: 'var(--primary)',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                            }}>
                                {roleName}
                            </span>
                        </div>
                    </div>
                    <div>
                        <label style={fieldLabelStyle}>Account Status</label>
                        <div style={readOnlyFieldStyle}>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.15rem 0.6rem',
                                borderRadius: '6px',
                                background: accountStatus === 'Active' ? '#ecfdf5' : '#fef2f2',
                                color: accountStatus === 'Active' ? '#065f46' : '#991b1b',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                            }}>
                                <span style={{
                                    width: '7px',
                                    height: '7px',
                                    borderRadius: '50%',
                                    background: accountStatus === 'Active' ? '#10b981' : '#ef4444',
                                    display: 'inline-block',
                                }} />
                                {accountStatus}
                            </span>
                        </div>
                    </div>
                    <div>
                        <label style={fieldLabelStyle}>
                            <Calendar size={13} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                            Member Since
                        </label>
                        <div style={readOnlyFieldStyle}>
                            {memberSince}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyProfileTab;
