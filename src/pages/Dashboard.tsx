import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/authContext";


const Dashboard = () => {

  const { user, logout } = useAuth();
  if (!user) return <Navigate to ='/login' />;



  return (
    <div>
      <h1 className="text-2xl font-bold">
        Welcome, {user.username}
      </h1>

      <button
        onClick={logout}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded">
          Logout
      </button>
    </div>
  )
}

export default Dashboard