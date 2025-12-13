import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-red-50 flex items-center justify-center p-8">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full border border-red-200">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong.</h1>
                        <p className="text-gray-600 mb-4">Please report this error to support.</p>
                        <div className="bg-gray-100 p-4 rounded overflow-auto text-sm font-mono text-red-800 h-64">
                            <p className="font-bold">{this.state.error?.toString()}</p>
                            <pre>{this.state.errorInfo?.componentStack}</pre>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
