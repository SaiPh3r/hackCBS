import React from "react";
import { Home, ClipboardList, Settings, BookOpen, MessageCircle } from "lucide-react";
import ClassCard from "../components/ClassCard";

export default function ClassroomPage() {
  

  return (
    <div className="flex bg-black min-h-screen text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0b0b0b] border-r border-purple-900/30 flex flex-col p-6">
        <h1 className="text-2xl font-bold mb-8 text-purple-400" >Assignly</h1>

        <nav className="flex flex-col gap-6 text-gray-300 text-lg">
          <a href="#" className="flex items-center gap-3 hover:text-purple-400 transition">
            <Home size={22} /> Home
          </a>
          <a href="#" className="flex items-center gap-3 hover:text-purple-400 transition">
            <ClipboardList size={22} /> To-Do
          </a>
          <a href="#" className="flex items-center gap-3 hover:text-purple-400 transition">
            <BookOpen size={22} /> Classes
          </a>
          <a href="#" className="flex items-center gap-3 hover:text-purple-400 transition mt-auto">
            <Settings size={22} /> Settings
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <h2 className="text-3xl font-bold mb-8">Your Classes</h2>

        {/* Class Cards Grid */}
        <ClassCard />
      </main>

      {/* Chatbot Panel */}
      <aside className="w-[350px] border-l border-purple-900/30 bg-[#0a0a0a] p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle className="text-purple-400" size={24} />
          <h3 className="text-xl font-semibold">Assignly AI</h3>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {/* Example Chat Bubbles */}
          <div className="bg-purple-700/30 p-3 rounded-lg self-start w-fit">
            Hey! Need help completing your unsubmitted assignments?
          </div>
          <div className="bg-purple-600 p-3 rounded-lg self-end w-fit ml-auto">
            Yes, show me what's pending.
          </div>
        </div>

        {/* Input Box */}
        <div className="flex gap-2">
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
    </div>
  );
}
