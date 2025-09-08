import Head from 'next/head';
import Link from 'next/link';

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy - Verifly</title>
        <meta name="description" content="Verifly Privacy Policy and data protection information" />
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
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
            
            <div className="prose prose-blue max-w-none">
              <p className="text-gray-600 mb-6">
                <strong>Effective Date:</strong> January 1, 2024<br />
                <strong>Last Updated:</strong> January 1, 2024
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                Verifly ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you use our 
                travel verification services.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Information We Collect</h2>
              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">Personal Information</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Name, date of birth, and nationality</li>
                <li>Passport information and travel documents</li>
                <li>Contact information (email, phone number)</li>
                <li>Address history and intended travel destinations</li>
                <li>Biometric data (selfies for identity verification)</li>
                <li>Payment information</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">Technical Information</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Usage data and analytics</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Process your travel verification applications</li>
                <li>Conduct background checks as authorized by you</li>
                <li>Communicate with you about your application status</li>
                <li>Comply with legal and regulatory requirements</li>
                <li>Improve our services and user experience</li>
                <li>Prevent fraud and ensure security</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Data Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-4">We may share your information with:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Government authorities and immigration officials as required</li>
                <li>Third-party verification services (sanctions, PEP databases)</li>
                <li>Payment processors for transaction processing</li>
                <li>Service providers who assist in our operations</li>
                <li>Legal authorities when required by law</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. International Data Transfers</h2>
              <p className="text-gray-700 mb-4">
                Your data may be transferred to and processed in countries outside your residence. 
                We ensure appropriate safeguards are in place, including Standard Contractual Clauses (SCCs) 
                and adequacy decisions where applicable.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your personal data for 180 days after the completion of your verification, 
                unless a longer retention period is required by law or for legitimate business purposes. 
                You may request deletion of your data subject to our legal obligations.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Your Rights</h2>
              <p className="text-gray-700 mb-4">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Access your personal data</li>
                <li>Rectify inaccurate or incomplete data</li>
                <li>Request deletion of your data</li>
                <li>Restrict processing of your data</li>
                <li>Data portability</li>
                <li>Withdraw consent (where applicable)</li>
                <li>Lodge a complaint with a supervisory authority</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. Security Measures</h2>
              <p className="text-gray-700 mb-4">
                We implement industry-standard security measures including encryption, access controls, 
                and regular security assessments to protect your personal data against unauthorized access, 
                alteration, disclosure, or destruction.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9. Cookies and Tracking</h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar technologies to enhance your experience, analyze usage patterns, 
                and provide personalized content. You can manage your cookie preferences through your browser settings.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">10. Updates to This Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any material 
                changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">11. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> privacy@verifly.com<br />
                  <strong>Support:</strong> support@verifly.com<br />
                  <strong>Data Protection Officer:</strong> dpo@verifly.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}