
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatBot from "../components/ChatBot";
import FileUploader from "./FileUploader";

const BASE_URL = "http://localhost:2000";

export default function ClassroomDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(false);

  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentDetails, setAssignmentDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // ✅ Track ChatBot-generated answer dynamically
  const [chatAnswer, setChatAnswer] = useState("");

  const navigate = useNavigate();

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
      setSelectedAssignment(null);
      setAssignmentDetails(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignmentDetails = async (courseId, assignmentId) => {
    setDetailsLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}/assignment_details?course_id=${courseId}&assignment_id=${assignmentId}`
      );
      const data = await res.json();
      setAssignmentDetails(data);
      setSelectedAssignment(assignmentId);
      const materials = data.assignment.materials || [];
      const driveFile = materials.find((m) => m.driveFile)?.driveFile?.driveFile;
      if (driveFile?.id) {
        await fetch(`${BASE_URL}/download_file?file_id=${driveFile.id}`);
      }
    } catch (err) {
      console.error("Error fetching assignment details:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // ✅ Updated submit to use ChatBot-generated answer dynamically
  const handleSubmitAssignment = async () => {
    try {
      if (!selectedCourse || !selectedAssignment || !assignmentDetails) {
        alert("Please select an assignment first.");
        return;
      }

      if (!chatAnswer) {
        alert("ChatBot has not generated an answer yet!");
        return;
      }

      const courseId =
        typeof selectedCourse === "object" ? selectedCourse.id : selectedCourse;
      const assignmentId =
        typeof selectedAssignment === "object" ? selectedAssignment.id : selectedAssignment;
      const submissionId =
        assignmentDetails.submissions?.[0]?.id || "Cg4I4bCPopEUENbF0ZT8Fw";

      const response = await fetch(`${BASE_URL}/submit_assignment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: courseId,
          assignment_id: assignmentId,
          submission_id: submissionId,
          answer_text: chatAnswer,
        }),
      });

      if (!response.ok) {
        throw new Error(`❌ Failed to upload assignment: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Upload response:", data);

      if (data.file_url) {
        const downloadLink = document.createElement("a");
        downloadLink.href = data.file_url;
        downloadLink.target = "_blank";
        downloadLink.rel = "noopener noreferrer";
        downloadLink.textContent = "📥 Download your assignment DOCX";
        downloadLink.className = "text-purple-400 underline mt-4 block";

        const container = document.getElementById("submission-link-container");
        if (container) {
          container.innerHTML = "";
          container.appendChild(downloadLink);
        } else {
          alert(`✅ Assignment uploaded! Download here: ${data.file_url}`);
        }
      } else {
        alert("✅ Assignment uploaded successfully, but no file URL returned.");
      }
    } catch (error) {
      console.error("❌ Error uploading assignment:", error);
      alert("Upload failed. Check console for details.");
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
    try {
      const res = await fetch("http://localhost:2000/signout");
      const data = await res.json();
      console.log(data.status);
      alert("You have been signed out successfully!");
      setIsLoggedIn(false);
      setCourses([]);
      setAssignments([]);
      setSelectedCourse(null);
      setSelectedAssignment(null);
      setAssignmentDetails(null);
      navigate("/"); // redirect to home or login page
    } catch (err) {
      console.error("Logout failed:", err);
    }
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
          <div className="text-center mt-40 text-xl animate-pulse">Loading...</div>
        ) : !isLoggedIn ? (
          <div className="flex flex-col items-center justify-center mt-40">
            <h2 className="text-3xl font-semibold mb-6">Welcome to Assignly Dashboard</h2>
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
              Assignments for {courses.find((c) => c.id === selectedCourse)?.name}
            </h2>
            <button
              onClick={() => {
                setSelectedCourse(null);
                setAssignments([]);
                setSelectedAssignment(null);
                setAssignmentDetails(null);
                setChatAnswer(""); // clear previous answer
              }}
              className="mt-10 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 mb-5"
            >
              ← Back to Courses
            </button>

            {/* Assignments List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments.length > 0 ? (
                assignments.map((a, index) => (
                  <div
                    key={index}
                    onClick={() => fetchAssignmentDetails(selectedCourse, a.id)}
                    className={`bg-gradient-to-br from-purple-700 to-purple-900 rounded-2xl p-6 shadow-lg cursor-pointer transition ${
                      selectedAssignment === a.id ? "ring-4 ring-purple-500" : ""
                    }`}
                  >
                    <h3 className="text-xl font-semibold">{a.title}</h3>
                    <p className="text-sm mt-2 text-gray-200">Status: {a.state}</p>
                    <p className="text-sm mt-1 text-gray-300">
                      {a.is_open ? "🟢 Open" : "🔴 Closed"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 mt-10">No assignments found.</p>
              )}
            </div>

            {/* Assignment Details Section */}
            {selectedAssignment && assignmentDetails && (
              <div className="mt-10 bg-gray-900 p-6 rounded-2xl shadow-lg">
                {detailsLoading ? (
                  <p className="text-gray-400 animate-pulse text-center">Loading details...</p>
                ) : (
                  <>
                    <h2 className="text-2xl font-semibold mb-4">{assignmentDetails.assignment.title}</h2>
                    <p className="text-gray-300 mb-2">
                      Description: {assignmentDetails.assignment.description || "No description"}
                    </p>
                    <p className="text-gray-300 mb-2">
                      Due Date:{" "}
                      {assignmentDetails.assignment.dueDate
                        ? `${assignmentDetails.assignment.dueDate.year}-${assignmentDetails.assignment.dueDate.month}-${assignmentDetails.assignment.dueDate.day}`
                        : "N/A"}
                    </p>

                    <h3 className="text-xl font-semibold mt-6 mb-2">Submissions</h3>
                    {assignmentDetails.submissions.length > 0 ? (
                      <ul className="text-gray-300 max-h-64 overflow-y-auto mb-4">
                        {assignmentDetails.submissions.map((s, idx) => (
                          <li key={idx} className="mb-1">
                            Student: {s.userId} | State: {s.state} | Grade: {s.assignedGrade ?? "N/A"}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-400 mb-4">No submissions yet.</p>
                    )}

                    <button
                      onClick={handleSubmitAssignment}
                      className="px-6 py-2 bg-purple-600 rounded-xl font-semibold hover:bg-purple-700 transition"
                    >
                      Submit Assignment
                    </button>

                    {/* ✅ Download link container */}
                    <div id="submission-link-container" className="mt-4"></div>
                  </>
                )}
              </div>
            )}
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
      <ChatBot setAnswer={setChatAnswer} />
    </div>
  );
}

