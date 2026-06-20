import React from 'react';

// Catches render crashes AND failed lazy-chunk loads (which happen when the app
// is redeployed and a browser still holds the old index.html → the hashed chunk
// filename no longer exists → dynamic import rejects → blank/white screen).
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error) {
        const msg = error?.message || '';
        const isChunkError = /ChunkLoadError|Loading chunk|dynamically imported module|Failed to fetch dynamically|importing a module script failed/i.test(msg);
        // For a stale chunk after redeploy: reload ONCE to pull fresh assets.
        if (isChunkError && !sessionStorage.getItem('t2c-chunk-reloaded')) {
            sessionStorage.setItem('t2c-chunk-reloaded', '1');
            window.location.reload();
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                        <div className="w-14 h-14 mx-auto rounded-full bg-red-50 text-red-500 flex items-center justify-center text-2xl font-black">!</div>
                        <h1 className="text-xl font-black text-gray-900 mt-4">Something went wrong</h1>
                        <p className="text-gray-500 font-medium mt-2 text-sm">
                            The page failed to load. This usually clears up with a refresh.
                        </p>
                        {this.state.error?.message && (
                            <pre className="text-[11px] text-left text-gray-400 bg-gray-50 border border-gray-100 rounded-lg p-3 mt-4 overflow-auto max-h-32 whitespace-pre-wrap">
                                {this.state.error.message}
                            </pre>
                        )}
                        <button
                            onClick={() => { sessionStorage.removeItem('t2c-chunk-reloaded'); window.location.reload(); }}
                            className="mt-5 w-full py-3 bg-brand-600 text-white font-black rounded-xl hover:bg-brand-700 active:scale-95 transition-all"
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
