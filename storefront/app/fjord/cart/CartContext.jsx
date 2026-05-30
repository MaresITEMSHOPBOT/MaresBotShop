import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'fjord-cart-v1';

function load() {
  if (typeof window === 'undefined') return { items: [], isOpen: false };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const items = raw ? JSON.parse(raw) : [];
    return { items: Array.isArray(items) ? items : [], isOpen: false };
  } catch {
    return { items: [], isOpen: false };
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const item = action.item;
      const existing = state.items.find((i) => i.key === item.key);
      const items = existing
        ? state.items.map((i) =>
            i.key === item.key ? { ...i, qty: Math.min(i.qty + item.qty, 99) } : i,
          )
        : [...state.items, item];
      return { ...state, items, isOpen: true };
    }
    case 'SET_QTY': {
      const items = state.items
        .map((i) => (i.key === action.key ? { ...i, qty: action.qty } : i))
        .filter((i) => i.qty > 0);
      return { ...state, items };
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter((i) => i.key !== action.key) };
    case 'CLEAR':
      return { ...state, items: [] };
    case 'OPEN':
      return { ...state, isOpen: true };
    case 'CLOSE':
      return { ...state, isOpen: false };
    case 'TOGGLE':
      return { ...state, isOpen: !state.isOpen };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      /* localStorage nedostupné – ignorujeme */
    }
  }, [state.items]);

  const value = useMemo(() => {
    const count = state.items.reduce((n, i) => n + i.qty, 0);
    const subtotal = state.items.reduce((s, i) => s + i.price * i.qty, 0);
    return {
      items: state.items,
      isOpen: state.isOpen,
      count,
      subtotal,
      add: (item) => dispatch({ type: 'ADD', item }),
      setQty: (key, qty) => dispatch({ type: 'SET_QTY', key, qty }),
      remove: (key) => dispatch({ type: 'REMOVE', key }),
      clear: () => dispatch({ type: 'CLEAR' }),
      open: () => dispatch({ type: 'OPEN' }),
      close: () => dispatch({ type: 'CLOSE' }),
      toggle: () => dispatch({ type: 'TOGGLE' }),
    };
  }, [state]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart musí být uvnitř <CartProvider>.');
  return ctx;
}
