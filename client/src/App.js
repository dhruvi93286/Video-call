import logo from "./logo.svg";
import "./App.css";
import Home from "./pages/Home";
import VideoRoom from "./pages/VideoRoom";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/video-call" element={<VideoRoom />}></Route>
          <Route path="/" element={<Home />}></Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
