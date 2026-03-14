import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (!formData.first_name || !formData.last_name) {
      setError("First name and last name are required!");
      return;
    }

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name
      };
      await api.post('/api/auth/signup', payload);
      alert("Account created successfully! Please login.");
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || "Signup failed. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-[600px] bg-white p-8 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)]">
      <form onSubmit={handleSignup} className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold text-center text- mb-6">Create an Account</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <input
          className="p-3 border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
          type="text"
          name="first_name"
          placeholder="First Name"
          value={formData.first_name}
          onChange={handleChange}
          required
        />
        
        <input
          className="p-3 border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
          type="text"
          name="last_name"
          placeholder="Last Name"
          value={formData.last_name}
          onChange={handleChange}
          required
        />
        
        <input
          className="p-3 border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          required
        />
        
        <input
          className="p-3 border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        
        <input
          className="p-3 border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />
        
        <button type="submit" className="mt-2 p-3 text-white font-semibold text-base rounded-lg
                       bg-gradient-to-br from-[#667eea] to-[#764ba2]
                       transition-all duration-300 ease-in-out
                       hover:-translate-y-0.5
                       hover:shadow-[0_5px_15px_rgba(102,126,234,0.4)]
                       active:translate-y-0">Sign Up</button>
      </form>
      <p className="pt-3">
        Already have an account? <Link to="/login" className='underline text-blue-900'>Login here</Link>
      </p>
    </div>
    </div>
  );
};

export default SignupPage;