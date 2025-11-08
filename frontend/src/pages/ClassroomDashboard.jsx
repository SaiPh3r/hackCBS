import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Paperclip, X } from "lucide-react";

const BASE_URL = "http://localhost:2000";

export default function ClassroomDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false); // 👈 modal state
  const [uploadedFile, setUploadedFile] = useState(null); // 👈 store uploaded file
  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCoursesOnLoad();
  }, []);

  const fetchCoursesOnLoad = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/courses`);
      const data = await res.json();
      if (data.courses && data.courses.length > 0) {
        setCourses(data.courses);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch(`${BASE_URL}/login`);
      const data = await res.json();
      if (data.auth_url) {
        window.location.href = data.auth_url;
      } else {
        alert("Login failed: No auth URL returned.");
      }
    } catch (err) {
      console.error("Login error:", err);
    }
  };

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

  // 👇 Handle file upload logic
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) setUploadedFile(file);
  };

  const handleSendFile = () => {
    if (uploadedFile) {
      console.log("File sent:", uploadedFile.name);
      alert(`"${uploadedFile.name}" sent successfully!`);
      setShowUploadModal(false);
      setUploadedFile(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-[#0b0b0b] to-[#141414] border-r border-purple-700/20 p-6 flex flex-col justify-between">
        <div>
          <button
            onClick={() => navigate("/")}
            className="text-3xl font-extrabold mb-10 bg-gradient-to-r from-purple-400 to-fuchsia-600 bg-clip-text text-transparent"
          >
            Assignly
          </button>

          <nav className="space-y-3">
            <button
              onClick={fetchCourses}
              className="flex items-center w-full px-3 py-2 rounded-lg text-left hover:bg-purple-800/20 hover:text-purple-400 transition-all duration-200"
            >
              <span className="text-lg mr-2">📘</span>
              <span>Courses</span>
            </button>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center w-full px-3 py-2 rounded-lg text-left hover:bg-purple-800/20 hover:text-purple-400 transition-all duration-200"
            >
              <span className="text-lg mr-2">🔁</span>
              <span>Refresh</span>
            </button>
          </nav>
        </div>

        <div className="border-t border-purple-800/20 pt-4 mt-6">
          <button
            onClick={async () => {
              await fetch("http://localhost:2000/signout");
              window.location.reload();
            }}
            className="flex items-center w-full px-3 py-2 rounded-lg text-left hover:bg-red-700/20 hover:text-red-400 transition-all duration-200"
          >
            <span className="text-lg mr-2">🚪</span>
            <span>Logout</span>
          </button>

          <p className="text-xs text-gray-500 mt-3 text-center">
            © 2025 Assignly Classroom
          </p>
        </div>
      </aside>

      {/* Main Section */}
      <main className="flex-1 p-10">
        {loading ? (
          <div className="text-center mt-40 text-xl animate-pulse">
            Loading...
          </div>
        ) : !isLoggedIn ? (
          <div className="flex flex-col items-center justify-center mt-40">
            <h2 className="text-3xl font-semibold mb-6">
              Welcome to Assignly Dashboard
            </h2>
            <button
              onClick={handleLogin}
              className="px-6 py-3 bg-purple-600 rounded-xl font-semibold hover:bg-purple-700 transition"
            >
              Login with Google Classroom
            </button>
          </div>
        ) : selectedCourse ? (
          <>
            <h2 className="text-3xl font-semibold ">
              Assignments for{" "}
              {courses.find((c) => c.id === selectedCourse)?.name}
            </h2>
            <button
              onClick={() => {
                setSelectedCourse(null);
                setAssignments([]);
              }}
              className="mt-10 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 mb-5"
            >
              ← Back to Courses
            </button>
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

      {/* Chat Aside */}
      <aside className="w-[350px] border-l border-purple-900/30 bg-[#0a0a0a] p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle className="text-purple-400" size={24} />
          <h3 className="text-xl font-semibold">Assignly AI</h3>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          <div className="bg-purple-700/30 p-3 rounded-lg self-start w-fit">
            Hey! Need help completing your unsubmitted assignments?
          </div>
          <div className="bg-purple-600 p-3 rounded-lg self-end w-fit ml-auto">
            Yes, show me what's pending.
          </div>
        </div>

        {/* Upload & Input Section */}
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setShowUploadModal(true)} 
            className="bg-purple-700 hover:bg-purple-800 px-3 py-2 rounded-md text-sm font-semibold flex items-center gap-2"
          >
            <Paperclip size={16} />
          </button>

          <input
            type="text"
            placeholder="Ask Assignly AI..."
            className="flex-1 bg-[#111] border border-purple-800/40 rounded-md px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
          <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md text-sm font-semibold">
            Send
          </button>
        </div>
      </aside>

      {/* 🔮 Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#121212] border border-purple-800 rounded-2xl p-8 w-[400px] text-center shadow-2xl relative">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowUploadModal(false);
                setUploadedFile(null);
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <h3 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
              Upload to Assignly Classroom
            </h3>

            {!uploadedFile ? (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="px-6 py-3 bg-purple-700 hover:bg-purple-800 rounded-lg font-semibold"
                >
                  Choose File
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-300 mb-4">
                  Selected: <span className="font-semibold">{uploadedFile.name}</span>
                </p>
                <button
                  onClick={handleSendFile}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold"
                >
                  Send
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
