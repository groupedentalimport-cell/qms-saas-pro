import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ─── Components under test ──────────────────────────────────────────────
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { GlobalSearch } from '@/components/shared/GlobalSearch';

// ─── Polyfills for jsdom ────────────────────────────────────────────────

// ResizeObserver is required by cmdk (Command component) but unavailable in jsdom
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// scrollIntoView is required by cmdk but unavailable in jsdom
Element.prototype.scrollIntoView = vi.fn();

// ─── Mocks ──────────────────────────────────────────────────────────────

// Mock custom ThemeProvider (ThemeToggle depends on useTheme)
const mockSetTheme = vi.fn();
const mockTheme = { theme: 'light' as string, setTheme: mockSetTheme, resolvedTheme: 'light' as string };

vi.mock('@/providers/ThemeProvider', () => ({
  useTheme: () => mockTheme,
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock the QMS demo store (GlobalSearch depends on useQMSStore)
const mockStoreData = {
  documents: [
    {
      id: 'doc-1',
      title: 'SOP-001 Quality Manual',
      documentNumber: 'SOP-001',
      type: 'SOP',
      status: 'Approved',
    },
    {
      id: 'doc-2',
      title: 'WI-002 Cleaning Procedure',
      documentNumber: 'WI-002',
      type: 'Work Instruction',
      status: 'Draft',
    },
  ],
  capas: [],
  ncrs: [],
  audits: [],
  training: [],
  risks: [],
  batchRecords: [],
  suppliers: [],
  changeControls: [],
  deviations: [],
};

vi.mock('@/lib/demo-store', () => ({
  useQMSStore: (selector?: (state: typeof mockStoreData) => unknown) => {
    if (selector) {
      return selector(mockStoreData);
    }
    return mockStoreData;
  },
}));

// ─── Test helpers ───────────────────────────────────────────────────────

/**
 * Renders GlobalSearch with a minimal wrapper since it requires no
 * complex providers — the store and theme mocks above handle that.
 */
function renderGlobalSearch(onNavigate = vi.fn()) {
  return render(<GlobalSearch onNavigate={onNavigate} />);
}

// ═══════════════════════════════════════════════════════════════════════
// 1. ThemeToggle
// ═══════════════════════════════════════════════════════════════════════

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTheme.resolvedTheme = 'light';
  });

  it('renders without errors', () => {
    const { container } = render(<ThemeToggle />);
    expect(container).toBeTruthy();
  });

  it('contains an icon button', () => {
    render(<ThemeToggle />);
    // ThemeToggle renders a Button with size="icon"
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    // The button should have the icon size class
    expect(button.className).toContain('size-9');
  });

  it('calls setTheme to toggle from light to dark on click', async () => {
    mockTheme.resolvedTheme = 'light';
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    await userEvent.click(button);

    expect(mockSetTheme).toHaveBeenCalledTimes(1);
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('calls setTheme to toggle from dark to light on click', async () => {
    mockTheme.resolvedTheme = 'dark';
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    await userEvent.click(button);

    expect(mockSetTheme).toHaveBeenCalledTimes(1);
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('has an accessible aria-label that reflects the current theme', () => {
    mockTheme.resolvedTheme = 'dark';
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
  });

  it('has an accessible aria-label for light mode', () => {
    mockTheme.resolvedTheme = 'light';
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 2. Button (shadcn/ui)
// ═══════════════════════════════════════════════════════════════════════

describe('Button', () => {
  it('renders with text content', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    render(<Button>Default</Button>);
    const button = screen.getByRole('button');
    // Default variant should include bg-primary
    expect(button.className).toContain('bg-primary');
    expect(button.className).toContain('text-primary-foreground');
  });

  it('applies variant classes for "outline"', () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('border');
    expect(button.className).toContain('bg-background');
  });

  it('applies variant classes for "destructive"', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-destructive');
  });

  it('applies variant classes for "ghost"', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('hover:bg-accent');
  });

  it('applies variant classes for "secondary"', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-secondary');
  });

  it('applies variant classes for "link"', () => {
    render(<Button variant="link">Link</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('text-primary');
    expect(button.className).toContain('hover:underline');
  });

  it('applies size classes for "sm"', () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('h-8');
  });

  it('applies size classes for "lg"', () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('h-10');
  });

  it('applies size classes for "icon"', () => {
    render(<Button size="icon">Icon</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('size-9');
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    await userEvent.click(screen.getByRole('button', { name: /click/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('handles multiple click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    const button = screen.getByRole('button', { name: /click/i });
    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(3);
  });

  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('does not fire click events when disabled', async () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies disabled styling when disabled', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('disabled:opacity-50');
  });

  it('renders with data-slot="button" attribute', () => {
    render(<Button>Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-slot', 'button');
  });

  it('merges custom className', () => {
    render(<Button className="my-custom-class">Custom</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('my-custom-class');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 3. Input (shadcn/ui)
// ═══════════════════════════════════════════════════════════════════════

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  it('renders with data-slot="input" attribute', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('data-slot', 'input');
  });

  it('accepts placeholder prop', () => {
    render(<Input placeholder="Enter your name" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Enter your name');
  });

  it('displays the placeholder text', () => {
    render(<Input placeholder="Search..." />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('handles value changes via onChange', async () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'hello');

    expect(handleChange).toHaveBeenCalled();
    // Each character fires a change event
    expect(handleChange).toHaveBeenCalledTimes(5);
  });

  it('reflects typed value in controlled input', async () => {
    function ControlledInput() {
      const [value, setValue] = React.useState('');
      return <Input value={value} onChange={(e) => setValue(e.target.value)} />;
    }

    render(<ControlledInput />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, 'test');

    expect(input).toHaveValue('test');
  });

  it('can be disabled', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('applies disabled styling when disabled', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('disabled:opacity-50');
  });

  it('applies disabled cursor and pointer-events styling', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('disabled:pointer-events-none');
    expect(input.className).toContain('disabled:cursor-not-allowed');
  });

  it('accepts type="password" prop', () => {
    render(<Input type="password" />);
    // Password inputs do not have the "textbox" role, so query directly
    const input = document.querySelector('input[type="password"]');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'password');
  });

  it('accepts type="email"', () => {
    render(<Input type="email" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('accepts type="number"', () => {
    render(<Input type="number" />);
    // number inputs use spinbutton role
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('type', 'number');
  });

  it('merges custom className', () => {
    render(<Input className="my-input-class" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('my-input-class');
  });

  it('passes through additional HTML attributes', () => {
    render(<Input aria-label="Search field" data-testid="search-input" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-label', 'Search field');
    expect(input).toHaveAttribute('data-testid', 'search-input');
  });

  it('applies focus-visible ring styles', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('focus-visible:border-ring');
    expect(input.className).toContain('focus-visible:ring-ring');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 4. GlobalSearch
// ═══════════════════════════════════════════════════════════════════════

describe('GlobalSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the search input', () => {
    renderGlobalSearch();
    const searchInput = screen.getByRole('combobox');
    expect(searchInput).toBeInTheDocument();
  });

  it('has placeholder text in the search input', () => {
    renderGlobalSearch();
    const searchInput = screen.getByPlaceholderText('Search...');
    expect(searchInput).toBeInTheDocument();
  });

  it('has an aria-label for accessibility', () => {
    renderGlobalSearch();
    const searchInput = screen.getByRole('combobox');
    expect(searchInput).toHaveAttribute('aria-label', 'Search QMS records');
  });

  it('has combobox role with aria-autocomplete', () => {
    renderGlobalSearch();
    const searchInput = screen.getByRole('combobox');
    expect(searchInput).toHaveAttribute('aria-autocomplete', 'list');
  });

  it('does not show results dropdown when query is empty', () => {
    renderGlobalSearch();
    // There should be no listbox visible initially
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows search results when typing a matching query', async () => {
    renderGlobalSearch();
    const searchInput = screen.getByRole('combobox');

    await userEvent.type(searchInput, 'Quality');

    // Wait for the results dropdown to appear (cmdk renders its own listbox alongside our wrapper)
    await waitFor(() => {
      const listboxes = screen.getAllByRole('listbox');
      expect(listboxes.length).toBeGreaterThanOrEqual(1);
    });

    // Should find the "SOP-001 Quality Manual" document
    expect(screen.getByText('SOP-001 Quality Manual')).toBeInTheDocument();
  });

  it('shows grouped results by entity type', async () => {
    renderGlobalSearch();
    const searchInput = screen.getByRole('combobox');

    await userEvent.type(searchInput, 'Quality');

    await waitFor(() => {
      expect(screen.getByText('SOP-001 Quality Manual')).toBeInTheDocument();
    });

    // The "Documents" heading should appear in the grouped results
    expect(screen.getByText('Documents')).toBeInTheDocument();
  });

  it('displays the status badge for each search result', async () => {
    renderGlobalSearch();
    const searchInput = screen.getByRole('combobox');

    await userEvent.type(searchInput, 'Quality');

    await waitFor(() => {
      expect(screen.getByText('SOP-001 Quality Manual')).toBeInTheDocument();
    });

    // The document has status "Approved"
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('calls onNavigate when a search result is selected', async () => {
    const onNavigate = vi.fn();
    renderGlobalSearch(onNavigate);

    const searchInput = screen.getByRole('combobox');
    await userEvent.type(searchInput, 'Quality');

    await waitFor(() => {
      expect(screen.getByText('SOP-001 Quality Manual')).toBeInTheDocument();
    });

    // Click on the search result item
    const resultItem = screen.getByText('SOP-001 Quality Manual');
    await userEvent.click(resultItem);

    expect(onNavigate).toHaveBeenCalledWith('documents');
  });

  it('clears the query after selecting a result', async () => {
    const onNavigate = vi.fn();
    renderGlobalSearch(onNavigate);

    const searchInput = screen.getByRole('combobox');
    await userEvent.type(searchInput, 'Quality');

    await waitFor(() => {
      expect(screen.getByText('SOP-001 Quality Manual')).toBeInTheDocument();
    });

    const resultItem = screen.getByText('SOP-001 Quality Manual');
    await userEvent.click(resultItem);

    // After selection, the input should be cleared
    await waitFor(() => {
      expect(searchInput).toHaveValue('');
    });
  });

  it('does not show results dropdown when query matches nothing', async () => {
    renderGlobalSearch();
    const searchInput = screen.getByRole('combobox');

    await userEvent.type(searchInput, 'zzznonexistent');

    // The component only renders the dropdown when searchResults.length > 0,
    // so no listbox should appear for unmatched queries.
    // Wait briefly to ensure no async rendering occurs.
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('shows search results on focus if query is already present', async () => {
    renderGlobalSearch();
    const searchInput = screen.getByRole('combobox');

    // Type a query
    await userEvent.type(searchInput, 'Quality');

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('SOP-001 Quality Manual')).toBeInTheDocument();
    });

    // Click outside to blur (close the dropdown via backdrop)
    const backdrop = document.querySelector('.fixed.inset-0');
    if (backdrop) {
      await userEvent.click(backdrop);
    }

    // Re-focus the input
    await userEvent.click(searchInput);

    // Results should appear again since query is still present
    await waitFor(() => {
      expect(screen.getByText('SOP-001 Quality Manual')).toBeInTheDocument();
    });
  });

  it('updates aria-expanded when results are shown', async () => {
    renderGlobalSearch();
    const searchInput = screen.getByRole('combobox');

    // Initially not expanded (no results for empty query)
    expect(searchInput).toHaveAttribute('aria-expanded', 'false');

    await userEvent.type(searchInput, 'Quality');

    await waitFor(() => {
      expect(searchInput).toHaveAttribute('aria-expanded', 'true');
    });
  });

  it('searches document numbers as well as titles', async () => {
    renderGlobalSearch();
    const searchInput = screen.getByRole('combobox');

    // Search by document number
    await userEvent.type(searchInput, 'SOP-001');

    await waitFor(() => {
      expect(screen.getByText('SOP-001 Quality Manual')).toBeInTheDocument();
    });
  });
});
