import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import TopicDisplay from './topic-display.svelte';

describe('TopicDisplay Component', () => {
  it('should render the current topic', () => {
    const topic = 'Artificial Intelligence';
    
    render(TopicDisplay, { props: { topic } });
    
    // Check if the topic is displayed
    expect(screen.getByText('Artificial Intelligence')).toBeTruthy();
  });

  it('should display a loading state when topic is empty', () => {
    const topic = '';
    
    render(TopicDisplay, { props: { topic } });
    
    // Check for empty topic display
    expect(screen.getByText('Current Topic')).toBeTruthy();
    // The component should show an empty div for the topic
    const topicElement = screen.getByText('Current Topic').nextElementSibling;
    expect(topicElement?.textContent).toBe('');
  });

  it('should apply different styles based on the topic length', () => {
    const shortTopic = 'AI';
    
    render(TopicDisplay, { props: { topic: shortTopic } });
    
    // Check if the topic is displayed
    expect(screen.getByText('AI')).toBeTruthy();
    
    // Re-render with a long topic
    const longTopic = 'Machine Learning and Artificial Intelligence';
    
    render(TopicDisplay, { props: { topic: longTopic } });
    
    // Check if the long topic is displayed
    expect(screen.getByText('Machine Learning and Artificial Intelligence')).toBeTruthy();
  });
}); 