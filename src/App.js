import './App.css';
import './custom.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import User from './pages/user.page';
import Admin from './pages/admin.page'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="admin" element={<Admin/>} />
        <Route path="/" element={<User/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
