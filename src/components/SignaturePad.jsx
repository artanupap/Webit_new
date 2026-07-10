import { useRef, useState } from 'react'

export default function SignaturePad({ onSave }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const hasDrawn = useRef(false)
  const [isEmpty, setIsEmpty] = useState(true)

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect()
    const point = e.touches ? e.touches[0] : e
    return { x: point.clientX - rect.left, y: point.clientY - rect.top }
  }

  function start(e) {
    e.preventDefault()
    drawing.current = true
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const { x, y } = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function move(e) {
    if (!drawing.current) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const { x, y } = getPos(e, canvas)
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#0f2148'
    ctx.lineTo(x, y)
    ctx.stroke()
    hasDrawn.current = true
    setIsEmpty(false)
  }

  function end() {
    drawing.current = false
  }

  function clear() {
    const canvas = canvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    hasDrawn.current = false
    setIsEmpty(true)
  }

  function save() {
    if (!hasDrawn.current) return
    onSave(canvasRef.current.toDataURL('image/png'))
  }

  return (
    <div className="signature-pad">
      <canvas
        ref={canvasRef}
        width={360}
        height={140}
        className="signature-canvas"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <div className="signature-actions">
        <button type="button" className="btn btn-ghost" onClick={clear}>ล้าง</button>
        <button type="button" className="btn btn-primary" disabled={isEmpty} onClick={save}>ยืนยันลายเซ็น</button>
      </div>
    </div>
  )
}
