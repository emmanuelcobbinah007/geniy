export default function PrivacyPage() {
  return (
    <div className="my-12 space-y-6">
      <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="text-zinc-500 dark:text-zinc-400">Last updated: November 30, 2025</p>

      <section>
        <h2>1. Data Collection</h2>
        <p>
          We collect information you provide directly to us, including:
        </p>
        <ul>
          <li>Account information (name, email).</li>
          <li>Workspace data (business context, uploaded documents).</li>
          <li>Survey responses collected from your audience.</li>
        </ul>
      </section>

      <section>
        <h2>2. Data Usage</h2>
        <p>
          We use your data to:
        </p>
        <ul>
          <li>Provide and improve the Geniy service.</li>
          <li>Generate AI insights tailored to your business.</li>
          <li>Communicate with you about updates and support.</li>
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
          <li><strong>Access Control:</strong> We maintain strict audit logs of all access to your confidential data.</li>
        </ul>
      </section>

      <section>
        <h2>4. AI Processing & Privacy</h2>
        <p>
          Your business context and documents are processed by our AI partners (e.g., OpenAI) solely for the purpose of generating insights for you.
        </p>
        <p className="mt-2"><strong>Zero-Training Policy:</strong></p>
        <ul>
          <li>We use enterprise APIs that <strong>do not use your data for model training</strong>.</li>
          <li>Your proprietary business secrets remain yours and are never used to improve public AI models.</li>
        </ul>
      </section>

      <section>
        <h2>5. Data Control</h2>
        <p>
          You have full control over your data. You can:
        </p>
        <ul>
          <li>Access and export your data.</li>
          <li>Delete your workspace context instantly via the "Clear Memory" feature.</li>
          <li>Request full account deletion by contacting support.</li>
        </ul>
      </section>
    </div>
  )
}
