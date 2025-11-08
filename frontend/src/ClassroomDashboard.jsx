import React, { useState } from "react";

const BASE_URL = "http://localhost:2000";

export default function ClassroomDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Login
  const handleLogin = async () => {
    const res = await fetch(`${BASE_URL}/login`);
    const data = await res.json();
    window.location.href = data.auth_url; // redirect user to Google OAuth
  };

  // Step 2: Fetch courses after user logs in
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/courses`);
      const data = await res.json();
      if (data.courses) {
        setCourses(data.courses);
        setIsLoggedIn(true);
      } else {
        alert("Please log in first.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Fetch assignments for selected course
  const fetchAssignments = async (courseId) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: courseId }),
      });
      const data = await res.json();
      setAssignments(data.assignments || []);
      setSelectedCourse(courseId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111111] border-r border-purple-800/20 p-6">
        <h1 className="text-2xl font-bold mb-8">StudyBuddy Classroom</h1>
        <nav className="space-y-4">
          <button
            onClick={fetchCourses}
            className="w-full text-left hover:text-purple-400"
          >
            📘 Courses
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full text-left hover:text-purple-400"
          >
            🔁 Refresh
          </button>
        </nav>
      </aside>

      {/* Main Section */}
      <main className="flex-1 p-10">
        {!isLoggedIn && courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-40">
            <h2 className="text-3xl font-semibold mb-6">
              Welcome to Classroom Dashboard
            </h2>
            <button
              onClick={handleLogin}
              className="px-6 py-3 bg-purple-600 rounded-xl font-semibold hover:bg-purple-700 transition"
            >
              Login with Google Classroom
            </button>
          </div>
        ) : loading ? (
          <div className="text-center mt-40 text-xl animate-pulse">
            Loading...
          </div>
        ) : selectedCourse ? (
          <>
            <h2 className="text-3xl font-semibold mb-6">
              Assignments for {courses.find((c) => c.id === selectedCourse)?.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments.length > 0 ? (
                assignments.map((a, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-purple-700 to-purple-900 rounded-2xl p-6 shadow-lg hover:scale-[1.02] transition"
                  >
                    <h3 className="text-xl font-semibold">{a.title}</h3>
                    <p className="text-sm mt-2 text-gray-200">
                      Status: {a.state}
                    </p>
                    <p className="text-sm mt-1 text-gray-300">
                      {a.is_open ? "🟢 Open" : "🔴 Closed"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 mt-10">No assignments found.</p>
              )}
            </div>
            <button
              onClick={() => {
                setSelectedCourse(null);
                setAssignments([]);
              }}
              className="mt-10 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
            >
              ← Back to Courses
            </button>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-semibold mb-6">Your Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => fetchAssignments(course.id)}
                  className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 cursor-pointer hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(168,85,247,0.25)] transition"
                >
                  <h3 className="text-xl font-semibold">{course.name}</h3>
                  <p className="text-sm text-gray-300 mt-2">
                    Section: {course.section || "N/A"}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
