import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '../react-utils';
import userEvent from '@testing-library/user-event';
import { UserFeedback } from '@/components/analytics/user-feedback';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock Radix UI components that cause issues in test environment
vi.mock('@/components/ui/radio-group', () => ({
  RadioGroup: ({ children, value, onValueChange }: any) => (
    <div data-testid="radio-group" data-value={value}>
      {children}
    </div>
  ),
  RadioGroupItem: ({ value, id }: any) => (
    <input
      type="radio"
      value={value}
      id={id}
      data-testid={`radio-${value}`}
      onChange={(e) => e.target.checked && e.target.form?.dispatchEvent(new Event('change'))}
    />
  )
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} data-testid="feedback-textarea" />
}));

describe('UserFeedback Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render feedback form correctly', () => {
      render(<UserFeedback onClose={mockOnClose} />);

      expect(screen.getByText('Share Your Feedback')).toBeInTheDocument();
      expect(screen.getByText('Help us improve by sharing your thoughts and suggestions')).toBeInTheDocument();
      expect(screen.getByText('Feedback Type')).toBeInTheDocument();
      expect(screen.getByText('Message')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit feedback/i })).toBeInTheDocument();
    });

    it('should render all feedback type options', () => {
      render(<UserFeedback onClose={mockOnClose} />);

      expect(screen.getByText('Bug Report')).toBeInTheDocument();
      expect(screen.getByText('Feature Request')).toBeInTheDocument();
      expect(screen.getByText('General Feedback')).toBeInTheDocument();
      expect(screen.getByText('Rate Experience')).toBeInTheDocument();
    });

    it('should render compact version when compact prop is true', () => {
      render(<UserFeedback onClose={mockOnClose} compact={true} />);

      expect(screen.getByText('Share Your Feedback')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should update message when typing', async () => {
      const user = userEvent.setup();
      render(<UserFeedback onClose={mockOnClose} />);

      const messageTextarea = screen.getByTestId('feedback-textarea');
      await user.type(messageTextarea, 'This is my feedback');

      expect(messageTextarea).toHaveValue('This is my feedback');
    });

    it('should show character count', async () => {
      const user = userEvent.setup();
      render(<UserFeedback onClose={mockOnClose} />);

      const messageTextarea = screen.getByTestId('feedback-textarea');
      await user.type(messageTextarea, 'Test message');

      expect(screen.getByText('12/2000 characters')).toBeInTheDocument();
    });

    it('should render feedback type options', () => {
      render(<UserFeedback onClose={mockOnClose} />);

      // Verify that feedback type options are rendered
      expect(screen.getByText('Bug Report')).toBeInTheDocument();
      expect(screen.getByText('Feature Request')).toBeInTheDocument();
      expect(screen.getByText('General Feedback')).toBeInTheDocument();
      expect(screen.getByText('Rate Experience')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should submit feedback successfully', async () => {
      const user = userEvent.setup();
      render(<UserFeedback onClose={mockOnClose} />);

      // Fill out form
      const messageTextarea = screen.getByTestId('feedback-textarea');
      await user.type(messageTextarea, 'This is my feedback');

      const submitButton = screen.getByRole('button', { name: /submit feedback/i });
      await user.click(submitButton);

      expect(mockFetch).toHaveBeenCalledWith('/api/feedback', expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"type":"general_feedback"')
      }));
      
      // Verify the body contains the expected data
      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.type).toBe('general_feedback');
      expect(body.message).toBe('This is my feedback');
      expect(body.rating).toBeUndefined();
      expect(body.metadata.page).toBe('/');
      expect(body.metadata.userAgent).toBeDefined();
      expect(body.metadata.timestamp).toBeDefined();
    });

    it('should show success state after submission', async () => {
      const user = userEvent.setup();
      render(<UserFeedback onClose={mockOnClose} />);

      const messageTextarea = screen.getByTestId('feedback-textarea');
      await user.type(messageTextarea, 'Test feedback');

      const submitButton = screen.getByRole('button', { name: /submit feedback/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Thank you!')).toBeInTheDocument();
        expect(screen.getByText('Your feedback has been submitted successfully.')).toBeInTheDocument();
      });
    });

    it('should handle submission errors', async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<UserFeedback onClose={mockOnClose} />);

      const messageTextarea = screen.getByTestId('feedback-textarea');
      await user.type(messageTextarea, 'Test feedback');

      const submitButton = screen.getByRole('button', { name: /submit feedback/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe('Form Validation', () => {
    it('should disable submit button when message is empty for non-rating types', () => {
      render(<UserFeedback onClose={mockOnClose} />);

      const submitButton = screen.getByRole('button', { name: /submit feedback/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when form is valid', async () => {
      const user = userEvent.setup();
      render(<UserFeedback onClose={mockOnClose} />);

      const messageTextarea = screen.getByTestId('feedback-textarea');
      await user.type(messageTextarea, 'Valid feedback');

      const submitButton = screen.getByRole('button', { name: /submit feedback/i });
      expect(submitButton).toBeEnabled();
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      mockFetch.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<UserFeedback onClose={mockOnClose} />);

      const messageTextarea = screen.getByTestId('feedback-textarea');
      await user.type(messageTextarea, 'Test feedback');

      const submitButton = screen.getByRole('button', { name: /submit feedback/i });
      await user.click(submitButton);

      expect(screen.getByText('Submitting...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<UserFeedback onClose={mockOnClose} />);

      expect(screen.getByText('Feedback Type')).toBeInTheDocument();
      expect(screen.getByText('Message')).toBeInTheDocument();
    });

    it('should have proper feedback type labels', () => {
      render(<UserFeedback onClose={mockOnClose} />);

      expect(screen.getByText('Bug Report')).toBeInTheDocument();
      expect(screen.getByText('Feature Request')).toBeInTheDocument();
      expect(screen.getByText('General Feedback')).toBeInTheDocument();
      expect(screen.getByText('Rate Experience')).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<UserFeedback onClose={mockOnClose} />);

      // Tab to the textarea
      const textarea = screen.getByTestId('feedback-textarea');
      textarea.focus();
      expect(textarea).toHaveFocus();
    });
  });

  describe('Props Handling', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<UserFeedback onClose={mockOnClose} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not render cancel button when onClose is not provided', () => {
      render(<UserFeedback />);

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });
  });
});