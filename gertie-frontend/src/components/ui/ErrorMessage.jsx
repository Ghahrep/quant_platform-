import { AlertCircle } from "lucide-react";

export default function ErrorMessage({ error, onRetry }) {
  return (
    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
      <div className="flex items-center space-x-2 text-red-400">
        <AlertCircle className="w-5 h-5" />
        <h3 className="font-semibold">Error</h3>
      </div>
      <p className="text-red-300 mt-2">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
