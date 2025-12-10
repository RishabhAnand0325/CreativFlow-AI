import React from 'react';

interface NavbarProps {
  onLogout: () => void;
  userProfileUrl: string;
}

const Navbar: React.FC<NavbarProps> = ({ onLogout, userProfileUrl }) => (
  <header className="navbar">
    <div className="navbar-left">
      <div className="navbar-logo">
        <svg className="logo-icon" viewBox="0 0 100 100"><path d="M20 20 L80 80 M80 20 L20 80" stroke="currentColor" strokeWidth="12" strokeLinecap="round" /></svg>
        <span className="logo-text">AI CREAT</span>
      </div>
      <nav className="navbar-nav">
        <a href="/user-dashboard" className="nav-item">Dashboard</a>
        <a href="#" className="nav-item active">Recreate</a>
        <a href="#" className="nav-item">Project History</a>
      </nav>
    </div>
    <div className="navbar-right">
      <button className="icon-button"><i className="fas fa-bell"></i></button>
      <button className="icon-button"><i className="fas fa-cog"></i></button>
      <button className="icon-button" onClick={onLogout} title="Logout"><i className="fas fa-sign-out-alt"></i></button>
      <div className="user-profile">
        <img src={userProfileUrl} alt="User" className="profile-avatar" />
      </div>
    </div>
  </header>
);

export default Navbar;
