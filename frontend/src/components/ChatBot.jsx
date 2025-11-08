import React, { useState, useRef } from "react";
import { MessageCircle, Paperclip, X } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export default function ChatBot() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  // ✅ Scroll to bottom on new message
  React.useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // 📤 File upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setUploadedFile(file);
  };

  const handleSendFile = () => {
    if (uploadedFile) {
      setMessages((prev) => [
        ...prev,
        { sender: "user", text: `Uploaded file: ${uploadedFile.name}` },
        { sender: "bot", text: `Got it! "${uploadedFile.name}" has been uploaded successfully.` },
      ]);
      setShowUploadModal(false);
      setUploadedFile(null);
    }
  };

  // 💬 Handle send message with Gemini response
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const newMessage = { sender: "user", text: inputValue };
    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    setLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const chatHistory = messages.map((msg) => ({
        role: msg.sender === "bot" ? "model" : "user",
        parts: [{ text: msg.text }],
      }));

      const chat = model.startChat({ history: chatHistory });

      const result = await chat.sendMessage(inputValue);
      const response = result.response.text();

      setMessages((prev) => [...prev, { sender: "bot", text: response }]);
    } catch (error) {
      console.error("Gemini API Error:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Sorry, there was an issue getting a response." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="w-[350px] border-l border-purple-900/30 bg-[#0a0a0a] p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <MessageCircle className="text-purple-400" size={24} />
        <h3 className="text-xl font-semibold">Assignly AI</h3>
      </div>

      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-thin scrollbar-thumb-purple-800/50 scrollbar-track-transparent"
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg max-w-[85%] animate-fadeIn ${
              msg.sender === "bot"
                ? "bg-purple-700/30 text-left self-start"
                : "bg-purple-600 text-right self-end ml-auto"
            }`}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="text-gray-400 text-sm italic animate-pulse">Assignly is typing...</div>
        )}
      </div>

      {/* Input Area */}
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
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          className="flex-1 bg-[#111] border border-purple-800/40 rounded-md px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
        />

        <button
          onClick={handleSendMessage}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50"
        >
          Send
        </button>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#121212] border border-purple-800 rounded-2xl p-8 w-[400px] text-center shadow-2xl relative">
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
    </aside>
  );
}
