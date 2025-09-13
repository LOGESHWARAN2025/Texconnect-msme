import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import Modal from '../common/Modal';

interface CreateAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const InputField: React.FC<{id: string, name: string, type?: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, label: string, required?: boolean }> = 
  ({id, name, type = "text", value, onChange, label, required = true }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>
    <input 
      id={id} 
      name={name} 
      type={type} 
      value={value} 
      onChange={onChange}
      required={required}
      className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
    />
  </div>
);

const CreateAdminModal: React.FC<CreateAdminModalProps> = ({isOpen, onClose}) => {
    const { register } = useAppContext();
    const initialFormData = {
        username: '',
        firstname: '',
        phone: '',
        email: '',
        password: '',
        adminId: '',
        gstNumber: 'ADMINISTRATOR',
    };
    const [formData, setFormData] = useState(initialFormData);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        const { gstNumber, ...requiredFields } = formData;
        const allFieldsFilled = Object.values(requiredFields).every(field => field.trim() !== '');

        if (allFieldsFilled) {
            const result = await register({ ...formData, role: 'admin', address: '' });
            if (result.success) {
                alert("Admin registration successful! They must verify their email before they can log in.");
                setFormData(initialFormData); // Reset form
                onClose();
            } else {
                alert(`Failed to create admin. Reason: ${result.reason || 'Unknown error'}`);
            }
        } else {
            alert("Please fill all required fields.");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Admin">
             <form onSubmit={handleRegister} className="space-y-4">
                <InputField id="username" name="username" value={formData.username} onChange={handleInputChange} label="Username" />
                <InputField id="firstname" name="firstname" value={formData.firstname} onChange={handleInputChange} label="Full Name" />
                <InputField id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} label="Phone Number" />
                <InputField id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} label="Email Address" />
                <InputField id="password" name="password" type="password" value={formData.password} onChange={handleInputChange} label="Password" />
                <InputField id="adminId" name="adminId" value={formData.adminId} onChange={handleInputChange} label="Admin ID"/>

                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300 transition">Cancel</button>
                    <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition shadow">Create Admin</button>
                </div>
             </form>
        </Modal>
    );
};

export default CreateAdminModal;
