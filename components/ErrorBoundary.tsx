
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Copy, Check, Home, AlertOctagon } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  scope?: string; // e.g., "Sidebar", "Chat", "Agent"
}

interface State {
  hasError: boolean;
  error: Error | null;
  copied: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    copied: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary] Caught error in ${this.props.scope || 'Root'}:`, error, errorInfo);
  }

  private copyErrorToClipboard = () => {
    const text = `Scope: ${this.props.scope || 'Root'}\nError: ${this.state.error?.message}\n\nStack: ${this.state.error?.stack}`;
    navigator.clipboard.writeText(text);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  private handleReset = () => {
      this.setState({ hasError: false, error: null });
  }

  private handleReload = () => {
      window.location.reload();
  }

  public render() {
    if (this.state.hasError) {
      // Small inline fallback for minor components (like icons or small widgets)
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Medium fallback for scoped areas like Sidebar or Chat Messages
      if (this.props.scope) {
        return (
          <div className="p-4 m-2 rounded-xl bg-secondary/50 border border-border text-center flex flex-col items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-2 bg-red-500/10 rounded-full text-red-500">
                <AlertOctagon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Error in {this.props.scope}</h3>
            <p className="text-xs text-muted-foreground max-w-[200px] truncate">{this.state.error?.message || "Something went wrong"}</p>
            <button 
              onClick={this.handleReset}
              className="mt-2 text-xs px-4 py-1.5 bg-background border border-border hover:bg-secondary text-foreground rounded-lg transition-colors font-medium shadow-sm"
            >
              Try Again
            </button>
          </div>
        );
      }

      // Full screen fallback for critical application crashes
      return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 text-center bg-background text-foreground animate-in fade-in duration-500">
          
          <div className="relative mb-8 group">
              <div className="absolute inset-0 bg-red-500/10 blur-3xl rounded-full animate-pulse-slow"></div>
              <div className="p-8 bg-card rounded-2xl border border-red-500/20 relative shadow-2xl ring-1 ring-red-500/10 group-hover:scale-105 transition-transform duration-500">
                <AlertTriangle className="w-16 h-16 text-red-500" />
              </div>
          </div>
          
          <h1 className="text-4xl font-bold font-cinema tracking-tight mb-4 bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
            Application Paused
          </h1>
          <p className="text-muted-foreground text-sm max-w-md leading-relaxed mb-8">
             A critical error occurred. We've safely paused the application to prevent data loss. 
             Please try reloading or copying the error for support.
          </p>

          <div className="w-full max-w-lg mb-8">
            <div className="bg-secondary/30 rounded-xl border border-border overflow-hidden text-left shadow-sm">
              <div className="bg-secondary/50 px-4 py-3 border-b border-border flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    System Log
                  </span>
                  <button 
                    onClick={this.copyErrorToClipboard}
                    className="text-[10px] flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-md hover:bg-background/50 font-medium"
                    title="Copy debugging info to clipboard"
                  >
                    {this.state.copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {this.state.copied ? 'Copied' : 'Copy Log'}
                  </button>
              </div>
              <div className="p-4 bg-black/5 dark:bg-black/40">
                  <pre className="text-[11px] font-mono text-red-600 dark:text-red-400 whitespace-pre-wrap break-words max-h-40 overflow-y-auto scrollbar-thin">
                    {this.state.error?.message || "Unknown Runtime Error"}
                    {this.state.error?.stack && `\n\n${this.state.error.stack.split('\n')[1]}`}
                  </pre>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
             <button
              onClick={this.handleReload}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground rounded-xl hover:brightness-110 transition-all shadow-lg hover:shadow-primary/25 font-bold text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Reload App
            </button>
            <a
               href="/"
               className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded-xl transition-all font-bold text-sm"
            >
              <Home className="w-4 h-4" />
              Go Home
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
