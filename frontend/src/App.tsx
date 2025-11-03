import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Header from './layout/Header';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import Login from './pages/Login';
import PostJob from './pages/PostJob';
import Dashboard from './pages/Dashboard';

import ProtectedRoutes from './components/ProtectedRoutes';

function App() {
  return (
    <Router>
      <div className='p-4'>
       <Header />
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/jobs' element={<Jobs />} />
          <Route path='/jobs/:id' element={<JobDetails />} />
          <Route path='/login' element={<Login />} />
          <Route path='/dashboard' element={<Dashboard />} />

          <Route element = {<ProtectedRoutes />}>
            <Route path='/postjob' element={<PostJob />} />
          </Route>
        </Routes>
      </div>
    </Router>
  )
}

export default App

// todo
// protect routes centrally
// Solution: Create a ProtectedRoute Wrapper Component
// tsx
// // src/components/ProtectedRoute.tsx
// import { useAuth } from '../context/AuthContext';
// import { Navigate, Outlet } from 'react-router-dom';

// export default function ProtectedRoute() {
//   const { user } = useAuth();
//   return user ? <Outlet /> : <Navigate to="/login" replace />;
// }
// Implementation Steps
// 1. Update Your Router Configuration
// tsx
// // App.tsx
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import ProtectedRoute from './components/ProtectedRoute';
// import Dashboard from './pages/Dashboard';
// import Login from './pages/Login';

// function App() {
//   return (
//     <Router>
//       <Routes>
//         {/* Public routes */}
//         <Route path="/login" element={<Login />} />
        
//         {/* Protected routes */}
//         <Route element={<ProtectedRoute />}>
//           <Route path="/dashboard" element={<Dashboard />} />
//           <Route path="/profile" element={<Profile />} />
//           {/* Add more protected routes here */}
//         </Route>
//       </Routes>
//     </Router>
//   );
// }
// 2. How It Works
// ProtectedRoute checks authentication automatically

// Outlet renders child routes if user is authenticated

// Navigate redirects to login if no user exists

// No need to manually check user in every protected page

// Alternative: Route Wrapper Pattern
// If you prefer wrapping individual routes:

// tsx
// // Usage in App.tsx
// <Route 
//   path="/dashboard" 
//   element={
//     <RequireAuth>
//       <Dashboard />
//     </RequireAuth>
//   } 
// />

// // RequireAuth.tsx
// function RequireAuth({ children }: { children: JSX.Element }) {
//   const { user } = useAuth();
//   return user ? children : <Navigate to="/login" replace />;
// }
// Benefits
// Clean Components: No repeated auth checks

// Central Control: Change redirect logic in one place

// Type Safety: Works with TypeScript

// React Router v6+: Uses modern routing conventions

