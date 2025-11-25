import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F0F0F',
      color: '#ffffff',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '90vw',
        margin: '0 auto',
        padding: '40px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '32px',
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '4px',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#ADD8E6';
            e.currentTarget.style.color = '#ADD8E6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.color = '#ffffff';
          }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <h1 style={{
          fontSize: '32px',
          marginBottom: '24px',
          color: '#ffffff'
        }}>
          Terms of Service
        </h1>

        <p style={{
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '32px'
        }}>
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div style={{
          lineHeight: '1.8',
          fontSize: '16px',
          color: 'rgba(255, 255, 255, 0.9)'
        }}>
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '16px',
              color: '#ADD8E6'
            }}>
              1. Acceptance of Terms
            </h2>
            <p style={{ marginBottom: '16px' }}>
              By accessing and using Petflix, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '16px',
              color: '#ADD8E6'
            }}>
              2. Use License
            </h2>
            <p style={{ marginBottom: '16px' }}>
              Permission is granted to temporarily access the materials on Petflix's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul style={{ marginLeft: '24px', marginBottom: '16px' }}>
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained on Petflix's website</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '16px',
              color: '#ADD8E6'
            }}>
              3. User Accounts
            </h2>
            <p style={{ marginBottom: '16px' }}>
              You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account or password. You must notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '16px',
              color: '#ADD8E6'
            }}>
              4. User Content
            </h2>
            <p style={{ marginBottom: '16px' }}>
              You retain ownership of any content you submit, post, or display on or through Petflix. By submitting content, you grant Petflix a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute your content for the purpose of operating and promoting the service.
            </p>
            <p style={{ marginBottom: '16px' }}>
              You agree not to post content that is illegal, harmful, threatening, abusive, or violates any third-party rights. Petflix reserves the right to remove any content that violates these terms.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '16px',
              color: '#ADD8E6'
            }}>
              5. Prohibited Uses
            </h2>
            <p style={{ marginBottom: '16px' }}>
              You may not use Petflix:
            </p>
            <ul style={{ marginLeft: '24px', marginBottom: '16px' }}>
              <li>In any way that violates any applicable law or regulation</li>
              <li>To transmit any malicious code or viruses</li>
              <li>To impersonate or attempt to impersonate another user or entity</li>
              <li>To engage in any automated use of the system</li>
              <li>To interfere with or disrupt the service or servers</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '16px',
              color: '#ADD8E6'
            }}>
              6. Intellectual Property
            </h2>
            <p style={{ marginBottom: '16px' }}>
              All content, features, and functionality of Petflix, including but not limited to text, graphics, logos, and software, are the exclusive property of Petflix and its licensors and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '16px',
              color: '#ADD8E6'
            }}>
              7. Termination
            </h2>
            <p style={{ marginBottom: '16px' }}>
              We may terminate or suspend your account and access to the service immediately, without prior notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '16px',
              color: '#ADD8E6'
            }}>
              8. Disclaimer
            </h2>
            <p style={{ marginBottom: '16px' }}>
              The materials on Petflix's website are provided on an 'as is' basis. Petflix makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '16px',
              color: '#ADD8E6'
            }}>
              9. Limitation of Liability
            </h2>
            <p style={{ marginBottom: '16px' }}>
              In no event shall Petflix or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Petflix's website.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '16px',
              color: '#ADD8E6'
            }}>
              10. Changes to Terms
            </h2>
            <p style={{ marginBottom: '16px' }}>
              Petflix reserves the right to revise these terms of service at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '16px',
              color: '#ADD8E6'
            }}>
              11. Contact Information
            </h2>
            <p style={{ marginBottom: '16px' }}>
              If you have any questions about these Terms of Service, please contact us at legal@petflix.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

