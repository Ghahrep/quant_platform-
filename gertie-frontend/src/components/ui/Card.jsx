import { cn } from '../../utils';

export default function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'bg-slate-800/50 rounded-xl p-4 sm:p-6 shadow-lg backdrop-blur-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
