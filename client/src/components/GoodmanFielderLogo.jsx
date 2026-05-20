export function GoodmanFielderLogo({ className = '', size = 'default' }) {
  const sizeClasses = {
    small: 'h-12',
    default: 'h-20',
    large: 'h-32'
  }

  return (
    <img 
      src="/gf-logo.jpg" 
      alt="Goodman Fielder" 
      className={`${sizeClasses[size]} w-auto object-contain ${className}`}
    />
  )
}
