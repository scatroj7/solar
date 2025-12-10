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

export const CardTitle = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <h3 className={cn("text-xl font-semibold text-navy-900 leading-none tracking-tight", className)}>{children}</h3>
);

export const CardContent = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <div className={cn("p-6 pt-2", className)}>{children}</div>
);

// --- Button ---
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = ({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-navy-900 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-navy-800 text-white hover:bg-navy-900",
    outline: "border border-slate-200 bg-transparent hover:bg-slate-100 text-slate-900",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-900",
    danger: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-green-600 text-white hover:bg-green-700",
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
  children,
  className 
}: { 
  active: boolean; 
  onClick: () => void; 
  children?: React.ReactNode;
  className?: string; 
}) => (
  <button
    onClick={onClick}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      active ? "bg-white text-navy-900 shadow-sm" : "hover:bg-gray-200 hover:text-slate-900",
      className
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
export const Badge = ({ children, variant = 'default' }: { children?: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'info' }) => {
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

// --- Progress ---
export const Progress = ({ value, max = 100, className }: { value: number; max?: number; className?: string }) => (
  <div className={cn("w-full bg-slate-200 rounded-full h-2.5 overflow-hidden", className)}>
    <div 
      className="bg-energy-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
      style={{ width: `${(value / max) * 100}%` }}
    />
  </div>
);

// --- Dialog / Modal ---
export const Dialog = ({ 
    isOpen, 
    onClose, 
    title, 
    children 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    title: string; 
    children?: React.ReactNode 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-slate-100">
                    <h3 className="font-semibold text-lg text-navy-900">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                <div className="p-4 max-h-[80vh] overflow-y-auto">
                    {children}
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <Button variant="outline" size="sm" onClick={onClose}>Kapat</Button>
                </div>
            </div>
        </div>
    );
};