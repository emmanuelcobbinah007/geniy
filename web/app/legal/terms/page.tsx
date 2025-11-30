export default function TermsPage() {
  return (
    <div className="my-12 space-y-6">
      <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
      <p className="text-zinc-500 dark:text-zinc-400">Last updated: November 30, 2025</p>

      <section>
        <h2>1. Introduction</h2>
        <p>
          Welcome to Geniy. By accessing or using our website and services, you agree to be bound by these Terms of Service and our Privacy Policy.
        </p>
      </section>

      <section>
        <h2>2. Use of Services</h2>
        <p>
          Geniy provides AI-powered market research tools. You agree to use these services only for lawful purposes and in accordance with these Terms.
        </p>
        <ul>
          <li>You must be at least 18 years old to use the Service.</li>
          <li>You are responsible for maintaining the confidentiality of your account.</li>
          <li>You agree not to misuse the AI generation features to create harmful content.</li>
        </ul>
      </section>

      <section>
        <h2>3. Data & Privacy</h2>
        <p>
          We respect your data privacy. You retain ownership of all business context and documents you upload.
          You can delete your workspace data at any time using the "Clear Memory" feature in the dashboard.
        </p>
      </section>

      <section>
        <h2>4. AI Limitations</h2>
        <p>
          Geniy uses artificial intelligence to generate insights. While we strive for accuracy, AI outputs may vary and should be verified by human judgment.
          We are not liable for business decisions made based solely on AI recommendations.
        </p>
      </section>

      <section>
        <h2>5. Termination</h2>
        <p>
          We reserve the right to terminate or suspend access to our Service immediately, without prior notice, for any breach of these Terms.
        </p>
      </section>
    </div>
  )
}
