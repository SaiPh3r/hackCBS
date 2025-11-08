import React, { useState } from "react";
import { Menu, X, ArrowRight, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="font-sans bg-black text-white min-h-screen scroll-smooth">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full bg-black/90 backdrop-blur-md z-50 border-b border-purple-800/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-8 py-5">
          {/* Logo */}
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Assignly
          </h1>

          {/* Centered Links */}
          <div className="hidden md:flex gap-10 text-lg font-medium">
            <a href="#home" className="hover:text-purple-400 transition">
              Home
            </a>
            <a href="#features" className="hover:text-purple-400 transition">
              Features
            </a>
            <a href="#about" className="hover:text-purple-400 transition">
              About
            </a>
            <a href="#pricing" className="hover:text-purple-400 transition">
              Pricing
            </a>
          </div>

          {/* Right CTA */}
          <button
            onClick={() => navigate("/ClassroomDashboard")}
            className="hidden md:flex bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded-md font-semibold transition items-center gap-2"
          >
            Connect Your Classroom <ArrowRight size={18} />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-gray-200"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-black flex flex-col items-center py-4 gap-4 text-lg border-t border-purple-900/30">
            <a href="#home" onClick={() => setMenuOpen(false)}>
              Home
            </a>
            <a href="#features" onClick={() => setMenuOpen(false)}>
              Features
            </a>
            <a href="#about" onClick={() => setMenuOpen(false)}>
              About
            </a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>
              Pricing
            </a>

            <button
              onClick={() => {
                setMenuOpen(false);
                navigate("/ClassroomDashboard");
              }}
              className="bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded-md font-semibold transition flex items-center gap-2 text-xl"
            >
              Connect Your Classroom <ArrowRight size={18} />
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section
        id="home"
        className="flex flex-col items-center justify-center text-center min-h-screen px-6 pt-32 bg-black"
      >
        <div className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
          <div className="flex justify-center flex-wrap">
            Manage Your{" "}
            <span className="ml-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
              Assignments
            </span>
          </div>
          <br />
          Smarter & Faster.
        </div>

        <p className="text-gray-400 text-lg max-w-2xl mb-10">
          Assignly syncs with Google Classroom to fetch your upcoming tasks,
          track unsubmitted work, and keep your academic life organized
          effortlessly.
        </p>

        <button
          onClick={() => navigate("/ClassroomDashboard")}
          className="bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white font-semibold px-8 py-3 rounded-lg text-lg shadow-lg transition flex items-center gap-2"
        >
          Connect Your Classroom <ArrowRight size={20} />
        </button>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-24 px-6 bg-black text-center border-t border-purple-900/30"
      >
        <h2 className="text-4xl font-bold mb-12">
          Powerful <span className="text-purple-400">Features</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {[
            {
              title: "Auto Fetch Assignments",
              desc: "Instantly syncs with Google Classroom and lists all your assignments automatically.",
            },
            {
              title: "Smart Deadline Tracker",
              desc: "Tracks due dates, sends reminders, and helps you stay on top of your tasks.",
            },
            {
              title: "Submission Insights",
              desc: "See which assignments are done, pending, or missed — all in one clean dashboard.",
            },
            {
              title: "Dark Minimal UI",
              desc: "Built with a clean black-purple theme for a distraction-free experience.",
            },
            {
              title: "Cross-Platform Sync",
              desc: "Access your assignments across devices with real-time cloud updates.",
            },
            {
              title: "Privacy First",
              desc: "We only fetch classroom data you approve — your learning, your control.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-[#0a0a0a] p-8 rounded-2xl border border-purple-800/20 hover:border-purple-500/70 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition"
            >
              <CheckCircle className="text-purple-400 mx-auto mb-4" size={40} />
              <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-400 text-base">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className="py-24 px-6 bg-black text-center border-t border-purple-900/30"
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">
            Built for <span className="text-purple-400">Students</span>, Loved
            by <span className="text-purple-400">Learners</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Assignly integrates directly with your Google Classroom account —
            fetching all your assignments automatically. It highlights unturned
            tasks, due dates, and provides reminders so you never miss a
            submission again.
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="py-24 px-6 bg-black text-center border-t border-purple-900/30"
      >
        <h2 className="text-4xl font-bold mb-12 text-purple-400">Pricing</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              name: "Free",
              price: "$0",
              desc: "For students managing a few classes.",
              button: "Get Started",
            },
            {
              name: "Pro",
              price: "$5/mo",
              desc: "Perfect for power users and educators.",
              button: "Upgrade",
            },
            {
              name: "Team",
              price: "$15/mo",
              desc: "For schools & collaborative study groups.",
              button: "Contact Us",
            },
          ].map((plan, i) => (
            <div
              key={i}
              className="bg-[#0a0a0a] p-10 rounded-2xl border border-purple-800/30 hover:border-purple-500/70 hover:shadow-[0_0_25px_rgba(168,85,247,0.25)] hover:scale-[1.03] transition transform"
            >
              <h3 className="text-2xl font-semibold mb-3">{plan.name}</h3>
              <p className="text-gray-400 mb-4">{plan.desc}</p>
              <p className="text-5xl font-extrabold mb-6">{plan.price}</p>
              <button className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-md font-semibold transition">
                {plan.button}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-purple-900/30 py-6 text-center text-gray-500">
        © {new Date().getFullYear()} Assignly — Built with ❤️ by Students.
      </footer>
    </div>
  );
}
