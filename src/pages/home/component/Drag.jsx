import { useEffect, useRef, useState } from "react"
import _ from 'lodash'
import { v4 } from "uuid"
import bmsIcon from '@/assets/bms.png'
import pcsIcon from '@/assets/pcs.png'
import { message } from "antd"

import './Drag.css'; // 引入CSS样式

const App = () => {
  return <div style={{ display: 'flex', height: '500px' }}>
    <div style={{ width: '200px' }}>
      <ToolsPanel />
    </div>
    <div style={{ flex: '1' }}>
      <BoardRender />
    </div>
  </div>;
};

// 属性配置
export function PropertyConfig() {
  return <div>
    属性配置

  </div>

}

export function BoardRender() {
  const boardRef = useRef(null)
  const [boardItems, setBoardItems] = useState([]);
  const [xmlData, setXmlData] = useState('')
  const boardItemsRef = useRef(null)
  boardItemsRef.current = boardItems
  const onMount = useRef(null)
  const clientPosition = useRef(null)
  const isDrawLine = useRef(false)
  const isLineMove = useRef(false)
  const [lineDrawingProcess, setLineDrawingProcess] = useState([])
  const lineDrawingProcessRef = useRef(null)
  lineDrawingProcessRef.current = lineDrawingProcess
  const [historyLineDrawingProcess, setHistoryLineDrawingProcess] = useState([[]])
  const historyLineDrawingProcessRef = useRef(null)
  historyLineDrawingProcessRef.current = historyLineDrawingProcess
  const [currentCursor, setCurrentCursor] = useState([])
  const lineLinkRef = useRef(null)
  const currentClickItem = useRef(null)
  const [currnetClickIndex, setCurrentClickIndex] = useState(-1)
  const currnetClickIndexRef = useRef(null)
  currnetClickIndexRef.current = currnetClickIndex
  const [settingPickItem, setSettingPickItem] = useState(null)
  const [settingPickIndex, setSettingPickIndex] = useState(-1)

  // 当前hover的线段
  const [currentHoverLine, setCurrentHoverLine] = useState(-1)
  const currentHoverLineRef = useRef(null)

  currentHoverLineRef.current = currentHoverLine
  useEffect(() => {
    if (settingPickIndex > -1) {
      setSettingPickItem(boardItems[settingPickIndex])
    }
  }, [
    settingPickIndex
  ])
  // 选中线段，则将元器件选中取消
  useEffect(() => {
    if (currentHoverLine > -1) {
      setCurrentClickIndex(-1)
    }
  }, [currentHoverLine])
  const clickItem = (index) => {
    setCurrentClickIndex(index)
  }
  useEffect(() => {
    if (currnetClickIndex > -1) {
      currentClickItem.current = boardItems[currnetClickIndex]

    } else {
      currentClickItem.current = null
    }
  }, [currnetClickIndex, boardItems])
  // 辅助函数：检查点是否在线段上
  function isPointOnLine(mouseX, mouseY, x, y, x2, y2) {
    const width = 8
    const distance = Math.abs((y - mouseY) * (x2 - x) - (x - mouseX) * (y2 - y)) /
      Math.sqrt((x2 - x) * (x2 - x) + (y2 - y) * (y2 - y));
    return distance <= width / 2 && mouseX >= Math.min(x, x2) && mouseX <= Math.max(x, x2) && mouseY >= Math.min(y, y2) && mouseY <= Math.max(y, y2);
  }
  console.log(isDrawLine.current, lineDrawingProcess, currentCursor, "LineDrawingProcess")
  useEffect(() => {
    if (!onMount.current) {
      onMount.current = true
      let isCopy = false
      document.addEventListener('keydown', function (event) {
        // 检查 Ctrl+C (67 是 'C' 的 ASCII 码，event.ctrlKey 检查 Ctrl 是否被按下)
        if (event.key === 'c' && event.ctrlKey) {
          if (currentClickItem.current) {
            isCopy = true
            message.success("复制成功")
          }
        }
        // 检查 Ctrl+V (86 是 'V' 的 ASCII 码)
        if (event.key === 'v' && event.ctrlKey) {
          if (isCopy) {
            const item = currentClickItem.current
            setBoardItems(prevItems => [...prevItems, { ...item, absoluteX: item.absoluteX + 40, absoluteY: item.absoluteY + 40, uuid: v4() }]);
            message.success("粘贴成功")
          }
        }
        if (event.key === 'Delete') {
          if (currnetClickIndexRef.current > -1 && boardItemsRef.current.length > 0) {
            boardItemsRef.current.splice(currnetClickIndex, 1)
            setBoardItems([...boardItemsRef.current])
            message.success('删除成功！')
          }
          if (currentHoverLineRef.current > -1) {
            setHistoryLineDrawingProcess((prev) => {
              return prev.filter((item, index) => {
                return index !== currentHoverLineRef.current
              })
            })
            setLineDrawingProcess([])
            setCurrentHoverLine(-1)
            message.success('删除成功！')
          }
          event.preventDefault();
        }
      });
      // 设置右键，取消绘制
      boardRef.current.addEventListener('contextmenu', (event) => {
        event.preventDefault()
        isDrawLine.current = false
        if (lineDrawingProcessRef.current.length > 1) {
          setHistoryLineDrawingProcess((prev) => {
            return [...prev, [...lineDrawingProcessRef.current]]
          })
        }
        setLineDrawingProcess([])
        setCurrentCursor([])
      }
      )
      // 设置鼠标点击事件，做组件连线
      boardRef.current.addEventListener('mousedown', (event) => {
        // 鼠标在元器件和线上的时候，不允许绘制
        if (currnetClickIndexRef.current > -1 || currentHoverLineRef.current > -1) {
          // isDrawLine.current=false
          return
        }
        // 左键绘制连线
        if (event.button === 0) {
          const rect = boardRef.current.getBoundingClientRect();
          if (isDrawLine.current) {
            setLineDrawingProcess((prev) => {
              return [...prev, { x: event.clientX - rect.left, y: event.clientY - rect.top, uuid: lineLinkRef.current }]
            })
          } else {
            setLineDrawingProcess([{ x: event.clientX - rect.left, y: event.clientY - rect.top, uuid: lineLinkRef.current }])
          }
        }
      })

      boardRef.current.addEventListener('mousemove', _.throttle(
        (event) => {
          const rect = boardRef.current.getBoundingClientRect();
          const x = event.clientX - rect.left
          const y = event.clientY - rect.top
          let isOnLine = -1
          historyLineDrawingProcessRef.current.forEach((item, level) => {
            item.forEach((point, key) => {
              if (key > 0 && isPointOnLine(x, y, item[key - 1].x, item[key - 1].y, point.x, point.y)) {
                isOnLine = level
              }
            })
          })
          setCurrentHoverLine(isOnLine)
          if (isDrawLine.current) {
            setCurrentCursor([x, y])
          }
        },
        100
      ))
      boardRef.current.addEventListener('dragover', (e) => {
        e.preventDefault(); // 允许在该元素上放置元素
      }
      )
      boardRef.current.addEventListener('drop', (event) => {
        const props = event.dataTransfer.getData('text')
        if (props) {
          let item = JSON.parse(props)
          const x = event.clientX;
          const y = event.clientY;

          // 获取目标元素的位置
          const rect = boardRef.current.getBoundingClientRect();
          // 计算相对位置
          const positionRelativeToDropzone = {
            x: x - rect.left,
            y: y - rect.top
          };
          setCurrentClickIndex(boardItemsRef.current.length)
          setBoardItems(prevItems => [...prevItems, { ...item, absoluteX: positionRelativeToDropzone.x - item.mouseX, absoluteY: positionRelativeToDropzone.y - item.mouseY, uuid: v4() }]);
        } else {
          // 在看板上移动电子元器件
          if (clientPosition.current) {
            const x = event.clientX;
            const y = event.clientY;
            const item = boardItemsRef.current[clientPosition.current.index]
            if (item) {
              item.absoluteX += x - clientPosition.current.x
              item.absoluteY += y - clientPosition.current.y
              setBoardItems([...boardItemsRef.current])
              // 设置锚定该组件的线的端点
              setHistoryLineDrawingProcess((prev) => {
                return prev.map((i) => {
                  return i.map((ii) => {
                    if (ii.uuid === item.uuid) {
                      return {
                        ...ii,
                        x: ii.x + event.clientX - clientPosition.current.x,
                        y: ii.y + event.clientY - clientPosition.current.y
                      }
                    } else {
                      return ii
                    }
                  })
                })
              })
            }
            setTimeout(() => {
              clientPosition.current = null
            }, 0)
          }
          // 移动连线
          if (isLineMove.current) {
            const { level, key, x, y } = isLineMove.current
            historyLineDrawingProcessRef.current[level][key].x += event.clientX - x;
            historyLineDrawingProcessRef.current[level][key].y += event.clientY - y;
            setHistoryLineDrawingProcess([...historyLineDrawingProcessRef.current])
            setTimeout(() => {
              isLineMove.current = null
            }, 0)
          }
        }
      })
    }
  }, [])
  // 看板内，元器件移动
  const handleDragStart = (e, index) => {
    if (isDrawLine.current) {
      clientPosition.current = null
      return
    }
    clientPosition.current = { index, x: e.clientX, y: e.clientY }
  }
  const handleGenerateXML = () => {
    const xmlItems = boardItems.map(item => `
      <item id="${item.id}" type="${item.type}" w="${item.w}" h="${item.h}" x="${item.absoluteX}" y="${item.absoluteY}" src="${item.src}" uuid="${item.uuid}" />
    `).join('');
    const lineItem = historyLineDrawingProcess.map((item, index) => {
      return `
      <line arr='${JSON.stringify(item)}'></line>
      `}).join('')
    const xmlString = `<root>${xmlItems}${lineItem}</root>`;
    localStorage.setItem('xmlData', xmlString)
    setXmlData(xmlString);
    // 实际应用中，这里可以添加下载xml文件的逻辑
  };
  const handleLoadXML = () => {
    const xmlString = localStorage.getItem('xmlData')
    if (xmlString) {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
      const newItems = Array.from(xmlDoc.getElementsByTagName('item')).map(item => ({
        id: parseInt(item.getAttribute('id')),
        type: item.getAttribute('type'),
        w: parseInt(item.getAttribute('w')),
        h: parseInt(item.getAttribute('h')),
        absoluteX: parseInt(item.getAttribute('x')),
        absoluteY: parseInt(item.getAttribute('y')),
        src: item.getAttribute('src'),
        uuid: item.getAttribute('uuid')
      }));
      const historyLines = Array.from(xmlDoc.getElementsByTagName('line')).map(item => (JSON.parse(item.getAttribute('arr'))))
      setBoardItems(newItems);
      setHistoryLineDrawingProcess(historyLines)
    }
  }
  useEffect(() => {
    handleLoadXML()
  }, [])

  // 绘制线
  const drawLine = (uuid) => {
    isDrawLine.current = true
    if (!isDrawLine.current && lineDrawingProcess.length > 1) {
      setCurrentCursor([])
      setHistoryLineDrawingProcess((prev) => {
        return [...prev, [...lineDrawingProcess.slice(0, lineDrawingProcess.length - 1), { ...lineDrawingProcess[lineDrawingProcess.length - 1], uuid: uuid }]]
      })
    }
  }
  const saveTargetNode = (uuid) => {
    lineLinkRef.current = uuid
  }
  const canvasRef = useRef(null)
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.beginPath()
      historyLineDrawingProcess.forEach((item, index) => {
        ctx.beginPath()
        if (currentHoverLine === index) {
          ctx.strokeStyle = '#f00'
        } else {
          ctx.strokeStyle = '#000'
        }
        item.forEach((point, key) => {
          if (key === 0) {
            ctx.moveTo(point.x, point.y)
          } else {
            ctx.lineTo(point.x, point.y)
          }
        })
        ctx.stroke()
      })
      lineDrawingProcess.forEach((item, index) => {
        if (index === 0) {
          ctx.moveTo(item.x, item.y)
        } else {
          ctx.lineTo(item.x, item.y)
        }
      })
      if (lineDrawingProcess.length > 0 && currentCursor.length > 0) {
        ctx.lineTo(currentCursor[0], currentCursor[1])
      }
      ctx.stroke()
    } else {
      if (boardRef.current) {
        canvasRef.current = document.createElement('canvas');
        canvasRef.current.width = boardRef.current.clientWidth
        canvasRef.current.height = boardRef.current.clientHeight
        canvasRef.current.style.position = 'absolute'
        canvasRef.current.style.top = 0
        canvasRef.current.style.left = 0
        boardRef.current.appendChild(canvasRef.current);
      }
    }
  }, [lineDrawingProcess, boardRef, historyLineDrawingProcess, currentCursor, currentHoverLine])
  const handleDragLineStart = (level, key, e) => {
    isLineMove.current = {
      level,
      key,
      x: e.clientX,
      y: e.clientY
    }
  }

  return <div >
    <div style={{ display: 'flex' }}>
      <div ref={boardRef} style={{ border: '1px solid #ccc', height: '500px', position: 'relative', flex: '1' }} onClick={() => {
        drawLine('')
        clickItem(-1)
        setSettingPickIndex(-1)
      }}>
        {
          historyLineDrawingProcess.map((arr, level) => {
            return arr.map((item, key) => {
              return <div draggable={true} key={key} style={{ position: 'absolute', left: item.x, top: item.y }} className="circle-point"
                onDragStart={(e) => { handleDragLineStart(level, key, e) }}
              ></div>
            })
          })
        }
        {
          lineDrawingProcess.length > 1 && lineDrawingProcess.map((item, key) => {
            return <div key={key} style={{ position: 'absolute', left: item.x, top: item.y }} className="circle-point"></div>
          })
        }
        {
          boardItems.map((item, index) => {
            return <div key={index} onClick={() => {
              setTimeout(() => {
                isDrawLine.current=false
                setSettingPickIndex(index)
                clickItem(index)
              }, 0)
            }} >
              <div onMouseOut={() => { setCurrentClickIndex(-1) }} onMouseOver={() => { setCurrentClickIndex(index) }} className={`${currnetClickIndex === index ? "item-click" : ""} ${settingPickIndex === index ? "item-pick" : ""}`} draggable={true} onDragStart={(e) => {
                clickItem(index)
                handleDragStart(e, index)
              }} style={{ width: `${item.w}px`, height: `${item.h}px`, top: `${item.absoluteY}px`, left: `${item.absoluteX}px`, position: 'absolute', cursor: 'move' }}>
                <img src={item.src} style={{ width: '100%', height: '100%' }}></img>
                <div className="hover-anchor"></div>
                <div className="circle-point" style={{ position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)' }} onMouseOut={() => { saveTargetNode('') }} onMouseOver={() => { saveTargetNode(item.uuid) }} onClick={() => { drawLine(item.uuid) }}></div>
                <div className="circle-point" style={{ position: 'absolute', bottom: '-5px', left: '50%', transform: 'translateX(-50%)' }} onMouseOut={() => { saveTargetNode('') }} onMouseOver={() => { saveTargetNode(item.uuid) }} onClick={() => { drawLine(item.uuid) }}></div>
              </div>
            </div>
          })
        }
      </div>
      <div style={{ width: '200px' }}>
        属性配置
        <div>
          {
            // settingPickItem && Ob
          }
        </div>
      </div>

    </div>

    <div style={{ width: '100%' }}>
      <button onClick={handleGenerateXML}>生成XML</button>
      <button onClick={handleLoadXML} >加载XML</button>
      <pre className="xml-preview">{xmlData}</pre>
    </div>
  </div>

}

export function ToolsPanel() {
  const [items, setItems] = useState([
    { id: 1, type: 'bms', w: 20, h: 36, src: bmsIcon },
    { id: 2, type: 'pcs', w: 30, h: 30, src: pcsIcon },
    // { id: 3, type: 'battery', w: 200, h: 300 }
  ]);
  const toolsRef = useRef(null)
  const handleDragStart = (event, item, index) => {
    const current = toolsRef.current.children[index]
    const rect = current.getBoundingClientRect();

    // 计算鼠标相对于被拖拽 div 左上顶点的位置
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    event.dataTransfer.setData('text', JSON.stringify({ ...item, mouseX, mouseY }));
    event.dataTransfer.effectAllowed = 'move';
  }
  return <div ref={toolsRef}>
    {items.map((item, index) => {
      return <div
        onDragStart={e => handleDragStart(e, item, index)}
        key={index} draggable="true" style={{ margin: '10px 0', width: `${item.w}px`, height: `${item.h}px`, cursor: 'move' }}>
        <img src={item.src} style={{ width: '100%', height: '100%' }}></img>
      </div>
    })}
  </div>
}
export default App;