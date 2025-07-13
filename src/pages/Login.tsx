import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/authContext";


const Login = () => {

  const [username, setUsername] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(username);
    navigate("/dashboard");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit = {handleLogin} className="space-y-4">
        <input 
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 rounded-md" 
          />

          <button 
            type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
            Login
          </button>
      </form>
    </div>
  )
}

export default Login

