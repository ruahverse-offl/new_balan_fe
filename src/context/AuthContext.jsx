/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, getUserPermissions, logoutApi } from '../services/authApi';
import { getCurrentUser, updateCurrentUser } from '../services/usersApi';
import { formatRoleCodeForDisplay } from '../utils/roleDisplay';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing session and refresh permissions if needed
    useEffect(() => {
        const loadSession = async () => {
            try {
                const storedAuth = localStorage.getItem('nb_auth');
                if (storedAuth) {
                    try {
                        const parsed = JSON.parse(storedAuth);
                        
                        // Check if we have a valid token
                        if (parsed.token) {
                            let userData = parsed.user;
                            
                            // If user data exists, restore session
                            if (userData) {
                                // If user doesn't have permissions, fetch them
                                if (!Array.isArray(userData.menuItems)) {
                                    try {
                                        const permResult = await getUserPermissions();
                                        const roleCode = permResult.role_code || null;
                                        const roleDisplayName =
                                            (permResult.role_display_name && String(permResult.role_display_name).trim()) ||
                                            formatRoleCodeForDisplay(roleCode || userData.role || '');
                                        const menuItems = permResult.menu_items || [];
                                        userData = {
                                            ...userData,
                                            backendRole: roleCode,
                                            role: (roleCode || userData.role || '').toUpperCase(),
                                            roleDisplayName,
                                            menuItems,
                                        };
                                        // Update stored auth
                                        localStorage.setItem('nb_auth', JSON.stringify({ 
                                            ...parsed, 
                                            user: userData 
                                        }));
                                    } catch (error) {
                                        console.warn('Failed to refresh permissions:', error);
                                        // Continue with existing user data even if permissions fetch fails
                                    }
                                }
                                
                                setUser(userData);
                                setIsAuthenticated(true);
                            } else {
                                // Token exists but no user data - clear invalid session
                                console.warn('Invalid session: token exists but no user data');
                                localStorage.removeItem('nb_auth');
                            }
                        } else {
                            // No token - clear invalid session
                            localStorage.removeItem('nb_auth');
                        }
                    } catch (error) {
                        console.error('Error parsing stored auth:', error);
                        localStorage.removeItem('nb_auth');
                    }
                }
            } catch (error) {
                console.error('Error loading session:', error);
                localStorage.removeItem('nb_auth');
            } finally {
                setIsLoading(false);
            }
        };
        
        loadSession();
    }, []);

    const login = async (email, password) => {
        setIsLoading(true);
        try {
            // Backend API login
            const response = await apiLogin(email, password);
            
            // Save token to localStorage first so getUserPermissions can use it
            // We'll update it again later with full user data
            localStorage.setItem('nb_auth', JSON.stringify({
                user: response.user,
                token: response.token,
                refresh_token: response.refresh_token
            }));
            
            // Fetch RBAC menu (grants) and role from backend
            let roleCode = null;
            let menuItems = [];
            let roleDisplayFromApi = '';
            try {
                // Pass token directly to avoid localStorage timing issues
                const permResult = await getUserPermissions(response.token);
                roleCode = permResult.role_code || null;
                menuItems = permResult.menu_items || [];
                roleDisplayFromApi = (permResult.role_display_name && String(permResult.role_display_name).trim()) || '';
            } catch (error) {
                console.warn('Failed to fetch menu/role:', error);
            }

            // Use the actual role from backend instead of guessing
            const userRole = (roleCode || 'PUBLIC').toUpperCase();
            const roleDisplayName = roleDisplayFromApi || formatRoleCodeForDisplay(roleCode || userRole);

            const userData = {
                ...response.user,
                name: response.user.full_name || response.user.name,
                phone: response.user.mobile_number || response.user.phone,
                role: userRole,
                backendRole: roleCode,
                roleDisplayName,
                menuItems,
            };
            
            setUser(userData);
            setIsAuthenticated(true);
            localStorage.setItem('nb_auth', JSON.stringify({ 
                user: userData, 
                token: response.token,
                refresh_token: response.refresh_token 
            }));
            
            return { success: true, role: userRole };

        } catch (error) {
            return { success: false, message: error.message };
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (userData) => {
        setIsLoading(true);
        try {
            // Backend assigns storefront role (PUBLIC / CUSTOMER); role_id on request is ignored
            const registrationData = {
                full_name: userData.name || userData.full_name,
                email: userData.email,
                password: userData.password,
                mobile_number: userData.phone || userData.mobile_number,
            };
            
            const response = await apiRegister(registrationData);

            // Save token first so permission fetch can use it
            localStorage.setItem('nb_auth', JSON.stringify({
                user: response.user,
                token: response.token,
                refresh_token: response.refresh_token
            }));

            let roleCode = null;
            let menuItems = [];
            let roleDisplayFromApi = '';
            try {
                const permResult = await getUserPermissions(response.token);
                roleCode = permResult.role_code || null;
                menuItems = permResult.menu_items || [];
                roleDisplayFromApi = (permResult.role_display_name && String(permResult.role_display_name).trim()) || '';
            } catch (error) {
                console.warn('Failed to fetch menu/role after register:', error);
            }

            const userRole = (roleCode || 'PUBLIC').toUpperCase();
            const roleDisplayName = roleDisplayFromApi || formatRoleCodeForDisplay(roleCode || userRole);

            const fullUserData = {
                ...response.user,
                name: response.user.full_name || response.user.name,
                phone: response.user.mobile_number || response.user.phone || userData.phone,
                role: userRole,
                backendRole: roleCode,
                roleDisplayName,
                menuItems,
            };

            setUser(fullUserData);
            setIsAuthenticated(true);
            localStorage.setItem('nb_auth', JSON.stringify({
                user: fullUserData,
                token: response.token,
                refresh_token: response.refresh_token
            }));
            
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        } finally {
            setIsLoading(false);
        }
    };

    const updateUser = async (updates) => {
        if (!user) return { success: false, message: 'Not logged in' };
        
        // Don't set loading for permission updates to avoid loading loops
        const isPermissionUpdate =
            updates.role !== undefined ||
            updates.backendRole !== undefined ||
            updates.roleDisplayName !== undefined ||
            updates.menuItems !== undefined;
        if (!isPermissionUpdate) {
            setIsLoading(true);
        }
        
        try {
            let updatedUser;

            if (isPermissionUpdate) {
                // Permission/role updates are local-only (from RBAC system)
                updatedUser = { ...user, ...updates };
            } else {
                // Send profile updates to backend
                const backendData = {};
                if (updates.name || updates.full_name) backendData.full_name = updates.name || updates.full_name;
                if (updates.phone || updates.mobile_number) backendData.mobile_number = updates.phone || updates.mobile_number;
                if (updates.email) backendData.email = updates.email;

                if (Object.keys(backendData).length > 0) {
                    try {
                        await updateCurrentUser(backendData);
                    } catch (apiError) {
                        console.warn('Backend profile update failed:', apiError);
                        // Continue with local update even if backend fails
                    }
                }
                updatedUser = { ...user, ...updates };
            }

            const newUserState = { ...user, ...updatedUser };
            setUser(newUserState);
            const stored = JSON.parse(localStorage.getItem('nb_auth') || '{}');
            localStorage.setItem('nb_auth', JSON.stringify({ ...stored, user: newUserState }));
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        } finally {
            if (!isPermissionUpdate) {
                setIsLoading(false);
            }
        }
    };

    const logout = async () => {
        // Best-effort backend token blacklist
        try { await logoutApi(); } catch { /* ignore */ }
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('nb_auth');
        // Clear cart on logout so next user doesn't see stale items
        localStorage.removeItem('nb_cart');
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
