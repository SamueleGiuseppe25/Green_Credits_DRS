import React, { useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Leaf, Menu, X } from 'lucide-react'

export const PublicLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-gray-700 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-emerald-600">
            <Leaf className="h-6 w-6" />
            <span>GreenCredits</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
            <a href="/#how-it-works" className="hover:text-emerald-600 transition-colors">How it Works</a>
            <a href="/#pricing" className="hover:text-emerald-600 transition-colors">Pricing</a>
            <a href="/#about" className="hover:text-emerald-600 transition-colors">About</a>
          </nav>

          {/* Desktop auth buttons */}
          <div className="hidden md:flex items-center gap-3 text-sm">
            <Link to="/login" className="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Login
            </Link>
            <Link to="/signup" className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 pb-4 pt-2 space-y-1">
            <a
              href="/#how-it-works"
              className="block px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setMobileOpen(false)}
            >
              How it Works
            </a>
            <a
              href="/#pricing"
              className="block px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setMobileOpen(false)}
            >
              Pricing
            </a>
            <a
              href="/#about"
              className="block px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setMobileOpen(false)}
            >
              About
            </a>
            <hr className="border-gray-200 dark:border-gray-700" />
            <Link
              to="/login"
              className="block px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setMobileOpen(false)}
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="block px-3 py-2 rounded-lg text-sm bg-emerald-600 text-white text-center hover:bg-emerald-700"
              onClick={() => setMobileOpen(false)}
            >
              Get Started
            </Link>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Toaster position="top-right" toastOptions={{ style: { background: '#111827', color: 'white' } }} />
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
                <Leaf className="h-5 w-5 text-emerald-500" />
                <span>GreenCredits</span>
              </div>
              <p className="text-sm leading-relaxed">
                Making recycling rewarding. Turn your bottles and cans into real value while helping the environment.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
                <li><a href="/#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link to="/map" className="hover:text-white transition-colors">Return Points Map</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/#about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-800 text-center text-sm">
            &copy; {new Date().getFullYear()} GreenCredits. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
