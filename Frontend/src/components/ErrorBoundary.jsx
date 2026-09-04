import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { hasError: false, errorId: "" };

  static getDerivedStateFromError() {
    return { hasError: true, errorId: `ERR-${Date.now().toString(36).toUpperCase()}` };
  }

  componentDidCatch(error, info) {
    console.error("[UI_ERROR]", this.state.errorId, error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center text-white"><div><h1 className="text-3xl font-bold">Something went wrong</h1><p className="text-slate-400 mt-3">Please reload the page or return home.</p><p className="text-slate-500 text-sm mt-4">Reference: {this.state.errorId}</p><div className="flex gap-3 justify-center mt-6"><button onClick={() => window.location.reload()} className="rounded-lg bg-cyan-400 text-slate-950 px-5 py-3">Reload</button><a href="/home" className="rounded-lg bg-white/10 px-5 py-3">Go home</a></div></div></main>;
  }
}
