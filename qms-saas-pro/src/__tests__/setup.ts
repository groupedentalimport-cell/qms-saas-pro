import '@testing-library/jest-dom/vitest';

// Mock React Router
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
  Routes: ({ children }: { children: React.ReactNode }) => children,
  Route: ({ element }: { element: React.ReactNode }) => element,
  Outlet: () => null,
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
  useParams: () => ({}),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

// Suppress console.error for expected test warnings
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && (
    args[0].includes('Warning: ReactDOM.render') ||
    args[0].includes('Not implemented: navigation') ||
    args[0].includes('act(')
  )) {
    return;
  }
  originalConsoleError.call(console, ...args);
};
