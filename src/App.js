import React, { useReducer, useEffect, createContext, useContext, useRef, useCallback, useState, memo } from 'react';

// Context
const AppContext = createContext();

const initialState = {
  tool: 'pen',
  color: '#000000',
  brushSize: 5,
  brushOpacity: 1,
  brushHardness: 100,
  paths: [],
  history: [],
  currentPath: null
};

const reducer = (state, action) => {
  switch(action.type) {
    case 'set_tool':
      return { ...state, tool: action.payload };
    case 'set_color':
      return { ...state, color: action.payload };
    case 'set_brush_size':
      return { ...state, brushSize: action.payload };
    case 'set_brush_opacity':
      return { ...state, brushOpacity: action.payload };
    case 'set_brush_hardness':
      return { ...state, brushHardness: action.payload };
    case 'start_drawing':
      const brushSize = state.tool === 'finepen' ? 1 : 
                       state.tool === 'spray' ? 2 : 
                       state.brushSize;
      return {
        ...state,
        currentPath: {
          d: action.payload,
          stroke: state.tool === 'eraser' ? 'white' : state.color,
          strokeWidth: brushSize,
          opacity: state.brushOpacity
        }
      };
    case 'drawing':
      return {
        ...state,
        currentPath: {
          ...state.currentPath,
          d: action.payload
        }
      };
    case 'end_drawing':
      if (!state.currentPath) return state;
      return {
        ...state,
        paths: [...state.paths, state.currentPath],
        history: [...state.history, [...state.paths]],
        currentPath: null
      };
    case 'undo':
      if (state.history.length === 0) return state;
      const previousState = state.history[state.history.length - 1];
      return {
        ...state,
        history: state.history.slice(0, -1),
        paths: previousState || []
      };
    case 'redo':
      return state;
    case 'clear':
      return {
        ...state,
        paths: [],
        history: [],
        currentPath: null
      };
    default:
      return state;
  }
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

// Canvas Component
const Canvas = memo(() => {
  const { state, dispatch } = useAppContext();
  const svgRef = useRef(null);
  const isDrawing = useRef(false);

  const getPointFromEvent = useCallback((e) => {
    const svgRect = svgRef.current.getBoundingClientRect();
    const scaleX = 800 / svgRect.width;
    const scaleY = 600 / svgRect.height;
    
    return {
      x: (e.clientX - svgRect.left) * scaleX,
      y: (e.clientY - svgRect.top) * scaleY
    };
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleMouseDown = (e) => {
      if (!['pen', 'eraser', 'finepen', 'spray', 'fill'].includes(state.tool)) return;
      
      if (state.tool === 'fill') {
        // Para fill, cambiar el fondo del canvas
        const svg = svgRef.current;
        const rect = svg.querySelector('rect');
        if (rect) {
          rect.setAttribute('fill', state.color);
        }
        return;
      }
      
      isDrawing.current = true;
      const point = getPointFromEvent(e);
      
      if (state.tool === 'spray') {
        const sprayPoints = [];
        for (let i = 0; i < 8; i++) {
          const offsetX = (Math.random() - 0.5) * state.brushSize;
          const offsetY = (Math.random() - 0.5) * state.brushSize;
          sprayPoints.push(`M ${point.x + offsetX} ${point.y + offsetY} L ${point.x + offsetX + 0.5} ${point.y + offsetY + 0.5}`);
        }
        dispatch({
          type: 'start_drawing',
          payload: sprayPoints.join(' ')
        });
      } else {
        dispatch({
          type: 'start_drawing',
          payload: `M ${point.x} ${point.y}`
        });
      }
    };

    const handleMouseMove = (e) => {
      if (!isDrawing.current || !state.currentPath) return;
      const point = getPointFromEvent(e);
      
      if (state.tool === 'spray') {
        const sprayPoints = [];
        for (let i = 0; i < 5; i++) {
          const offsetX = (Math.random() - 0.5) * state.brushSize;
          const offsetY = (Math.random() - 0.5) * state.brushSize;
          sprayPoints.push(`M ${point.x + offsetX} ${point.y + offsetY} L ${point.x + offsetX + 0.5} ${point.y + offsetY + 0.5}`);
        }
        const newPath = `${state.currentPath.d} ${sprayPoints.join(' ')}`;
        dispatch({ type: 'drawing', payload: newPath });
      } else {
        const newPath = `${state.currentPath.d} L ${point.x} ${point.y}`;
        dispatch({ type: 'drawing', payload: newPath });
      }
    };

    const handleMouseUp = () => {
      if (isDrawing.current) {
        dispatch({ type: 'end_drawing' });
        isDrawing.current = false;
      }
    };

    svg.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      svg.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [state, dispatch, getPointFromEvent]);

  return (
    <div className="canvas-container">
      <svg
        ref={svgRef}
        className="drawing-canvas"
        width="100%"
        height="100%"
        viewBox="0 0 800 600"
        style={{ 
          cursor: state.tool === 'pen' ? 'crosshair' : 
                  state.tool === 'finepen' ? 'crosshair' :
                  state.tool === 'spray' ? 'crosshair' :
                  state.tool === 'fill' ? 'pointer' :
                  state.tool === 'eraser' ? 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'><rect x=\'4\' y=\'4\' width=\'16\' height=\'12\' rx=\'2\' fill=\'%23FFB6C1\' stroke=\'%23000\' stroke-width=\'1\'/><rect x=\'6\' y=\'6\' width=\'12\' height=\'8\' fill=\'white\'/></svg>") 12 12, auto' :
                  'default' 
        }}
      >
        <rect width="100%" height="100%" fill="white" />
        {state.paths.map((path, index) => (
          <path
            key={`path-${index}`}
            d={path.d}
            stroke={path.stroke}
            strokeWidth={path.strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={path.opacity || 1}
          />
        ))}
        {state.currentPath && (
          <path
            d={state.currentPath.d}
            stroke={state.currentPath.stroke}
            strokeWidth={state.currentPath.strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={state.currentPath.opacity || 1}
          />
        )}
      </svg>
    </div>
  );
});

// Toolbar Component
const Toolbar = memo(() => {
  const { state, dispatch } = useAppContext();
  const { tool } = state;

  const handleToolSelect = (toolName) => {
    dispatch({ type: 'set_tool', payload: toolName });
  };

  const handleUndo = () => {
    dispatch({ type: 'undo' });
  };

  const handleClear = () => {
    dispatch({ type: 'clear' });
  };

  return (
    <div className="toolbar">
      <div className="tool-group">
        <button
          className={`tool-button ${tool === 'pen' ? 'active' : ''}`}
          onClick={() => handleToolSelect('pen')}
          title="Lápiz (Ctrl+K)"
        >
          ✏️
        </button>
        <button
          className={`tool-button ${tool === 'finepen' ? 'active' : ''}`}
          onClick={() => handleToolSelect('finepen')}
          title="Lápiz fino"
        >
          ✒️
        </button>
        <button
          className={`tool-button ${tool === 'spray' ? 'active' : ''}`}
          onClick={() => handleToolSelect('spray')}
          title="Spray"
        >
          💨
        </button>
        <button
          className={`tool-button ${tool === 'fill' ? 'active' : ''}`}
          onClick={() => handleToolSelect('fill')}
          title="Relleno"
        >
          💥
        </button>
        <button
          className={`tool-button ${tool === 'eraser' ? 'active' : ''}`}
          onClick={() => handleToolSelect('eraser')}
          title="Borrador (Ctrl+E)"
        >
          🧹
        </button>
      </div>
      
      <div className="tool-group">
        <button
          className="tool-button"
          onClick={handleUndo}
          title="Deshacer (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          className="tool-button"
          onClick={handleClear}
          title="Limpiar (Ctrl+C)"
        >
          🗑️
        </button>
      </div>
    </div>
  );
});

// Brush Controls Component
const BrushControls = memo(() => {
  const { state, dispatch } = useAppContext();
  const { brushSize, brushOpacity, color } = state;

  const colors = [
    '#FFFFFF', '#000000', '#00FFFF', '#FF00FF', '#00FF00',
    '#FFFF00', '#FF0080', '#8000FF', '#FF8000', '#0080FF'
  ];

  return (
    <div className="brush-controls">
      <div className="brush-preview" style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div
          className="preview-circle"
          style={{
            width: `${Math.max(Math.min(brushSize * 3, 60), 30)}px`,
            height: `${Math.max(Math.min(brushSize * 3, 60), 30)}px`,
            opacity: brushOpacity,
            backgroundColor: color,
            borderRadius: '50%',
            border: '2px solid #ccc',
            margin: '0 auto',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'color';
            input.value = color;
            input.onchange = (e) => dispatch({ type: 'set_color', payload: e.target.value });
            input.click();
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          title="Click para selector de color avanzado"
        />
      </div>

      <div style={colorPaletteStyles}>
        <div style={colorRowStyles}>
          {colors.slice(0, 5).map((c) => (
            <button
              key={c}
              style={c === color ? selectedSwatchStyles : colorSwatchStyles}
              onClick={() => dispatch({ type: 'set_color', payload: c })}
              title={c}
            >
              <div style={{ 
                width: '20px', 
                height: '20px', 
                backgroundColor: c, 
                borderRadius: '2px',
                border: c === '#FFFFFF' ? '1px solid #ccc' : 'none'
              }} />
            </button>
          ))}
        </div>
        <div style={colorRowStyles}>
          {colors.slice(5, 10).map((c) => (
            <button
              key={c}
              style={c === color ? selectedSwatchStyles : colorSwatchStyles}
              onClick={() => dispatch({ type: 'set_color', payload: c })}
              title={c}
            >
              <div style={{ 
                width: '20px', 
                height: '20px', 
                backgroundColor: c, 
                borderRadius: '2px' 
              }} />
            </button>
          ))}
        </div>
      </div>

      <div className="control-group">
        <label>
          Tamaño: {brushSize}px
          <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => dispatch({ 
              type: 'set_brush_size', 
              payload: parseInt(e.target.value) 
            })}
            className="slider"
          />
        </label>
      </div>

      <div className="control-group">
        <label>
          Opacidad: {Math.round(brushOpacity * 100)}%
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={brushOpacity}
            onChange={(e) => dispatch({ 
              type: 'set_brush_opacity', 
              payload: parseFloat(e.target.value) 
            })}
            className="slider"
          />
        </label>
      </div>
    </div>
  );
});

// App Provider Component
const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            dispatch({ type: 'undo' });
            break;
          case 'k':
            e.preventDefault();
            dispatch({ type: 'set_tool', payload: 'pen' });
            break;
          case 'e':
            e.preventDefault();
            dispatch({ type: 'set_tool', payload: 'eraser' });
            break;
          case 'c':
            e.preventDefault();
            dispatch({ type: 'clear' });
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Main App Component
const AppContent = () => {
  return (
    <div className="paint-app" style={appStyles}>
      <Toolbar />
      <div className="main-content" style={mainContentStyles}>
        <div className="sidebar" style={sidebarStyles}>
          <BrushControls />
        </div>
        <Canvas />
      </div>
      <div style={{
        textAlign: 'center',
        padding: '8px',
        fontSize: '12px',
        color: '#666',
        borderTop: '1px solid #e0e0e0',
        backgroundColor: '#f8f8f8'
      }}>
        Paintix 0.1 beta por Coque Tornado
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

// Styles
const appStyles = {
  display: 'flex',
  flexDirection: 'column',
  width: '95vw',
  maxWidth: '1200px',
  height: '85vh',
  maxHeight: '800px',
  border: '1px solid #e0e0e0',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  overflow: 'hidden',
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
};

const colorPaletteStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  marginBottom: '16px'
};

const colorRowStyles = {
  display: 'flex',
  gap: '4px'
};

const colorSwatchStyles = {
  width: '24px',
  height: '24px',
  minWidth: '24px',
  minHeight: '24px',
  border: '2px solid transparent',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'transform 0.2s',
  padding: '0',
  backgroundColor: 'transparent',
  display: 'flex'
};

const selectedSwatchStyles = {
  ...colorSwatchStyles,
  border: '2px solid #333',
  transform: 'scale(1.1)'
};

const mainContentStyles = {
  display: 'flex',
  flex: 1
};

const sidebarStyles = {
  width: '200px',
  borderRight: '1px solid #e0e0e0',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  backgroundColor: '#fafafa'
};

export default App;
