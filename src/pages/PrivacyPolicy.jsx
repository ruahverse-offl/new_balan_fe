import React from 'react';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
    return (
        <div className="legal-page animate-fade">
            <header className="page-header">
                <div className="container">
                    <h1 style={{ color: '#fff' }}>Privacy Policy</h1>
                    <p>Your privacy is important to us. This policy explains how we collect, use, and protect your information.</p>
                </div>
            </header>

            <section className="section">
                <div className="container">
                    <div className="legal-content">
                        <div className="legal-section">
                            <h2>1. Information We Collect</h2>
                            <p>We collect information that you provide directly to us when you:</p>
                            <ul>
                                <li>Create an account or register on our website</li>
                                <li>Place an order for medicines or services</li>
                                <li>Upload prescriptions or medical documents</li>
                                <li>Contact us via phone, email, or WhatsApp</li>
                                <li>Subscribe to our newsletter or promotional communications</li>
                                <li>Participate in surveys or provide feedback</li>
                            </ul>
                            <p>The types of information we may collect include:</p>
                            <ul>
                                <li><strong>Personal Information:</strong> Name, email address, phone number, date of birth, gender</li>
                                <li><strong>Address Information:</strong> Delivery address, billing address, location data</li>
                                <li><strong>Medical Information:</strong> Prescriptions, medical history (only when necessary for order fulfillment)</li>
                                <li><strong>Payment Information:</strong> Payment method details (processed securely through third-party payment gateways)</li>
                                <li><strong>Account Information:</strong> Username, password, account preferences</li>
                            </ul>
                        </div>

                        <div className="legal-section">
                            <h2>2. How We Use Your Information</h2>
                            <p>We use the information we collect to:</p>
                            <ul>
                                <li>Process and fulfill your orders for medicines and healthcare services</li>
                                <li>Verify prescriptions and ensure compliance with medical regulations</li>
                                <li>Communicate with you about your orders, appointments, and account</li>
                                <li>Send you important updates, notifications, and service-related information</li>
                                <li>Provide customer support and respond to your inquiries</li>
                                <li>Improve our services, website functionality, and user experience</li>
                                <li>Send promotional offers, discounts, and marketing communications (with your consent)</li>
                                <li>Detect and prevent fraud, abuse, and security threats</li>
                                <li>Comply with legal obligations and regulatory requirements</li>
                            </ul>
                        </div>

                        <div className="legal-section">
                            <h2>3. Information Sharing and Disclosure</h2>
                            <p>We do not sell your personal information. We may share your information only in the following circumstances:</p>
                            <ul>
                                <li><strong>Service Providers:</strong> With trusted third-party service providers who assist us in operating our website, processing payments, delivering orders, and providing customer support</li>
                                <li><strong>Healthcare Providers:</strong> With licensed pharmacists and doctors who need to verify prescriptions and provide medical services</li>
                                <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
                                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (with notice to users)</li>
                                <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
                            </ul>
                        </div>

                        <div className="legal-section">
                            <h2>4. Data Security</h2>
                            <p>We implement industry-standard security measures to protect your personal information:</p>
                            <ul>
                                <li>Encryption of sensitive data during transmission (SSL/TLS)</li>
                                <li>Secure storage of data on protected servers</li>
                                <li>Regular security audits and vulnerability assessments</li>
                                <li>Access controls and authentication mechanisms</li>
                                <li>Employee training on data protection and privacy</li>
                            </ul>
                            <p>However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.</p>
                        </div>

                        <div className="legal-section">
                            <h2>5. Your Rights and Choices</h2>
                            <p>You have the following rights regarding your personal information:</p>
                            <ul>
                                <li><strong>Access:</strong> Request access to the personal information we hold about you</li>
                                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                                <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal retention requirements)</li>
                                <li><strong>Objection:</strong> Object to processing of your information for certain purposes</li>
                                <li><strong>Data Portability:</strong> Request a copy of your data in a portable format</li>
                                <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications at any time</li>
                            </ul>
                            <p>To exercise these rights, please contact us using the contact information provided below.</p>
                        </div>

                        <div className="legal-section">
                            <h2>6. Cookies and Tracking Technologies</h2>
                            <p>We use cookies and similar tracking technologies to:</p>
                            <ul>
                                <li>Remember your preferences and settings</li>
                                <li>Analyze website traffic and usage patterns</li>
                                <li>Improve website functionality and performance</li>
                                <li>Provide personalized content and advertisements</li>
                            </ul>
                            <p>You can control cookies through your browser settings. However, disabling cookies may affect the functionality of our website.</p>
                        </div>

                        <div className="legal-section">
                            <h2>7. Children's Privacy</h2>
                            <p>Our services are not intended for children under the age of 18. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, please contact us immediately.</p>
                        </div>

                        <div className="legal-section">
                            <h2>8. Data Retention</h2>
                            <p>We retain your personal information for as long as necessary to:</p>
                            <ul>
                                <li>Fulfill the purposes for which it was collected</li>
                                <li>Comply with legal, regulatory, and tax obligations</li>
                                <li>Resolve disputes and enforce our agreements</li>
                                <li>Maintain accurate business records</li>
                            </ul>
                            <p>Prescription records may be retained for longer periods as required by healthcare regulations.</p>
                        </div>

                        <div className="legal-section">
                            <h2>9. Third-Party Links</h2>
                            <p>Our website may contain links to third-party websites or services. We are not responsible for the privacy practices of these external sites. We encourage you to review the privacy policies of any third-party sites you visit.</p>
                        </div>

                        <div className="legal-section">
                            <h2>10. Changes to This Privacy Policy</h2>
                            <p>We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by posting the updated policy on our website and updating the "Last Updated" date. Your continued use of our services after such changes constitutes acceptance of the updated policy.</p>
                        </div>

                        <div className="legal-section">
                            <h2>11. Contact Us</h2>
                            <p>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
                            <ul>
                                <li><strong>Email:</strong> newbalanmedicals@gmail.com</li>
                                <li><strong>Phone:</strong> +91 9894880598</li>
                                <li><strong>Address:</strong> 120/a Poobalarayapuram 2nd street, Thoothukudi, Tamil Nadu 628001</li>
                            </ul>
                        </div>

                        <div className="legal-footer">
                            <p><strong>Last Updated:</strong> January 2026</p>
                            <p>This Privacy Policy is effective as of the date stated above and applies to all users of NEW BALAN Medical & Clinic services.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default PrivacyPolicy;
