import { Link } from "react-router-dom"
import { useAuth } from '../hooks/authContext';

const Header = () => {
    const { user } = useAuth();
  return (
    <nav className='space-x-4 mb-4'>
          <Link to = "/" className='text-blue-500'>Home</Link>
          <Link to = "/jobs" className='text-blue-500'>Jobs</Link>
          {!user && <Link to = "/login" className='text-blue-500'>Login</Link>}
          <Link to = "/postjob" className='text-blue-500'>Post Job</Link>
          {user && <Link to = "/dashboard" className='text-blue-500'>Dashboard</Link>}
    </nav>
  )
}

export default Header