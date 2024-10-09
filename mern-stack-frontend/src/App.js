import "./App.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import Transaction from "./Components/Transaction";
import Navbar from "./Components/Navbar";
import Dashboard from "./Components/Combined";
import { BrowserRouter as Router ,Route,Routes } from "react-router-dom";

function App() {
  return (
    <div>
      <Navbar />
      <Router>
        <Routes>
          <Route path="/combined" element={<Dashboard/>}/>
          <Route path="/" element={<Transaction />}/>
        </Routes>
      </Router>
    </div>
  );
}

export default App;