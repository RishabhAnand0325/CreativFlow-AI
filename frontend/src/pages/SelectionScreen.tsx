import React from 'react';
import '../App.css';

const SelectionScreen: React.FC = () => {
  return (
    <div className="screen-container">
      <button className="panel-button">
        Admin Panel Screens
      </button>
      <a href="/login" style={{textDecoration: "none"}}>
      <button className="panel-button">
        User Panel Screens
      </button></a>
    </div>
  );
};

export default SelectionScreen;