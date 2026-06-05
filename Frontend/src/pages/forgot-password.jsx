import { useState } from 'react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed');
      setMessage(data.message || 'Check your email for reset instructions');
      if (data.resetURL) setMessage(`Reset link (dev): ${data.resetURL}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: 20 }}>
      <h2>Forgot Password</h2>
      <form onSubmit={submit}>
        <div>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%' }} />
        </div>
        <div style={{ marginTop: 12 }}>
          <button disabled={loading} type="submit">{loading ? 'Sending...' : 'Send reset link'}</button>
        </div>
      </form>
      {message && <div style={{ marginTop: 12 }}>{message}</div>}
      {error && <div style={{ marginTop: 12, color: 'red' }}>{error}</div>}
    </div>
  );
}
