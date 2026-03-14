import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axiosConfig";
import { AuthContext } from "../context/AuthContext";
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/api/auth/login", { email, password });
      login(response.data.user, response.data.access_token);
      console.log("Full user data:", response.data.user);

      navigate("/dashboard");
    } catch (err) {
    toast.error("Invalid email or password. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="  p-4 sm:p-4 lg:p-8  sm:max-w-[350px] lg:w-full bg-white  rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)]">  
        <h2 className="text-lg sm:text-xl md:text-xl lg:text-2xl font-semibold text-center mb-6">
          Login to TodoList
        </h2>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="p-3 border rounded-xl text-sm sm:text-base
                       focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="p-3 border rounded-xl text-sm sm:text-base
                       focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />

          <button
            type="submit"
            className="p-2 mt-2 sm:mt-2 sm:p-3
            
                        text-white font-semibold text-base rounded-lg
                       bg-gradient-to-br from-[#667eea] to-[#764ba2]
                       transition-all duration-300 ease-in-out
                       hover:-translate-y-0.5
                       hover:shadow-[0_5px_15px_rgba(102,126,234,0.4)]
                       active:translate-y-0"
          >
            Login
          </button>
        </form>
        <p className=" text-sm sm:text-center text-gray-500 mt-6">
          Don&apos;t have an account?{" "}
          <Link
            to="/signup"
            className="text-indigo-600 font-medium hover:underline">
            Signup here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
