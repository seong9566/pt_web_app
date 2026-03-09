export function generateVideoThumbnail(file) {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    video.onloadeddata = () => {
      video.currentTime = 0.1
    }

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          URL.revokeObjectURL(video.src)
          resolve(null)
          return
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(video.src)
          resolve(blob)
        }, 'image/jpeg', 0.7)
      } catch {
        URL.revokeObjectURL(video.src)
        resolve(null)
      }
    }

    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      resolve(null)
    }

    video.src = URL.createObjectURL(file)
  })
}
