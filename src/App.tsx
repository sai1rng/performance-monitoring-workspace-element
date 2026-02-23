import { useState } from 'react'
import { BrowserRouter as Router } from "react-router-dom";
import { AppRoutes } from "./routes";
import './App.css'

function App() {

  return (
    <Router>
      <div className="app-container">
        <main className="main-content">
          <AppRoutes />
        </main>
      </div>
    </Router>
  );
}

export default App
