import CreatXMl from './component/Drag'
import { useNavigate } from 'react-router-dom'

export default function View() {
  const router = useNavigate()
  return (
    <>
    <button onClick={()=>{router('/pic')}}>去到pic</button>
      <CreatXMl />
    </>
  )
}
