/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, getUserPermissions, logoutApi } from '../services/authApi';
import { getCurrentUser, updateCurrentUser } from '../services/usersApi';
import { mapBackendPermissionsToFrontend } from '../utils/permissionMapper';

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
                                if (!userData.permissions || userData.permissions.length === 0 || !Array.isArray(userData.menuKeys) || !Array.isArray(userData.menuItems)) {
                                    try {
                                        const permResult = await getUserPermissions();
                                        const backendPermissions = permResult.permissions || [];
                                        const roleCode = permResult.role_code || null;
                                        const frontendPermissions = mapBackendPermissionsToFrontend(backendPermissions);
                                        const menuItems = permResult.menu_items || [];
                                        const menuKeys = permResult.menu_keys || menuItems.map((m) => m.code);
                                        userData = {
                                            ...userData,
                                            permissions: frontendPermissions,
                                            backendPermissions: backendPermissions,
                                            backendRole: roleCode,
                                            role: (roleCode || userData.role || '').toUpperCase(),
                                            menuKeys,
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
            
            // Fetch user permissions and role from backend
            let backendPermissions = [];
            let frontendPermissions = [];
            let roleCode = null;
            let menuKeys = [];
            let menuItems = [];
            try {
                // Pass token directly to avoid localStorage timing issues
                const permResult = await getUserPermissions(response.token);
                backendPermissions = permResult.permissions || [];
                roleCode = permResult.role_code || null;
                frontendPermissions = mapBackendPermissionsToFrontend(backendPermissions);
                menuItems = permResult.menu_items || [];
                menuKeys = permResult.menu_keys || menuItems.map((m) => m.code);
            } catch (error) {
                console.warn('Failed to fetch permissions:', error);
                // Continue without permissions - user can still login
            }

            // Use the actual role from backend instead of guessing
            const userRole = (roleCode || 'CUSTOMER').toUpperCase();

            const userData = {
                ...response.user,
                name: response.user.full_name || response.user.name,
                phone: response.user.mobile_number || response.user.phone,
                role: userRole,
                backendRole: roleCode,
                permissions: frontendPermissions,
                backendPermissions: backendPermissions,
                menuKeys,
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
            // Backend always assigns CUSTOMER role and only customer permissions; role_id is not required
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

            // Fetch permissions (same as login flow)
            let backendPermissions = [];
            let frontendPermissions = [];
            let roleCode = null;
            let menuKeys = [];
            let menuItems = [];
            try {
                const permResult = await getUserPermissions(response.token);
                backendPermissions = permResult.permissions || [];
                roleCode = permResult.role_code || null;
                frontendPermissions = mapBackendPermissionsToFrontend(backendPermissions);
                menuItems = permResult.menu_items || [];
                menuKeys = permResult.menu_keys || menuItems.map((m) => m.code);
            } catch (error) {
                console.warn('Failed to fetch permissions after register:', error);
            }

            const userRole = (roleCode || 'CUSTOMER').toUpperCase();

            const fullUserData = {
                ...response.user,
                name: response.user.full_name || response.user.name,
                phone: response.user.mobile_number || response.user.phone || userData.phone,
                role: userRole,
                backendRole: roleCode,
                permissions: frontendPermissions,
                backendPermissions: backendPermissions,
                menuKeys,
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
        const isPermissionUpdate = updates.permissions || updates.backendPermissions || updates.role || updates.menuKeys !== undefined || updates.menuItems !== undefined;
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
