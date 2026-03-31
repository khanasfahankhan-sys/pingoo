import { render, screen } from '@testing-library/react';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

jest.mock("./pages/Lesson", () => () => <div />);

test('renders learn react link', () => {
  render(
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  );
  expect(screen.getByRole("heading", { name: /welcome to/i })).toBeInTheDocument();
});
