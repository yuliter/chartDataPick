import { useEffect, useRef, useState } from "react"
import pickImg from '@/assets/forPick.jpg'
import _ from 'lodash'
import { Button, Popconfirm } from "antd"
import * as echarts from 'echarts';

export default function View() {
  const [y1, setY1] = useState(0)
  const [y2, setY2] = useState(100)
  const [x1, setX1] = useState(0)
  const [x2, setX2] = useState(100)
  const refY = useRef(null)
  const refX = useRef(null)
  const [lines, setLines] = useState([[]])
  const clearLine = () => {
    setLines([[]])
  }
  useEffect(() => {
    clearLine()
    if (y2 > y1) {
      refY.current = y2 - y1
    }
    if (x2 - x1) {
      refX.current = x2 - x1
    }
  }, [y1, y2, x1, x2])

  const linesRef = useRef(lines)
  linesRef.current = lines
  const [currentPickLine, setCurrentPickLine] = useState(1)
  const currentPickLineRef = useRef(null)
  currentPickLineRef.current = currentPickLine
  const onMount = useRef(null)
  const initCanvas = function (imgElement) {
    clearLine()
    const canvas = document.createElement('canvas')
    const w = imgElement.width
    const h = imgElement.height
    canvas.width = w
    canvas.height = h
    canvas.addEventListener('mousedown', function (event) {
      // 获取鼠标相对于文档的位置
      const mouseX = event.pageX;
      const mouseY = event.pageY;

      // 获取canvas相对于文档的位置
      const canvasRect = canvas.getBoundingClientRect();
      console.log(canvasRect.left,canvasRect.top,'canvasRect')
      const canvasLeft = canvasRect.left;
      const canvasTop = canvasRect.top;

      // 计算鼠标相对于canvas左下角的位置
      const relativeX = mouseX - canvasLeft;
      const relativeY = mouseY - canvasTop;

      // 由于在canvas中，坐标系的y轴是向上增长的，所以需要调整
      // 相对位置的y坐标，使其与canvas的坐标系一致
      const relativeYFlipped = canvas.height - relativeY;
      const coordX = relativeX / w
      const coordY = relativeYFlipped / h
      // console.log(`coordX: ${coordX}, coordY: ${coordY}`);
      if (currentPickLineRef.current >= 1) {
        let index = currentPickLineRef.current - 1
        let line = linesRef.current[index]
        line.push([parseFloat((coordX * refX.current).toFixed(2)), parseFloat((coordY * refY.current).toFixed(2))])
        setLines([...linesRef.current])
      }
      // console.log(`X: ${relativeX}, Y: ${relativeYFlipped}`);
      // 可选：在canvas上绘制一个点或标记，显示鼠标的位置
      ctx.clearRect(0, 0, canvas.width, canvas.height); // 清除画布
      ctx.beginPath();
      ctx.arc(relativeX, relativeY, 2, 0, Math.PI * 2); // 绘制一个圆点
      ctx.fill();
    });
    const ctx = canvas.getContext('2d')

    canvas.style.position = 'absolute'
    canvas.style.left = '0'
    canvas.style.top = '0'
    ctx.drawImage(imgElement, 0, 0, imgElement.width, imgElement.height)
    const parentElement = imgElement.parentNode
    const childNodes = parentElement.childNodes;
    // 过滤出canvas元素
    const canvasNodes = Array.from(childNodes).filter(node => node.tagName === 'CANVAS');
    // 移除canvas元素
    canvasNodes.forEach(canvas => {
      parentElement.removeChild(canvas);
    });

    parentElement.appendChild(canvas)
  }
  function displayImagePreview(imageUrl) {
    const imgElement = document.getElementById('imagePreview');
    imgElement.src = imageUrl;
    imgElement.style.maxWidth = '100%';
    imgElement.onload = () => {
      initCanvas(imgElement)
    }
  }
  function uploadImage() {
    const imageInput = document.getElementById('imageInput');
    const file = imageInput.files[0]; // 获取选择的文件
    if (file) {
      const reader = new FileReader();

      reader.onload = function (e) {
        const imageUrl = e.target.result;
        console.log('图片URL:', imageUrl);

        // 这里可以进一步处理图片，例如显示预览或上传到服务器
        displayImagePreview(imageUrl);
      };

      reader.readAsDataURL(file); // 读取文件并将其转换为base64编码的URL
    } else {
      alert("请选择一个图片文件")
    }
  }

  useEffect(() => {
    const imgElement = document.getElementById('imagePreview');
    imgElement.onload = () => { initCanvas(imgElement) };
    if (!onMount.current) {
      onMount.current = true
      document.getElementById('uploadForm').addEventListener('submit', function (event) {
        event.preventDefault(); // 阻止表单默认提交
        uploadImage();
      });
    }
  }, [])

  const [xBaseLine, setXBaseLine] = useState(7)
  const [yBaseLine, setYBaseLine] = useState(3)
  const [echartShow, setEchartShow] = useState(false)
  const echartsRef = useRef(null)
  const generateEchart = () => {
    setEchartShow(true)
    setTimeout(() => {
      if (!echartsRef.current) {
        echartsRef.current = echarts.init(document.getElementById('main'))
        console.log('init')
      }
      let data = _.cloneDeep(linesRef.current).map((line, index) => {
        return {
          name: `线${index + 1}`,
          type: 'line',
          data: line.sort((a,b)=>a[0]-b[0])
        }
      }
      )
      
      let option = {
        title: {
          text: '样例'
        },
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'value'
        },
        yAxis: {
          type: 'value'
        },
        series: data
      };
      console.log(echartsRef.current)
      echartsRef.current.setOption(option);
    }, 0);
  }
  useEffect(() => {
    if (echartShow) {
      generateEchart()
    }
  }, [lines, echartShow])
  console.log(currentPickLine, 'currentPickLine')
  // 删除已选择的点
  const deletePoint =(index,j)=>{
    let line = linesRef.current[index]
    line.splice(j,1)
    setLines([...linesRef.current])
  }

  return <div style={{height: 'calc(100vh - 64px)',overflow: 'hidden',boxSizing: 'border-box'}}>
    <form id="uploadForm" style={{ textAlign: 'left' }}>
      <input type="file" id="imageInput" accept="image/*">
      </input>
      <div style={{ marginTop: '10px' }}>
        <button type="submit">上传图片</button>
      </div>
    </form>
    <div style={{ textAlign: echartShow ? 'left' : 'center' }}>
      <div style={{ textAlign: 'right' }}>
        x轴基线 <Button onClick={() => { setXBaseLine(prev => prev > 0 ? prev - 1 : 0) }}>-</Button> {xBaseLine} <Button onClick={() => { setXBaseLine(prev => prev + 1) }}>+</Button>
        <div style={{ marginTop: '10px' }}>
          y轴基线 <Button onClick={() => { setYBaseLine(prev => prev > 0 ? prev - 1 : 0) }}>-</Button> {yBaseLine} <Button onClick={() => { setYBaseLine(prev => prev + 1) }}>+</Button>
        </div>
      </div>
      <div style={{ position: 'relative', margin: '0 50px', display: 'inline-block' }} >
        {
          new Array(xBaseLine).fill(0).map((_, index) => {
            return <div key={index} style={{ position: 'absolute', left: `${index * 100 / xBaseLine}%`, top: '0', width: '1px', height: '108%', background: 'red', zIndex: 1, transform: 'translateY(-4%)' }}></div>
          }
          )
        }
        {
          new Array(yBaseLine).fill(0).map((_, index) => {
            return <div key={index} style={{ position: 'absolute', left: '0', top: `${index * 100 / yBaseLine}%`, width: '108%', height: '1px', background: 'red', zIndex: 1, transform: 'translateX(-4%)' }}></div>
          }
          )
        }
        <img id="imagePreview" src={pickImg}>

        </img>

        <div style={{ position: 'absolute', left: '-88px', top: '-3px' }}>
          y2 <input
            className="x-y-value"
            value={y2}
            onChange={(e) => setY2(e.target.value)}
          ></input>
        </div>
        <div style={{ position: 'absolute', left: '-88px', bottom: '6px' }}>
          y1 <input
            className="x-y-value"
            value={y1}
            onChange={(e) => setY1(e.target.value)}
          ></input>
        </div>
        <div style={{ position: 'absolute', left: '3px', bottom: '-17px' }}>
          x1 <input
            className="x-y-value"
            value={x1}
            onChange={(e) => setX1(e.target.value)}
          ></input>
        </div>
        <div style={{ position: 'absolute', right: '0', bottom: '-17px' }}>
          x2 <input
            className="x-y-value"
            value={x2}
            onChange={(e) => setX2(e.target.value)}
          ></input>
        </div>
      </div>
    </div>
    <div style={{ textAlign: 'left', marginTop: '50px' }}>
      当前pick第 <select style={{ width: '50px' }} value={currentPickLine} onChange={(e) => { setCurrentPickLine(e.target.value) }}>
        {
          lines.map((line, index) => {
            return <option key={index} value={index + 1} >{index + 1}</option>
          })
        }
      </select>条线
      <button onClick={() => { 
        setCurrentPickLine(lines.length+1)
        setLines((prev) => [...prev, []]) }}>添加线</button>
      <button style={{ marginLeft: '20px' }} onClick={generateEchart} >根据当前pick点,生成echart图</button>
      <div style={{height: '100px',overflow: 'auto'}}>
      {
        lines.map((line, index) => {
          return <div key={index}>
            <span>第{index + 1}条线值</span>[
            {
              line.map((point, j) => {
                return <span key={j}>{
                  j>0?',':''
                }
                <Popconfirm onConfirm={()=>{deletePoint(index,j)}} title={`删除[${point[0]},${point[1]}]` }><span style={{cursor: 'pointer'}}>{`[${point[0]},${point[1]}]`}</span></Popconfirm>
                </span>
              })
            }
            ]
            </div>
        })
      }
      </div>
    </div>
    {
     <div style={{ width: '40%', height: '100%', position: 'fixed', right: '0', top: '0', background: '#fff', zIndex: 1, borderLeft: '1px solid #ccc',display:echartShow?'block':'none' }} >
        <div onClick={() => { setEchartShow(false) }} style={{ textAlign: 'right', cursor: 'pointer' }}>关闭展示
        </div>
        <div id="main" style={{ width: '100%', height: '50%' }}></div>
      </div>
    }
  </div>
}