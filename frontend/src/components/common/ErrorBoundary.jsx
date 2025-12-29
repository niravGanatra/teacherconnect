import React from 'react';
import { Button } from './index';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * ErrorBoundary Component
 * Catches JavaScript errors in child components and displays a fallback UI.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="min-h-[50vh] flex items-center justify-center p-6">
                    <div className="text-center max-w-lg mx-auto bg-white p-8 rounded-xl shadow-lg border border-red-100">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ExclamationTriangleIcon className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">
                            Something went wrong
                        </h2>
                        <p className="text-slate-600 mb-6">
                            We encountered an unexpected error while loading this section.
                            Please try refreshing the page.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-6 text-left bg-slate-50 p-4 rounded-lg overflow-auto max-h-48 text-xs font-mono text-red-600 border border-slate-200">
                                {this.state.error.toString()}
                                <br />
                                {this.state.errorInfo?.componentStack}
                            </div>
                        )}

                        <div className="flex justify-center gap-3">
                            <Button onClick={() => window.location.href = '/dashboard'} variant="secondary">
                                Go to Dashboard
                            </Button>
                            <Button onClick={this.handleReset} variant="primary">
                                <ArrowPathIcon className="w-4 h-4" />
                                Refresh Page
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
