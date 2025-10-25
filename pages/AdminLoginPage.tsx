import React, { useState } from 'react';
import { useAppContext } from '../context/SupabaseContext';
import { useLocalization } from '../hooks/useLocalization';
import { MOCK_USERS } from '../constants';
// fix: Removed unused v9 modular imports for auth and firestore.

interface AdminLoginPageProps {
  onSwitchToUserLogin: () => void;
}

const InputField: React.FC<{id: string, name: string, type?: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, label: string, required?: boolean, children?: React.ReactNode}> = 
  ({id, name, type = "text", value, onChange, label, required = true, children}) => (
  <div>
    <label htmlFor={id} className="text-xs font-normal text-slate-600">{label}</label>
    <div className="relative flex items-center">
      <input 
        id={id} 
        name={name} 
        type={type} 
        value={value} 
        onChange={onChange}
        required={required}
        className="w-full py-2 text-sm text-slate-800 bg-transparent border-b border-slate-300 focus:outline-none focus:border-primary"
        autoComplete={name === 'password' ? 'current-password' : name === 'email' ? 'email' : 'off'}
      />
      <div className="absolute right-1 text-slate-400">
        {children}
      </div>
    </div>
  </div>
);


const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onSwitchToUserLogin }) => {
  const { login } = useAppContext();
  const { t } = useLocalization();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const adminUser = MOCK_USERS.find(user => user.role === 'admin');
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Check if this is the admin credentials
      const adminEmail = 'gokulsaravanakumar267@gmail.com';
      const adminPassword = 'Gokulsha990@';
      const isAdminCredentials = email === adminEmail && password === adminPassword;
      
      if (isAdminCredentials) {
        try {
          // In development mode, simulate successful admin login
          
          // Set the admin user in context directly
          if (adminUser) {
            // Simulate successful login by calling the context login function
            const result = await login(email, password);
            if (result.success) {
              return;
            }
          }
          
          // If login fails, create the admin user (this won't execute in dev mode)
          const userCredential = await auth.createUserWithEmailAndPassword(email, password);
          
          // Create admin user document
          const adminData = {
            email: email,
            username: 'TexConnect Admin',
            firstname: 'Admin',
            phone: '1234567890',
            address: '123 Admin Lane',
            role: 'admin',
            gstNumber: 'ADMIN',
            isApproved: true,
            isEmailVerified: true,
            adminId: 'SUPERADMIN01'
          };
          
          await db.collection("users").doc(userCredential.user!.uid).set(adminData);
          return;
          
        } catch (creationError: any) {
          if (creationError.code === 'auth/email-already-in-use') {
            // User exists but login failed - try regular login
            const result = await login(email, password);
            if (!result.success) {
              setError('Invalid admin credentials');
            }
          } else {
            console.error('Admin setup error:', creationError);
            setError('Failed to setup admin account');
          }
        }
      } else {
        // Regular login attempt
        const result = await login(email, password);
        if (!result.success) {
          setError('Invalid credentials');
        }
      }

    } catch (err) {
      console.error("Login error:", err);
      setError('Login failed');
    } finally {
      setIsLoading(false);
    }
  };


  const handleAutoFill = () => {
    if (adminUser) {
      setEmail(adminUser.email);
      setPassword(adminUser.password as string);
      setError('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative">
       <button 
          onClick={onSwitchToUserLogin}
          className="absolute top-6 right-6 text-sm font-semibold text-primary hover:underline py-2 px-4 rounded-lg transition"
        >
          User Login
        </button>

      <div className="max-w-md w-full bg-white p-6 md:p-8 rounded-2xl shadow-lg">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Admin Portal</h2>
            <p className="text-slate-500 text-sm">Please log in to continue.</p>
        </div>
        
        {/* DEMO HELPER */}
        {adminUser && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <p><span className="font-bold">Demo Credentials:</span></p>
            <p>Email: <code className="font-mono">{adminUser.email}</code></p>
            <p>Password: <code className="font-mono">{adminUser.password}</code></p>
            <button onClick={handleAutoFill} className="mt-2 text-sm font-semibold text-blue-600 hover:underline">Auto-fill</button>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          {error && <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</div>}
          
          <div>
            <InputField id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} label="E-mail" />
          </div>
          
          <div>
            <InputField id="password" name="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} label="Enter password">
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword 
                    ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                    : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" /><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.303 6.546A10.048 10.048 0 01.458 10c1.274 4.057 5.022 7 9.542 7 .847 0 1.669-.105 2.454-.303z" /></svg>
                  }
                </button>
            </InputField>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
              {isLoading ? 'Logging in...' : t('login')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
