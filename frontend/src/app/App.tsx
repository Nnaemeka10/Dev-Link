import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from '../features/authentication/pages/Login.tsx';
import  {SignUp}   from '../features/authentication/pages/SignUp.tsx';
import Home  from '../features/landing/pages/Home.tsx';

function App() {
  return (
    <Router>
      <div>

        <Routes>
          /* <Route path='/' element={<Home />} />
          {/* <Route path='/jobs/:id' element={<JobDetails />} /> */}
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<SignUp />} />
          {/* <Route path='/dashboard' element={<Dashboard />} /> */}

          {/* <Route element = {<ProtectedRoutes />}>
            <Route path='/postjob' element={<PostJob />} />
          </Route> */}
        </Routes>
      </div>
    </Router>
  )
}

export default App