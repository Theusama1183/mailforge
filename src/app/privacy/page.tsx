import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Privacy Policy</h1>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-gray-600 dark:text-gray-400">
          <p><strong>Last updated:</strong> June 2026</p>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-8">1. Information We Collect</h2>
          <p>We collect information you provide when creating an account, including your email address and password. We also collect email metadata (sender, recipient, subject, timestamps) and email content necessary to provide the Service.</p>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-8">2. How We Use Your Information</h2>
          <p>Your information is used solely to operate and improve the Service: sending and receiving emails, managing email routing, providing customer support, and ensuring platform security.</p>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-8">3. Data Storage</h2>
          <p>Email data is stored securely in our database. We use encryption in transit (TLS) and at rest. You can delete your emails and account at any time, which will remove your data from our systems.</p>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-8">4. Third-Party Services</h2>
          <p>MailForge integrates with Cloudflare (email routing), Supabase (database and authentication), and Vercel (hosting). Each provider has their own privacy policy governing data handling.</p>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-8">5. Data Retention</h2>
          <p>We retain your data for as long as your account is active. Upon account deletion, all associated data is permanently removed within 30 days.</p>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-8">6. Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal data at any time through your account settings. Contact us for any privacy-related requests.</p>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-8">7. Contact</h2>
          <p>For privacy inquiries, please contact us through the support channels available on our website.</p>
        </div>
      </div>
    </div>
  )
}
