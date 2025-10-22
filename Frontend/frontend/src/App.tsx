import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './styles/index.css';
import './App.css'

export default function App() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-primary">🎬 Cinema System</h1>
      <p className="text-gray-600 mt-4">Tailwind 4 is working!</p>
      <button className="mt-6 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition">
        Test Button
      </button>
    </div>
  );
}

