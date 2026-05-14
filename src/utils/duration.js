export function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return {
    days,
    hours,
    minutes,
    seconds,
    ms: ms % 1000,
    formatted: [
      days && `${days}d`,
      hours && `${hours}h`,
      minutes && `${minutes}m`,
      seconds && `${seconds}s`
    ].filter(Boolean).join(' ') || '0s'
  }
}
