export default function SecurityPage() {
  return (
    <div className="my-12 space-y-6">
      <h1 className="text-4xl font-bold tracking-tight">Security</h1>
      <p className="text-zinc-500 dark:text-zinc-400">Last updated: November 30, 2025</p>

      <section>
        <h2>1. Infrastructure</h2>
        <p>
          Geniy is built on industry-leading secure infrastructure.
        </p>
        <ul>
          <li><strong>Hosting:</strong> Vercel (Frontend) & Render (Backend).</li>
          <li><strong>Database:</strong> Neon (PostgreSQL) with encryption at rest.</li>
          <li><strong>Authentication:</strong> Secure JWT-based auth with bcrypt password hashing.</li>
        </ul>
      </section>

      <section>
        <h2>2. Data Protection</h2>
        <p>
          We employ strict measures to protect your data:
        </p>
        <ul>
          <li><strong>Encryption:</strong> All data in transit is encrypted via TLS 1.2+.</li>
          <li><strong>Access Control:</strong> Strict role-based access control (RBAC) ensures only authorized members can access workspace data.</li>
          <li><strong>Isolation:</strong> Workspace data is logically isolated in our database.</li>
        </ul>
      </section>

      <section>
        <h2>3. Reporting Vulnerabilities</h2>
        <p>
          If you discover a security vulnerability, please report it to us immediately at security@geniy.ai. We appreciate your help in keeping Geniy safe.
        </p>
      </section>
    </div>
  )
}
