// src/components/Navbar.js
import React from "react";
import { Navbar, Nav } from "react-bootstrap";
import { RiAdminLine } from "react-icons/ri";

const NavigationBar = () => {
  return (
    <Navbar bg="light" expand="lg" className="px-4">
      <Navbar.Brand href="/" className="d-flex align-items-center">
        <RiAdminLine size={30} className="me-2" /> Transaction App
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="navbar-nav" />
      <Navbar.Collapse id="navbar-nav">
        <Nav className="me-auto">
          <Nav.Link href="/" className="text-dark">Dashboard</Nav.Link>
          <Nav.Link href="/combined" className="text-dark">Combined</Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default NavigationBar;
