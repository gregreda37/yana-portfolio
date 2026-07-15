import { Component } from 'react';
import { logger } from '../firebase/logger';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    logger.error('React render error', {
      message: error.message,
      stack: error.stack?.slice(0, 600) ?? '',
      componentStack: info.componentStack?.slice(0, 400) ?? '',
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="font-display text-2xl text-gray-800 mb-2">Something went wrong</h2>
          <p className="font-body text-sm text-gray-400 mb-6">
            An unexpected error occurred. Reload the page to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
