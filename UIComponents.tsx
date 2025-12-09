import React from 'react';

// --- Helper ---
const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');

// --- Card ---
export const Card = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <div className={cn("bg-white rounded-xl border border-slate-200 shadow-sm", className)}>
    {children}
  </div>
);

export const CardHeader = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <div className={cn("p-6 pb-2", className)}>{children}</div>
);

export const CardTitle = ({ children }: { children?: React.ReactNode }) => (
  <h3 className="text-xl font-semibold text-navy-900 leading-none tracking-tight">{children}</h3>
);

export const CardContent = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <div className={cn("p-6 pt-2", className)}>{children}</div>
);

// --- Button ---
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = ({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-navy-900 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-navy-800 text-white hover:bg-navy-900",
    outline: "border border-slate-200 bg-transparent hover:bg-slate-100 text-slate-900",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-900",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-6",
    lg: "h-14 px-8 text-lg",
  };

  return (
    <button className={cn(baseStyles, variants[variant], sizes[size], className)} {...props} />
  );
};

// --- Input ---
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = ({ label, error, className, ...props }: InputProps) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
    <input
      className={cn(
        "flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-energy-500 focus:border-transparent transition-all",
        error && "border-red-500 focus:ring-red-500",
        className
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

// --- Select ---
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { label: string; value: string | number }[];
}

export const Select = ({ label, options, className, ...props }: SelectProps) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
    <div className="relative">
      <select
        className={cn(
          "flex h-11 w-full appearance-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-energy-500 focus:border-transparent",
          className
        )}
        {...props}
      >
        <option value="" disabled>Seçiniz</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
        <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
      </div>
    </div>
  </div>
);

// --- Tabs ---
export const Tabs = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
);

export const TabsList = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <div className={cn("inline-flex h-10 items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-500", className)}>
    {children}
  </div>
);

export const TabsTrigger = ({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children?: React.ReactNode 
}) => (
  <button
    onClick={onClick}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      active ? "bg-white text-navy-900 shadow-sm" : "hover:bg-gray-200 hover:text-slate-900"
    )}
  >
    {children}
  </button>
);

export const TabsContent = ({ active, children }: { active: boolean; children?: React.ReactNode }) => {
  if (!active) return null;
  return <div className="mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 animate-in fade-in zoom-in-95 duration-200">{children}</div>;
};

// --- Badge ---
export const Badge = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'info' }) => {
  const styles = {
    default: "bg-slate-100 text-slate-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    info: "bg-blue-100 text-blue-800",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2", styles[variant])}>
      {children}
    </span>
  );
};

// --- Toast ---
export const Toast = ({ message, show, onClose }: { message: string, show: boolean, onClose: () => void }) => {
    if(!show) return null;
    return (
        <div className="fixed bottom-4 right-4 z-50 bg-navy-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
            <span>{message}</span>
            <button onClick={onClose} className="text-slate-300 hover:text-white">✕</button>
        </div>
    )
}