export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-[#0F172A] text-white py-12">
                <div className="max-w-3xl mx-auto px-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-white/10 rounded-lg px-3 py-1.5 text-sm font-bold tracking-tight">AW</div>
                        <span className="text-white/60">AcadWorld</span>
                    </div>
                    <h1 className="text-3xl font-bold">Privacy Policy</h1>
                    <p className="text-white/60 mt-2 text-sm">Effective date: 1 January 2025 · Last updated: 1 March 2026</p>
                </div>
            </div>

            {/* Body */}
            <div className="max-w-3xl mx-auto px-6 py-12 space-y-10 text-slate-700 text-[15px] leading-relaxed">

                <section>
                    <p>
                        AcadWorld ("we", "us", "our") is committed to protecting your personal information. This
                        Privacy Policy explains what data we collect, how we use it, and the choices you have.
                        It applies to all users of{' '}
                        <a href="https://acadworld.com" className="text-blue-600 hover:underline">acadworld.com</a>{' '}
                        and our associated services.
                    </p>
                </section>

                <Section title="1. Information We Collect">
                    <p className="font-medium text-slate-800 mb-2">Information you provide directly:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Name, email address, and password when you register.</li>
                        <li>Profile details: photo, headline, bio, institution, subjects, skills, experience.</li>
                        <li>Content you post: feed posts, comments, FDP reviews.</li>
                        <li>Job applications and messages you send.</li>
                    </ul>

                    <p className="font-medium text-slate-800 mb-2 mt-5">Information collected automatically:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Log data: IP address, browser type, pages visited, time and date of visits.</li>
                        <li>Device information: operating system, device type.</li>
                        <li>Cookies and similar tracking technologies (see Section 7).</li>
                    </ul>

                    <p className="font-medium text-slate-800 mb-2 mt-5">Information from third parties:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>If you sign in with Google, we receive your name, email, and profile picture from Google.</li>
                    </ul>
                </Section>

                <Section title="2. How We Use Your Information">
                    <p>We use your data to:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>Create and manage your account.</li>
                        <li>Provide and improve our services.</li>
                        <li>Show your profile to other educators and institutions.</li>
                        <li>Send transactional emails (email verification, enrolment confirmations, certificates).</li>
                        <li>Send platform notifications (new followers, endorsements, connection requests).</li>
                        <li>Enforce our Terms of Service and prevent abuse.</li>
                        <li>Comply with legal obligations.</li>
                    </ul>
                    <p className="mt-3">We do <strong>not</strong> sell your personal data to third parties.</p>
                </Section>

                <Section title="3. How We Share Your Information">
                    <p>We may share your information with:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>
                            <strong>Other users</strong> — your public profile, posts, and activity are visible
                            to other registered users of the Platform.
                        </li>
                        <li>
                            <strong>Service providers</strong> — trusted third parties who help us operate the
                            Platform (e.g. cloud hosting, email delivery, file storage). These providers are
                            contractually prohibited from using your data for their own purposes.
                        </li>
                        <li>
                            <strong>Legal authorities</strong> — when required by law, court order, or to protect
                            the rights and safety of our users or the public.
                        </li>
                        <li>
                            <strong>Business transfers</strong> — in the event of a merger, acquisition, or sale
                            of assets, your data may be transferred as part of that transaction.
                        </li>
                    </ul>
                </Section>

                <Section title="4. Data Retention">
                    <p>
                        We retain your personal data for as long as your account is active or as needed to provide
                        our services. If you delete your account, we will delete or anonymise your personal data
                        within 30 days, except where we are required to retain it by law.
                    </p>
                </Section>

                <Section title="5. Your Rights">
                    <p>Under applicable data protection laws, you have the right to:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
                        <li><strong>Correction</strong> — request that we correct inaccurate or incomplete data.</li>
                        <li><strong>Deletion</strong> — request that we delete your personal data ("right to be forgotten").</li>
                        <li><strong>Portability</strong> — request your data in a machine-readable format.</li>
                        <li><strong>Objection</strong> — object to processing of your data in certain circumstances.</li>
                        <li><strong>Withdraw consent</strong> — where processing is based on consent, you may withdraw it at any time.</li>
                    </ul>
                    <p className="mt-3">
                        To exercise any of these rights, email us at{' '}
                        <a href="mailto:info@acadworld.com" className="text-blue-600 hover:underline">info@acadworld.com</a>.
                        We will respond within 30 days.
                    </p>
                </Section>

                <Section title="6. Data Security">
                    <p>
                        We implement industry-standard security measures to protect your data, including:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>HTTPS encryption for all data in transit.</li>
                        <li>Hashed and salted password storage (we never store your password in plain text).</li>
                        <li>Role-based access controls limiting who can access your data internally.</li>
                        <li>Regular security reviews and dependency audits.</li>
                    </ul>
                    <p className="mt-3">
                        No method of transmission over the internet is 100% secure. While we strive to protect
                        your data, we cannot guarantee absolute security.
                    </p>
                </Section>

                <Section title="7. Cookies">
                    <p>
                        We use cookies and similar technologies to keep you logged in and improve your experience.
                        Specifically:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li><strong>Essential cookies</strong> — required for authentication and security.</li>
                        <li><strong>Preference cookies</strong> — remember your settings and preferences.</li>
                    </ul>
                    <p className="mt-3">
                        You can control cookies through your browser settings. Disabling essential cookies may
                        prevent the Platform from functioning correctly.
                    </p>
                </Section>

                <Section title="8. Third-Party Services">
                    <p>We use the following third-party services to operate the Platform:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li><strong>Google OAuth</strong> — for sign-in with Google (governed by Google's Privacy Policy).</li>
                        <li><strong>Resend</strong> — for transactional email delivery.</li>
                        <li><strong>Cloudflare R2</strong> — for media file storage.</li>
                        <li><strong>Railway</strong> — for cloud hosting and infrastructure.</li>
                    </ul>
                    <p className="mt-3">
                        Each service has its own privacy policy. We encourage you to review them.
                    </p>
                </Section>

                <Section title="9. Children's Privacy">
                    <p>
                        AcadWorld is not intended for use by anyone under the age of 18. We do not knowingly
                        collect personal data from children. If you believe a child has provided us with personal
                        data, please contact us and we will delete it promptly.
                    </p>
                </Section>

                <Section title="10. Changes to This Policy">
                    <p>
                        We may update this Privacy Policy from time to time. When we do, we will update the
                        "Last updated" date at the top of this page. We will notify you of significant changes
                        via email or a prominent notice on the Platform.
                    </p>
                </Section>

                <Section title="11. Contact Us">
                    <p>If you have questions, concerns, or requests related to this Privacy Policy:</p>
                    <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm space-y-1">
                        <p><strong>AcadWorld — Privacy Team</strong></p>
                        <p>Email: <a href="mailto:info@acadworld.com" className="text-blue-600 hover:underline">info@acadworld.com</a></p>
                        <p>Website: <a href="https://acadworld.com" className="text-blue-600 hover:underline">acadworld.com</a></p>
                    </div>
                </Section>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 py-8 text-center text-sm text-slate-400">
                © {new Date().getFullYear()} AcadWorld · All rights reserved ·{' '}
                <a href="/terms-of-service" className="hover:text-slate-600 hover:underline">Terms of Service</a>
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
