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

export const resetPasswordTemplate = (link: string) =>
  `<div style="font-family:Arial,sans-serif">
    <h2>Password Reset</h2>
    <p>Click the link below to reset your password:</p>
    <p><a href="${link}">${link}</a></p>
  </div>`;
