import React, { useState } from "react";

const BASE_URL = "http://localhost:2000";

function FileUploader() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage(""); // reset message when selecting a new file
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${BASE_URL}/upload/book`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setMessage(`✅ "${file.name}" uploaded successfully!`);
      setFile(null);
      console.log("Server response:", data);
    } catch (err) {
      console.error("Upload error:", err);
      setMessage("⚠️ File upload failed.");
    }
  };

  return (
    <div className="flex flex-col items-center p-6 bg-[#121212] border border-purple-800 rounded-2xl shadow-lg w-full max-w-sm">
      <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
        Upload PDF
      </h3>

      <input
        type="file"
        accept="application/pdf"
        id="fileInput"
        className="hidden"
        onChange={handleFileChange}
      />
      <label
        htmlFor="fileInput"
        className="cursor-pointer px-6 py-3 bg-purple-700 hover:bg-purple-800 rounded-lg text-white font-semibold mb-4"
      >
        {file ? `Selected: ${file.name}` : "Choose File"}
      </label>

      <button
        onClick={handleUpload}
        className={`w-full px-6 py-3 rounded-lg font-semibold text-white ${
          file ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-600 cursor-not-allowed"
        }`}
        disabled={!file}
      >
        Upload
      </button>

      {message && (
        <p className="mt-4 text-sm text-gray-300 text-center">{message}</p>
      )}
    </div>
  );
}

export default FileUploader;