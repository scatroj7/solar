import React, { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

// --- Helper ---
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

// --- BUTTON ---
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}
export const Button = ({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    outline: "border border-slate-200 hover:bg-slate-100 text-slate-900",
    ghost: "hover:bg-slate-100 text-slate-700"
  };
  
  const sizes = {
    sm: "h-9 px-3 text-xs",
    md: "h-10 py-2 px-4",
    lg: "h-11 px-8"
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], sizes[size], className)} 
      {...props} 
    />
  );
};

// --- INPUT ---
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
export const Input = ({ className, label, error, ...props }: InputProps) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      <input 
        className={cn(
          "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-red-500 focus:ring-red-500" : "",
          className
        )}
        {...props} 
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

// --- CARD ---
export const Card = ({ className, children }: { className?: string, children: ReactNode }) => (
  <div className={cn("rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm", className)}>
    {children}
  </div>
);
export const CardHeader = ({ className, children }: { className?: string, children: ReactNode }) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)}>{children}</div>
);
export const CardTitle = ({ className, children }: { className?: string, children: ReactNode }) => (
  <h3 className={cn("font-semibold leading-none tracking-tight", className)}>{children}</h3>
);
export const CardContent = ({ className, children }: { className?: string, children: ReactNode }) => (
  <div className={cn("p-6 pt-0", className)}>{children}</div>
);

// --- TABS ---
export const Tabs = ({ className, children }: { className?: string, children: ReactNode }) => (
  <div className={cn("", className)}>{children}</div>
);
export const TabsList = ({ className, children }: { className?: string, children: ReactNode }) => (
  <div className={cn("inline-flex h-10 items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-500", className)}>
    {children}
  </div>
);
export const TabsTrigger = ({ className, children, active, onClick }: { className?: string, children: ReactNode, active?: boolean, onClick?: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      active ? "bg-white text-slate-950 shadow-sm" : "hover:bg-slate-200 hover:text-slate-700",
      className
    )}
  >
    {children}
  </button>
);
export const TabsContent = ({ className, children, active }: { className?: string, children: ReactNode, active?: boolean }) => {
  if (!active) return null;
  return <div className={cn("mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 animate-in fade-in slide-in-from-bottom-2", className)}>{children}</div>;
};

// --- PROGRESS ---
export const Progress = ({ value, className }: { value: number, className?: string }) => (
  <div className={cn("relative h-4 w-full overflow-hidden rounded-full bg-slate-100", className)}>
    <div
      className="h-full w-full flex-1 bg-slate-900 transition-all duration-500 ease-in-out"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </div>
);

// --- BADGE ---
export const Badge = ({ className, variant = 'default', children }: { className?: string, variant?: 'default' | 'success' | 'warning' | 'info', children: ReactNode }) => {
  const variants = {
    default: "bg-slate-900 text-white hover:bg-slate-900/80",
    success: "bg-green-100 text-green-800 hover:bg-green-200",
    warning: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    info: "bg-blue-100 text-blue-800 hover:bg-blue-200"
  };
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 border-transparent", variants[variant], className)}>
      {children}
    </div>
  );
};

// --- SELECT ---
interface SelectOption {
  label: string;
  value: string | number;
}
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
}
export const Select = ({ className, label, options, ...props }: SelectProps) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
    <div className="relative">
      <select
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
       <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
    </div>
  </div>
);

// --- TOAST ---
export const Toast = ({ show, message, onClose }: { show: boolean, message: string, onClose: () => void }) => {
  if (!show) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-5">
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:text-slate-300">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
  );
};

// --- DIALOG ---
export const Dialog = ({ open, onClose, children }: { open?: boolean, onClose?: () => void, children?: ReactNode }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>
    )
}

// --- LOGO COMPONENT ---
export const Logo = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-3 select-none", className)}>
    
    {/* ICON */}
    <div className="relative h-14 w-auto flex-shrink-0">
      <svg
        width="730"
        height="808"
        viewBox="0 0 730 808"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <g clipPath="url(#clip0_2013_9)">
          <mask id="mask0_2013_9" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="730" height="808">
            {/* DÜZELTME: Maske path'inin sol kenarı H0'dan H10'a çekildi */}
            <path d="M730 0H10V808H730V0Z" fill="white"/>
          </mask>
          <g mask="url(#mask0_2013_9)">
            {/* DÜZELTME: Beyaz arka plan path'inin sol kenarı H0'dan H10'a çekildi */}
            <path d="M730 0H10V808H730V0Z" fill="white"/>
            
            {/* Lacivert Kısım - Renk: #051532 */}
            <path d="M367 808H2V0H732V808H367ZM186.15 590L263.496 589.5L264.496 468.5L485.996 467.991V590.011L643.496 589.499L644 114.999H598.782L393.833 300.536L423.527 328.5L427.882 332.207L467.565 296.5L507.496 260.525L511.496 256.826L523.903 245.663L596.996 180.999V546.039L550.496 545.502L551 495.104L490.304 442.501L478.765 432.251L467.226 422.001H263.996V343L203.496 280.837L203.238 413.167L202.8 545.26H154.8V359.76L156 175L161 180L165.675 184.493L335 343L304 378.971L436.996 378.969V377.339L421.496 362.492L378.496 321.384L360.029 303.938L341.562 286.492L314.464 260.492L275.572 224.492L264.034 213.539L252.496 202.586L214.496 166.39L206.996 159.498L199.496 152.606L182.496 136.41L165.496 120.393L157.829 113.905L107.798 114.855L107.411 115.242L107.024 115.629L106.981 352.479L106 590H186.15ZM362.227 590L408.501 590.439L431.001 590.001V513.119L430.106 512.566L429.211 512.013L316.031 511.638L315.589 512.08L315.148 512.522L314.535 550.361L315 590H362.227ZM551 459L550.996 282.803L489 340V402.655L551 459Z" fill="#051532"/>
            
            {/* Turuncu Kısım */}
            <path d="M157.09 113.01L132.074 113.485L107.058 113.961L106.671 114.348L106.285 114.735L106.242 351.585L106 588.5V590H108H203L203.068 568.097L203 545H178H155V544V359L156 175L165 184L189.345 206.501L214 230.5L231 246L246 260L278.755 290.707L303.616 314.145L328.5 338L335 343L371.812 379H404H439L438 378L437.272 377.216L429.384 369.607L421.772 362.322L400.272 341.676L378.586 320.893L360.166 303.676L340.82 285.584L313.722 259.584L294.277 241.584L274.83 223.584L263.293 212.631L251.754 201.678L213.754 165.483L206.254 158.59L198.754 151.7L181.754 135.505L173.254 127.495L164.754 119.487L160.922 116.243L157.09 113.01ZM551.21 282.54L545.013 287.823L538.823 293.218L519.762 311.23L500.586 329.353L494.885 334.812L489 340V402.535L551 459L551.296 370.78L551.21 282.54ZM314 511.047V591H431V511L314 511.047Z" fill="#EF6702"/>
          </g>
        </g>
        <defs>
          <clipPath id="clip0_2013_9">
            <rect width="730" height="808" fill="white"/>
          </clipPath>
        </defs>
      </svg>
    </div>

    {/* TEXT */}
    <div className="flex flex-col items-center justify-center -space-y-0.5">
      <h1 className="text-2xl font-bold tracking-tight text-white leading-none">
        Solar<span className="text-[#e96504]">Smart</span>
      </h1>
      <p className="text-[9px] text-slate-300 font-semibold tracking-[0.2em] w-full text-center mt-0.5 uppercase opacity-90">
        Geleceğin Enerjisi
      </p>
    </div>

  </div>
);