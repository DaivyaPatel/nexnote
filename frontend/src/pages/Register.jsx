import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import api from '../lib/api';

function Register({ onLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    avatarUrl: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/register', formData);
      onLogin(response.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-surface border border-border p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <UserPlus className="w-12 h-12 text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-center text-text-primary mb-6">Create Account</h1>
        
        {error && (
          <div className="bg-surface border border-accent text-accent px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">Avatar URL (optional)</label>
            <input
              type="url"
              name="avatarUrl"
              value={formData.avatarUrl}
              onChange={handleChange}
              className="input w-full"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="text-center mt-6 text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
