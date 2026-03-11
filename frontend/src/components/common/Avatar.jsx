function Avatar({ src, alt, name, size = 44 }) {
  const initial = (name || alt || "?").trim().charAt(0).toUpperCase()

  if (src) {
    return (
      <img
        className="avatar"
        src={src}
        alt={alt || name || "avatar"}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className="avatar avatarFallback"
      style={{ width: size, height: size }}
      aria-label={alt || name || "avatar"}
      title={name || alt || "avatar"}
    >
      {initial}
    </div>
  )
}

export default Avatar