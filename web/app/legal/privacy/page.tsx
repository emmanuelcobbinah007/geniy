export default function PrivacyPage() {
  return (
    <div className="my-12 space-y-6">
      <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="text-zinc-500 dark:text-zinc-400">Last updated: January 2, 2026</p>

      <section>
        <h2>1. Data Collection</h2>
        <p>
          We collect information you provide directly to us, including:
        </p>
        <ul>
          <li><strong>Account information:</strong> Name, email address, and authentication credentials.</li>
          <li><strong>Workspace data:</strong> Business context, product descriptions, target audience information, and uploaded documents.</li>
          <li><strong>Survey data:</strong> Survey questions you create and responses collected from your audience.</li>
          <li><strong>Competitor research:</strong> Information about competitors you track within the platform.</li>
          <li><strong>Payment information:</strong> Billing details processed securely through Paystack (we do not store card details).</li>
        </ul>
      </section>

      <section>
        <h2>2. Data Usage</h2>
        <p>
          We use your data to:
        </p>
        <ul>
          <li>Provide and improve the Geniy market research platform.</li>
          <li>Generate AI-powered insights, gap analysis, and strategic recommendations tailored to your business.</li>
          <li>Process survey responses and generate sentiment analysis.</li>
          <li>Analyze competitor landscapes and identify market opportunities.</li>
          <li>Process payments and manage your subscription.</li>
          <li>Communicate with you about updates, support, and service announcements.</li>
        </ul>
        <p><strong>We do not sell your data to third parties.</strong></p>
      </section>

      <section>
        <h2>3. Data Security & Encryption</h2>
        <p>
          Security is our top priority. We implement enterprise-grade security measures:
        </p>
        <ul>
          <li><strong>Data at Rest:</strong> All sensitive business context and documents are encrypted using <strong>AES-256 encryption</strong> before being stored in our database.</li>
          <li><strong>Data in Transit:</strong> All data is transmitted over secure SSL/TLS connections.</li>
          <li><strong>File Storage:</strong> Uploaded files are securely stored in AWS S3 with server-side encryption.</li>
          <li><strong>Payment Security:</strong> All payment processing is handled by Paystack, a PCI-DSS compliant payment provider.</li>
          <li><strong>Access Control:</strong> We maintain strict audit logs of all access to your confidential data.</li>
        </ul>
      </section>

      <section>
        <h2>4. AI Processing & Privacy</h2>
        <p>
          Your business context, surveys, and documents are processed by our AI partners solely for the purpose of generating insights for you.
        </p>
        <p className="mt-2"><strong>Zero-Training Policy:</strong></p>
        <ul>
          <li>We use enterprise APIs that <strong>do not use your data for model training</strong>.</li>
          <li>Your proprietary business secrets remain yours and are never used to improve public AI models.</li>
          <li>AI-generated insights are specific to your workspace and are not shared across accounts.</li>
        </ul>
      </section>

      <section>
        <h2>5. Survey Respondent Privacy</h2>
        <p>
          When you create surveys:
        </p>
        <ul>
          <li>Survey responses may be collected anonymously or with email addresses, depending on your survey settings.</li>
          <li>You are responsible for informing your respondents about data collection practices.</li>
          <li>Survey data is stored securely and associated with your workspace.</li>
        </ul>
      </section>

      <section>
        <h2>6. Data Control</h2>
        <p>
          You have full control over your data. You can:
        </p>
        <ul>
          <li>Access, view, and export your data at any time.</li>
          <li>Delete your workspace context instantly via the "Clear Memory" feature.</li>
          <li>Delete individual surveys and their responses.</li>
          <li>Cancel your subscription and request full account deletion by contacting support.</li>
        </ul>
      </section>

      <section>
        <h2>7. Contact</h2>
        <p>
          For privacy-related inquiries, please contact us at <strong>aurorasoftwarelabs@gmail.com</strong>.
        </p>
      </section>
    </div>
  )
}
