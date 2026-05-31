import { Component } from 'react';

// Když 3D (WebGL) selže — starý GPU, vypnutý WebGL, chyba kontextu —
// nesmí to shodit celou stránku. Místo plátna se ukáže fallback (CSS láhev).
export class CanvasErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    // jen log; stránka běží dál bez 3D
    if (typeof console !== 'undefined') console.warn('3D scéna selhala, používám fallback:', error);
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}
