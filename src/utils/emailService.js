import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendEmail = async ({ to, subject, html }) => {
  await sgMail.send({
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject,
    html,
  });
};

export const sendPasswordResetEmail = async ({ email, name, resetLink }) => {
  const message = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: "Reset Your Admin Password",

    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>Password Reset Request</h2>

        <p>Hello ${name || "Admin"},</p>

        <p>
          We received a request to reset your admin account password.
        </p>

        <p>
          Click the button below to create a new password:
        </p>

        <a
          href="${resetLink}"
          style="
            display: inline-block;
            padding: 12px 20px;
            background-color: #f97316;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
          "
        >
          Reset Password
        </a>

        <p style="margin-top: 20px;">
          This link will expire in 15 minutes.
        </p>

        <p>
          If you did not request a password reset, you can safely ignore
          this email.
        </p>

        <p>
          Regards,<br />
          Leadership Conference Forum
        </p>
      </div>
    `,
  };

  await sgMail.send(message);
};

export const sendContactEmail = async ({
  fullName,
  email,
  phone,
  subject,
  message,
}) => {
  const mail = {
    to: process.env.CONTACT_RECEIVER_EMAIL,
    from: process.env.SENDGRID_FROM_EMAIL,
    replyTo: email,
    subject: `New Contact Message: ${subject}`,

    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>New Contact Message</h2>

        <p><strong>Name:</strong> ${fullName}</p>

        <p><strong>Email:</strong> ${email}</p>

        <p><strong>Phone:</strong> ${phone || "Not provided"}</p>

        <p><strong>Subject:</strong> ${subject}</p>

        <h3>Message</h3>

        <p>${message}</p>

        <p style="margin-top: 30px;">
          Regards,<br />
          Leadership Conference Forum Website
        </p>
      </div>
    `,
  };

  await sgMail.send(mail);
};
