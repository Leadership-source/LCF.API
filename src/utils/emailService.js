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

export const sendAdminLoginCodeEmail = async ({ email, name, code }) => {
  await sendEmail({
    to: email,
    subject: "Your LCF admin security code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>Admin login verification</h2>
        <p>Hello ${name || "Admin"},</p>
        <p>Use this six-digit security code to complete your admin login:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">${code}</p>
        <p>This code expires in 10 minutes. If you did not try to sign in, you can ignore this email.</p>
      </div>
    `,
  });
};

export const sendUserWelcomeEmail = async ({ email, name, temporaryPassword, loginLink }) => {
  await sendEmail({
    to: email,
    subject: "Your LCF account details",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>Welcome to the Leadership Conference Forum</h2>
        <p>Hello ${name || "there"},</p>
        <p>An account has been created for you. Use these temporary login details:</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary password:</strong> ${temporaryPassword}</p>
        <p><a href="${loginLink}">Sign in to your account</a></p>
        <p>After signing in, change your password from your account settings using the change-password form.</p>
      </div>
    `,
  });
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

export const sendVolunteerApplicationEmail = async ({
  fullName,
  email,
  phone,
  areaOfInterest,
  availability,
  details,
  message,
}) => {
  const detailRows = Object.entries(details || {})
    .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
    .join("");

  await sgMail.send({
    to: process.env.CONTACT_RECEIVER_EMAIL,
    from: process.env.SENDGRID_FROM_EMAIL,
    replyTo: email,
    subject: `New Volunteer Application: ${areaOfInterest}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>New Volunteer Application</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
        <p><strong>Area of interest:</strong> ${areaOfInterest}</p>
        <p><strong>Availability:</strong> ${availability}</p>
        <h3>Additional details</h3>
        ${detailRows || "<p>None provided</p>"}
        <h3>Message</h3>
        <p>${message || "None provided"}</p>
      </div>
    `,
  });
};

export const sendQuoteInvitationEmail = async ({
  email,
  invitationLink,
  expiresAt,
}) => {
  const message = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: "You're Invited to Share Your Leadership Quote",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; line-height: 1.6;">
        
        <h2 style="color: #111827;">
          Share Your Leadership Quote
        </h2>

        <p>Hello,</p>

        <p>
          We would be honored to feature your thoughts and perspective
          on leadership with the Leadership Conference Forum community.
        </p>

        <p>
          We invite you to share an inspirational quote or thought
          that reflects your experience, leadership journey, or perspective.
        </p>

        <p style="margin: 30px 0;">
          <a
            href="${invitationLink}"
            style="
              display: inline-block;
              padding: 12px 22px;
              background-color: #f97316;
              color: #ffffff;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
            "
          >
            Submit Your Quote
          </a>
        </p>

        <p>
          This invitation link is valid for <strong>12 hours</strong>.
        </p>

        <p>
          Invitation expires at:
          <strong>${new Date(expiresAt).toLocaleString()}</strong>
        </p>

        <p>
          If you did not expect this invitation, you can safely ignore
          this email.
        </p>

        <p style="margin-top: 30px;">
          Regards,<br />
          <strong>Leadership Conference Forum</strong>
        </p>

      </div>
    `,
  };

  await sgMail.send(message);
};

export const sendQuoteRejectionEmail = async ({ email, name }) => {
  try {
    const response = await sendEmail({
      to: email,
      subject: "Your Leadership Quote Submission",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #f97316;">
            Quote Submission Update
          </h2>

          <p>Dear ${name},</p>

          <p>
            Thank you for taking the time to submit your leadership quote
            to the Leadership Conference Forum.
          </p>

          <p>
            After reviewing your submission, we are unable to approve
            the quote for publication at this time.
          </p>

          <p>
            We appreciate your contribution and your willingness to share
            your leadership experience with our community.
          </p>

          <p>
            Thank you for your understanding.
          </p>

          <p>
            Best regards,<br />
            Leadership Conference Forum
          </p>
        </div>
      `,
    });

    return response;
  } catch (error) {
    throw error;
  }
};
