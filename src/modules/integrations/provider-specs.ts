import type { EmailProvider, PaymentProvider, SmsProvider } from "@/types";

export interface ProviderFieldSpec {
  key: string;
  label: string;
  placeholder?: string;
  help: string;
  required?: boolean;
  generated?: boolean;
}

export interface ProviderSpec {
  key: string;
  label: string;
  docs: string[];
  fields: ProviderFieldSpec[];
  methodLabels?: string[];
}

export const paymentProviderSpecs: Record<PaymentProvider, ProviderSpec> = {
  paystack: {
    key: "paystack",
    label: "Paystack",
    docs: [
      "https://docs-v2.paystack.com/guides/accept_payments_on_your_react_app/",
      "https://docs-v2.paystack.com/payments/webhooks/",
    ],
    fields: [
      {
        key: "publicKey",
        label: "Public key",
        placeholder: "pk_live_xxx",
        help: "Paystack's React checkout guide uses a public key on the client.",
        required: true,
      },
      {
        key: "secretKey",
        label: "Secret key",
        placeholder: "sk_live_xxx",
        help: "The backend uses the secret key to initialize and verify transactions.",
        required: true,
      },
      {
        key: "webhookUrl",
        label: "Webhook URL",
        help: "Set this URL in your Paystack dashboard so the backend can receive payment events.",
        required: true,
        generated: true,
      },
    ],
    methodLabels: ["Card", "Mobile money"],
  },
  flutterwave: {
    key: "flutterwave",
    label: "Flutterwave",
    docs: [
      "https://developer.flutterwave.com/v2.0/docs/api-keys",
      "https://developer.flutterwave.com/docs/webhooks",
    ],
    fields: [
      {
        key: "publicKey",
        label: "Public key",
        placeholder: "FLWPUBK_TEST-xxx",
        help: "Flutterwave uses a public key for checkout initialization.",
        required: true,
      },
      {
        key: "secretKey",
        label: "Secret key",
        placeholder: "FLWSECK_TEST-xxx",
        help: "Flutterwave's API and webhook verification require the secret key.",
        required: true,
      },
      {
        key: "secretHash",
        label: "Secret hash",
        placeholder: "your-secret-hash",
        help: "Flutterwave's webhook docs recommend a secret hash for callback verification.",
        required: true,
      },
      {
        key: "webhookUrl",
        label: "Webhook URL",
        help: "Use this backend callback URL when configuring Flutterwave webhooks.",
        required: true,
        generated: true,
      },
    ],
    methodLabels: ["Card", "Mobile money"],
  },
  hubtel: {
    key: "hubtel",
    label: "Hubtel",
    docs: [
      "https://docs-developers.hubtel.com/docs/receive-mobile-money-payment",
    ],
    fields: [
      {
        key: "clientId",
        label: "Client ID",
        placeholder: "hubtel-client-id",
        help: "Hubtel request money APIs authenticate with a client ID.",
        required: true,
      },
      {
        key: "clientSecret",
        label: "Client secret",
        placeholder: "hubtel-client-secret",
        help: "Hubtel request money APIs authenticate with a client secret.",
        required: true,
      },
      {
        key: "merchantAccountNumber",
        label: "Merchant account number",
        placeholder: "2012345",
        help: "Hubtel's request body includes a merchant account number for collections.",
        required: true,
      },
      {
        key: "callbackUrl",
        label: "Callback URL",
        help: "Hubtel requires a callback URL so the backend can receive payment status updates.",
        required: true,
        generated: true,
      },
    ],
    methodLabels: ["Mobile money"],
  },
};

export const emailProviderSpecs: Record<EmailProvider, ProviderSpec> = {
  resend: {
    key: "resend",
    label: "Resend",
    docs: [
      "https://resend.com/docs/api-reference/introduction",
      "https://resend.com/docs/api-reference/emails/send-email",
      "https://resend.com/docs/dashboard/domains/introduction",
    ],
    fields: [
      {
        key: "apiKey",
        label: "API key",
        placeholder: "re_xxx",
        help: "Resend authenticates requests with an API key.",
        required: true,
      },
      {
        key: "fromEmail",
        label: "From email",
        placeholder: "bookings@example.com",
        help: "Resend's send-email API requires a from address.",
        required: true,
      },
      {
        key: "replyToEmail",
        label: "Reply-to email",
        placeholder: "support@example.com",
        help: "Set an optional reply-to mailbox for resident responses.",
      },
      {
        key: "sendingDomain",
        label: "Verified domain",
        placeholder: "example.com",
        help: "Resend domains must be verified before sending from your brand domain.",
        required: true,
      },
    ],
  },
};

export const smsProviderSpecs: Record<SmsProvider, ProviderSpec> = {
  hubtel: {
    key: "hubtel",
    label: "Hubtel SMS",
    docs: [
      "https://developers.hubtel.com/hubtel/sms",
    ],
    fields: [
      {
        key: "clientId",
        label: "Client ID",
        placeholder: "hubtel-sms-client-id",
        help: "Hubtel SMS authenticates requests with a client ID.",
        required: true,
      },
      {
        key: "clientSecret",
        label: "Client secret",
        placeholder: "hubtel-sms-client-secret",
        help: "Hubtel SMS authenticates requests with a client secret.",
        required: true,
      },
      {
        key: "senderId",
        label: "Sender ID",
        placeholder: "Dreamland",
        help: "Hubtel SMS requests include the approved sender ID in the from field.",
        required: true,
      },
    ],
  },
};
