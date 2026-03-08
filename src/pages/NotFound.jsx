import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        padding: '20px',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: '500px',
        }}
      >
        <h1
          style={{
            fontSize: '120px',
            fontWeight: '700',
            margin: '0 0 10px 0',
            color: 'var(--primary)',
            lineHeight: '1',
          }}
        >
          404
        </h1>

        <h2
          style={{
            fontSize: '32px',
            fontWeight: '600',
            margin: '0 0 20px 0',
            color: 'var(--gray-500)',
          }}
        >
          Page Not Found
        </h2>

        <p
          style={{
            fontSize: '16px',
            color: 'var(--gray-500)',
            marginBottom: '40px',
            lineHeight: '1.6',
          }}
        >
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 24px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '16px',
            transition: 'background-color 0.3s ease',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = 'var(--primary-light)')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'var(--primary)')}
        >
          <Home size={20} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
