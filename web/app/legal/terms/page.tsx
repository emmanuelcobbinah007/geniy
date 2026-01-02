export default function TermsPage() {
  return (
    <div className="my-12 space-y-6">
      <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
      <p className="text-zinc-500 dark:text-zinc-400">Last updated: January 2, 2026</p>

      <section>
        <h2>1. Introduction</h2>
        <p>
          Welcome to Geniy, an AI-powered market research platform operated by Aurora Software Labs. By accessing or using our website and services, you agree to be bound by these Terms of Service and our Privacy Policy.
        </p>
      </section>

      <section>
        <h2>2. Service Description</h2>
        <p>
          Geniy provides:
        </p>
        <ul>
          <li><strong>AI-Powered Surveys:</strong> Create, distribute, and analyze market research surveys with AI-generated insights.</li>
          <li><strong>Competitor Research:</strong> Track and analyze competitors in your market.</li>
          <li><strong>Gap Analysis:</strong> Identify market opportunities and strategic gaps.</li>
          <li><strong>Business Context AI:</strong> An AI assistant trained on your business context to provide tailored recommendations.</li>
        </ul>
      </section>

      <section>
        <h2>3. Use of Services</h2>
        <p>
          You agree to use these services only for lawful purposes and in accordance with these Terms:
        </p>
        <ul>
          <li>You must be at least 18 years old to use the Service.</li>
          <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
          <li>You agree not to misuse the AI features to create harmful, deceptive, or illegal content.</li>
          <li>You are responsible for the content of surveys you create and ensuring they comply with applicable laws.</li>
          <li>You must not use the service to collect data from minors without appropriate consent.</li>
        </ul>
      </section>

      <section>
        <h2>4. Subscriptions & Payments</h2>
        <p>
          Geniy offers tiered subscription plans:
        </p>
        <ul>
          <li><strong>Free Plan:</strong> Limited access to basic features.</li>
          <li><strong>Starter Plan:</strong> Expanded features including AI insights, CSV export, and gap analysis.</li>
          <li><strong>Pro Plan:</strong> Full access including integrations, unlimited surveys, and advanced analytics.</li>
        </ul>
        <p className="mt-2">
          Payments are processed securely through Paystack. Subscriptions renew automatically unless cancelled. 
          You may cancel your subscription at any time from your account settings. Refunds are handled on a case-by-case basis.
        </p>
      </section>

      <section>
        <h2>5. Data & Privacy</h2>
        <p>
          We respect your data privacy. You retain ownership of all business context, surveys, and documents you upload.
          You can delete your workspace data at any time using the "Clear Memory" feature in the dashboard.
          For complete details, please review our <a href="/legal/privacy" className="text-violet-600 dark:text-violet-400 underline">Privacy Policy</a>.
        </p>
      </section>

      <section>
        <h2>6. AI Limitations</h2>
        <p>
          Geniy uses artificial intelligence to generate insights, analyze surveys, and provide recommendations. While we strive for accuracy:
        </p>
        <ul>
          <li>AI outputs may vary and should be verified by human judgment.</li>
          <li>We are not liable for business decisions made based solely on AI recommendations.</li>
          <li>AI-generated content should be reviewed before publication or external use.</li>
        </ul>
      </section>

      <section>
        <h2>7. Intellectual Property</h2>
        <p>
          You retain all rights to your uploaded content, surveys, and business data. 
          Geniy and its AI-generated outputs for your workspace are provided for your use only.
          The Geniy platform, branding, and underlying technology remain the property of Aurora Software Labs.
        </p>
      </section>

      <section>
        <h2>8. Termination</h2>
        <p>
          We reserve the right to terminate or suspend access to our Service immediately, without prior notice, for any breach of these Terms.
          Upon termination, your right to use the Service will cease immediately. You may request export of your data before account deletion.
        </p>
      </section>

      <section>
        <h2>9. Contact</h2>
        <p>
          For questions about these terms, please contact us at <strong>aurorasoftwarelabs@gmail.com</strong>.
        </p>
      </section>
    </div>
  )
}
