import { useState } from 'react'

export default function StarRating({ value = 0, onRate, readOnly }) {
  const [hover, setHover] = useState(0)
  const stars = [1, 2, 3, 4, 5]

  return (
    <div className="star-rating">
      {stars.map((n) => {
        const filled = (hover || value) >= n
        return (
          <span
            key={n}
            className={filled ? 'star star-filled' : 'star'}
            onMouseEnter={() => !readOnly && setHover(n)}
            onMouseLeave={() => !readOnly && setHover(0)}
            onClick={() => !readOnly && onRate?.(n)}
          >
            ★
          </span>
        )
      })}
    </div>
  )
}
