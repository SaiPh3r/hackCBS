import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, Paperclip, X } from "lucide-react";
import FileUploader from "../pages/FileUploader";

const BASE_URL = "http://localhost:2000"; // FastAPI backend

export default function ChatBot({ setAnswer }) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSendFile = () => {
    if (uploadedFile) {
      setMessages((prev) => [
        ...prev,
        { sender: "user", text: `Uploaded file: ${uploadedFile.name}` },
        {
          sender: "bot",
          text: `✅ Got it! "${uploadedFile.name}" has been uploaded successfully.`,
        },
      ]);
      setShowUploadModal(false);
      setUploadedFile(null);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const newMessage = { sender: "user", text: inputValue };
    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: inputValue,
          chat_history: messages.map((msg) => ({
            sender: msg.sender,
            text: msg.text,
          })),
        }),
      });

      const data = await response.json();

      const botMsg = {
        sender: "bot",
        text: data.error
          ? `⚠️ ${data.error}`
          : data.answer || "🤖 No response received.",
      };

      setMessages((prev) => [...prev, botMsg]);
      if (setAnswer) setAnswer(data.answer || "");
    } catch (err) {
      console.error("API Error:", err);
      const botMsg = {
        sender: "bot",
        text: "⚠️ Sorry, something went wrong with the server.",
      };
      setMessages((prev) => [...prev, botMsg]);
      if (setAnswer) setAnswer("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="w-[400px] border-l h-screen  border-purple-900/30 bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-purple-900/30">
        <MessageCircle className="text-purple-400" size={22} />
        <h3 className="text-lg font-semibold text-gray-100">Assignly AI</h3>
      </div>

      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto   px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-purple-800/50 scrollbar-track-transparent"
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`max-w-[80%] p-3 rounded-xl text-sm animate-fadeIn ${
              msg.sender === "bot"
                ? "bg-[#1a1a1a] text-gray-200 self-start"
                : "bg-purple-700/70 text-white self-end ml-auto"
            }`}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="text-gray-400 text-sm italic animate-pulse">
            Assignly is typing...
          </div>
        )}
      </div>

      {/* Input Bar (Sticky Bottom) */}
      <div className="border-t border-purple-900/30 w-auto p-4 bottom-0 fixed flex items-center gap-2 bg-[#0a0a0a]">
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-purple-700/30 hover:bg-purple-700/50 p-2 rounded-lg transition"
        >
          <Paperclip size={16} className="text-purple-400" />
        </button>

        <input
          type="text"
          placeholder="Ask Assignly AI..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          className="flex-1 bg-[#111] border border-purple-800/40 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-700"
        />

        <button
          onClick={handleSendMessage}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition disabled:opacity-50"
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
              <FileUploader setUploadedFile={setUploadedFile} />
            ) : (
              <>
                <p className="text-gray-300 mb-4">
                  Selected:{" "}
                  <span className="font-semibold">{uploadedFile.name}</span>
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
