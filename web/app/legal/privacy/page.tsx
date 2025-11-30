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
        <h2>3. AI Processing</h2>
        <p>
          Your business context and documents are processed by our AI partners (e.g., OpenAI, Anthropic) solely for the purpose of generating responses for you. 
          We have data processing agreements in place to ensure your data is not used to train public models without your consent.
        </p>
      </section>

      <section>
        <h2>4. Data Control</h2>
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
