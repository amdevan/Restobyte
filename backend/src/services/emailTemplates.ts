export const welcomeTemplate = (name: string) =>
  `<div style="font-family:Arial,sans-serif">
    <h2>Welcome to RestoByte${name ? ', ' + name : ''}!</h2>
    <p>Your account has been created successfully. We're excited to have you onboard.</p>
  </div>`;

export const invoiceTemplate = (params: { invoiceNumber: string; amount: string; currency: string }) =>
  `<div style="font-family:Arial,sans-serif">
    <h2>Invoice ${params.invoiceNumber}</h2>
    <p>Amount Due: <strong>${params.currency} ${params.amount}</strong></p>
  </div>`;

export const invoiceReminderTemplate = (params: { invoiceNumber: string; amount: string; currency: string; tenantName?: string }) =>
  `<div style="font-family:Arial,sans-serif">
    <h2>Payment Reminder</h2>
    <p>${params.tenantName ? `Hello ${params.tenantName},` : 'Hello,'}</p>
    <p>This is a reminder for invoice <strong>${params.invoiceNumber}</strong>.</p>
    <p>Invoice Amount: <strong>${params.currency} ${params.amount}</strong></p>
    <p>Please contact us if you need any billing help.</p>
  </div>`;

export const resetPasswordTemplate = (link: string) =>
  `<div style="font-family:Arial,sans-serif">
    <h2>Password Reset</h2>
    <p>Click the link below to reset your password:</p>
    <p><a href="${link}">${link}</a></p>
  </div>`;
