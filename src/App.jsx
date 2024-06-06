import { Routes, Route } from "react-router-dom";
import Home from './pages/home/index'
import Pic from './pages/picCollection'
import './App.css'

function App() {

  return (
    <>
       <Routes>
          <Route path="/" element={<Home/>}></Route>
          <Route path="/pic" element={<Pic/>}></Route>
        </Routes>
    </>
  )
}

export default App
