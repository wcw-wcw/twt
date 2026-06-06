function DemoBadge({ user, className = "" }) {
  if (!user?.isDemo) return null

  const classes = ["demoBadge", className].filter(Boolean).join(" ")

  return (
    <span className={classes} title={user.demoLabel || "Simulated demo account"}>
      Demo
    </span>
  )
}

export default DemoBadge
