import Head from 'next/head';
import Link from 'next/link';
import { ShieldCheckIcon, LockClosedIcon, DocumentCheckIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

const complianceFeatures = [
  {
    name: 'GDPR Compliance',
    description: 'Full compliance with EU General Data Protection Regulation including right to access, rectify, and delete personal data.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Data Encryption',
    description: 'All data is encrypted at rest and in transit using industry-standard AES-256 encryption.',
    icon: LockClosedIcon,
  },
  {
    name: 'Audit Trails',
    description: 'Complete audit logs for all data processing activities with immutable timestamps.',
    icon: DocumentCheckIcon,
  },
  {
    name: 'Cross-Border Transfers',
    description: 'Secure international data transfers using Standard Contractual Clauses (SCCs) and adequacy decisions.',
    icon: GlobeAltIcon,
  },
];

export default function Compliance() {
  return (
    <>
      <Head>
        <title>Compliance - Verifly</title>
        <meta name="description" content="Verifly compliance information, data protection, and security standards" />
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

        {/* Hero Section */}
        <div className="bg-white">
          <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
                Compliance & Security
              </h1>
              <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
                Verifly is built with security and compliance at its core. We adhere to the highest 
                international standards for data protection and privacy.
              </p>
            </div>
          </div>
        </div>

        {/* Compliance Features */}
        <div className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {complianceFeatures.map((feature) => (
                <div key={feature.name} className="bg-white rounded-lg p-6 shadow">
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0">
                      <feature.icon className="h-8 w-8 text-primary-600" />
                    </div>
                    <h3 className="ml-3 text-lg font-medium text-gray-900">{feature.name}</h3>
                  </div>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Compliance Information */}
        <div className="bg-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-12">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Protection Framework</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">GDPR Compliance</h3>
                    <ul className="text-gray-600 space-y-2">
                      <li>• Lawful basis for processing personal data</li>
                      <li>• Data minimization and purpose limitation</li>
                      <li>• Individual rights (access, rectification, erasure)</li>
                      <li>• Data Protection Impact Assessments (DPIAs)</li>
                      <li>• Appointed Data Protection Officer (DPO)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Security Measures</h3>
                    <ul className="text-gray-600 space-y-2">
                      <li>• End-to-end encryption (AES-256)</li>
                      <li>• Multi-factor authentication (MFA)</li>
                      <li>• Regular security audits and penetration testing</li>
                      <li>• ISO 27001 security management</li>
                      <li>• SOC 2 Type II compliance</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Handling Practices</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Collection</h3>
                  <p className="text-gray-600 mb-4">
                    We collect only the minimum amount of personal data necessary to provide our verification services. 
                    This includes identity information, travel documents, and biometric data for verification purposes.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Processing</h3>
                  <p className="text-gray-600 mb-4">
                    All data processing is conducted with explicit user consent and for specific, legitimate purposes. 
                    We use automated systems with human oversight to ensure accuracy and fairness.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Retention</h3>
                  <p className="text-gray-600">
                    Personal data is retained for 180 days after verification completion, unless longer retention 
                    is required by law. Users can request earlier deletion subject to legal obligations.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">International Standards</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 border rounded-lg">
                    <div className="text-2xl font-bold text-primary-600 mb-2">GDPR</div>
                    <p className="text-sm text-gray-600">EU General Data Protection Regulation</p>
                  </div>
                  <div className="text-center p-6 border rounded-lg">
                    <div className="text-2xl font-bold text-primary-600 mb-2">ISO 27001</div>
                    <p className="text-sm text-gray-600">Information Security Management</p>
                  </div>
                  <div className="text-center p-6 border rounded-lg">
                    <div className="text-2xl font-bold text-primary-600 mb-2">SOC 2</div>
                    <p className="text-sm text-gray-600">Service Organization Control</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Incident Response</h2>
                <p className="text-gray-600 mb-4">
                  We maintain a comprehensive incident response plan to address any potential security or privacy incidents:
                </p>
                <ul className="text-gray-600 space-y-2 mb-6">
                  <li>• 24/7 monitoring and alerting systems</li>
                  <li>• Dedicated incident response team</li>
                  <li>• 72-hour breach notification procedures</li>
                  <li>• Forensic investigation capabilities</li>
                  <li>• Regular incident response drills and testing</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Third Party Assessments</h2>
                <p className="text-gray-600 mb-4">
                  Our compliance posture is validated through regular third-party assessments:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Annual Security Audits</h4>
                    <p className="text-sm text-gray-600">
                      Independent security assessments by certified auditors
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Penetration Testing</h4>
                    <p className="text-sm text-gray-600">
                      Quarterly penetration testing by ethical hackers
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Privacy Impact Assessments</h4>
                    <p className="text-sm text-gray-600">
                      Regular DPIAs for new features and data processing activities
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Compliance Monitoring</h4>
                    <p className="text-sm text-gray-600">
                      Continuous monitoring of regulatory changes and requirements
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-primary-50 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Our Compliance Team</h2>
                <p className="text-gray-600 mb-4">
                  For questions about our compliance practices, data protection, or to report a security concern:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Data Protection Officer</p>
                    <p className="text-sm text-gray-600">dpo@verifly.com</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Security Team</p>
                    <p className="text-sm text-gray-600">security@verifly.com</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Compliance Officer</p>
                    <p className="text-sm text-gray-600">compliance@verifly.com</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Legal Team</p>
                    <p className="text-sm text-gray-600">legal@verifly.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}