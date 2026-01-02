export default function SecurityPage() {
  return (
    <div className="my-12 space-y-6">
      <h1 className="text-4xl font-bold tracking-tight">Security</h1>
      <p className="text-zinc-500 dark:text-zinc-400">Last updated: January 2, 2026</p>

      <section>
        <h2>1. Infrastructure</h2>
        <p>
          Geniy is built on industry-leading secure infrastructure powered by Amazon Web Services (AWS):
        </p>
        <ul>
          <li><strong>Frontend Hosting:</strong> AWS Amplify with automatic SSL and global CDN distribution.</li>
          <li><strong>Backend Hosting:</strong> AWS EC2 with App Runner for isolated, scalable compute instances.</li>
          <li><strong>Database:</strong> Amazon RDS (PostgreSQL) with encryption at rest and automatic backups.</li>
          <li><strong>File Storage:</strong> AWS S3 with server-side encryption (SSE-S3).</li>
          <li><strong>Payment Processing:</strong> Paystack (PCI-DSS Level 1 compliant).</li>
        </ul>
      </section>

      <section>
        <h2>2. Authentication & Access</h2>
        <p>
          We implement robust authentication measures:
        </p>
        <ul>
          <li><strong>Password Security:</strong> bcrypt hashing with automatic salt generation.</li>
          <li><strong>Session Management:</strong> Secure JWT tokens with expiration.</li>
          <li><strong>Workspace Isolation:</strong> Strict role-based access control (RBAC) ensures only authorized members can access workspace data.</li>
          <li><strong>Audit Logging:</strong> All sensitive operations are logged for security monitoring.</li>
        </ul>
      </section>

      <section>
        <h2>3. Data Protection</h2>
        <p>
          We employ strict measures to protect your data:
        </p>
        <ul>
          <li><strong>Encryption in Transit:</strong> All data is encrypted via TLS 1.2+ (HTTPS).</li>
          <li><strong>Encryption at Rest:</strong> Business context and sensitive data encrypted with AES-256.</li>
          <li><strong>Database Isolation:</strong> Workspace data is logically isolated with row-level security.</li>
          <li><strong>Secure File Handling:</strong> Uploaded documents are stored with restricted access policies.</li>
        </ul>
      </section>

      <section>
        <h2>4. AI & Third-Party Security</h2>
        <p>
          Our AI integrations prioritize your privacy:
        </p>
        <ul>
          <li><strong>Google Gemini:</strong> Enterprise API with zero data retention for training.</li>
          <li><strong>No Cross-Workspace Data Sharing:</strong> Your data is never used to train models or shared with other users.</li>
          <li><strong>API Key Security:</strong> All third-party API keys are stored encrypted and never exposed to the frontend.</li>
        </ul>
      </section>

      <section>
        <h2>5. Survey & Response Security</h2>
        <p>
          Survey responses are protected with:
        </p>
        <ul>
          <li>Unique, non-guessable survey URLs.</li>
          <li>Optional respondent anonymity settings.</li>
          <li>Encrypted storage of response data.</li>
          <li>Rate limiting to prevent abuse.</li>
        </ul>
      </section>

      <section>
        <h2>6. Reporting Vulnerabilities</h2>
        <p>
          If you discover a security vulnerability, please report it to us immediately at <strong>security@geniy.ai</strong>. 
          We appreciate your help in keeping Geniy safe and will acknowledge responsible disclosures.
        </p>
      </section>

      <section>
        <h2>7. Compliance</h2>
        <p>
          Geniy is committed to data protection best practices. We are continuously working towards compliance with:
        </p>
        <ul>
          <li>GDPR (General Data Protection Regulation)</li>
          <li>Data Protection Act (Ghana)</li>
        </ul>
      </section>
    </div>
  )
}
