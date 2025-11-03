import { useAuth } from "../hooks/authContext"
import { Navigate, Outlet } from "react-router-dom"

const ProtectedRoutes = () => {
    const { user } = useAuth();
  return (
    user ? <Outlet /> : <Navigate to= "/login" replace />
  )
}

export default ProtectedRoutes