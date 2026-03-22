export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-[#0F172A] text-white py-12">
                <div className="max-w-3xl mx-auto px-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-white/10 rounded-lg px-3 py-1.5 text-sm font-bold tracking-tight">AW</div>
                        <span className="text-white/60">AcadWorld</span>
                    </div>
                    <h1 className="text-3xl font-bold">Terms of Service</h1>
                    <p className="text-white/60 mt-2 text-sm">Effective date: 1 January 2025 · Last updated: 1 March 2026</p>
                </div>
            </div>

            {/* Body */}
            <div className="max-w-3xl mx-auto px-6 py-12 space-y-10 text-slate-700 text-[15px] leading-relaxed">

                <section>
                    <p>
                        Welcome to AcadWorld ("Platform", "we", "us", or "our"). By accessing or using our website at{' '}
                        <a href="https://acadworld.com" className="text-blue-600 hover:underline">acadworld.com</a> or
                        any associated services, you agree to be bound by these Terms of Service ("Terms"). Please read
                        them carefully before using the Platform.
                    </p>
                </section>

                <Section title="1. Who We Are">
                    <p>
                        AcadWorld is India's professional network for educators — a platform where teachers, professors,
                        trainers, and academic institutions connect, collaborate, and grow. We provide tools for
                        professional networking, Faculty Development Programme (FDP) discovery, job postings, and
                        peer learning.
                    </p>
                </Section>

                <Section title="2. Eligibility">
                    <p>You may use AcadWorld if you:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>Are at least 18 years old.</li>
                        <li>Are an educator, academic professional, or institution representative.</li>
                        <li>Provide accurate, complete, and current registration information.</li>
                        <li>Agree to these Terms and our Privacy Policy.</li>
                    </ul>
                    <p className="mt-3">
                        We reserve the right to refuse access to anyone who does not meet these requirements.
                    </p>
                </Section>

                <Section title="3. Your Account">
                    <p>
                        You are responsible for maintaining the security of your account and password. You must
                        not share your credentials with others or use another person's account. You are fully
                        responsible for all activity that occurs under your account.
                    </p>
                    <p className="mt-3">
                        If you believe your account has been compromised, contact us immediately at{' '}
                        <a href="mailto:info@acadworld.com" className="text-blue-600 hover:underline">info@acadworld.com</a>.
                    </p>
                </Section>

                <Section title="4. Acceptable Use">
                    <p>You agree <strong>not</strong> to:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>Post false, misleading, or fraudulent content.</li>
                        <li>Impersonate any person or institution.</li>
                        <li>Harass, abuse, or harm other users.</li>
                        <li>Scrape, copy, or redistribute platform content without permission.</li>
                        <li>Use the Platform for spam, phishing, or commercial solicitation unrelated to education.</li>
                        <li>Attempt to gain unauthorised access to any part of the Platform or its infrastructure.</li>
                        <li>Upload content that infringes intellectual property rights.</li>
                    </ul>
                </Section>

                <Section title="5. Content You Post">
                    <p>
                        You retain ownership of content you post on AcadWorld (your profile, posts, course
                        materials, etc.). By posting content, you grant AcadWorld a non-exclusive, royalty-free,
                        worldwide licence to display, distribute, and promote that content on the Platform.
                    </p>
                    <p className="mt-3">
                        You are solely responsible for ensuring your content is accurate, lawful, and does not
                        violate any third-party rights. We reserve the right to remove content that violates
                        these Terms without notice.
                    </p>
                </Section>

                <Section title="6. Faculty Development Programmes (FDPs)">
                    <p>
                        Institutions may list FDPs on AcadWorld. We do not guarantee the accuracy, quality, or
                        accreditation status of any listed programme. Educators should independently verify
                        programme details before enrolling.
                    </p>
                    <p className="mt-3">
                        AcadWorld is not a party to any agreement between an educator and an institution. Any
                        disputes arising from FDP enrolment are solely between the parties involved.
                    </p>
                </Section>

                <Section title="7. Intellectual Property">
                    <p>
                        The AcadWorld name, logo, design, and all platform-generated content are the exclusive
                        intellectual property of AcadWorld. You may not reproduce, modify, or distribute any
                        part of the Platform without our prior written consent.
                    </p>
                </Section>

                <Section title="8. Privacy">
                    <p>
                        Your use of the Platform is also governed by our{' '}
                        <a href="/privacy-policy" target="_blank" className="text-blue-600 hover:underline">Privacy Policy</a>,
                        which is incorporated into these Terms by reference. Please review it to understand how
                        we collect, use, and protect your data.
                    </p>
                </Section>

                <Section title="9. Termination">
                    <p>
                        We may suspend or terminate your account at any time if you violate these Terms, engage
                        in fraudulent activity, or if we are required to do so by law. You may delete your
                        account at any time from your account settings.
                    </p>
                </Section>

                <Section title="10. Disclaimers">
                    <p>
                        AcadWorld is provided "as is" and "as available". We make no warranties — express or
                        implied — about the reliability, accuracy, or availability of the Platform. We do not
                        guarantee that the Platform will be uninterrupted or error-free.
                    </p>
                </Section>

                <Section title="11. Limitation of Liability">
                    <p>
                        To the maximum extent permitted by law, AcadWorld shall not be liable for any indirect,
                        incidental, special, or consequential damages arising from your use of, or inability to
                        use, the Platform — even if we have been advised of the possibility of such damages.
                    </p>
                </Section>

                <Section title="12. Governing Law">
                    <p>
                        These Terms are governed by and construed in accordance with the laws of India. Any
                        disputes shall be subject to the exclusive jurisdiction of the courts in New Delhi, India.
                    </p>
                </Section>

                <Section title="13. Changes to These Terms">
                    <p>
                        We may update these Terms from time to time. When we do, we will update the "Last updated"
                        date at the top of this page. Continued use of the Platform after changes constitutes
                        your acceptance of the revised Terms.
                    </p>
                </Section>

                <Section title="14. Contact Us">
                    <p>If you have questions about these Terms, please contact us:</p>
                    <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm space-y-1">
                        <p><strong>AcadWorld</strong></p>
                        <p>Email: <a href="mailto:info@acadworld.com" className="text-blue-600 hover:underline">info@acadworld.com</a></p>
                        <p>Website: <a href="https://acadworld.com" className="text-blue-600 hover:underline">acadworld.com</a></p>
                    </div>
                </Section>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 py-8 text-center text-sm text-slate-400">
                © {new Date().getFullYear()} AcadWorld · All rights reserved ·{' '}
                <a href="/privacy-policy" className="hover:text-slate-600 hover:underline">Privacy Policy</a>
            </div>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">{title}</h2>
            {children}
        </section>
    );
}
