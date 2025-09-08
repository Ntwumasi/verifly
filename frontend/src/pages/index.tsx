import Head from 'next/head';
import Link from 'next/link';
import { CheckCircleIcon, ShieldCheckIcon, ClockIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Fast Processing',
    description: 'Get your verification results within hours, not days.',
    icon: ClockIcon,
  },
  {
    name: 'Secure & Compliant',
    description: 'GDPR compliant with bank-level security for your data.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Multiple Countries',
    description: 'Supporting travel to Ghana, Nigeria, Senegal, and Ivory Coast.',
    icon: GlobeAltIcon,
  },
  {
    name: 'Simple Process',
    description: 'Just upload your documents, pay the fee, and get verified.',
    icon: CheckCircleIcon,
  },
];

export default function Home() {
  return (
    <>
      <Head>
        <title>Verifly - Travel Verification Made Easy</title>
        <meta name="description" content="Fast, secure pre-arrival background verification for travelers to West Africa" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="bg-white">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4 md:py-6">
              <div className="flex justify-start lg:w-0 lg:flex-1">
                <Link href="/" className="text-2xl font-bold text-primary-600">
                  Verifly
                </Link>
              </div>
              <div className="flex items-center space-x-2 md:space-x-4">
                <Link href="/login" className="whitespace-nowrap text-sm md:text-base font-medium text-gray-500 hover:text-gray-900 px-3 py-2">
                  Sign in
                </Link>
                <Link href="/register" className="btn btn-primary text-sm md:text-base px-3 py-2 md:px-4">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero section */}
        <div className="relative bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
              <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                <div className="sm:text-center lg:text-left">
                  <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                    <span className="block xl:inline">Travel verification</span>{' '}
                    <span className="block text-primary-600 xl:inline">made simple</span>
                  </h1>
                  <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                    Get pre-arrival background verification for travel to West African countries. 
                    Fast, secure, and compliant with international privacy standards.
                  </p>
                  <div className="mt-5 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:justify-center lg:justify-start">
                    <div className="rounded-md shadow">
                      <Link href="/register" className="btn btn-primary btn-lg w-full flex items-center justify-center px-6 py-3 text-base">
                        Start Application
                      </Link>
                    </div>
                    <div>
                      <Link href="#how-it-works" className="btn btn-secondary btn-lg w-full flex items-center justify-center px-6 py-3 text-base">
                        How it works
                      </Link>
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </div>
          <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
            <div className="h-56 w-full bg-gradient-to-r from-primary-600 to-primary-800 sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center">
              <div className="text-white text-6xl">✈️</div>
            </div>
          </div>
        </div>

        {/* Features section */}
        <div className="py-12 bg-gray-50" id="how-it-works">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Features</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Why choose Verifly?
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                We make travel verification fast, secure, and transparent.
              </p>
            </div>

            <div className="mt-10">
              <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                {features.map((feature) => (
                  <div key={feature.name} className="relative">
                    <dt>
                      <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                        <feature.icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <p className="ml-16 text-lg leading-6 font-medium text-gray-900">{feature.name}</p>
                    </dt>
                    <dd className="mt-2 ml-16 text-base text-gray-500">{feature.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* How it works section */}
        <div className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Process</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                How it works
              </p>
            </div>

            <div className="mt-10">
              <div className="space-y-8 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-x-8 md:gap-y-8">
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 font-bold text-lg">1</span>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Create Account</h3>
                  <p className="mt-2 text-sm sm:text-base text-gray-500">
                    Sign up and provide your consent for background verification.
                  </p>
                </div>

                <div className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 font-bold text-lg">2</span>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Upload Documents</h3>
                  <p className="mt-2 text-sm sm:text-base text-gray-500">
                    Upload your passport, selfie, and travel itinerary.
                  </p>
                </div>

                <div className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 font-bold text-lg">3</span>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Pay & Verify</h3>
                  <p className="mt-2 text-sm sm:text-base text-gray-500">
                    Pay the $15 fee and we'll start your background verification.
                  </p>
                </div>

                <div className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 font-bold text-lg">4</span>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Get Results</h3>
                  <p className="mt-2 text-sm sm:text-base text-gray-500">
                    Receive your verification results and travel with confidence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA section */}
        <div className="bg-primary-600">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              <span className="block">Ready to get verified?</span>
              <span className="block text-primary-200">Start your application today.</span>
            </h2>
            <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
              <div className="inline-flex rounded-md shadow">
                <Link href="/register" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50">
                  Get started
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <span className="text-2xl font-bold text-primary-600">Verifly</span>
                <p className="mt-2 text-sm text-gray-500">
                  Fast and secure travel verification for West African destinations.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Support</h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <a href="mailto:support@verifly.com" className="text-base text-gray-500 hover:text-gray-900">
                      Contact Support
                    </a>
                  </li>
                  <li>
                    <Link href="/privacy" className="text-base text-gray-500 hover:text-gray-900">
                      Privacy Policy
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Legal</h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link href="/terms" className="text-base text-gray-500 hover:text-gray-900">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link href="/compliance" className="text-base text-gray-500 hover:text-gray-900">
                      Compliance
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-200 pt-8">
              <p className="text-base text-gray-400 text-center">
                &copy; 2024 Verifly. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}