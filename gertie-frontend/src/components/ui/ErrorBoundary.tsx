import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-600">Something went wrong</h2>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}