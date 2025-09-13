import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from './react-utils';
import userEvent from '@testing-library/user-event';

// Simple test component
const TestButton: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  const [clicked, setClicked] = React.useState(false);
  
  const handleClick = () => {
    setClicked(true);
    onClick?.();
  };
  
  return (
    <button onClick={handleClick}>
      {clicked ? 'Clicked!' : 'Click me'}
    </button>
  );
};

const TestForm: React.FC = () => {
  const [value, setValue] = React.useState('');
  
  return (
    <form>
      <label htmlFor="test-input">Test Input</label>
      <input
        id="test-input"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter text"
      />
      <p>Value: {value}</p>
    </form>
  );
};

describe('React Component Testing', () => {
  describe('TestButton Component', () => {
    it('should render with initial text', () => {
      render(<TestButton />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should change text when clicked', async () => {
      const user = userEvent.setup();
      render(<TestButton />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(screen.getByText('Clicked!')).toBeInTheDocument();
      expect(screen.queryByText('Click me')).not.toBeInTheDocument();
    });

    it('should call onClick handler when provided', async () => {
      const user = userEvent.setup();
      const mockOnClick = vi.fn();
      render(<TestButton onClick={mockOnClick} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('TestForm Component', () => {
    it('should render form elements', () => {
      render(<TestForm />);
      
      expect(screen.getByLabelText('Test Input')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
      expect(screen.getByText('Value:')).toBeInTheDocument();
    });

    it('should update value when typing', async () => {
      const user = userEvent.setup();
      render(<TestForm />);
      
      const input = screen.getByLabelText('Test Input');
      await user.type(input, 'Hello World');
      
      expect(screen.getByDisplayValue('Hello World')).toBeInTheDocument();
      expect(screen.getByText('Value: Hello World')).toBeInTheDocument();
    });

    it('should clear input when cleared', async () => {
      const user = userEvent.setup();
      render(<TestForm />);
      
      const input = screen.getByLabelText('Test Input');
      await user.type(input, 'Test');
      await user.clear(input);
      
      expect(screen.getByDisplayValue('')).toBeInTheDocument();
      expect(screen.getByText('Value:')).toBeInTheDocument();
    });
  });

  describe('Accessibility Testing', () => {
    it('should have proper ARIA labels', () => {
      render(<TestForm />);
      
      const input = screen.getByLabelText('Test Input');
      expect(input).toHaveAttribute('id', 'test-input');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<TestButton />);
      
      const button = screen.getByRole('button');
      button.focus();
      
      expect(button).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(screen.getByText('Clicked!')).toBeInTheDocument();
    });
  });
});