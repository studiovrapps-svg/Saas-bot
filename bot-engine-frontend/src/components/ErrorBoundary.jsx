import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-6">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Algo salió mal</h1>
            <p className="text-slate-600 mb-6">Ha ocurrido un error inesperado al renderizar esta vista. Por favor recarga la página o vuelve más tarde.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 transition"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
