import { Navigate, Route, Routes } from 'react-router-dom';

import CourseDetail from './pages/CourseDetail';
import Courses from './pages/Courses';
import Home from './pages/Home';
import Lesson from './pages/Lesson';
import Login from './pages/Login';
import Signup from './pages/Signup';

function App() {
  return (
    <div className="min-h-dvh bg-ice text-navy">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:slug" element={<CourseDetail />} />
          <Route path="/lessons/:id" element={<Lesson />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
