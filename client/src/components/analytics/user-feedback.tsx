import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Star, MessageSquare, Bug, Lightbulb, Heart, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface UserFeedbackProps {
  onClose?: () => void;
  compact?: boolean;
}

type FeedbackType = 'bug_report' | 'feature_request' | 'general_feedback' | 'rating';

export function UserFeedback({ onClose, compact = false }: UserFeedbackProps) {
  const [type, setType] = useState<FeedbackType>('general_feedback');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const feedbackTypes = [
    {
      value: 'bug_report' as const,
      label: 'Bug Report',
      icon: Bug,
      description: 'Report a problem or issue'
    },
    {
      value: 'feature_request' as const,
      label: 'Feature Request',
      icon: Lightbulb,
      description: 'Suggest a new feature'
    },
    {
      value: 'general_feedback' as const,
      label: 'General Feedback',
      icon: MessageSquare,
      description: 'Share your thoughts'
    },
    {
      value: 'rating' as const,
      label: 'Rate Experience',
      icon: Heart,
      description: 'Rate your experience'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && type !== 'rating') {
      toast.error('Please provide feedback message');
      return;
    }

    if (type === 'rating' && rating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          message: message.trim() || undefined,
          rating: type === 'rating' ? rating : undefined,
          metadata: {
            page: window.location.pathname,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setIsSubmitted(true);
      toast.success('Thank you for your feedback!');
      
      // Reset form after a delay
      setTimeout(() => {
        setMessage('');
        setRating(0);
        setType('general_feedback');
        setIsSubmitted(false);
        onClose?.();
      }, 2000);

    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const trackInteraction = async (action: string, target: string, metadata?: any) => {
    try {
      await fetch('/api/analytics/interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          target,
          metadata: {
            ...metadata,
            page: window.location.pathname,
            timestamp: new Date().toISOString()
          }
        }),
      });
    } catch (error) {
      // Silently fail for analytics tracking
      console.debug('Failed to track interaction:', error);
    }
  };

  const handleTypeChange = (newType: FeedbackType) => {
    setType(newType);
    trackInteraction('feedback_type_selected', newType);
  };

  const handleRatingClick = (newRating: number) => {
    setRating(newRating);
    trackInteraction('rating_selected', 'star_rating', { rating: newRating });
  };

  if (isSubmitted) {
    return (
      <Card className={compact ? 'w-full' : 'w-full max-w-md mx-auto'}>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Thank you!</h3>
              <p className="text-muted-foreground">Your feedback has been submitted successfully.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={compact ? 'w-full' : 'w-full max-w-md mx-auto'}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <span>Share Your Feedback</span>
        </CardTitle>
        <CardDescription>
          Help us improve by sharing your thoughts and suggestions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Feedback Type</Label>
            <RadioGroup
              value={type}
              onValueChange={handleTypeChange}
              className="mt-2"
            >
              {feedbackTypes.map((feedbackType) => {
                const Icon = feedbackType.icon;
                return (
                  <div key={feedbackType.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={feedbackType.value} id={feedbackType.value} />
                    <Label
                      htmlFor={feedbackType.value}
                      className="flex items-center space-x-2 cursor-pointer flex-1"
                    >
                      <Icon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{feedbackType.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {feedbackType.description}
                        </div>
                      </div>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {type === 'rating' && (
            <div>
              <Label className="text-sm font-medium">Rating</Label>
              <div className="flex items-center space-x-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= (hoveredRating || rating)
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="message" className="text-sm font-medium">
              {type === 'rating' ? 'Additional Comments (Optional)' : 'Message'}
            </Label>
            <Textarea
              id="message"
              placeholder={
                type === 'bug_report'
                  ? 'Describe the issue you encountered...'
                  : type === 'feature_request'
                  ? 'Describe the feature you would like to see...'
                  : type === 'rating'
                  ? 'Tell us more about your experience...'
                  : 'Share your thoughts...'
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1"
              rows={4}
              maxLength={2000}
            />
            <div className="text-xs text-muted-foreground mt-1">
              {message.length}/2000 characters
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              type="submit"
              disabled={isSubmitting || (!message.trim() && type !== 'rating') || (type === 'rating' && rating === 0)}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}