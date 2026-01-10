import { render, screen, fireEvent, act } from '@testing-library/react'; // Import act
import { describe, it, expect, vi } from 'vitest';
import AddCard from '../pages/AddCard';
import { BrowserRouter } from 'react-router-dom';

// 1. MOCK API
vi.mock('../api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: {} })), 
  },
}));

// 2. MOCK TOAST
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AddCard Component', () => {
  
  it('renders the form correctly', async () => {
    // Wrap render in act
    await act(async () => {
      render(
        <BrowserRouter>
          <AddCard />
        </BrowserRouter>
      );
    });

    expect(screen.getByText(/Add New Card/i)).toBeInTheDocument();
  });

  it('updates input fields when typing', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <AddCard />
        </BrowserRouter>
      );
    });

    const frontInput = screen.getByPlaceholderText(/Type your question.../i);
    
    // Wrap the event in act
    await act(async () => {
      fireEvent.change(frontInput, { target: { value: 'What is React?' } });
    });
    
    expect(frontInput.value).toBe('What is React?');
  });

  it('prevents saving if fields are empty', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <AddCard />
        </BrowserRouter>
      );
    });

    const saveBtn = screen.getByText(/Save Card/i);
    
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    const frontInput = screen.getByPlaceholderText(/Type your question.../i);
    expect(frontInput.value).toBe(''); 
  });

});