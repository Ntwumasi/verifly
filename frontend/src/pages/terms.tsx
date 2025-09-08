import Head from 'next/head';
import Link from 'next/link';

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service - Verifly</title>
        <meta name="description" content="Verifly Terms of Service and user agreement" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <Link href="/" className="text-2xl font-bold text-primary-600">
                Verifly
              </Link>
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                ← Back to Home
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
            
            <div className="prose prose-blue max-w-none">
              <p className="text-gray-600 mb-6">
                <strong>Effective Date:</strong> January 1, 2024<br />
                <strong>Last Updated:</strong> January 1, 2024
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using Verifly's services, you accept and agree to be bound by the terms 
                and provision of this agreement. If you do not agree to abide by these terms, you are not 
                authorized to use or access this service.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Service Description</h2>
              <p className="text-gray-700 mb-4">
                Verifly provides pre-arrival background verification services for travelers to West African 
                countries. Our service includes document verification, background checks against public databases, 
                and risk assessment to facilitate smoother travel experiences.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. User Responsibilities</h2>
              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">You agree to:</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Provide accurate, complete, and truthful information</li>
                <li>Upload genuine documents and provide authentic biometric data</li>
                <li>Pay all applicable fees for services rendered</li>
                <li>Use the service only for lawful purposes</li>
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">You agree NOT to:</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Provide false, misleading, or fraudulent information</li>
                <li>Use the service to circumvent legal or regulatory requirements</li>
                <li>Attempt to hack, compromise, or interfere with our systems</li>
                <li>Use automated tools to access or use our service</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Fees and Payment</h2>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Current verification fee is $15.00 USD per application</li>
                <li>Fees are non-refundable except in cases of technical failure</li>
                <li>Payment must be completed before verification processing begins</li>
                <li>We reserve the right to change fees with 30 days notice</li>
                <li>All payments are processed securely through third-party payment processors</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Verification Process</h2>
              <p className="text-gray-700 mb-4">
                Our verification process includes checks against publicly available databases, sanctions lists, 
                and document validation. Results are provided for informational purposes and do not guarantee 
                entry or approval by destination country authorities.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">Verification Results:</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Clear:</strong> No issues identified in available databases</li>
                <li><strong>Review:</strong> Manual review required, may take additional time</li>
                <li><strong>Not Clear:</strong> Issues identified that may affect travel authorization</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Limitations and Disclaimers</h2>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Results are based on available public and licensed databases at the time of checking</li>
                <li>We do not guarantee the completeness or accuracy of third-party data sources</li>
                <li>Verification results do not guarantee entry approval by destination countries</li>
                <li>Government authorities may have additional requirements not covered by our service</li>
                <li>We are not liable for travel delays, denials, or related costs</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Data Protection and Privacy</h2>
              <p className="text-gray-700 mb-4">
                Your personal data is processed in accordance with our Privacy Policy and applicable 
                data protection laws including GDPR. By using our service, you consent to the collection, 
                processing, and sharing of your data as described in our Privacy Policy.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. Intellectual Property</h2>
              <p className="text-gray-700 mb-4">
                All content, features, and functionality of our service are owned by Verifly and are 
                protected by copyright, trademark, and other intellectual property laws. You may not 
                reproduce, modify, or distribute any part of our service without written permission.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9. Termination</h2>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your account and access to our service immediately, without 
                prior notice, for conduct that we believe violates these Terms or is harmful to other 
                users, us, or third parties.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                To the maximum extent permitted by law, Verifly shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages, including but not limited to 
                loss of profits, data, or other intangible losses.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">11. Governing Law</h2>
              <p className="text-gray-700 mb-4">
                These Terms shall be interpreted and governed by the laws of [Jurisdiction], without 
                regard to its conflict of law provisions. Any disputes shall be resolved through 
                binding arbitration.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">12. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify these terms at any time. We will notify users of any 
                material changes via email or through our service. Continued use of the service after 
                changes constitutes acceptance of the new terms.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">13. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                For questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> legal@verifly.com<br />
                  <strong>Support:</strong> support@verifly.com<br />
                  <strong>Address:</strong> [Company Address]
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}