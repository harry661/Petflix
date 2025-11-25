import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
          Privacy Policy
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
              1. Introduction
            </h2>
            <p style={{ marginBottom: '16px' }}>
              Petflix ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the service.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '16px',
              color: '#ADD8E6'
            }}>
              2. Information We Collect
            </h2>
            <h3 style={{
              fontSize: '20px',
              marginBottom: '12px',
              marginTop: '16px',
              color: '#ffffff'
            }}>
              2.1 Personal Information
            </h3>
            <p style={{ marginBottom: '16px' }}>
              We may collect personal information that you voluntarily provide to us when you register for an account, including:
            </p>
            <ul style={{ marginLeft: '24px', marginBottom: '16px' }}>
              <li>Name and username</li>
              <li>Email address</li>
              <li>Password (stored securely using encryption)</li>
              <li>Profile information and preferences</li>
            </ul>

            <h3 style={{
              fontSize: '20px',
              marginBottom: '12px',
              marginTop: '16px',
              color: '#ffffff'
            }}>
              2.2 Usage Information
            </h3>
            <p style={{ marginBottom: '16px' }}>
              We automatically collect certain information when you use our service, including:
            </p>
            <ul style={{ marginLeft: '24px', marginBottom: '16px' }}>
              <li>Device information and identifiers</li>
              <li>IP address and location data</li>
              <li>Browser type and version</li>
              <li>Pages visited and time spent on pages</li>
              <li>Videos watched and interactions</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '16px',
              color: '#ADD8E6'
            }}>
              3. How We Use Your Information
            </h2>
            <p style={{ marginBottom: '16px' }}>
              We use the information we collect to:
            </p>
            <ul style={{ marginLeft: '24px', marginBottom: '16px' }}>
              <li>Provide, maintain, and improve our services</li>
              <li>Process your registration and manage your account</li>
              <li>Personalize your experience and content recommendations</li>
              <li>Send you notifications and updates about the service</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Detect, prevent, and address technical issues and security threats</li>
              <li>Comply with legal obligations and enforce our terms</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '16px',
              color: '#ADD8E6'
            }}>
              4. Information Sharing and Disclosure
            </h2>
            <p style={{ marginBottom: '16px' }}>
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            <ul style={{ marginLeft: '24px', marginBottom: '16px' }}>
              <li><strong>Service Providers:</strong> We may share information with third-party service providers who perform services on our behalf, such as hosting, analytics, and customer support.</li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required by law or in response to valid requests by public authorities.</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
              <li><strong>With Your Consent:</strong> We may share your information with your explicit consent or at your direction.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '16px',
              color: '#ADD8E6'
            }}>
              5. Data Security
            </h2>
            <p style={{ marginBottom: '16px' }}>
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '16px',
              color: '#ADD8E6'
            }}>
              6. Your Rights and Choices
            </h2>
            <p style={{ marginBottom: '16px' }}>
              You have the following rights regarding your personal information:
            </p>
            <ul style={{ marginLeft: '24px', marginBottom: '16px' }}>
              <li><strong>Access:</strong> You can access and review your personal information through your account settings.</li>
              <li><strong>Correction:</strong> You can update or correct your personal information at any time.</li>
              <li><strong>Deletion:</strong> You can request deletion of your account and associated data.</li>
              <li><strong>Opt-out:</strong> You can opt-out of certain communications and data processing activities.</li>
              <li><strong>Data Portability:</strong> You can request a copy of your data in a portable format.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '16px',
              color: '#ADD8E6'
            }}>
              7. Cookies and Tracking Technologies
            </h2>
            <p style={{ marginBottom: '16px' }}>
              We use cookies and similar tracking technologies to track activity on our service and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '16px',
              color: '#ADD8E6'
            }}>
              8. Children's Privacy
            </h2>
            <p style={{ marginBottom: '16px' }}>
              Our service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '16px',
              color: '#ADD8E6'
            }}>
              9. International Data Transfers
            </h2>
            <p style={{ marginBottom: '16px' }}>
              Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ. By using our service, you consent to the transfer of your information to these facilities.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '16px',
              color: '#ADD8E6'
            }}>
              10. Changes to This Privacy Policy
            </h2>
            <p style={{ marginBottom: '16px' }}>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '16px',
              color: '#ADD8E6'
            }}>
              11. Contact Us
            </h2>
            <p style={{ marginBottom: '16px' }}>
              If you have any questions about this Privacy Policy, please contact us at privacy@petflix.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

