import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Terms of Service</h1>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-gray-600 dark:text-gray-400">
          <p><strong>Last updated:</strong> June 2026</p>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-8">1. Acceptance of Terms</h2>
          <p>By accessing or using MailForge ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-8">2. Description of Service</h2>
          <p>MailForge provides a self-hosted email management platform that allows users to create and manage email addresses on their own domains, send and receive emails, and manage email routing through Cloudflare.</p>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-8">3. User Responsibilities</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to use the Service in compliance with all applicable laws and regulations.</p>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-8">4. Acceptable Use</h2>
          <p>You may not use the Service to send spam, distribute malware, engage in phishing, or conduct any illegal or unauthorized activity. We reserve the right to suspend or terminate accounts that violate this policy.</p>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-8">5. Data Privacy</h2>
          <p>Your use of the Service is also governed by our Privacy Policy. We do not sell your personal data. Emails are stored securely and processed only to provide the Service.</p>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-8">6. Limitation of Liability</h2>
          <p>MailForge is provided "as is" without warranty of any kind. We are not liable for any damages arising from your use of the Service.</p>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-8">7. Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. Users will be notified of material changes via email or through the Service.</p>
        </div>
      </div>
    </div>
  )
}
