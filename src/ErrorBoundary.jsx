import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { crashed: false }

  static getDerivedStateFromError() {
    return { crashed: true }
  }

  render() {
    if (this.state.crashed) {
      return (
        <div className="min-h-screen bg-[#f1f2f4] flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl border border-border shadow-sm p-10 text-center max-w-sm">
            <div className="text-4xl mb-3">😅</div>
            <h2 className="text-lg font-bold text-foreground mb-1">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-5">Try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-[#3b3bf5] text-white rounded-lg text-sm font-medium hover:bg-[#2d2de0] transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
