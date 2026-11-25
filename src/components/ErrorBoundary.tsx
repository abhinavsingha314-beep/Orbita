import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readable = error.message || 'An unexpected application error occurred.';
    try {
      const parsed = JSON.parse(readable) as { error?: string; operationType?: string; path?: string };
      if (parsed.error) {
        readable = `Data access error (${parsed.operationType ?? 'operation'} on ${parsed.path ?? 'workspace'}): ${parsed.error}`;
      }
    } catch {
      // keep raw message
    }
    return { hasError: true, message: readable };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#090B12] text-[#F7F8FC] flex items-center justify-center p-6">
          <div className="w-full max-w-lg rounded-xl bg-[#151C2B] border border-[#252D40] p-8 space-y-5">
            <div className="flex items-center gap-3 text-[#EF5350]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h1 className="text-xl font-semibold text-[#F7F8FC]">Something interrupted the workspace</h1>
            </div>
            <p className="text-sm text-[#9CA7BB] leading-relaxed break-words">
              {this.state.message}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, message: '' });
                  window.location.href = '/';
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#527CFF] hover:bg-[#4168E8] text-white text-sm font-medium transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Reload Command Center
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
