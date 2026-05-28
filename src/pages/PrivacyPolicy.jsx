import React from 'react';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
    return (
        <div className="legal-page animate-fade">
            <header className="page-header">
                <div className="container">
                    <h1 style={{ color: '#fff' }}>Privacy Policy</h1>
                    <p>How we collect, use, and protect your information.</p>
                </div>
            </header>

            <section className="section">
                <div className="container">
                    <div className="legal-content">

                        <div className="legal-section">
                            <h2>1. Who We Are</h2>
                            <p>NEW BALAN Medical &amp; Clinic ("we", "us", "New Balan") operates a licensed retail pharmacy, polyclinic services, and the New Balan Medical mobile app. This policy explains what personal information we collect through the app and our services, how we use it, who we share it with, and the rights you have over it.</p>
                            <p>This policy is governed by the Digital Personal Data Protection Act, 2023 (India) and applicable consumer-protection and pharmacy regulations.</p>
                        </div>

                        <div className="legal-section">
                            <h2>2. Information We Collect</h2>
                            <p>We collect the following categories of information:</p>
                            <ul>
                                <li><strong>Account info:</strong> full name, email address, mobile number, hashed password.</li>
                                <li><strong>Health data:</strong> prescription images or PDFs you upload, the medicines on those prescriptions, and information needed to fulfil your order.</li>
                                <li><strong>Order info:</strong> items purchased, quantities, prices, delivery address, order notes, special instructions.</li>
                                <li><strong>Payment info:</strong> handled by Razorpay (see &sect;4). We do NOT store your card or UPI credentials on our servers.</li>
                                <li><strong>Device info:</strong> a Firebase Cloud Messaging (FCM) token used to send order-status push notifications, plus app version and device type to diagnose problems.</li>
                                <li><strong>Diagnostic info:</strong> crash reports and basic app activity (which screens are visited, when the app last opened) for troubleshooting.</li>
                            </ul>
                        </div>

                        <div className="legal-section">
                            <h2>3. How We Use Your Information</h2>
                            <ul>
                                <li>Fulfil your medicine orders and dispatch deliveries to your address.</li>
                                <li>Verify prescriptions and comply with the rules of the Drugs and Cosmetics Act.</li>
                                <li>Send push notifications and emails about your order status, delivery updates, and refund confirmations.</li>
                                <li>Provide customer support over phone, WhatsApp, and email.</li>
                                <li>Detect and prevent fraud, account abuse, and security incidents.</li>
                                <li>Meet legal obligations including GST tax records, pharmacy licensing audits, and consumer-protection law.</li>
                            </ul>
                            <p>We do NOT use your health, prescription, or order data to serve advertising. We do not sell your personal information to anyone.</p>
                        </div>

                        <div className="legal-section">
                            <h2>4. Who We Share With</h2>
                            <p>We share the minimum information required, only with these processors:</p>
                            <ul>
                                <li><strong>Razorpay Software Pvt. Ltd.</strong> — payment processing. Receives your name, mobile number, order ID, and amount to complete the transaction. Razorpay's own privacy policy governs their handling of card and UPI data.</li>
                                <li><strong>Google Firebase (Cloud Messaging)</strong> — delivers our push notifications. Receives an opaque FCM token tied to your device.</li>
                                <li><strong>Licensed pharmacists at New Balan</strong> — see prescriptions to dispense medicines, as required by law.</li>
                                <li><strong>Government and regulatory authorities</strong> — only when compelled by a valid legal order or required by drug-control / tax / consumer-protection law.</li>
                            </ul>
                        </div>

                        <div className="legal-section">
                            <h2>5. How We Protect Your Data</h2>
                            <ul>
                                <li>Passwords are stored as one-way bcrypt hashes — we cannot read your password even if asked.</li>
                                <li>All API traffic is encrypted in transit using HTTPS / TLS 1.2+.</li>
                                <li>Authentication tokens on your device are stored in Android EncryptedSharedPreferences / iOS Keychain.</li>
                                <li>Access to production data is restricted to a small number of authorised staff and logged.</li>
                            </ul>
                            <p>No method of internet transmission or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.</p>
                        </div>

                        <div className="legal-section">
                            <h2>6. Data Retention</h2>
                            <ul>
                                <li><strong>Active accounts:</strong> we retain your profile and address details for as long as you have an account with us.</li>
                                <li><strong>Order and invoice records:</strong> retained for at least 8 years from the order date to satisfy GST and the Drugs and Cosmetics Act recordkeeping requirements. After your account is deleted, these records remain but are no longer linked to your name, email, or phone number.</li>
                                <li><strong>Prescriptions:</strong> retained for at least 2 years as required by pharmacy regulations.</li>
                                <li><strong>Push notification tokens:</strong> cleared as soon as you log out or delete your account.</li>
                                <li><strong>Diagnostic and crash data:</strong> retained for 90 days, then aggregated.</li>
                            </ul>
                        </div>

                        <div className="legal-section">
                            <h2>7. Your Rights</h2>
                            <p>Under the DPDP Act 2023 you have the following rights, exercisable free of charge:</p>
                            <ul>
                                <li><strong>Access:</strong> request a copy of the personal information we hold about you.</li>
                                <li><strong>Correction:</strong> update your name, email, mobile, or address from the Profile screen — or email us to correct anything else.</li>
                                <li><strong>Deletion:</strong> delete your account at any time using <em>Account &rarr; Delete Account</em> inside the app (see &sect;8). This permanently removes your identifying information and anonymises any retained order history.</li>
                                <li><strong>Withdraw consent:</strong> revoke push notifications from <em>Settings &rarr; Notifications</em>, or revoke storage access from your device settings.</li>
                                <li><strong>Grievance:</strong> contact our grievance officer (details in &sect;11) if you believe your rights have been infringed.</li>
                            </ul>
                        </div>

                        <div className="legal-section">
                            <h2>8. Account Deletion</h2>
                            <p>You can delete your account directly from the app: <strong>Account &rarr; Delete Account</strong>. You will be asked to re-enter your password to prevent accidental deletion.</p>
                            <p>When you delete your account we immediately do all of the following:</p>
                            <ul>
                                <li>Mark the account as deleted and disable login.</li>
                                <li>Anonymise your name, email, and mobile number on past order records so they cannot be linked back to you.</li>
                                <li>Invalidate your authentication tokens and push notification tokens.</li>
                                <li>Clear saved delivery addresses, cart contents, and notification preferences.</li>
                            </ul>
                            <p>Anonymised order and invoice records remain in our systems for the retention windows in &sect;6 because GST and consumer-protection law require pharmacies to keep transaction records. After anonymisation these rows cannot be re-associated with you.</p>
                            <p>If you cannot access the app to delete your account (for example, you lost your device), email or WhatsApp us using the contact details in &sect;11 and we will action your request within 30 days after verifying your identity.</p>
                        </div>

                        <div className="legal-section">
                            <h2>9. Children's Privacy</h2>
                            <p>New Balan Medical is intended for adults aged 18 and over. We do not knowingly create accounts for or collect personal information from children under 13. If you believe a child has registered, contact us and we will delete the account.</p>
                            <p>Parents and guardians may order medicines for children using their own adult account. In those cases, the prescription is treated like any other medical document under this policy.</p>
                        </div>

                        <div className="legal-section">
                            <h2>10. Cross-Border Transfers</h2>
                            <p>Our servers are located in India. The third parties listed in &sect;4 (Razorpay, Google Firebase) may process data on infrastructure outside India. By using the app or website you consent to these transfers, which are subject to the contractual safeguards those providers offer.</p>
                        </div>

                        <div className="legal-section">
                            <h2>11. Contact and Grievance Officer</h2>
                            <p>For any privacy-related question, request, or complaint, contact our Grievance Officer:</p>
                            <ul>
                                <li><strong>Name:</strong> Manikandan (Founder &amp; Director)</li>
                                <li><strong>Email:</strong> newbalanmedicals@gmail.com</li>
                                <li><strong>Phone / WhatsApp:</strong> +91 9894880598</li>
                                <li><strong>Address:</strong> 120/a Poobalarayapuram 2nd Street, Thoothukudi, Tamil Nadu 628001</li>
                            </ul>
                            <p>We acknowledge requests within 7 days and complete them within 30 days.</p>
                        </div>

                        <div className="legal-section">
                            <h2>12. Changes to This Policy</h2>
                            <p>We may update this policy when laws change or when we add new features. Material changes will be announced in-app and on the website before they take effect. The "Last Updated" date below tells you when this version was published.</p>
                        </div>

                        <div className="legal-footer">
                            <p><strong>Last Updated:</strong> May 2026</p>
                            <p>This Privacy Policy applies to all users of NEW BALAN Medical &amp; Clinic services across web and mobile.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default PrivacyPolicy;
