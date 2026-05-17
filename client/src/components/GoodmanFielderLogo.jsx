// Placeholder logo — replace with actual Goodman Fielder asset when supplied
export function GoodmanFielderLogo({ className = '' }) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center">
        <span className="text-white font-bold text-2xl tracking-tight">GF</span>
      </div>
      <span className="text-gray-700 font-semibold text-sm tracking-widest uppercase">
        Goodman Fielder
      </span>
    </div>
  )
}
